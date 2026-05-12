import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { RealtimeRoom } from "@/features/practice/realtime-room";

type MockWebSocketListener = (event?: unknown) => void;

function installGetUserMedia(
  getUserMedia: ReturnType<typeof vi.fn>,
) {
  Object.defineProperty(navigator, "mediaDevices", {
    configurable: true,
    value: {
      getUserMedia,
    },
  });
}

function createMockWebSocketHarness() {
  const sockets: MockWebSocket[] = [];

  class MockWebSocket {
    static OPEN = 1;

    listeners = new Map<string, MockWebSocketListener[]>();
    readyState = 0;
    sent: string[] = [];
    url: string;

    constructor(url: string | URL) {
      this.url = String(url);
      sockets.push(this);
    }

    addEventListener(type: string, listener: MockWebSocketListener) {
      this.listeners.set(type, [...(this.listeners.get(type) ?? []), listener]);
    }

    close() {
      this.readyState = 3;
    }

    send(message: string) {
      this.sent.push(message);
    }

    open() {
      this.readyState = MockWebSocket.OPEN;
      this.listeners.get("open")?.forEach((listener) => {
        listener(new Event("open"));
      });
    }

    message(payload: Record<string, unknown>) {
      this.listeners.get("message")?.forEach((listener) => {
        listener({
          data: JSON.stringify(payload),
        });
      });
    }
  }

  vi.stubGlobal("WebSocket", MockWebSocket);

  return { sockets };
}

function createMockAudioContextHarness() {
  const processors: Array<{
    connect: ReturnType<typeof vi.fn>;
    disconnect: ReturnType<typeof vi.fn>;
    onaudioprocess: ((event: AudioProcessingEvent) => void) | null;
  }> = [];

  class MockAudioContext {
    currentTime = 0;
    destination = {};
    sampleRate = 48_000;

    close = vi.fn().mockResolvedValue(undefined);

    createBuffer() {
      return {
        copyToChannel: vi.fn(),
        duration: 0.1,
      };
    }

    createBufferSource() {
      return {
        connect: vi.fn(),
        start: vi.fn(),
      };
    }

    createMediaStreamSource() {
      return {
        connect: vi.fn(),
        disconnect: vi.fn(),
      };
    }

    createScriptProcessor() {
      const processor = {
        connect: vi.fn(),
        disconnect: vi.fn(),
        onaudioprocess: null,
      };
      processors.push(processor);
      return processor;
    }
  }

  vi.stubGlobal("AudioContext", MockAudioContext);

  return { processors };
}

describe("RealtimeRoom browser voice connection", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("requests microphone only after Start and shows permission state when denied", async () => {
    const getUserMedia = vi.fn().mockRejectedValue(new Error("denied"));
    installGetUserMedia(getUserMedia);

    render(<RealtimeRoom sessionId="session_123" />);

    expect(getUserMedia).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "开始" }));

    await waitFor(() => {
      expect(getUserMedia).toHaveBeenCalledWith({ audio: true });
      expect(
        screen.getByText("当前状态：需要麦克风权限"),
      ).toBeInTheDocument();
    });
  });

  it("saves the transcript when the learner ends a mock realtime session", async () => {
    const stop = vi.fn();
    const getUserMedia = vi.fn().mockResolvedValue({
      getTracks: () => [{ stop }],
    });
    const fetch = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            clientSecret: "mock_realtime_client_secret_123",
            sessionId: "rt_session_123",
            expiresAt: new Date(Date.now() + 60_000).toISOString(),
            model: "gpt-realtime-mini",
            instructionsPreview: "Technical Lead",
          }),
          { status: 201 },
        ),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            sessionId: "session_123",
            turnCount: 3,
            status: "saved",
          }),
          { status: 201 },
        ),
      );

    installGetUserMedia(getUserMedia);
    vi.stubGlobal("fetch", fetch);
    vi.stubGlobal("RTCPeerConnection", undefined);

    render(<RealtimeRoom sessionId="session_123" />);

    fireEvent.click(screen.getByRole("button", { name: "开始" }));
    await screen.findByText("当前状态：聆听中");

    fireEvent.click(screen.getByRole("button", { name: "结束" }));

    await waitFor(() => {
      expect(fetch).toHaveBeenLastCalledWith(
        "/api/practice-sessions/session_123/transcript",
        expect.objectContaining({
          method: "POST",
        }),
      );
    });
    expect(stop).toHaveBeenCalled();
    expect(screen.getByText("当前状态：会话已结束")).toBeInTheDocument();
  });

  it("streams microphone audio to the configured realtime WebSocket relay", async () => {
    const { sockets } = createMockWebSocketHarness();
    const { processors } = createMockAudioContextHarness();
    const getUserMedia = vi.fn().mockResolvedValue({
      getAudioTracks: () => [{ enabled: true }],
      getTracks: () => [{ stop: vi.fn() }],
    });
    const fetch = vi.fn().mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          transport: "websocket_relay",
          relayUrl: "wss://relay.example.com/realtime",
          relayToken: "relay-token",
          sessionId: "rt_session_123",
          expiresAt: new Date(Date.now() + 60_000).toISOString(),
          model: "gpt-4o-realtime-preview",
          instructionsPreview: "Technical Lead",
        }),
        { status: 201 },
      ),
    );

    installGetUserMedia(getUserMedia);
    vi.stubGlobal("fetch", fetch);

    render(<RealtimeRoom sessionId="session_123" />);

    fireEvent.click(screen.getByRole("button", { name: "开始" }));

    await waitFor(() => {
      expect(sockets).toHaveLength(1);
    });
    expect(sockets[0]?.url).toBe(
      "wss://relay.example.com/realtime?token=relay-token",
    );

    sockets[0]?.open();
    sockets[0]?.message({
      model: "gpt-4o-realtime-preview",
      realtimeSessionId: "rt_session_123",
      type: "relay.ready",
    });

    await screen.findByText("当前状态：聆听中");
    await waitFor(() => {
      expect(processors).toHaveLength(1);
    });

    processors[0]?.onaudioprocess?.({
      inputBuffer: {
        getChannelData: () => new Float32Array([0.25, 0.5, -0.25, -0.5]),
      },
      outputBuffer: {
        getChannelData: () => new Float32Array(4),
      },
    } as unknown as AudioProcessingEvent);

    const sentEvents = sockets[0]?.sent.map((message) => JSON.parse(message));

    expect(sentEvents).toContainEqual(
      expect.objectContaining({
        response: expect.objectContaining({
          modalities: ["audio", "text"],
        }),
        type: "response.create",
      }),
    );
    expect(sentEvents).toContainEqual(
      expect.objectContaining({
        audio: expect.any(String),
        type: "input_audio_buffer.append",
      }),
    );
  });

  it("surfaces realtime provider errors instead of silently staying connected", async () => {
    const { sockets } = createMockWebSocketHarness();
    createMockAudioContextHarness();
    const getUserMedia = vi.fn().mockResolvedValue({
      getAudioTracks: () => [{ enabled: true }],
      getTracks: () => [{ stop: vi.fn() }],
    });
    const fetch = vi.fn().mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          transport: "websocket_relay",
          relayUrl: "wss://relay.example.com/realtime",
          relayToken: "relay-token",
          sessionId: "rt_session_123",
          expiresAt: new Date(Date.now() + 60_000).toISOString(),
          model: "gpt-4o-realtime-preview",
          instructionsPreview: "Technical Lead",
        }),
        { status: 201 },
      ),
    );

    installGetUserMedia(getUserMedia);
    vi.stubGlobal("fetch", fetch);

    render(<RealtimeRoom sessionId="session_123" />);

    fireEvent.click(screen.getByRole("button", { name: "开始" }));

    await waitFor(() => {
      expect(sockets).toHaveLength(1);
    });
    sockets[0]?.open();
    sockets[0]?.message({
      model: "gpt-4o-realtime-preview",
      realtimeSessionId: "rt_session_123",
      type: "relay.ready",
    });

    await screen.findByText("当前状态：聆听中");

    sockets[0]?.message({
      type: "error",
      error: {
        message: "provider realtime handshake failed",
      },
    });

    expect(await screen.findByText("当前状态：连接失败")).toBeInTheDocument();
    expect(
      screen.getByText(
        "实时模型服务返回错误：provider realtime handshake failed",
      ),
    ).toBeInTheDocument();
  });
});
