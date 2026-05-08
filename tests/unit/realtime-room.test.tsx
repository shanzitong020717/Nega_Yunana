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
      "Ready",
      "Listening",
      "Thinking",
      "Speaking",
      "Muted",
      "Reconnecting",
      "Mic Permission Required",
      "Session Ended",
    ].forEach((state) => {
      expect(screen.getAllByText(state).length).toBeGreaterThan(0);
    });

    [
      "Start",
      "Mute",
      "End",
      "Better Phrase",
      "Use Material Point",
      "Ask a Discovery Question",
      "Shorten Answer",
      "Translate This",
      "Challenge Me",
    ].forEach((control) => {
      expect(screen.getByRole("button", { name: control })).toBeInTheDocument();
    });

    expect(
      screen.getByText("What business problem are you trying to solve with smart glasses?"),
    ).toBeInTheDocument();
    expect(screen.getByText("Material Navigator")).toBeInTheDocument();
    expect(screen.getByText("Smart Support")).toBeInTheDocument();
  });

  it("updates mock room state and transcript when controls are used", async () => {
    installMockVoiceSession();
    render(<RealtimeRoom sessionId="session_123" />);

    fireEvent.click(screen.getByRole("button", { name: "Start" }));
    expect(await screen.findByText("Current state: Listening")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Mute" }));
    expect(screen.getByText("Current state: Muted")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Better Phrase" }));
    expect(
      screen.getByText("Try: The key value is reducing communication friction in real time."),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "End" }));
    expect(screen.getByText("Current state: Session Ended")).toBeInTheDocument();
  });
});
