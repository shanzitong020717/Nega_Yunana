import { describe, expect, it, vi } from "vitest";

const { generateTextJSONMock } = vi.hoisted(() => ({
  generateTextJSONMock: vi.fn(),
}));

vi.mock("@/lib/ai/text-client", () => ({
  TEXT_ANALYSIS_BOUNDARY: "DeepSeek text analysis boundary",
  generateTextJSON: generateTextJSONMock,
  hasTextAIApiKey: vi.fn(() => true),
}));

import { defaultScenarioPack } from "@/data/scenario-packs";
import { generateSmartGuidance } from "@/lib/ai/support-cue";
import type { PracticeSessionRecord } from "@/lib/practice/practice-session-store";

const practiceSession: PracticeSessionRecord = {
  id: "session_smart_guidance_model",
  scenarioPackId: "rokid-overseas-sales",
  goalId: "customer_qa",
  mode: "customer_qa",
  personaId: "technical_lead",
  voicePackId: "kore-firm",
  materialId: undefined,
  prepCardId: undefined,
  difficulty: "normal",
  trainingFocus: ["product use cases", "competitive difference"],
  focusTags: ["应用场景", "差异点"],
  sourceObjectionId: undefined,
  status: "active",
  createdAt: new Date().toISOString(),
};

const persona = defaultScenarioPack.personas.find(
  (item) => item.id === "technical_lead",
)!;

describe("generateSmartGuidance", () => {
  it("uses the text model and sends the real recent transcript context", async () => {
    generateTextJSONMock.mockResolvedValueOnce({
      currentJudgment: "客户正在比较智能眼镜和手机翻译应用的实际场景差异。",
      nextStep: "先回应对比问题，再把回答落到免手持、会议连续性和工作流适配。",
      riskNote: "不要泛泛声称全面优于手机应用，要限定在客户的业务场景里说明差异。",
      sayThis:
        "The key difference is that Rokid keeps the conversation visible and hands-free while people stay in the workflow.",
    });
    vi.stubEnv("NODE_ENV", "production");

    const guidance = await generateSmartGuidance({
      persona,
      practiceSession,
      transcriptTurns: [
        {
          speaker: "ai_customer",
          text: "Why should we use Rokid instead of a phone translation app?",
          timestamp: 0,
          metadata: {},
        },
        {
          speaker: "user",
          text: "It is better for meetings.",
          timestamp: 8,
          metadata: {},
        },
      ],
    });
    vi.unstubAllEnvs();

    expect(guidance.currentJudgment).toContain("手机翻译应用");
    expect(generateTextJSONMock).toHaveBeenCalledWith(
      expect.objectContaining({
        model: "deepseek-v4-flash",
        schemaName: "smart guidance",
        timeoutMs: 7_000,
        maxRetries: 1,
      }),
    );
    const prompt = generateTextJSONMock.mock.calls[0]?.[0].prompt as string;
    expect(prompt).toContain(
      "Why should we use Rokid instead of a phone translation app?",
    );
    expect(prompt).toContain("It is better for meetings.");
    expect(prompt).toContain("Recent transcript");
  });

  it("returns context-derived guidance when the production text model fails", async () => {
    generateTextJSONMock.mockRejectedValueOnce(new Error("model timeout"));
    vi.stubEnv("NODE_ENV", "production");

    const guidance = await generateSmartGuidance({
      persona,
      practiceSession,
      transcriptTurns: [
        {
          speaker: "ai_customer",
          text: "Which use cases are most successful for field service?",
          timestamp: 0,
          metadata: {},
        },
      ],
    });
    vi.unstubAllEnvs();

    expect(guidance.currentJudgment).toContain("客户刚提出新问题");
    expect(guidance.nextStep).toContain("确认问题");
    expect(guidance.sayThis).toContain("priority");
  });

  it("removes garbled speech-recognition snippets from Chinese guidance fields", async () => {
    generateTextJSONMock.mockResolvedValueOnce({
      currentJudgment:
        "用户最近两次回应不清晰（'stumps'和'Shout out a la'），可能未理解AI客户关于数据安全的追问，导致对话卡住。",
      nextStep:
        "引导用户复述或澄清AI客户的问题，例如'I'm sorry, could you please repeat the question?'，再鼓励用英文完整回答数据安全措施。",
      riskNote: "如果继续模糊回应，对话将无法推进到具体技术细节。",
      sayThis:
        "Could you repeat the question about data security? I want to make sure I address your specific concerns.",
    });
    vi.stubEnv("NODE_ENV", "production");

    const guidance = await generateSmartGuidance({
      persona,
      practiceSession,
      transcriptTurns: [
        {
          speaker: "ai_customer",
          text: "Can you explain how customer data is protected?",
          timestamp: 0,
          metadata: {},
        },
        {
          speaker: "user",
          text: "stumps",
          timestamp: 5,
          metadata: {},
        },
        {
          speaker: "user",
          text: "Shout out a la",
          timestamp: 8,
          metadata: {},
        },
      ],
    });
    vi.unstubAllEnvs();

    expect(guidance.currentJudgment).toContain("用户最近两次回应不清晰");
    expect(guidance.currentJudgment).not.toContain("stumps");
    expect(guidance.currentJudgment).not.toContain("Shout out a la");
    expect(guidance.currentJudgment).not.toMatch(/[（(][^）)]*['"‘’][^）)]*[）)]/);
    expect(guidance.nextStep).not.toContain("I'm sorry");
    const prompt = generateTextJSONMock.mock.calls.at(-1)?.[0].prompt as string;
    expect(prompt).toContain("Never quote raw unclear ASR fragments");
  });
});
