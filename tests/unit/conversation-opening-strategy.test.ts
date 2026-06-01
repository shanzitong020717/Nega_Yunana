import { describe, expect, it } from "vitest";

import {
  resolveConversationOpeningStrategy,
  resolveVoiceTemperamentModifier,
} from "@/config/scenarios/rokid-overseas-sales/conversation-opening-strategies";

describe("conversation opening strategy", () => {
  it("starts technical-lead conversations with context before detailed audit questions", () => {
    const strategy = resolveConversationOpeningStrategy({
      goalId: "customer_qa",
      roleId: "technical_lead",
      voicePackId: "charon-informative",
    });

    expect(strategy.defaultModeMix).toEqual([
      "efficient_warm_start",
      "formal_business",
    ]);
    expect(strategy.escalationAfterTurn).toBe(4);
    expect(strategy.firstTurnGoal).toContain("confirm the main use case");
    expect(strategy.doNotStartWith).toEqual(
      expect.arrayContaining([
        "data encryption audit",
        "deployment model challenge",
      ]),
    );
  });

  it("lets channel-partner demo practice invite the learner to introduce first", () => {
    const strategy = resolveConversationOpeningStrategy({
      goalId: "demo_narration",
      roleId: "channel_partner",
      voicePackId: "puck-upbeat",
    });

    expect(strategy.defaultModeMix).toContain("learner_led_intro");
    expect(strategy.firstTurnGoal).toContain(
      "invite the learner to introduce Rokid",
    );
    expect(strategy.thirdTurnGoal).toContain("demo story");
  });

  it("keeps Fenrir polite before increasing pressure after context is established", () => {
    const modifier = resolveVoiceTemperamentModifier("fenrir-excitable");

    expect(modifier.pressureRamp).toBe("fast_after_context");
    expect(modifier.openingTone).toContain("polite for the first 2 turns");
    expect(modifier.wordingStyle).toContain("short");
  });

  it("uses quick-pitch goals to ask for a concise 30-60 second value explanation", () => {
    const strategy = resolveConversationOpeningStrategy({
      goalId: "quick_pitch",
      roleId: "executive_decision_maker",
      voicePackId: "fenrir-excitable",
    });

    expect(strategy.firstTurnGoal).toContain("30-60 second");
    expect(strategy.escalationAfterTurn).toBe(3);
    expect(strategy.preferredOpeningMoves).toEqual(
      expect.arrayContaining([
        expect.stringContaining("30-second version"),
      ]),
    );
  });

  it("uses product-parameter practice to ask for use case context before technical details", () => {
    const strategy = resolveConversationOpeningStrategy({
      goalId: "product_parameters",
      roleId: "technical_lead",
      voicePackId: "charon-informative",
    });

    expect(strategy.defaultModeMix).toContain("efficient_warm_start");
    expect(strategy.firstTurnGoal).toContain("confirm the application context");
    expect(strategy.secondTurnGoal).toContain("which parameters matter");
    expect(strategy.doNotStartWith).toEqual(
      expect.arrayContaining([
        "raw specification interrogation before use case context",
      ]),
    );
  });

  it("uses privacy-security practice to keep a business opening before audit pressure", () => {
    const strategy = resolveConversationOpeningStrategy({
      goalId: "privacy_security",
      roleId: "technical_lead",
      voicePackId: "fenrir-excitable",
    });

    expect(strategy.firstTurnGoal).toContain("confirm the customer's security review goal");
    expect(strategy.escalationAfterTurn).toBe(3);
    expect(strategy.doNotStartWith).toEqual(
      expect.arrayContaining([
        "security certification audit before meeting context",
      ]),
    );
  });

  it("uses competitive-difference practice to ask which alternatives the customer is comparing", () => {
    const strategy = resolveConversationOpeningStrategy({
      goalId: "competitive_differences",
      roleId: "procurement_manager",
      voicePackId: "fenrir-excitable",
    });

    expect(strategy.firstTurnGoal).toContain("ask which alternatives");
    expect(strategy.thirdTurnGoal).toContain("differentiation");
    expect(strategy.preferredOpeningMoves).toEqual(
      expect.arrayContaining([
        expect.stringContaining("which alternatives"),
      ]),
    );
  });
});
