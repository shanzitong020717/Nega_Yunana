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
      "Ava 友好买家",
      "Serena 企业决策者",
      "Ethan 技术负责人",
      "Marcus 高管客户",
      "Vivian 挑剔采购",
      "Noah 渠道伙伴",
    ]);

    expect(defaultScenarioPack.voicePacks).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "vivian-critical-procurement",
          gender: "female",
          speed: "fast",
          bestFor: expect.arrayContaining(["竞品差异", "优缺点"]),
        }),
        expect.objectContaining({
          id: "ethan-technical-lead",
          gender: "male",
          bestFor: expect.arrayContaining(["技术参数"]),
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
    expect(getDefaultVoicePack("missing-scenario").name).toBe("Ava 友好买家");
  });
});
