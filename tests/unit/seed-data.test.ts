import { describe, expect, it } from "vitest";

import { objections, objectionCategories } from "@/data/objections";
import { personas } from "@/data/personas";
import { phraseCategories, seedPhrases } from "@/data/seed-phrases";

describe("seed domain data", () => {
  it("contains all required customer personas", () => {
    expect(personas.map((persona) => persona.id).sort()).toEqual([
      "distributor",
      "end_user_manager",
      "enterprise_buyer",
      "procurement_manager",
      "skeptical_executive",
      "technical_lead",
    ]);
  });

  it("contains at least 30 objections across all required categories", () => {
    expect(objections).toHaveLength(30);
    expect(objectionCategories).toEqual([
      "Product Value",
      "Accuracy & Reliability",
      "Privacy & Security",
      "Deployment",
      "Competition",
      "Pricing & Pilot",
    ]);

    for (const category of objectionCategories) {
      expect(
        objections.filter((objection) => objection.category === category),
      ).toHaveLength(5);
    }
  });

  it("contains all required phrasebook categories with starter phrases", () => {
    expect(phraseCategories).toEqual([
      "Opening",
      "Discovery Questions",
      "Product Positioning",
      "Feature Explanation",
      "Business Value",
      "Demo Narration",
      "产品应用场景",
      "产品优点与缺点",
      "竞品差异与替代方案对比",
      "产品详细参数",
      "Objection Handling",
      "Pricing & Pilot",
      "Closing & Next Step",
      "Follow-up Email",
    ]);

    for (const category of phraseCategories) {
      expect(seedPhrases.some((phrase) => phrase.category === category)).toBe(
        true,
      );
    }
  });
});
