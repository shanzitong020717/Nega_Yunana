import { describe, expect, it } from "vitest";

import {
  listMaterialRecords,
  saveMaterialRecord,
} from "@/lib/materials/material-store";
import {
  listPracticeSessionRecords,
  savePracticeSessionRecord,
} from "@/lib/practice/practice-session-store";

describe("user-scoped stores", () => {
  it("only lists materials owned by the requested user", () => {
    saveMaterialRecord({
      userId: "profile_store_a",
      name: "Alice Deck",
      fileType: "PDF",
      originalFileName: "alice.pdf",
      storagePath: "/tmp/alice.pdf",
      confidentialMode: true,
    });
    saveMaterialRecord({
      userId: "profile_store_b",
      name: "Bob Deck",
      fileType: "PDF",
      originalFileName: "bob.pdf",
      storagePath: "/tmp/bob.pdf",
      confidentialMode: true,
    });

    const aliceMaterials = listMaterialRecords({
      userId: "profile_store_a",
    });

    expect(aliceMaterials.map((material) => material.name)).toContain(
      "Alice Deck",
    );
    expect(aliceMaterials.map((material) => material.name)).not.toContain(
      "Bob Deck",
    );
  });

  it("only lists practice sessions owned by the requested user", () => {
    savePracticeSessionRecord({
      userId: "profile_session_a",
      scenarioPackId: "rokid-overseas-sales",
      goalId: "customer_qa",
      mode: "customer_qa",
      personaId: "technical_lead",
      voicePackId: "kore-firm",
      materialMode: "no_material",
      difficulty: "normal",
      trainingFocus: ["privacy"],
      focusTags: ["隐私安全"],
    });
    savePracticeSessionRecord({
      userId: "profile_session_b",
      scenarioPackId: "rokid-overseas-sales",
      goalId: "demo_walkthrough",
      mode: "presentation_rehearsal",
      personaId: "enterprise_buyer",
      voicePackId: "leda-youthful",
      materialMode: "no_material",
      difficulty: "normal",
      trainingFocus: ["scenario"],
      focusTags: ["应用场景"],
    });

    expect(
      listPracticeSessionRecords({
        userId: "profile_session_a",
      }),
    ).toHaveLength(1);
  });
});
