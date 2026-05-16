import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { RealtimeRoom } from "@/features/practice/realtime-room";
import { savePracticeSessionSelection } from "@/lib/practice/practice-session-selection";

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
    window.sessionStorage.clear();
  });

  it("renders the live room status, controls, and mock transcript turns", () => {
    render(<RealtimeRoom sessionId="session_123" />);

    expect(screen.getByRole("heading", { name: "准备开始" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "开始" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "静音" })).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "结束并复盘" }),
    ).not.toBeInTheDocument();

    expect(
      screen.getByText("What business problem are you trying to solve with smart glasses?"),
    ).toBeInTheDocument();
    expect(screen.queryByText("材料导航")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "打开提示" })).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "换个更自然表达" }),
    ).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "打开提示" }));

    [
      "换个更自然表达",
      "使用材料要点",
      "问一个探索问题",
      "缩短回答",
      "翻译这句话",
      "挑战我",
    ].forEach((control) => {
      expect(screen.getByRole("button", { name: control })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: "隐藏提示" }));

    expect(
      screen.queryByRole("button", { name: "换个更自然表达" }),
    ).not.toBeInTheDocument();
  });

  it("updates mock room state and transcript when controls are used", async () => {
    installMockVoiceSession();
    render(<RealtimeRoom sessionId="session_123" />);

    fireEvent.click(screen.getByRole("button", { name: "开始" }));
    expect(await screen.findByRole("heading", { name: "对话中" })).toBeInTheDocument();
    expect(screen.queryByText("当前状态：对话中")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "静音" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "结束并复盘" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "静音" }));
    expect(screen.getByRole("heading", { name: "对话中" })).toBeInTheDocument();
    expect(screen.getByText("麦克风已静音")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "打开提示" }));
    fireEvent.click(screen.getByRole("button", { name: "换个更自然表达" }));
    expect(
      screen.getByText("Try: The key value is reducing communication friction in real time."),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "结束并复盘" }));
    expect(screen.getByRole("heading", { name: "会话已结束" })).toBeInTheDocument();
  });

  it("uses the learner-selected persona and voice pack for realtime session creation", async () => {
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
    const fetchMock = vi.fn().mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          clientSecret: "mock_realtime_client_secret_123",
          sessionId: "rt_session_123",
          expiresAt: new Date(Date.now() + 60_000).toISOString(),
          model: "gpt-realtime-mini",
          instructionsPreview: "Channel Partner",
        }),
        { status: 201 },
      ),
    );
    vi.stubGlobal("fetch", fetchMock);
    savePracticeSessionSelection({
      id: "session_custom",
      scenarioPackId: "rokid-overseas-sales",
      goalId: "solution_meeting",
      mode: "solution_meeting",
      personaId: "channel_partner",
      voicePackId: "noah-channel-partner",
      difficulty: "normal",
      trainingFocus: ["channel partnership"],
      focusTags: ["渠道合作"],
    });

    render(<RealtimeRoom sessionId="session_custom" />);

    expect(await screen.findByText("AI 声音：Noah 渠道伙伴")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "开始" }));
    expect(await screen.findByRole("heading", { name: "对话中" })).toBeInTheDocument();

    const [, requestInit] = fetchMock.mock.calls[0];
    expect(JSON.parse(String(requestInit.body))).toMatchObject({
      practiceSessionId: "session_custom",
      goalId: "solution_meeting",
      mode: "solution_meeting",
      personaId: "channel_partner",
      voicePackId: "noah-channel-partner",
      trainingFocus: ["channel partnership"],
      focusTags: ["渠道合作"],
    });
  });
});
