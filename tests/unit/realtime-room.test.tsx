import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import type { ReactElement } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { RealtimeRoom } from "@/features/practice/realtime-room";
import type { TranscriptTurn } from "@/features/practice/conversation-transcript-panel";
import { savePracticeSessionSelection } from "@/lib/practice/practice-session-selection";
import {
  readTodayRecommendationCache,
  writeTodayRecommendationCache,
} from "@/lib/recommendations/today-recommendation-cache";
import type { TodayRecommendation } from "@/lib/recommendations/today-recommendation";

const mockSuggestedAnswerPayload = {
  suggestion: {
    id: "suggestion_123",
    aiQuestion: {
      english: "Can you detail how data is encrypted both at rest and in transit?",
      translationZh: "你能详细说明数据在静态和传输过程中如何加密吗？",
    },
    analysis:
      "This technical buyer is asking for a precise security answer, so respond with scope, safeguards, and a review next step.",
    responseStrategy: {
      english:
        "Acknowledge the security concern first, then give a bounded deployment answer and propose a technical review.",
      chinese: "先承认客户的安全顾虑，再给出有边界的部署回答，并建议进行技术评审。",
    },
    logicBreakdown: {
      surfaceMeaningZh: "客户在询问云端部署和本地部署的选择。",
      customerIntentZh: "客户想确认 Rokid 是否能满足企业安全要求。",
      informationNeededZh: "客户需要了解部署方式、数据流、加密边界和 IT 审查路径。",
      responseFocusZh: "回答时先聚焦安全边界，再说明可以与 IT 团队共同确认细节。",
    },
    contextBreakdown: {
      conversationStateZh: "当前对话正在围绕部署方式和安全要求展开。",
      customerQuestionReasonZh: "客户前面已经进入技术评估阶段，所以现在追问部署边界。",
      priorUserAnswerZh: "用户前面还没有给出具体部署方案，只说明需要进一步确认。",
      missingInformationZh: "还缺少客户 IT 政策、系统环境和允许的数据处理边界。",
      responseBoundaryZh: "不要直接承诺所有云端或本地部署方式，只能先提出和 IT 团队确认。",
    },
    suggestedReplies: [
      {
        english:
          "That is an important security question. For a pilot, we can first map the data flow with your IT team and confirm encryption requirements before deployment.",
        chinese:
          "这是一个很重要的安全问题。试点阶段我们可以先和你们 IT 团队梳理数据流，并在部署前确认加密要求。",
        reason:
          "It acknowledges the concern, avoids unsupported claims, and moves the conversation to a technical review.",
      },
    ],
    vocabulary: [
      {
        term: "at rest",
        phonetic: "/æt rest/",
        chinese: "静态存储时",
        example: "data encrypted at rest",
      },
    ],
    phrasebookEntry: {
      category: "Objection Handling",
      english:
        "That is an important security question. For a pilot, we can first map the data flow with your IT team and confirm encryption requirements before deployment.",
      chinese:
        "这是一个很重要的安全问题。试点阶段我们可以先和你们 IT 团队梳理数据流，并在部署前确认加密要求。",
      useCase: "Answer a technical buyer's security question.",
      tags: ["suggested-answer", "live-coaching"],
      source: "review",
      masteryStatus: "needs_practice",
    },
    createdAt: "2026-05-19T00:00:00.000Z",
  },
};

const mockBetterPhrasePayload = {
  cueResult: {
    id: "support_better_phrase",
    title: "更自然表达分析",
    badge: "AI 分析",
    sections: [
      {
        label: "AI 客户上下文",
        english: "Can you detail how data is encrypted both at rest and in transit?",
      },
      {
        label: "你的原句",
        english: "We can help translate meetings and make communication better.",
      },
      {
        label: "改进后句子",
        english:
          "For a technical review, we can first map the data flow and confirm security requirements with your IT team.",
        chinese:
          "在技术评审中，我们可以先梳理数据流，并和你们 IT 团队确认安全要求。",
      },
    ],
    vocabulary: [
      {
        term: "technical review",
        phonetic: "/ˈteknɪkəl rɪˈvjuː/",
        chinese: "技术评审",
        example: "For a technical review, we can first confirm the data flow.",
      },
      {
        term: "security requirements",
        phonetic: "/sɪˈkjʊrəti rɪˈkwaɪərmənts/",
        chinese: "安全要求",
        example: "We should confirm security requirements with your IT team.",
      },
    ],
  },
};

const mockDiscoveryPayload = {
  cueResult: {
    id: "support_discovery_question",
    title: "探索问题建议",
    badge: "AI 分析",
    sections: [
      {
        label: "AI 客户上下文",
        english: "What workflow are you trying to improve?",
      },
      {
        label: "推荐问题",
        english: "What does a successful pilot look like for your team?",
        chinese: "对你们团队来说，什么样的试点结果才算成功？",
      },
      {
        label: "建议原因",
        chinese: "这个问题能把客户需求推进到试点目标和评估标准。",
      },
    ],
    vocabulary: [
      {
        term: "successful pilot",
        phonetic: "/səkˈsesfəl ˈpaɪlət/",
        chinese: "成功试点",
        example: "What does a successful pilot look like?",
      },
      {
        term: "evaluation criteria",
        phonetic: "/ɪˌvæljuˈeɪʃən kraɪˈtɪriə/",
        chinese: "评估标准",
        example: "We should align on evaluation criteria.",
      },
    ],
  },
};

const mockMaterialPointPayload = {
  cueResult: {
    id: "support_material_point",
    title: "材料要点建议",
    badge: "AI 分析",
    sections: [
      {
        label: "AI 客户上下文",
        english: "What workflow are you trying to improve?",
      },
      {
        label: "可引用要点",
        english:
          "Use verified material points and mark unsupported deployment details as items for IT confirmation.",
        chinese:
          "引用已验证材料要点，并把未确认部署细节标记为需要 IT 确认的事项。",
      },
      {
        label: "风险边界",
        note: "不要补充材料中没有确认的价格、认证或部署承诺。",
      },
    ],
    vocabulary: [
      {
        term: "verified material points",
        phonetic: "/ˈverɪfaɪd məˈtɪriəl pɔɪnts/",
        chinese: "已验证材料要点",
        example: "Use verified material points in the answer.",
      },
      {
        term: "IT confirmation",
        phonetic: "/ˌaɪ ˈtiː ˌkɑːnfərˈmeɪʃən/",
        chinese: "IT 确认",
        example: "Frame it as an item for IT confirmation.",
      },
    ],
  },
};

const completedRecommendation: TodayRecommendation = {
  id: "competitive_differences:procurement_manager:fenrir-excitable:memory_context",
  title: "采购经理 · 竞品差异说明",
  reason: "今天先练竞品差异。",
  goalId: "competitive_differences",
  goalLabel: "竞品差异说明",
  personaId: "procurement_manager",
  personaLabel: "采购经理",
  voicePackId: "fenrir-excitable",
  voicePackLabel: "Fenrir 高能追问",
  materialMode: "memory_context",
  materialLabel: "系统记忆",
  durationMinutes: 8,
  href: "/practice",
  source: "ai",
  evidence: ["recent review"],
};

const nextRecommendation: TodayRecommendation = {
  id: "application_scenarios:enterprise_buyer:kore-firm:memory_context",
  title: "企业买家 · 应用场景说明",
  reason: "完成快速练习后预取的新推荐。",
  goalId: "application_scenarios",
  goalLabel: "应用场景说明",
  personaId: "enterprise_buyer",
  personaLabel: "企业买家",
  voicePackId: "kore-firm",
  voicePackLabel: "Kore 坚定专业",
  materialMode: "memory_context",
  materialLabel: "系统记忆",
  durationMinutes: 10,
  href: "/practice",
  source: "ai",
  evidence: ["next package"],
};

function installSupportResultFetchMock() {
  const fetchMock = vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);

    if (url.includes("/suggested-answer")) {
      return Promise.resolve(
        new Response(JSON.stringify(mockSuggestedAnswerPayload), { status: 201 }),
      );
    }

    if (url.includes("/support-cue")) {
      const body = init?.body ? JSON.parse(String(init.body)) : {};
      const cue = body.cue as string | undefined;
      const payload =
        cue === "Ask a Discovery Question"
          ? mockDiscoveryPayload
          : cue === "Use Material Point"
            ? mockMaterialPointPayload
            : mockBetterPhrasePayload;

      return Promise.resolve(
        new Response(JSON.stringify(payload), { status: 201 }),
      );
    }

    return Promise.resolve(new Response(JSON.stringify({}), { status: 200 }));
  });

  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

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
    ).mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          reviewId: "review_123",
          sessionId: "session_123",
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
    window.localStorage.clear();
  });

  it("renders the live room status and controls without default transcript turns", () => {
    render(<RealtimeRoom sessionId="session_123" />);

    expect(screen.getByRole("heading", { name: "准备开始" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "开始" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "静音" })).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "结束并复盘" }),
    ).not.toBeInTheDocument();

    expect(
      screen.queryByText("What business problem are you trying to solve with smart glasses?"),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText(
        "We want to help international teams communicate more smoothly during meetings.",
      ),
    ).not.toBeInTheDocument();
    expect(screen.queryByText("材料导航")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "打开提示面板" })).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "换个更自然表达" }),
    ).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "打开提示面板" }));

    expect(screen.getByRole("complementary", { name: "提示" })).toHaveClass(
      "lg:sticky",
    );
    expect(screen.queryByText("隐藏提示")).not.toBeInTheDocument();

    expect(screen.getByText("智能建议")).toBeInTheDocument();
    expect(screen.getByText("当前判断")).toBeInTheDocument();
    expect(screen.getByText("下一步")).toBeInTheDocument();
    expect(screen.getByText("可直接说")).toBeInTheDocument();

    ["核心救场", "优化表达", "推进会谈", "进阶练习"].forEach((section) => {
      expect(screen.getByText(section)).toBeInTheDocument();
    });

    [
      "建议回答",
      "换个更自然表达",
      "使用材料要点",
      "问一个探索问题",
      "挑战我",
    ].forEach((control) => {
      expect(screen.getByRole("button", { name: control })).toBeInTheDocument();
    });
    expect(
      screen.queryByRole("button", { name: "缩短回答" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "翻译这句话" }),
    ).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "关闭提示面板" }));

    expect(
      screen.queryByRole("button", { name: "换个更自然表达" }),
    ).not.toBeInTheDocument();
  });

  it("shows a neutral smart guidance state while waiting for model analysis", () => {
    const initialTranscriptTurns: TranscriptTurn[] = [
      {
        id: "turn_ai_deployment",
        speaker: "ai_customer",
        text: "Can you clarify the deployment options? Cloud or on-premise?",
        translationZh: "你能解释一下部署选项吗？云部署还是本地部署？",
        timestamp: 0,
      },
    ];
    const RealtimeRoomWithInitialTurns = RealtimeRoom as typeof RealtimeRoom & ((
      props: Parameters<typeof RealtimeRoom>[0] & {
        initialTranscriptTurns: TranscriptTurn[];
      },
    ) => ReactElement);

    render(
      <RealtimeRoomWithInitialTurns
        sessionId="session_smart_guidance"
        initialTranscriptTurns={initialTranscriptTurns}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "打开提示面板" }));

    expect(screen.getByText("分析中")).toBeInTheDocument();
    expect(
      screen.getByText("正在根据客户刚才的真实发言生成智能建议。"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("先保持对话节奏，等 AI 分析返回后再按照当前语境选择下一步。"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Let me make sure I understand your point before I answer."),
    ).toBeInTheDocument();
    expect(screen.queryByText("客户正在确认部署方式和安全边界。")).not.toBeInTheDocument();
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

    fireEvent.click(screen.getByRole("button", { name: "打开提示面板" }));
    expect(
      screen.queryByText("Live coaching cue: Better Phrase"),
    ).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "结束并复盘" }));
    expect(screen.getByRole("heading", { name: "会话已结束" })).toBeInTheDocument();
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        "/api/practice-sessions/session_123/review",
        expect.objectContaining({
          method: "POST",
        }),
      );
    });
  });

  it("opens AI coaching panels for manual cues without asking the AI customer to continue", async () => {
    installSupportResultFetchMock();
    const initialTranscriptTurns: TranscriptTurn[] = [
      {
        id: "turn_ai_need",
        speaker: "ai_customer",
        text: "What workflow are you trying to improve?",
        timestamp: 0,
      },
      {
        id: "turn_user_need",
        speaker: "user",
        text: "We want improve meeting communication.",
        timestamp: 8,
      },
    ];
    const RealtimeRoomWithInitialTurns = RealtimeRoom as typeof RealtimeRoom & ((
      props: Parameters<typeof RealtimeRoom>[0] & {
        initialTranscriptTurns: TranscriptTurn[];
      },
    ) => ReactElement);

    render(
      <RealtimeRoomWithInitialTurns
        sessionId="session_manual_cue_panel"
        initialTranscriptTurns={initialTranscriptTurns}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "打开提示面板" }));
    fireEvent.click(screen.getByRole("button", { name: "问一个探索问题" }));

    expect(await screen.findByText("探索问题建议")).toBeInTheDocument();
    expect(screen.getByText("推荐问题")).toBeInTheDocument();
    expect(
      screen.getByText("What does a successful pilot look like for your team?"),
    ).toBeInTheDocument();
    expect(screen.queryByText(/Live coaching cue/)).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "使用材料要点" }));

    expect(await screen.findByText("材料要点建议")).toBeInTheDocument();
    expect(screen.getByText("可引用要点")).toBeInTheDocument();
    expect(
      screen.getByText("不要补充材料中没有确认的价格、认证或部署承诺。"),
    ).toBeInTheDocument();
  });

  it("does not render canned support cue content while waiting for AI analysis", async () => {
    let resolveSupportCue: (response: Response) => void = () => {};
    const fetchMock = vi.fn((input: RequestInfo | URL) => {
      const url = String(input);

      if (url.includes("/support-cue")) {
        return new Promise<Response>((resolve) => {
          resolveSupportCue = resolve;
        });
      }

      return Promise.resolve(new Response(JSON.stringify({}), { status: 200 }));
    });
    vi.stubGlobal("fetch", fetchMock);

    const initialTranscriptTurns: TranscriptTurn[] = [
      {
        id: "turn_ai_material_waiting",
        speaker: "ai_customer",
        text: "Do you have material that supports this deployment claim?",
        timestamp: 0,
      },
      {
        id: "turn_user_material_waiting",
        speaker: "user",
        text: "We have some material for customer review.",
        timestamp: 8,
      },
    ];
    const RealtimeRoomWithInitialTurns = RealtimeRoom as typeof RealtimeRoom & ((
      props: Parameters<typeof RealtimeRoom>[0] & {
        initialTranscriptTurns: TranscriptTurn[];
      },
    ) => ReactElement);

    render(
      <RealtimeRoomWithInitialTurns
        sessionId="session_support_ai_waiting"
        initialTranscriptTurns={initialTranscriptTurns}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "打开提示面板" }));
    fireEvent.click(screen.getByRole("button", { name: "使用材料要点" }));

    expect(screen.getByText("生成中")).toBeInTheDocument();
    expect(screen.queryByText("材料要点建议")).not.toBeInTheDocument();
    expect(screen.queryByText("可引用要点")).not.toBeInTheDocument();
    expect(
      screen.queryByText(
        "Rokid supports real-time translated captions for multilingual conversations.",
      ),
    ).not.toBeInTheDocument();

    resolveSupportCue(
      new Response(
        JSON.stringify({
          cueResult: {
            id: "support_material_ai",
            title: "材料要点建议",
            badge: "AI 分析",
            sections: [
              {
                label: "AI 客户上下文",
                english:
                  "Do you have material that supports this deployment claim?",
              },
              {
                label: "可引用要点",
                english:
                  "Use the verified material point and frame unsupported deployment details as items for IT confirmation.",
                chinese:
                  "引用已验证材料要点，并把未确认部署细节表述为需要 IT 确认的事项。",
              },
            ],
            vocabulary: [
              {
                term: "verified material point",
                phonetic: "/ˈverɪfaɪd məˈtɪriəl pɔɪnt/",
                chinese: "已验证材料要点",
                example: "Use a verified material point in the answer.",
              },
              {
                term: "IT confirmation",
                phonetic: "/ˌaɪ ˈtiː ˌkɑːnfərˈmeɪʃən/",
                chinese: "IT 确认",
                example: "Frame this as an item for IT confirmation.",
              },
            ],
          },
        }),
        { status: 201 },
      ),
    );

    expect(await screen.findByText("材料要点建议")).toBeInTheDocument();
    expect(screen.getByText("verified material point")).toBeInTheDocument();
  });

  it("tailors the better phrase analysis to the conversation context and shows vocabulary", async () => {
    installSupportResultFetchMock();
    const initialTranscriptTurns: TranscriptTurn[] = [
      {
        id: "turn_ai_deployment_context",
        speaker: "ai_customer",
        text: "Can you clarify the deployment options? Cloud or on-premise?",
        timestamp: 0,
      },
      {
        id: "turn_user_value_context",
        speaker: "user",
        text: "We can help translate meetings and make communication better.",
        timestamp: 8,
      },
    ];
    const RealtimeRoomWithInitialTurns = RealtimeRoom as typeof RealtimeRoom & ((
      props: Parameters<typeof RealtimeRoom>[0] & {
        initialTranscriptTurns: TranscriptTurn[];
      },
    ) => ReactElement);

    render(
      <RealtimeRoomWithInitialTurns
        sessionId="session_better_phrase_context"
        initialTranscriptTurns={initialTranscriptTurns}
        initialPracticeSession={{
          id: "session_better_phrase_context",
          scenarioPackId: "rokid-overseas-sales",
          goalId: "customer_qa",
          mode: "customer_qa",
          personaId: "technical_lead",
          voicePackId: "charon-informative",
          difficulty: "normal",
          trainingFocus: ["deployment options", "security review"],
          focusTags: ["技术与部署", "隐私安全"],
        }}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "打开提示面板" }));
    fireEvent.click(screen.getByRole("button", { name: "换个更自然表达" }));

    expect(await screen.findByText("更自然表达分析")).toBeInTheDocument();
    expect(screen.getByText("AI 客户上下文")).toBeInTheDocument();
    expect(screen.getByText("你的原句")).toBeInTheDocument();
    expect(
      screen.getByText(
        "For a technical review, we can first map the data flow and confirm security requirements with your IT team.",
      ),
    ).toBeInTheDocument();
    expect(screen.getByText("高级词汇")).toBeInTheDocument();
    expect(screen.getByText("technical review")).toBeInTheDocument();
    expect(screen.getByText("security requirements")).toBeInTheDocument();
  });

  it("renders the better phrase recommended wording as a full-width section", async () => {
    installSupportResultFetchMock();
    const RealtimeRoomWithInitialTurns = RealtimeRoom as typeof RealtimeRoom & ((
      props: Parameters<typeof RealtimeRoom>[0] & {
        initialTranscriptTurns: TranscriptTurn[];
      },
    ) => ReactElement);

    render(
      <RealtimeRoomWithInitialTurns
        sessionId="session_better_phrase_full_width"
        initialTranscriptTurns={[
          {
            id: "turn_ai_recommended_wording",
            speaker: "ai_customer",
            text: "Can you detail how data is encrypted both at rest and in transit?",
            translationZh: "你能详细说明数据在静态和传输过程中如何加密吗？",
            timestamp: 0,
          },
          {
            id: "turn_user_recommended_wording",
            speaker: "user",
            text: "We can help translate meetings and make communication better.",
            timestamp: 8,
          },
        ]}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "打开提示面板" }));
    fireEvent.click(screen.getByRole("button", { name: "换个更自然表达" }));

    const recommendedSection = (await screen.findByText("改进后句子")).closest(
      "article",
    );
    const contextSection = screen.getByText("AI 客户上下文").closest("article");

    expect(recommendedSection).toHaveClass("md:col-span-2");
    expect(contextSection).not.toHaveClass("md:col-span-2");
  });

  it("shows support results in switchable tabs instead of stacking panels", async () => {
    installSupportResultFetchMock();
    const initialTranscriptTurns: TranscriptTurn[] = [
      {
        id: "turn_ai_security_tabs",
        speaker: "ai_customer",
        text: "Can you detail how data is encrypted both at rest and in transit?",
        translationZh: "你能详细说明数据在静态和传输过程中如何加密吗？",
        timestamp: 0,
      },
      {
        id: "turn_user_security_tabs",
        speaker: "user",
        text: "We can help translate meetings and make communication better.",
        timestamp: 8,
      },
    ];
    const RealtimeRoomWithInitialTurns = RealtimeRoom as typeof RealtimeRoom & ((
      props: Parameters<typeof RealtimeRoom>[0] & {
        initialTranscriptTurns: TranscriptTurn[];
      },
    ) => ReactElement);

    render(
      <RealtimeRoomWithInitialTurns
        sessionId="session_support_result_tabs"
        initialTranscriptTurns={initialTranscriptTurns}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "打开提示面板" }));
    fireEvent.click(screen.getByRole("button", { name: "建议回答" }));
    expect(await screen.findByText("上下文解析")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "换个更自然表达" }));
    expect(await screen.findByText("更自然表达分析")).toBeInTheDocument();

    const workspace = screen.getByRole("region", { name: "辅助结果工作区" });
    expect(
      within(workspace).getByRole("tab", { name: /建议回答/ }),
    ).toHaveAttribute("aria-selected", "false");
    expect(
      within(workspace).getByRole("tab", { name: /更自然表达/ }),
    ).toHaveAttribute("aria-selected", "true");
    expect(within(workspace).getAllByRole("tab")).toHaveLength(2);

    fireEvent.click(within(workspace).getByRole("tab", { name: /建议回答/ }));

    expect(screen.getByText("上下文解析")).toBeInTheDocument();
    expect(screen.queryByText("更自然表达分析")).not.toBeInTheDocument();
  });

  it("collapses and expands the support result workspace", async () => {
    installSupportResultFetchMock();
    const initialTranscriptTurns: TranscriptTurn[] = [
      {
        id: "turn_ai_security_collapse",
        speaker: "ai_customer",
        text: "Can you detail how data is encrypted both at rest and in transit?",
        translationZh: "你能详细说明数据在静态和传输过程中如何加密吗？",
        timestamp: 0,
      },
      {
        id: "turn_user_security_collapse",
        speaker: "user",
        text: "We can help translate meetings and make communication better.",
        timestamp: 8,
      },
    ];
    const RealtimeRoomWithInitialTurns = RealtimeRoom as typeof RealtimeRoom & ((
      props: Parameters<typeof RealtimeRoom>[0] & {
        initialTranscriptTurns: TranscriptTurn[];
      },
    ) => ReactElement);

    render(
      <RealtimeRoomWithInitialTurns
        sessionId="session_support_result_collapse"
        initialTranscriptTurns={initialTranscriptTurns}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "打开提示面板" }));
    fireEvent.click(screen.getByRole("button", { name: "换个更自然表达" }));
    expect(await screen.findByText("更自然表达分析")).toBeInTheDocument();

    const workspace = screen.getByRole("region", { name: "辅助结果工作区" });
    fireEvent.click(
      within(workspace).getByRole("button", { name: "折叠辅助结果工作区" }),
    );

    expect(
      within(workspace).queryByRole("tablist", { name: "辅助结果模块" }),
    ).not.toBeInTheDocument();
    expect(screen.queryByText("更自然表达分析")).not.toBeInTheDocument();
    expect(
      within(workspace).getByRole("button", { name: "展开辅助结果工作区" }),
    ).toBeInTheDocument();

    fireEvent.click(
      within(workspace).getByRole("button", { name: "展开辅助结果工作区" }),
    );

    expect(
      within(workspace).getByRole("tablist", { name: "辅助结果模块" }),
    ).toBeInTheDocument();
    expect(screen.getByText("更自然表达分析")).toBeInTheDocument();
  });

  it("closes individual support result tabs and hides the workspace after the last close", async () => {
    installSupportResultFetchMock();
    const initialTranscriptTurns: TranscriptTurn[] = [
      {
        id: "turn_ai_security_close",
        speaker: "ai_customer",
        text: "Can you detail how data is encrypted both at rest and in transit?",
        translationZh: "你能详细说明数据在静态和传输过程中如何加密吗？",
        timestamp: 0,
      },
      {
        id: "turn_user_security_close",
        speaker: "user",
        text: "We can help translate meetings and make communication better.",
        timestamp: 8,
      },
    ];
    const RealtimeRoomWithInitialTurns = RealtimeRoom as typeof RealtimeRoom & ((
      props: Parameters<typeof RealtimeRoom>[0] & {
        initialTranscriptTurns: TranscriptTurn[];
      },
    ) => ReactElement);

    render(
      <RealtimeRoomWithInitialTurns
        sessionId="session_support_result_close"
        initialTranscriptTurns={initialTranscriptTurns}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "打开提示面板" }));
    fireEvent.click(screen.getByRole("button", { name: "建议回答" }));
    expect(await screen.findByText("上下文解析")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "换个更自然表达" }));
    expect(await screen.findByText("更自然表达分析")).toBeInTheDocument();

    let workspace = screen.getByRole("region", { name: "辅助结果工作区" });
    fireEvent.click(within(workspace).getByRole("button", { name: "关闭更自然表达" }));

    workspace = screen.getByRole("region", { name: "辅助结果工作区" });
    expect(
      within(workspace).getByRole("tab", { name: /建议回答/ }),
    ).toHaveAttribute("aria-selected", "true");
    expect(screen.getByText("上下文解析")).toBeInTheDocument();
    expect(screen.queryByRole("tab", { name: /更自然表达/ })).not.toBeInTheDocument();

    fireEvent.click(within(workspace).getByRole("button", { name: "关闭建议回答" }));

    expect(
      screen.queryByRole("region", { name: "辅助结果工作区" }),
    ).not.toBeInTheDocument();
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
      voicePackId: "puck-upbeat",
      difficulty: "normal",
      trainingFocus: ["channel partnership"],
      focusTags: ["渠道合作"],
    });

    render(<RealtimeRoom sessionId="session_custom" />);

    expect(await screen.findByText("AI 声音：Puck 轻快外向")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "开始" }));
    expect(await screen.findByRole("heading", { name: "对话中" })).toBeInTheDocument();

    const [, requestInit] = fetchMock.mock.calls[0];
    expect(JSON.parse(String(requestInit.body))).toMatchObject({
      practiceSessionId: "session_custom",
      goalId: "solution_meeting",
      mode: "solution_meeting",
      personaId: "channel_partner",
      voicePackId: "puck-upbeat",
      trainingFocus: ["channel partnership"],
      focusTags: ["渠道合作"],
    });
  });

  it("preloads the next daily recommendation after a quick practice ends", async () => {
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
    writeTodayRecommendationCache(completedRecommendation);
    savePracticeSessionSelection({
      id: "session_quick_practice",
      scenarioPackId: "rokid-overseas-sales",
      goalId: "competitive_differences",
      mode: "customer_qa",
      personaId: "procurement_manager",
      voicePackId: "fenrir-excitable",
      difficulty: "normal",
      trainingFocus: ["竞品差异"],
      focusTags: ["竞品差异"],
      source: "today-recommendation",
      recommendationId: completedRecommendation.id,
    });
    const fetchMock = vi.fn((input: RequestInfo | URL) => {
      const url = String(input);

      if (url === "/api/realtime/session") {
        return Promise.resolve(
          new Response(
            JSON.stringify({
              clientSecret: "mock_realtime_client_secret_123",
              sessionId: "rt_session_quick",
              expiresAt: new Date(Date.now() + 60_000).toISOString(),
              model: "gpt-realtime-mini",
              instructionsPreview: "Procurement Manager",
            }),
            { status: 201 },
          ),
        );
      }

      if (url.includes("/transcript")) {
        return Promise.resolve(
          new Response(JSON.stringify({ status: "saved" }), { status: 201 }),
        );
      }

      if (url.includes("/api/today-recommendation")) {
        return Promise.resolve(
          new Response(JSON.stringify({ recommendation: nextRecommendation }), {
            status: 200,
          }),
        );
      }

      return Promise.resolve(new Response(JSON.stringify({}), { status: 200 }));
    });
    vi.stubGlobal("fetch", fetchMock);

    render(<RealtimeRoom sessionId="session_quick_practice" />);

    fireEvent.click(screen.getByRole("button", { name: "开始" }));
    expect(await screen.findByRole("heading", { name: "对话中" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "结束并复盘" }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining("/api/today-recommendation?"),
        expect.objectContaining({
          signal: expect.any(AbortSignal),
        }),
      );
    });
    expect(
      String(
        fetchMock.mock.calls.find((call) =>
          String(call[0]).includes("/api/today-recommendation"),
        )?.[0],
      ),
    ).toBe("/api/today-recommendation?refresh=1");
    expect(readTodayRecommendationCache()?.completedRecommendationIds).toContain(
      completedRecommendation.id,
    );
    expect(readTodayRecommendationCache()?.recommendation.title).toBe(
      "企业买家 · 应用场景说明",
    );
  });

  it("shows a suggested answer module under the transcript and sends the selected context", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          suggestion: {
            id: "suggestion_123",
            aiQuestion: {
              english:
                "Can you detail how data is encrypted both at rest and in transit?",
              translationZh:
                "你能详细说明数据在静态和传输过程中如何加密吗？",
            },
            analysis:
              "This technical buyer is asking for a precise security answer, so respond with scope, safeguards, and a review next step.",
            responseStrategy: {
              english:
                "Acknowledge the security concern first, then give a bounded deployment answer and propose a technical review.",
              chinese:
                "先承认客户的安全顾虑，再给出有边界的部署回答，并建议进行技术评审。",
            },
            logicBreakdown: {
              surfaceMeaningZh: "客户在询问云端部署和本地部署的选择。",
              customerIntentZh: "客户想确认 Rokid 是否能满足企业安全要求。",
              informationNeededZh:
                "客户需要了解部署方式、数据流、加密边界和 IT 审查路径。",
              responseFocusZh:
                "回答时先聚焦安全边界，再说明可以与 IT 团队共同确认细节。",
            },
            contextBreakdown: {
              conversationStateZh: "当前对话正在围绕部署方式和安全要求展开。",
              customerQuestionReasonZh:
                "客户前面已经进入技术评估阶段，所以现在追问部署边界。",
              priorUserAnswerZh:
                "用户前面还没有给出具体部署方案，只说明需要进一步确认。",
              missingInformationZh:
                "还缺少客户 IT 政策、系统环境和允许的数据处理边界。",
              responseBoundaryZh:
                "不要直接承诺所有云端或本地部署方式，只能先提出和 IT 团队确认。",
            },
            suggestedReplies: [
              {
                english:
                  "That is an important security question. For a pilot, we can first map the data flow with your IT team and confirm encryption requirements before deployment.",
                chinese:
                  "这是一个很重要的安全问题。试点阶段我们可以先和你们 IT 团队梳理数据流，并在部署前确认加密要求。",
                reason:
                  "It acknowledges the concern, avoids unsupported claims, and moves the conversation to a technical review.",
              },
            ],
            vocabulary: [
              {
                term: "at rest",
                phonetic: "/æt rest/",
                chinese: "静态存储时",
                example: "data encrypted at rest",
              },
            ],
            phrasebookEntry: {
              category: "Objection Handling",
              english:
                "That is an important security question. For a pilot, we can first map the data flow with your IT team and confirm encryption requirements before deployment.",
              chinese:
                "这是一个很重要的安全问题。试点阶段我们可以先和你们 IT 团队梳理数据流，并在部署前确认加密要求。",
              useCase: "Answer a technical buyer's security question.",
              tags: ["suggested-answer", "live-coaching"],
              source: "review",
              masteryStatus: "needs_practice",
            },
            createdAt: "2026-05-19T00:00:00.000Z",
          },
        }),
        { status: 201 },
      ),
    );
    vi.stubGlobal("fetch", fetchMock);
    const initialTranscriptTurns: TranscriptTurn[] = [
      {
        id: "turn_ai_security",
        speaker: "ai_customer",
        text: "Can you detail how data is encrypted both at rest and in transit?",
        translationZh: "你能详细说明数据在静态和传输过程中如何加密吗？",
        timestamp: 0,
      },
    ];
    const RealtimeRoomWithInitialTurns = RealtimeRoom as typeof RealtimeRoom & ((
      props: Parameters<typeof RealtimeRoom>[0] & {
        initialTranscriptTurns: TranscriptTurn[];
      },
    ) => ReactElement);

    render(
      <RealtimeRoomWithInitialTurns
        sessionId="session_suggested_answer"
        initialTranscriptTurns={initialTranscriptTurns}
        initialPracticeSession={{
          id: "session_suggested_answer",
          scenarioPackId: "rokid-overseas-sales",
          goalId: "customer_qa",
          mode: "customer_qa",
          personaId: "technical_lead",
          voicePackId: "charon-informative",
          difficulty: "normal",
          trainingFocus: ["security objections"],
          focusTags: ["隐私安全"],
        }}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "打开提示面板" }));
    fireEvent.click(screen.getByRole("button", { name: "建议回答" }));

    expect(
      await screen.findByText(
        "That is an important security question. For a pilot, we can first map the data flow with your IT team and confirm encryption requirements before deployment.",
      ),
    ).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "建议回答" })).toBeInTheDocument();
    expect(screen.getByText("上下文解析")).toBeInTheDocument();
    expect(screen.getByText("当前对话正在围绕部署方式和安全要求展开。")).toBeInTheDocument();
    expect(
      screen.getByText("客户前面已经进入技术评估阶段，所以现在追问部署边界。"),
    ).toBeInTheDocument();
    expect(screen.getByText("语句逻辑拆解")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Acknowledge the security concern first, then give a bounded deployment answer and propose a technical review.",
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText("先承认客户的安全顾虑，再给出有边界的部署回答，并建议进行技术评审。"),
    ).toBeInTheDocument();
    expect(screen.getByText("客户想确认 Rokid 是否能满足企业安全要求。")).toBeInTheDocument();
    expect(
      screen.getAllByText(
        "Can you detail how data is encrypted both at rest and in transit?",
      ).length,
    ).toBeGreaterThanOrEqual(2);
    expect(screen.getByText("你能详细说明数据在静态和传输过程中如何加密吗？")).toBeInTheDocument();
    expect(screen.getByText("/æt rest/")).toBeInTheDocument();
    expect(screen.queryByText("技术负责人")).not.toBeInTheDocument();

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/practice-sessions/session_suggested_answer/suggested-answer",
      expect.objectContaining({
        method: "POST",
        body: expect.stringContaining("technical_lead"),
      }),
    );
  });
});
