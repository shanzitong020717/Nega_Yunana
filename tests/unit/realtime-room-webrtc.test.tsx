import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { RealtimeRoom } from "@/features/practice/realtime-room";

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
});
