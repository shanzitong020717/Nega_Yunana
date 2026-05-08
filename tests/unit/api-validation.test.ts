import { describe, expect, it } from "vitest";

import { createMaterialInputSchema } from "@/lib/validation/materials";
import { createPhraseInputSchema } from "@/lib/validation/phrasebook";
import { createPracticeSessionInputSchema } from "@/lib/validation/practice";

describe("api validation schemas", () => {
  it("accepts valid material input", () => {
    expect(
      createMaterialInputSchema.parse({
        name: "Rokid enterprise demo deck",
        fileType: "PDF",
        originalFileName: "demo.pdf",
        storagePath: "materials/demo.pdf",
        customerType: "Enterprise Buyer",
        industry: "Conference",
        meetingGoal: "schedule_follow_up_demo",
        confidentialMode: true,
        notes: "Practice privacy objections.",
      }),
    ).toMatchObject({
      fileType: "PDF",
      confidentialMode: true,
    });
  });

  it("rejects unsupported file types", () => {
    expect(() =>
      createMaterialInputSchema.parse({
        name: "Video demo",
        fileType: "MP4",
        originalFileName: "demo.mp4",
        storagePath: "materials/demo.mp4",
      }),
    ).toThrow("Unsupported file type");
  });

  it("rejects invalid persona ids", () => {
    expect(() =>
      createPracticeSessionInputSchema.parse({
        mode: "customer_qa",
        personaId: "random_customer",
        difficulty: "normal",
        trainingFocus: ["business_value"],
      }),
    ).toThrow("Invalid customer persona");
  });

  it("rejects empty phrase English sentences", () => {
    expect(() =>
      createPhraseInputSchema.parse({
        category: "Business Value",
        english: "   ",
        chinese: "核心价值是实时降低沟通阻力。",
        useCase: "Explaining business value.",
        tags: ["business-value"],
      }),
    ).toThrow("English sentence is required");
  });
});
