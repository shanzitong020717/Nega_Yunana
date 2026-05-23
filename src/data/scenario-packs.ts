import {
  rokidRoleVoiceRules,
  rokidRoles,
  rokidVoicePacks,
} from "@/config/scenarios/rokid-overseas-sales";

export type ScenarioPackId = "rokid-overseas-sales";

export type PracticeGoalId =
  | "customer_qa"
  | "demo_narration"
  | "application_scenarios"
  | "pros_cons"
  | "competitive_differences"
  | "product_parameters"
  | "privacy_security"
  | "deployment_integration"
  | "objection_handling"
  | "solution_meeting"
  | "quick_pitch";

export type VoicePackId =
  | "kore-firm"
  | "zephyr-bright"
  | "puck-upbeat"
  | "charon-informative"
  | "fenrir-excitable"
  | "leda-youthful";

export type NavigationItem = {
  label: string;
  href: string;
  description: string;
};

export type PracticeMode =
  | "customer_qa"
  | "demo_narration"
  | "objection_handling"
  | "solution_meeting"
  | "quick_pitch";

export type PracticeOpeningMode =
  | "formal_business"
  | "learner_led_intro"
  | "efficient_warm_start";

export type PracticeEscalationBias =
  | "slow"
  | "standard"
  | "faster_after_context";

export type PracticeGoal = {
  id: PracticeGoalId;
  label: string;
  description: string;
  mode: PracticeMode;
  defaultFocusTags: string[];
  recommendedPersonaIds: string[];
  recommendedVoicePackIds: VoicePackId[];
  openingStrategyHint: string;
  conversationStrategyModifiers: {
    preferredOpeningModes: PracticeOpeningMode[];
    escalationBias: PracticeEscalationBias;
    firstTurnIntent: string;
  };
  questionGuidance: string[];
  reviewDimensions: string[];
  phrasebookTags: string[];
};

export type ScenarioPersona = {
  id: string;
  label: string;
  englishName: string;
  pressureLevel: "low" | "medium" | "medium_high" | "high";
  focusAreas: string[];
  communicationStyle: string;
  likelyFollowUps: string[];
  openingQuestions: string[];
  followUpPatterns: string[];
  challengeRules: string[];
  defaultFocusTags: string[];
  rolePrompt: string;
};

export type GeminiLiveAudioConfig = {
  response_modalities: ["AUDIO"];
  speech_config: {
    voice_config: {
      prebuilt_voice_config: {
        voice_name: string;
      };
    };
  };
};

export type VoicePack = {
  id: VoicePackId;
  name: string;
  providerVoiceName: string;
  gender: "female" | "male";
  personality: string;
  voiceStyle: string;
  speed: "medium_slow" | "medium" | "medium_fast" | "fast";
  bestFor: string[];
  modelVoiceHint: string;
  geminiLiveConfig: GeminiLiveAudioConfig;
};

export type RoleVoiceRule = {
  roleId: string;
  defaultVoicePackId: VoicePackId;
  recommendedVoicePackIds: VoicePackId[];
};

export type PhraseCategoryConfig = {
  id: string;
  label: string;
  description: string;
};

export type ReviewRubricItem = {
  id: string;
  label: string;
  description: string;
};

export type PromptTemplates = {
  realtimeRole: string;
  materialBrief: string;
  review: string;
};

export type ModuleToggles = {
  materials: boolean;
  objections: boolean;
  phrasebook: boolean;
  memory: boolean;
  realtimePractice: boolean;
};

export type ScenarioPack = {
  id: ScenarioPackId;
  name: string;
  shortName: string;
  targetUser: string;
  primaryGoal: string;
  navigation: {
    primary: NavigationItem[];
    auxiliary: NavigationItem[];
  };
  homepageCopy: {
    title: string;
    subtitle: string;
    primaryCta: string;
  };
  practiceGoals: PracticeGoal[];
  personas: ScenarioPersona[];
  voicePacks: VoicePack[];
  roleVoiceRules: RoleVoiceRule[];
  promptTemplates: PromptTemplates;
  phraseCategories: PhraseCategoryConfig[];
  objectionCategories: PhraseCategoryConfig[];
  reviewRubric: ReviewRubricItem[];
  memorySchema: {
    types: string[];
  };
  moduleToggles: ModuleToggles;
};

const primaryNavigation: NavigationItem[] = [
  {
    label: "今日练习",
    href: "/dashboard",
    description: "今天该练什么",
  },
  {
    label: "客户材料",
    href: "/materials",
    description: "材料与准备卡",
  },
  {
    label: "表达库",
    href: "/phrasebook",
    description: "每日复习",
  },
  {
    label: "复盘",
    href: "/progress",
    description: "总结与记忆",
  },
];

const auxiliaryNavigation: NavigationItem[] = [
  {
    label: "设置",
    href: "/settings",
    description: "隐私与模型",
  },
  {
    label: "异议库",
    href: "/objection-bank",
    description: "专项练习",
  },
];

const practiceGoals: PracticeGoal[] = [
  {
    id: "customer_qa",
    label: "客户问答",
    description: "练习客户连续提问下的清晰回答。",
    mode: "customer_qa",
    defaultFocusTags: ["商业价值", "应用场景说明", "探索式提问"],
    recommendedPersonaIds: [
      "enterprise_buyer",
      "technical_lead",
      "procurement_manager",
    ],
    recommendedVoicePackIds: ["kore-firm", "charon-informative", "leda-youthful"],
    openingStrategyHint: "正式商务开场，先确认客户场景，再逐步提问。",
    conversationStrategyModifiers: {
      preferredOpeningModes: ["formal_business", "efficient_warm_start"],
      escalationBias: "standard",
      firstTurnIntent: "Confirm which customer scenario or business problem the learner wants to discuss.",
    },
    questionGuidance: [
      "Ask what business problem the customer wants to solve first.",
      "Ask the learner to answer with structure before adding detail.",
      "Follow up on unclear value, missing use case, or unsupported claims.",
    ],
    reviewDimensions: ["回答清晰度", "是否先确认需求", "边界感"],
    phrasebookTags: ["客户问答", "探索式提问", "商务回应"],
  },
  {
    id: "demo_narration",
    label: "产品演示讲解",
    description: "把产品功能讲成客户能理解的应用场景。",
    mode: "demo_narration",
    defaultFocusTags: ["产品演示表达", "应用场景说明", "商业价值"],
    recommendedPersonaIds: [
      "channel_partner",
      "enterprise_buyer",
      "technical_lead",
    ],
    recommendedVoicePackIds: ["zephyr-bright", "puck-upbeat", "leda-youthful"],
    openingStrategyHint: "用户先介绍产品或 demo flow，AI 客户再追问客户能否听懂。",
    conversationStrategyModifiers: {
      preferredOpeningModes: ["learner_led_intro", "formal_business"],
      escalationBias: "slow",
      firstTurnIntent: "Invite the learner to introduce Rokid through a simple demo story first.",
    },
    questionGuidance: [
      "Ask for a simple demo sequence instead of a feature list.",
      "Ask how each feature connects to a customer workflow.",
      "Check whether a non-technical customer would understand the demo.",
    ],
    reviewDimensions: ["演示结构", "场景化表达", "避免功能堆砌"],
    phrasebookTags: ["产品演示", "场景讲解", "功能转价值"],
  },
  {
    id: "application_scenarios",
    label: "应用场景说明",
    description: "练习说明产品适合哪些客户、哪些场景，以及为什么适合。",
    mode: "customer_qa",
    defaultFocusTags: ["应用场景说明", "商业价值", "探索式提问"],
    recommendedPersonaIds: [
      "enterprise_buyer",
      "channel_partner",
      "executive_decision_maker",
    ],
    recommendedVoicePackIds: ["kore-firm", "zephyr-bright", "leda-youthful"],
    openingStrategyHint: "轻量商务开场，从客户业务问题和目标用户切入。",
    conversationStrategyModifiers: {
      preferredOpeningModes: ["efficient_warm_start", "formal_business"],
      escalationBias: "standard",
      firstTurnIntent: "Confirm the customer's business scenario and target users before explaining fit.",
    },
    questionGuidance: [
      "Ask which users, meeting types, or multilingual workflows matter most.",
      "Ask the learner to match Rokid value to one concrete department or workflow.",
      "Push for a practical example instead of a generic scenario list.",
    ],
    reviewDimensions: ["场景具体度", "客户匹配度", "价值连接"],
    phrasebookTags: ["应用场景", "客户画像", "业务痛点"],
  },
  {
    id: "pros_cons",
    label: "优缺点对比",
    description: "练习诚实说明产品优势、限制和适配边界。",
    mode: "objection_handling",
    defaultFocusTags: ["优缺点对比", "竞品差异", "隐私安全"],
    recommendedPersonaIds: [
      "procurement_manager",
      "enterprise_buyer",
      "executive_decision_maker",
    ],
    recommendedVoicePackIds: ["kore-firm", "fenrir-excitable", "leda-youthful"],
    openingStrategyHint: "先确认客户评估标准，再进入优势、限制和适配边界。",
    conversationStrategyModifiers: {
      preferredOpeningModes: ["formal_business", "efficient_warm_start"],
      escalationBias: "faster_after_context",
      firstTurnIntent: "Confirm the customer's evaluation criteria before discussing pros and cons.",
    },
    questionGuidance: [
      "Ask what the customer values most: workflow fit, adoption, security, or cost.",
      "Ask for a balanced view of strengths and limitations.",
      "Challenge one-sided claims by asking when Rokid may not be the right fit.",
    ],
    reviewDimensions: ["平衡表达", "可信度", "是否过度承诺"],
    phrasebookTags: ["优缺点", "适配边界", "风险回应"],
  },
  {
    id: "competitive_differences",
    label: "竞品差异说明",
    description: "回答与手机翻译、会议软件或其他智能眼镜方案的差异。",
    mode: "objection_handling",
    defaultFocusTags: ["竞品差异", "商业价值", "优缺点对比"],
    recommendedPersonaIds: [
      "procurement_manager",
      "executive_decision_maker",
      "channel_partner",
    ],
    recommendedVoicePackIds: ["fenrir-excitable", "kore-firm", "puck-upbeat"],
    openingStrategyHint: "先确认客户正在比较什么，再说明差异化价值。",
    conversationStrategyModifiers: {
      preferredOpeningModes: ["efficient_warm_start", "formal_business"],
      escalationBias: "faster_after_context",
      firstTurnIntent: "Ask which alternatives the customer is comparing before giving differentiation.",
    },
    questionGuidance: [
      "Ask why the customer is considering phones, meeting software, or other devices.",
      "Ask for safe differentiation connected to workflow and hands-free value.",
      "Challenge unsupported competitor claims or absolute statements.",
    ],
    reviewDimensions: ["差异是否清楚", "是否尊重竞品", "是否连接客户场景"],
    phrasebookTags: ["竞品差异", "替代方案", "差异化表达"],
  },
  {
    id: "product_parameters",
    label: "产品参数解释",
    description: "练习硬件、软件、续航、显示、音频和翻译能力等参数表达。",
    mode: "customer_qa",
    defaultFocusTags: ["产品参数解释", "隐私安全", "商业价值"],
    recommendedPersonaIds: [
      "technical_lead",
      "enterprise_buyer",
      "procurement_manager",
    ],
    recommendedVoicePackIds: ["charon-informative", "kore-firm", "fenrir-excitable"],
    openingStrategyHint: "先确认 use case，再进入参数细节和确认路径。",
    conversationStrategyModifiers: {
      preferredOpeningModes: ["efficient_warm_start", "formal_business"],
      escalationBias: "standard",
      firstTurnIntent: "Confirm the application context before asking which product parameters matter.",
    },
    questionGuidance: [
      "Ask which parameters matter for the customer's use case.",
      "Ask the learner to explain limits safely without inventing facts.",
      "Ask how a parameter changes customer workflow, not only what the parameter is.",
    ],
    reviewDimensions: ["参数解释清晰度", "是否避免编造", "参数到价值转换"],
    phrasebookTags: ["产品参数", "技术解释", "边界说明"],
  },
  {
    id: "privacy_security",
    label: "隐私安全沟通",
    description: "回答数据流、权限、合规、安全边界和 IT 审查问题。",
    mode: "objection_handling",
    defaultFocusTags: ["隐私安全", "产品参数解释", "试点推进"],
    recommendedPersonaIds: [
      "technical_lead",
      "enterprise_buyer",
      "procurement_manager",
    ],
    recommendedVoicePackIds: ["charon-informative", "kore-firm", "fenrir-excitable"],
    openingStrategyHint: "先确认客户安全关注点，再进入安全审查路径。",
    conversationStrategyModifiers: {
      preferredOpeningModes: ["formal_business", "efficient_warm_start"],
      escalationBias: "faster_after_context",
      firstTurnIntent: "Confirm the customer's security review goal before asking detailed audit questions.",
    },
    questionGuidance: [
      "Ask what security concern the customer wants to review first.",
      "Ask how data flow, access, and customer IT review should be confirmed.",
      "Push the learner to state boundaries and confirmation paths instead of guessing.",
    ],
    reviewDimensions: ["安全边界", "可信表达", "确认路径"],
    phrasebookTags: ["隐私安全", "数据治理", "IT 审查"],
  },
  {
    id: "deployment_integration",
    label: "部署与集成沟通",
    description: "练习云端、本地、系统集成、试点部署和客户 IT 配合方式。",
    mode: "solution_meeting",
    defaultFocusTags: ["试点推进", "产品参数解释", "隐私安全"],
    recommendedPersonaIds: [
      "technical_lead",
      "enterprise_buyer",
      "channel_partner",
    ],
    recommendedVoicePackIds: ["charon-informative", "kore-firm", "puck-upbeat"],
    openingStrategyHint: "先确认客户现有流程和 IT 环境，再讨论部署方式。",
    conversationStrategyModifiers: {
      preferredOpeningModes: ["formal_business", "efficient_warm_start"],
      escalationBias: "standard",
      firstTurnIntent: "Confirm the customer's current workflow and IT environment before deployment details.",
    },
    questionGuidance: [
      "Ask what workflow or system the customer wants Rokid to fit into.",
      "Ask for pilot scope, IT stakeholders, and integration constraints.",
      "Keep unsupported deployment claims framed as items to confirm with technical teams.",
    ],
    reviewDimensions: ["流程化表达", "边界说明", "下一步明确度"],
    phrasebookTags: ["部署", "集成", "试点范围"],
  },
  {
    id: "solution_meeting",
    label: "方案会议推进",
    description: "围绕客户业务目标推进方案和下一步。",
    mode: "solution_meeting",
    defaultFocusTags: ["试点推进", "商业价值", "探索式提问"],
    recommendedPersonaIds: [
      "enterprise_buyer",
      "executive_decision_maker",
      "channel_partner",
    ],
    recommendedVoicePackIds: ["kore-firm", "fenrir-excitable", "puck-upbeat"],
    openingStrategyHint: "确认会议目标、决策人、成功标准和下一步行动。",
    conversationStrategyModifiers: {
      preferredOpeningModes: ["formal_business", "efficient_warm_start"],
      escalationBias: "standard",
      firstTurnIntent: "Confirm the meeting goal, success criteria, and what next step the customer wants to align on.",
    },
    questionGuidance: [
      "Ask for the customer's business target and decision process.",
      "Ask how a pilot should be scoped and measured.",
      "Push toward a clear owner, timeline, and next action.",
    ],
    reviewDimensions: ["推进力", "下一步清晰度", "客户目标连接"],
    phrasebookTags: ["方案会议", "试点推进", "下一步"],
  },
  {
    id: "quick_pitch",
    label: "60 秒快速表达",
    description: "在短时间内讲清价值、场景和下一步。",
    mode: "quick_pitch",
    defaultFocusTags: ["简短回答", "商业价值", "竞品差异"],
    recommendedPersonaIds: [
      "executive_decision_maker",
      "enterprise_buyer",
      "procurement_manager",
    ],
    recommendedVoicePackIds: ["fenrir-excitable", "kore-firm", "leda-youthful"],
    openingStrategyHint: "短寒暄后直接邀请用户做 30-60 秒价值表达。",
    conversationStrategyModifiers: {
      preferredOpeningModes: ["efficient_warm_start", "learner_led_intro"],
      escalationBias: "faster_after_context",
      firstTurnIntent: "Invite the learner to give a concise 30-60 second value explanation.",
    },
    questionGuidance: [
      "Ask for the shortest version of value, scenario, differentiation, and next step.",
      "Interrupt rambling answers by asking for one sentence first.",
      "Ask how the customer can validate the value quickly.",
    ],
    reviewDimensions: ["简洁度", "重点突出", "是否有行动建议"],
    phrasebookTags: ["快速表达", "电梯演讲", "价值总结"],
  },
];

const phraseCategories: PhraseCategoryConfig[] = [
  {
    id: "opening",
    label: "开场与会议目标",
    description: "用于建立会议上下文和确认目标。",
  },
  {
    id: "product_value",
    label: "产品价值表达",
    description: "把功能、参数和能力转换成客户价值。",
  },
  {
    id: "application_scenarios",
    label: "产品应用场景",
    description: "说明 Rokid 产品适合哪些客户和业务场景。",
  },
  {
    id: "pros_cons",
    label: "产品优点与缺点",
    description: "诚实说明产品优势、限制和适配边界。",
  },
  {
    id: "competitive_differences",
    label: "竞品差异与替代方案对比",
    description: "回答与其他设备、软件或替代方案的差异。",
  },
  {
    id: "product_parameters",
    label: "产品详细参数",
    description: "解释硬件、软件、部署和使用参数。",
  },
  {
    id: "technology_deployment",
    label: "技术与部署",
    description: "覆盖技术架构、部署方式和集成问题。",
  },
  {
    id: "privacy_security",
    label: "隐私与安全",
    description: "回答数据、权限和安全治理问题。",
  },
  {
    id: "pilot_next_step",
    label: "试点与下一步",
    description: "推动 pilot、demo 和后续沟通。",
  },
  {
    id: "pricing_roi",
    label: "价格与 ROI",
    description: "解释成本、收益和投入回报。",
  },
  {
    id: "objection_handling",
    label: "异议处理",
    description: "处理客户质疑、风险和反对意见。",
  },
  {
    id: "follow_up_email",
    label: "跟进邮件表达",
    description: "会后跟进、总结和推进下一步。",
  },
];

const reviewRubric: ReviewRubricItem[] = [
  {
    id: "fluency",
    label: "流畅度",
    description: "能否稳定完成英文表达，减少停顿和卡壳。",
  },
  {
    id: "clarity",
    label: "清晰度",
    description: "答案是否结构清楚、重点明确。",
  },
  {
    id: "business_momentum",
    label: "商务推进力",
    description: "是否能推动客户进入下一步沟通。",
  },
  {
    id: "product_value",
    label: "产品价值表达",
    description: "是否把功能、参数和方案能力转化为客户价值。",
  },
  {
    id: "objection_handling",
    label: "异议处理",
    description: "是否正面回应隐私、安全、成本、竞品和落地风险。",
  },
  {
    id: "material_coverage",
    label: "材料覆盖度",
    description: "是否覆盖客户材料中的关键内容。",
  },
  {
    id: "english_naturalness",
    label: "句子自然度",
    description: "英文是否自然、商务、适合当前场景。",
  },
];

export const defaultScenarioPack: ScenarioPack = {
  id: "rokid-overseas-sales",
  name: "Rokid 海外商务会谈",
  shortName: "Rokid 商务",
  targetUser: "Rokid 智能眼镜企业海外销售与解决方案人员",
  primaryGoal: "帮助用户用英文完成真实海外客户会谈。",
  navigation: {
    primary: primaryNavigation,
    auxiliary: auxiliaryNavigation,
  },
  homepageCopy: {
    title: "今日练习",
    subtitle: "基于客户材料、长期弱点和表达库，直接开始今天最值得练的一次会谈。",
    primaryCta: "开始今日练习",
  },
  practiceGoals,
  personas: rokidRoles,
  voicePacks: rokidVoicePacks,
  roleVoiceRules: rokidRoleVoiceRules,
  promptTemplates: {
    realtimeRole:
      "You are an overseas customer in a Rokid business meeting. Ask realistic questions about scenarios, pros and cons, differentiation, parameters, deployment, privacy, pricing, and next steps.",
    materialBrief:
      "Extract application scenarios, pros and cons, competitor differences, product parameters, likely customer questions, and useful bilingual sales expressions.",
    review:
      "Review the conversation for business clarity, product value, objection handling, material coverage, sentence naturalness, phrasebook suggestions, and memory candidates.",
  },
  phraseCategories,
  objectionCategories: [
    {
      id: "privacy_security",
      label: "隐私与安全",
      description: "客户担心数据处理、权限和安全治理。",
    },
    {
      id: "competitive_difference",
      label: "竞品差异",
      description: "客户比较手机翻译、会议软件或其他智能眼镜方案。",
    },
    {
      id: "product_fit",
      label: "产品适配",
      description: "客户质疑应用场景、优缺点和落地边界。",
    },
  ],
  reviewRubric,
  memorySchema: {
    types: [
      "profile",
      "speaking_habit",
      "weakness",
      "material_context",
      "customer_context",
      "phrase_preference",
      "learning_preference",
    ],
  },
  moduleToggles: {
    materials: true,
    objections: true,
    phrasebook: true,
    memory: true,
    realtimePractice: true,
  },
};

export const scenarioPacks: ScenarioPack[] = [defaultScenarioPack];
