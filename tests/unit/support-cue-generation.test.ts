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
import { generateSupportCue } from "@/lib/ai/support-cue";
import type { PracticeSessionRecord } from "@/lib/practice/practice-session-store";

const persona = defaultScenarioPack.personas.find(
  (item) => item.id === "technical_lead",
)!;

const practiceSession: PracticeSessionRecord = {
  id: "session_support_cue_model",
  scenarioPackId: "rokid-overseas-sales",
  goalId: "customer_qa",
  mode: "customer_qa",
  personaId: "technical_lead",
  voicePackId: "charon-informative",
  materialId: undefined,
  prepCardId: undefined,
  difficulty: "normal",
  trainingFocus: ["deployment options", "security review"],
  focusTags: ["技术与部署", "隐私安全"],
  sourceObjectionId: undefined,
  status: "active",
  createdAt: new Date().toISOString(),
};

describe("generateSupportCue", () => {
  it("uses the text model with the real cue and transcript context", async () => {
    generateTextJSONMock.mockResolvedValueOnce({
      id: "ai_support_cue",
      title: "探索问题建议",
      badge: "AI 分析",
      sections: [
        {
          label: "AI 客户上下文",
          english: "Can you clarify the deployment options? Cloud or on-premise?",
        },
        {
          label: "推荐问题",
          english: "What deployment constraints should we consider first?",
          chinese: "我们应该先考虑哪些部署限制？",
        },
        {
          label: "建议原因",
          chinese: "这个问题能把部署讨论推进到客户真实限制和下一步 IT 评估。",
        },
      ],
      vocabulary: [
        {
          term: "deployment constraints",
          phonetic: "/dɪˈplɔɪmənt kənˈstreɪnts/",
          chinese: "部署限制",
          example: "What deployment constraints should we consider first?",
        },
        {
          term: "IT evaluation",
          phonetic: "/ˌaɪ ˈtiː ɪˌvæljuˈeɪʃən/",
          chinese: "IT 评估",
          example: "This can support the IT evaluation.",
        },
      ],
    });
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("SUBTITLE_DEEPSEEK_MODEL", "deepseek-v4-flash");

    const result = await generateSupportCue({
      cue: "Ask a Discovery Question",
      persona,
      practiceSession,
      transcriptTurns: [
        {
          speaker: "ai_customer",
          text: "Can you clarify the deployment options? Cloud or on-premise?",
          timestamp: 0,
          metadata: {},
        },
        {
          speaker: "user",
          text: "We support different deployment needs.",
          timestamp: 8,
          metadata: {},
        },
      ],
    });
    vi.unstubAllEnvs();

    expect(result.id).toBe("ai_support_cue");
    expect(result.sections[1]?.english).toContain("deployment constraints");
    expect(generateTextJSONMock).toHaveBeenCalledWith(
      expect.objectContaining({
        model: "deepseek-v4-flash",
        schemaName: "support cue",
        timeoutMs: 20_000,
      }),
    );
    const prompt = generateTextJSONMock.mock.calls[0]?.[0].prompt as string;
    expect(prompt).toContain("Ask a Discovery Question");
    expect(prompt).toContain("Can you clarify the deployment options?");
    expect(prompt).toContain("We support different deployment needs.");
    expect(prompt).toContain("Recent transcript");
    expect(prompt).toContain(
      "For Ask a Discovery Question: include a recommended question, why it works, customer intent, and what signal to listen for after asking.",
    );
    expect(prompt).toContain(
      "For Use Material Point: include the material-backed point, how to connect it to the conversation, material basis, and a risk boundary.",
    );
  });

  it("returns a context-derived support cue when the production model fails", async () => {
    generateTextJSONMock.mockRejectedValueOnce(new Error("model timeout"));
    vi.stubEnv("NODE_ENV", "production");

    const result = await generateSupportCue({
      cue: "Use Material Point",
      persona,
      practiceSession,
      transcriptTurns: [
        {
          speaker: "ai_customer",
          text: "Do you have material that supports this deployment claim?",
          timestamp: 0,
          metadata: {},
        },
      ],
    });
    vi.unstubAllEnvs();

    expect(result.title).toBe("材料要点建议");
    expect(result.sections[0]?.english).toContain("deployment claim");
    expect(result.sections.some((section) => section.label === "风险边界")).toBe(
      true,
    );
  });
});
