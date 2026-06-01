import type { PracticeGoalId, VoicePackId } from "@/data/scenario-packs";

export type OpeningMode =
  | "formal_business"
  | "learner_led_intro"
  | "efficient_warm_start";

export type PressureRamp = "slow" | "medium" | "fast_after_context";

export type ConversationOpeningStrategy = {
  roleId: string;
  defaultModeMix: OpeningMode[];
  firstTurnGoal: string;
  secondTurnGoal: string;
  thirdTurnGoal: string;
  escalationAfterTurn: number;
  doNotStartWith: string[];
  preferredOpeningMoves: string[];
};

export type VoiceTemperamentModifier = {
  voicePackId: VoicePackId;
  openingTone: string;
  pressureRamp: PressureRamp;
  wordingStyle: string;
};

type ResolveConversationOpeningStrategyInput = {
  roleId: string;
  voicePackId?: VoicePackId | string;
  goalId?: PracticeGoalId | string;
};

const DEFAULT_DO_NOT_START_WITH = [
  "detailed product parameter interrogation",
  "data encryption audit",
  "deployment model challenge",
  "pricing negotiation",
  "ROI pressure test",
  "security certification audit",
];

const DEFAULT_STRATEGY: ConversationOpeningStrategy = {
  roleId: "default",
  defaultModeMix: ["formal_business", "efficient_warm_start"],
  firstTurnGoal:
    "greet the learner, thank them for joining, and confirm the meeting direction",
  secondTurnGoal:
    "clarify the customer context, evaluation stage, or preferred starting point",
  thirdTurnGoal:
    "enter application scenarios, customer pain points, business value, or demo framing",
  escalationAfterTurn: 4,
  doNotStartWith: DEFAULT_DO_NOT_START_WITH,
  preferredOpeningMoves: [
    "Hi, thanks for taking the time today. Before we get into details, could you briefly share which customer scenario you would like to focus on first?",
  ],
};

const ROLE_STRATEGIES: Record<string, ConversationOpeningStrategy> = {
  enterprise_buyer: {
    roleId: "enterprise_buyer",
    defaultModeMix: ["formal_business", "efficient_warm_start"],
    firstTurnGoal:
      "greet the learner, confirm the meeting goal, and invite a short business scenario framing",
    secondTurnGoal:
      "clarify the buyer's current business problem, target users, and evaluation stage",
    thirdTurnGoal:
      "ask about application scenarios and business value before ROI or pilot-risk questions",
    escalationAfterTurn: 4,
    doNotStartWith: [
      ...DEFAULT_DO_NOT_START_WITH,
      "ROI demand before the use case is clear",
    ],
    preferredOpeningMoves: [
      "Hi, thanks for taking the time today. Before we get into details, could you briefly share which customer scenario you would like to focus on first?",
    ],
  },
  technical_lead: {
    roleId: "technical_lead",
    defaultModeMix: ["efficient_warm_start", "formal_business"],
    firstTurnGoal:
      "greet the learner and confirm the main use case before asking technical questions",
    secondTurnGoal:
      "clarify the current workflow, system environment, and what the technical team needs to evaluate",
    thirdTurnGoal:
      "connect the use case to product parameters, integration fit, or security review without starting an audit",
    escalationAfterTurn: 4,
    doNotStartWith: [
      ...DEFAULT_DO_NOT_START_WITH,
      "compatibility interrogation before context",
    ],
    preferredOpeningMoves: [
      "Thanks for joining. Before I ask technical questions, could you first explain the main use case and what part of the Rokid solution you want us to evaluate?",
    ],
  },
  procurement_manager: {
    roleId: "procurement_manager",
    defaultModeMix: ["formal_business", "efficient_warm_start"],
    firstTurnGoal:
      "greet the learner and confirm the procurement stage and evaluation scope",
    secondTurnGoal:
      "clarify decision criteria, pilot scope, vendor comparison needs, and risk concerns",
    thirdTurnGoal:
      "ask for balanced product fit, trade-offs, and competitor differences before pricing pressure",
    escalationAfterTurn: 4,
    doNotStartWith: [
      ...DEFAULT_DO_NOT_START_WITH,
      "discount or contract demand before value is clear",
    ],
    preferredOpeningMoves: [
      "Thanks for meeting today. Before we discuss commercial terms, could you help me understand what stage of evaluation you would like to focus on?",
    ],
  },
  channel_partner: {
    roleId: "channel_partner",
    defaultModeMix: ["learner_led_intro", "formal_business"],
    firstTurnGoal:
      "invite the learner to introduce Rokid, the target customer, and the cooperation idea first",
    secondTurnGoal:
      "clarify which customer segment, demo story, or partner support topic matters most",
    thirdTurnGoal:
      "move into a practical demo story, sales enablement, after-sales support, or customer education question",
    escalationAfterTurn: 3,
    doNotStartWith: [
      ...DEFAULT_DO_NOT_START_WITH,
      "partner margin challenge before product positioning",
    ],
    preferredOpeningMoves: [
      "Great to meet you. Could you first walk me through how you would introduce Rokid to a potential overseas customer in a simple demo?",
    ],
  },
  executive_decision_maker: {
    roleId: "executive_decision_maker",
    defaultModeMix: ["efficient_warm_start", "learner_led_intro"],
    firstTurnGoal:
      "use a brief greeting and ask for a concise business-value framing",
    secondTurnGoal:
      "clarify the strategic problem, business impact, and why this deserves attention now",
    thirdTurnGoal:
      "ask for differentiation, validation path, or the smallest next step",
    escalationAfterTurn: 3,
    doNotStartWith: [
      ...DEFAULT_DO_NOT_START_WITH,
      "deep product feature review before value framing",
    ],
    preferredOpeningMoves: [
      "Thanks for joining. I only have a short window today, so could you give me the 30-second version of why Rokid is worth our attention?",
    ],
  },
};

const VOICE_TEMPERAMENT_MODIFIERS: Record<
  VoicePackId,
  VoiceTemperamentModifier
> = {
  "kore-firm": {
    voicePackId: "kore-firm",
    openingTone: "formal, steady, and agenda-aware",
    pressureRamp: "medium",
    wordingStyle: "structured and professional",
  },
  "zephyr-bright": {
    voicePackId: "zephyr-bright",
    openingTone: "friendly, warm, and encouraging",
    pressureRamp: "slow",
    wordingStyle: "supportive and easy to answer",
  },
  "puck-upbeat": {
    voicePackId: "puck-upbeat",
    openingTone: "open, light, and interactive",
    pressureRamp: "medium",
    wordingStyle: "conversational and exploratory",
  },
  "charon-informative": {
    voicePackId: "charon-informative",
    openingTone: "clear, calm, and context-oriented",
    pressureRamp: "medium",
    wordingStyle: "precise and well structured",
  },
  "fenrir-excitable": {
    voicePackId: "fenrir-excitable",
    openingTone: "polite for the first 2 turns, then more energetic",
    pressureRamp: "fast_after_context",
    wordingStyle: "short, sharp, and challenging after context is established",
  },
  "leda-youthful": {
    voicePackId: "leda-youthful",
    openingTone: "natural, direct, and balanced",
    pressureRamp: "medium",
    wordingStyle: "plainspoken and business casual",
  },
};

function isVoicePackId(value: string | undefined): value is VoicePackId {
  return Boolean(value && value in VOICE_TEMPERAMENT_MODIFIERS);
}

function applyGoalModifier(
  strategy: ConversationOpeningStrategy,
  goalId: string | undefined,
) {
  if (goalId === "application_scenarios") {
    return {
      ...strategy,
      defaultModeMix: Array.from(
        new Set<OpeningMode>(["efficient_warm_start", ...strategy.defaultModeMix]),
      ),
      firstTurnGoal:
        "greet the learner and confirm the customer's business scenario and target users",
      secondTurnGoal:
        "clarify which users, meeting types, or multilingual workflows matter most",
      thirdTurnGoal:
        "ask how Rokid's application scenario connects to business value and adoption",
    };
  }

  if (goalId === "demo_narration") {
    return {
      ...strategy,
      defaultModeMix: Array.from(
        new Set<OpeningMode>(["learner_led_intro", ...strategy.defaultModeMix]),
      ),
      firstTurnGoal:
        "invite the learner to introduce Rokid through a simple product or demo story first",
      thirdTurnGoal:
        "ask how the demo story connects to the customer's workflow and application scenario",
    };
  }

  if (goalId === "pros_cons") {
    return {
      ...strategy,
      firstTurnGoal:
        "greet the learner and confirm the customer's evaluation criteria before discussing pros and cons",
      secondTurnGoal:
        "ask which trade-offs matter most: workflow fit, security, adoption, cost, or pilot risk",
      thirdTurnGoal:
        "pressure-test the learner's ability to explain advantages, limitations, and fit boundaries",
      escalationAfterTurn: Math.min(strategy.escalationAfterTurn, 3),
      doNotStartWith: [
        ...strategy.doNotStartWith,
        "one-sided product claim before evaluation criteria",
      ],
    };
  }

  if (goalId === "competitive_differences") {
    return {
      ...strategy,
      defaultModeMix: Array.from(
        new Set<OpeningMode>(["efficient_warm_start", ...strategy.defaultModeMix]),
      ),
      firstTurnGoal:
        "greet the learner and ask which alternatives the customer is comparing before giving differentiation",
      thirdTurnGoal:
        "ask for differentiation that respects alternatives and connects to customer workflow",
      escalationAfterTurn: Math.min(strategy.escalationAfterTurn, 3),
      preferredOpeningMoves: [
        "Thanks for meeting today. Before we compare options, could you clarify which alternatives you are comparing Rokid against?",
      ],
    };
  }

  if (goalId === "product_parameters") {
    return {
      ...strategy,
      defaultModeMix: Array.from(
        new Set<OpeningMode>(["efficient_warm_start", ...strategy.defaultModeMix]),
      ),
      firstTurnGoal:
        "greet the learner and confirm the application context before asking product-parameter questions",
      secondTurnGoal:
        "ask which parameters matter for the customer's use case and evaluation stage",
      thirdTurnGoal:
        "connect the relevant parameters to workflow fit, customer value, and safe confirmation paths",
      doNotStartWith: [
        ...strategy.doNotStartWith,
        "raw specification interrogation before use case context",
      ],
    };
  }

  if (goalId === "privacy_security") {
    return {
      ...strategy,
      firstTurnGoal:
        "greet the learner and confirm the customer's security review goal before audit details",
      secondTurnGoal:
        "clarify data-flow, access-control, privacy, or IT review concerns at a high level first",
      thirdTurnGoal:
        "ask for security boundaries and confirmation paths without unsupported claims",
      escalationAfterTurn: Math.min(strategy.escalationAfterTurn, 3),
      doNotStartWith: [
        ...strategy.doNotStartWith,
        "security certification audit before meeting context",
      ],
    };
  }

  if (goalId === "deployment_integration") {
    return {
      ...strategy,
      defaultModeMix: Array.from(
        new Set<OpeningMode>(["formal_business", "efficient_warm_start", ...strategy.defaultModeMix]),
      ),
      firstTurnGoal:
        "greet the learner and confirm the customer's current workflow before deployment details",
      secondTurnGoal:
        "clarify the IT environment, integration constraints, and stakeholders involved",
      thirdTurnGoal:
        "guide the conversation toward deployment fit, pilot scope, and technical confirmation paths",
      doNotStartWith: [
        ...strategy.doNotStartWith,
        "deployment architecture challenge before workflow context",
      ],
    };
  }

  if (goalId === "objection_handling") {
    return {
      ...strategy,
      firstTurnGoal: `${strategy.firstTurnGoal}; still include a short business transition before pressure-testing objections`,
      escalationAfterTurn: Math.min(strategy.escalationAfterTurn, 3),
    };
  }

  if (goalId === "solution_meeting") {
    return {
      ...strategy,
      secondTurnGoal:
        "clarify the customer's business target, stakeholders, constraints, and expected next step",
      thirdTurnGoal:
        "guide the conversation toward solution fit, pilot scope, and next-step alignment",
    };
  }

  if (goalId === "quick_pitch") {
    return {
      ...strategy,
      firstTurnGoal:
        "use a brief greeting and ask for a concise 30-60 second business-value explanation",
      escalationAfterTurn: 3,
      preferredOpeningMoves: [
        "Thanks for joining. Could you give me the 30-second version of why Rokid is worth our attention?",
      ],
    };
  }

  return strategy;
}

export function resolveVoiceTemperamentModifier(
  voicePackId: string | undefined,
) {
  if (isVoicePackId(voicePackId)) {
    return VOICE_TEMPERAMENT_MODIFIERS[voicePackId];
  }

  return VOICE_TEMPERAMENT_MODIFIERS["kore-firm"];
}

export function resolveConversationOpeningStrategy({
  goalId,
  roleId,
}: ResolveConversationOpeningStrategyInput) {
  const baseStrategy = ROLE_STRATEGIES[roleId] ?? {
    ...DEFAULT_STRATEGY,
    roleId,
  };

  return applyGoalModifier(baseStrategy, goalId);
}
