import { describe, expect, it } from "vitest";

import {
  defaultScenarioPack,
  scenarioPacks,
} from "@/data/scenario-packs";
import {
  getDefaultVoicePack,
  getScenarioPack,
} from "@/lib/scenarios/current-scenario";

describe("scenario pack configuration", () => {
  it("defines the Rokid overseas sales scenario as the default pack", () => {
    expect(defaultScenarioPack.id).toBe("rokid-overseas-sales");
    expect(scenarioPacks.map((pack) => pack.id)).toContain(
      "rokid-overseas-sales",
    );
  });

  it("defines the redesigned primary navigation labels", () => {
    expect(defaultScenarioPack.navigation.primary.map((item) => item.label)).toEqual([
      "今日练习",
      "客户材料",
      "表达库",
      "复盘",
    ]);
  });

  it("defines the selectable AI voice packs", () => {
    expect(defaultScenarioPack.voicePacks.map((voicePack) => voicePack.name)).toEqual([
      "Kore 坚定专业",
      "Zephyr 明亮友好",
      "Puck 轻快外向",
      "Charon 清晰信息型",
      "Fenrir 高能追问",
      "Leda 年轻自然",
    ]);

    expect(defaultScenarioPack.voicePacks).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "kore-firm",
          providerVoiceName: "Kore",
          gender: "female",
          geminiLiveConfig: expect.objectContaining({
            speech_config: expect.objectContaining({
              voice_config: expect.objectContaining({
                prebuilt_voice_config: expect.objectContaining({
                  voice_name: "Kore",
                }),
              }),
            }),
          }),
          bestFor: expect.arrayContaining(["企业买家"]),
        }),
        expect.objectContaining({
          id: "charon-informative",
          providerVoiceName: "Charon",
          gender: "male",
          geminiLiveConfig: expect.objectContaining({
            speech_config: expect.objectContaining({
              voice_config: expect.objectContaining({
                prebuilt_voice_config: expect.objectContaining({
                  voice_name: "Charon",
                }),
              }),
            }),
          }),
          bestFor: expect.arrayContaining(["技术参数"]),
        }),
      ]),
    );
  });

  it("defines ten fully configured practice scenarios for the first wizard step", () => {
    const practiceGoals = defaultScenarioPack.practiceGoals;
    const personaIds = new Set(defaultScenarioPack.personas.map((persona) => persona.id));
    const voicePackIds = new Set(
      defaultScenarioPack.voicePacks.map((voicePack) => voicePack.id),
    );

    expect(practiceGoals.map((goal) => goal.label)).toEqual([
      "客户问答",
      "产品演示讲解",
      "应用场景说明",
      "优缺点对比",
      "竞品差异说明",
      "产品参数解释",
      "隐私安全沟通",
      "部署与集成沟通",
      "方案会议推进",
      "60 秒快速表达",
    ]);

    practiceGoals.forEach((goal) => {
      expect(goal).toMatchObject({
        mode: expect.any(String),
        openingStrategyHint: expect.any(String),
        conversationStrategyModifiers: expect.objectContaining({
          preferredOpeningModes: expect.any(Array),
          escalationBias: expect.any(String),
          firstTurnIntent: expect.any(String),
        }),
      });
      expect(goal.description).not.toHaveLength(0);
      expect(goal.defaultFocusTags.length).toBeGreaterThan(0);
      expect(goal.recommendedPersonaIds.length).toBeGreaterThan(0);
      expect(goal.recommendedVoicePackIds.length).toBeGreaterThan(0);
      expect(goal.questionGuidance.length).toBeGreaterThan(0);
      expect(goal.reviewDimensions.length).toBeGreaterThan(0);
      expect(goal.phrasebookTags.length).toBeGreaterThan(0);
      goal.recommendedPersonaIds.forEach((personaId) => {
        expect(personaIds.has(personaId)).toBe(true);
      });
      goal.recommendedVoicePackIds.forEach((voicePackId) => {
        expect(voicePackIds.has(voicePackId)).toBe(true);
      });
    });

    expect(practiceGoals.find((goal) => goal.id === "customer_qa")).toMatchObject({
      defaultFocusTags: expect.arrayContaining(["探索式提问"]),
      questionGuidance: expect.arrayContaining([
        expect.stringContaining("business problem"),
      ]),
    });
    expect(practiceGoals.find((goal) => goal.id === "demo_narration")).toMatchObject({
      label: "产品演示讲解",
      defaultFocusTags: expect.arrayContaining(["产品演示表达"]),
    });
    expect(practiceGoals.find((goal) => goal.id === "solution_meeting")).toMatchObject({
      label: "方案会议推进",
      mode: "solution_meeting",
    });
    expect(practiceGoals.find((goal) => goal.id === "quick_pitch")).toMatchObject({
      conversationStrategyModifiers: expect.objectContaining({
        firstTurnIntent: expect.stringContaining("30-60"),
      }),
    });
  });

  it("defines role-specific prompts for each customer persona", () => {
    expect(defaultScenarioPack.personas).toHaveLength(5);
    expect(defaultScenarioPack.personas).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "enterprise_buyer",
          rolePrompt: expect.stringContaining("application scenarios"),
        }),
        expect.objectContaining({
          id: "technical_lead",
          rolePrompt: expect.stringContaining("product parameters"),
          openingQuestions: expect.arrayContaining([
            expect.stringContaining("parameters"),
          ]),
          followUpPatterns: expect.arrayContaining([
            expect.stringContaining("integration"),
          ]),
          challengeRules: expect.arrayContaining([
            expect.stringContaining("unsupported"),
          ]),
          defaultFocusTags: expect.arrayContaining(["产品参数解释"]),
        }),
        expect.objectContaining({
          id: "procurement_manager",
          rolePrompt: expect.stringContaining("competitor differences"),
        }),
        expect.objectContaining({
          id: "channel_partner",
          rolePrompt: expect.stringContaining("go-to-market positioning"),
        }),
        expect.objectContaining({
          id: "executive_decision_maker",
          rolePrompt: expect.stringContaining("concise business value"),
        }),
      ]),
    );
  });

  it("defines role to voice recommendations for the second wizard step", () => {
    expect(defaultScenarioPack.roleVoiceRules).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          roleId: "technical_lead",
          defaultVoicePackId: "charon-informative",
          recommendedVoicePackIds: expect.arrayContaining([
            "charon-informative",
            "kore-firm",
          ]),
        }),
        expect.objectContaining({
          roleId: "executive_decision_maker",
          defaultVoicePackId: "fenrir-excitable",
        }),
      ]),
    );
  });

  it("includes Rokid product-focused phrase categories", () => {
    expect(defaultScenarioPack.phraseCategories.map((category) => category.label)).toEqual(
      expect.arrayContaining([
        "产品应用场景",
        "产品优点与缺点",
        "竞品差异与替代方案对比",
        "产品详细参数",
      ]),
    );
  });

  it("includes the review rubric needed by the redesigned review loop", () => {
    expect(defaultScenarioPack.reviewRubric.map((item) => item.label)).toEqual(
      expect.arrayContaining([
        "产品价值表达",
        "异议处理",
        "材料覆盖度",
        "句子自然度",
      ]),
    );
  });

  it("returns the default scenario and default voice pack for unknown ids", () => {
    expect(getScenarioPack("missing-scenario").id).toBe("rokid-overseas-sales");
    expect(getDefaultVoicePack("missing-scenario").name).toBe("Kore 坚定专业");
  });
});
