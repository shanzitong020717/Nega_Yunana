export const phraseCategories = [
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
] as const;

export type PhraseCategory = (typeof phraseCategories)[number];

export type SeedPhrase = {
  category: PhraseCategory;
  english: string;
  chinese: string;
  useCase: string;
  simpleVersion?: string;
  professionalVersion?: string;
  tags: string[];
};

export const seedPhrases: SeedPhrase[] = [
  {
    category: "Opening",
    english: "Before we jump into the product, may I first understand your use case?",
    chinese: "在进入产品细节前，我可以先了解一下你的使用场景吗？",
    useCase: "Open a discovery-led customer meeting.",
    tags: ["opening", "discovery"],
  },
  {
    category: "Discovery Questions",
    english: "What does a successful pilot look like for your team?",
    chinese: "对你们团队来说，成功的试点是什么样的？",
    useCase: "Clarify pilot success criteria.",
    tags: ["pilot", "discovery"],
  },
  {
    category: "Product Positioning",
    english: "Rokid is not just a display device; it is designed to make information accessible hands-free.",
    chinese: "Rokid 不只是显示设备，而是让用户免手持获取信息。",
    useCase: "Position Rokid as a work-focused solution.",
    tags: ["positioning", "hands-free"],
  },
  {
    category: "Feature Explanation",
    english: "Rokid Glasses support real-time translated captions during multilingual conversations.",
    chinese: "Rokid 眼镜支持多语言对话中的实时翻译字幕。",
    useCase: "Explain real-time translation in product demos.",
    tags: ["translation", "captions"],
  },
  {
    category: "Business Value",
    english: "The key value is reducing communication friction in real time.",
    chinese: "核心价值是实时降低沟通阻力。",
    useCase: "Connect product capability to business outcome.",
    tags: ["business-value", "communication"],
  },
  {
    category: "Demo Narration",
    english: "Let me walk you through a simple scenario.",
    chinese: "我带你看一个简单场景。",
    useCase: "Transition from explanation to demo.",
    tags: ["demo", "transition"],
  },
  {
    category: "产品应用场景",
    english: "A strong use case is hands-free multilingual communication during customer-facing meetings.",
    chinese: "一个强应用场景是在面向客户的会议中进行免手持多语言沟通。",
    useCase: "Explain where Rokid smart glasses fit naturally in business workflows.",
    tags: ["scenario", "customer-meeting", "hands-free"],
  },
  {
    category: "产品优点与缺点",
    english: "The advantage is hands-free access to information, while the fit still depends on the customer's workflow and privacy requirements.",
    chinese: "优势是免手持获取信息，但适配程度仍取决于客户流程和隐私要求。",
    useCase: "Discuss benefits and limitations without overpromising.",
    tags: ["pros-cons", "workflow", "privacy"],
  },
  {
    category: "竞品差异与替代方案对比",
    english: "Compared with phone-based translation, Rokid is better suited for situations where users need to keep their hands and attention in the meeting.",
    chinese: "相比手机翻译，Rokid 更适合用户需要保持双手和注意力都在会议中的场景。",
    useCase: "Compare Rokid with phone translation apps or alternative tools.",
    tags: ["competition", "phone-app", "positioning"],
  },
  {
    category: "产品详细参数",
    english: "For detailed parameters, I would confirm the exact model and deployment requirements before giving a final specification.",
    chinese: "关于详细参数，我会先确认具体型号和部署要求，再给出最终规格。",
    useCase: "Answer specification questions safely when details depend on model or deployment.",
    tags: ["parameters", "specification", "safe-answer"],
  },
  {
    category: "Objection Handling",
    english: "That is a fair concern. It depends on the use case, so I would first clarify your deployment environment.",
    chinese: "这是一个合理的顾虑。这取决于使用场景，所以我会先确认你的部署环境。",
    useCase: "Acknowledge and clarify before answering an objection.",
    tags: ["objection", "clarify"],
  },
  {
    category: "Pricing & Pilot",
    english: "We can start with a small pilot before discussing a larger rollout.",
    chinese: "我们可以先从小规模试点开始，再讨论更大规模部署。",
    useCase: "Reduce commitment risk in commercial conversations.",
    tags: ["pilot", "rollout"],
  },
  {
    category: "Closing & Next Step",
    english: "Would it make sense to schedule a follow-up demo with your technical team?",
    chinese: "是否可以和你的技术团队安排一次后续 demo？",
    useCase: "Move a meeting toward the next concrete step.",
    tags: ["closing", "technical-review"],
  },
  {
    category: "Follow-up Email",
    english: "I can send over a short proposal based on what we discussed today.",
    chinese: "我可以根据今天讨论的内容发一份简短方案。",
    useCase: "Close a meeting with a follow-up commitment.",
    tags: ["follow-up", "proposal"],
  },
];
