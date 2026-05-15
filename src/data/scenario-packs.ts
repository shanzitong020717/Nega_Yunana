export type ScenarioPackId = "rokid-overseas-sales";

export type PracticeGoalId =
  | "customer_qa"
  | "demo_narration"
  | "objection_handling"
  | "solution_meeting"
  | "quick_pitch";

export type VoicePackId =
  | "ava-friendly-buyer"
  | "serena-enterprise-decision-maker"
  | "ethan-technical-lead"
  | "marcus-executive-customer"
  | "vivian-critical-procurement"
  | "noah-channel-partner";

export type NavigationItem = {
  label: string;
  href: string;
  description: string;
};

export type PracticeGoal = {
  id: PracticeGoalId;
  label: string;
  description: string;
};

export type ScenarioPersona = {
  id: string;
  label: string;
  focusAreas: string[];
  communicationStyle: string;
  likelyFollowUps: string[];
};

export type VoicePack = {
  id: VoicePackId;
  name: string;
  gender: "female" | "male";
  personality: string;
  voiceStyle: string;
  speed: "medium_slow" | "medium" | "medium_fast" | "fast";
  bestFor: string[];
  modelVoiceHint: string;
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
  },
  {
    id: "demo_narration",
    label: "演示讲解",
    description: "把产品功能讲成客户能理解的应用场景。",
  },
  {
    id: "objection_handling",
    label: "异议处理",
    description: "练习隐私、价格、竞品和落地边界等高压问题。",
  },
  {
    id: "solution_meeting",
    label: "方案会议",
    description: "围绕客户业务目标推进方案和下一步。",
  },
  {
    id: "quick_pitch",
    label: "60 秒快速表达",
    description: "在短时间内讲清价值、场景和下一步。",
  },
];

const personas: ScenarioPersona[] = [
  {
    id: "enterprise_buyer",
    label: "企业买家",
    focusAreas: ["业务价值", "应用场景", "ROI", "试点风险"],
    communicationStyle: "谨慎、结果导向，关注真实落地效果。",
    likelyFollowUps: [
      "这个产品最适合哪些业务场景？",
      "它相比手机翻译或会议软件有什么差异？",
    ],
  },
  {
    id: "technical_lead",
    label: "技术负责人",
    focusAreas: ["产品参数", "集成方式", "隐私安全", "部署边界"],
    communicationStyle: "理性、细节导向，会持续追问技术限制。",
    likelyFollowUps: [
      "关键参数和设备限制是什么？",
      "数据处理和系统集成怎么做？",
    ],
  },
  {
    id: "procurement_manager",
    label: "采购经理",
    focusAreas: ["价格", "合同", "交付周期", "竞品差异"],
    communicationStyle: "成本敏感、谈判导向，关注供应风险。",
    likelyFollowUps: [
      "为什么我们应该选择 Rokid 而不是其他方案？",
      "优缺点和采购风险分别是什么？",
    ],
  },
  {
    id: "channel_partner",
    label: "渠道合作伙伴",
    focusAreas: ["市场支持", "售后", "渠道利润", "客户教育"],
    communicationStyle: "务实、合作型，关注如何卖出去和服务好。",
    likelyFollowUps: [
      "这个产品最容易打动哪些客户？",
      "Rokid 能提供哪些销售和售后支持？",
    ],
  },
  {
    id: "executive_decision_maker",
    label: "高管决策者",
    focusAreas: ["战略价值", "差异化", "效率提升", "下一步"],
    communicationStyle: "直接、高压、时间敏感，只听关键结论。",
    likelyFollowUps: [
      "一句话说清楚，为什么这值得我们投入时间？",
      "下一步怎么验证它真的有价值？",
    ],
  },
];

const voicePacks: VoicePack[] = [
  {
    id: "ava-friendly-buyer",
    name: "Ava 友好买家",
    gender: "female",
    personality: "友好、耐心、愿意配合",
    voiceStyle: "清晰温和，压力较低",
    speed: "medium",
    bestFor: ["新手练习", "客户问答", "产品介绍"],
    modelVoiceHint: "warm_clear_female",
  },
  {
    id: "serena-enterprise-decision-maker",
    name: "Serena 企业决策者",
    gender: "female",
    personality: "专业、克制、结果导向",
    voiceStyle: "冷静商务，表达简洁",
    speed: "medium_slow",
    bestFor: ["企业采购", "方案会议", "ROI 讨论"],
    modelVoiceHint: "calm_business_female",
  },
  {
    id: "ethan-technical-lead",
    name: "Ethan 技术负责人",
    gender: "male",
    personality: "理性、细节导向、追问较多",
    voiceStyle: "稳重清晰，技术感强",
    speed: "medium",
    bestFor: ["技术参数", "集成", "部署", "安全问题"],
    modelVoiceHint: "steady_technical_male",
  },
  {
    id: "marcus-executive-customer",
    name: "Marcus 高管客户",
    gender: "male",
    personality: "直接、高压、时间敏感",
    voiceStyle: "低沉坚定，节奏较快",
    speed: "medium_fast",
    bestFor: ["高管简报", "价值陈述", "快速推进"],
    modelVoiceHint: "firm_executive_male",
  },
  {
    id: "vivian-critical-procurement",
    name: "Vivian 挑剔采购",
    gender: "female",
    personality: "谨慎、怀疑、关注成本",
    voiceStyle: "犀利干练，追问强",
    speed: "fast",
    bestFor: ["价格", "竞品差异", "优缺点", "谈判"],
    modelVoiceHint: "sharp_procurement_female",
  },
  {
    id: "noah-channel-partner",
    name: "Noah 渠道伙伴",
    gender: "male",
    personality: "开放、务实、合作型",
    voiceStyle: "亲和自然，商务轻松",
    speed: "medium",
    bestFor: ["渠道合作", "市场支持", "售后政策"],
    modelVoiceHint: "friendly_partner_male",
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
  personas,
  voicePacks,
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
