import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { RealtimeRoom } from "@/features/practice/realtime-room";

function installMockVoiceSession() {
  Object.defineProperty(navigator, "mediaDevices", {
    configurable: true,
    value: {
      getUserMedia: vi.fn().mockResolvedValue({
        getTracks: () => [{ stop: vi.fn() }],
        getAudioTracks: () => [{ enabled: true }],
      }),
    },
  });
  vi.stubGlobal("RTCPeerConnection", undefined);
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValueOnce(
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
    ).mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          sessionId: "session_123",
          turnCount: 3,
          status: "saved",
        }),
        { status: 201 },
      ),
    ),
  );
}

describe("RealtimeRoom mock UI", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("renders all live room states, controls, and mock transcript turns", () => {
    render(<RealtimeRoom sessionId="session_123" />);

    [
      "准备就绪",
      "聆听中",
      "思考中",
      "回复中",
      "已静音",
      "连接中",
      "需要麦克风权限",
      "会话已结束",
    ].forEach((state) => {
      expect(screen.getAllByText(state).length).toBeGreaterThan(0);
    });

    [
      "开始",
      "静音",
      "结束",
      "换个更自然表达",
      "使用材料要点",
      "问一个探索问题",
      "缩短回答",
      "翻译这句话",
      "挑战我",
    ].forEach((control) => {
      expect(screen.getByRole("button", { name: control })).toBeInTheDocument();
    });

    expect(
      screen.getByText("What business problem are you trying to solve with smart glasses?"),
    ).toBeInTheDocument();
    expect(screen.getByText("材料导航")).toBeInTheDocument();
    expect(screen.getByText("智能辅助")).toBeInTheDocument();
  });

  it("updates mock room state and transcript when controls are used", async () => {
    installMockVoiceSession();
    render(<RealtimeRoom sessionId="session_123" />);

    fireEvent.click(screen.getByRole("button", { name: "开始" }));
    expect(await screen.findByText("当前状态：聆听中")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "静音" }));
    expect(screen.getByText("当前状态：已静音")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "换个更自然表达" }));
    expect(
      screen.getByText("Try: The key value is reducing communication friction in real time."),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "结束" }));
    expect(screen.getByText("当前状态：会话已结束")).toBeInTheDocument();
  });
});
