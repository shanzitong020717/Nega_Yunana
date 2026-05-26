import type { MaterialBriefPayload } from "@/lib/ai/material-brief";
import type { PrepCardPayload } from "@/lib/ai/prep-card";
import {
  TEXT_ANALYSIS_BOUNDARY,
  generateTextJSON,
  hasTextAIApiKey,
} from "@/lib/ai/text-client";
import type { PracticeSessionRecord } from "@/lib/practice/practice-session-store";
import type { TranscriptTurnInput } from "@/lib/validation/practice";
import {
  smartGuidanceSchema,
  supportCueResultSchema,
  type SmartGuidance,
  type SupportCue,
  type SupportCueResult,
} from "@/lib/validation/support-cue";

export type SupportCuePersona = {
  id: string;
  label: string;
  communicationStyle: string;
  focusAreas: string[];
  rolePrompt: string;
};

type GenerateSupportCueInput = {
  cue: SupportCue;
  materialBrief?: MaterialBriefPayload | null;
  mockMode?: boolean;
  persona: SupportCuePersona;
  practiceSession: PracticeSessionRecord;
  prepCard?: PrepCardPayload | null;
  transcriptTurns: TranscriptTurnInput[];
};

type GenerateSmartGuidanceInput = Omit<GenerateSupportCueInput, "cue">;

function shouldUseMockMode(input: { mockMode?: boolean }) {
  return (
    input.mockMode === true ||
    process.env.AI_MOCK_MODE === "true" ||
    process.env.NODE_ENV === "test"
  );
}

function shouldUseExplicitMockMode(input: { mockMode?: boolean }) {
  return (
    input.mockMode === true ||
    process.env.AI_MOCK_MODE === "true" ||
    process.env.NODE_ENV === "test"
  );
}

function latestTurnBySpeaker(
  turns: TranscriptTurnInput[],
  speaker: TranscriptTurnInput["speaker"],
) {
  return [...turns].reverse().find((turn) => turn.speaker === speaker);
}

function latestConversationTurn(turns: TranscriptTurnInput[]) {
  return [...turns].reverse().find((turn) => turn.speaker !== "system");
}

function textIncludesAny(text: string, keywords: string[]) {
  const normalizedText = text.toLowerCase();

  return keywords.some((keyword) => normalizedText.includes(keyword));
}

function practiceFocus(input: GenerateSupportCueInput | GenerateSmartGuidanceInput) {
  return input.practiceSession.focusTags.length > 0
    ? input.practiceSession.focusTags.join("、")
    : input.practiceSession.trainingFocus.join("、");
}

function smartGuidanceTextModel() {
  return (
    process.env.SMART_GUIDANCE_TEXT_MODEL?.trim() ||
    process.env.SUPPORT_CUE_FAST_TEXT_MODEL?.trim() ||
    process.env.SUBTITLE_DEEPSEEK_MODEL?.trim() ||
    undefined
  );
}

function removeQuotedAsrNoise(value: string) {
  return value
    .replace(/[（(][^）)]*['"‘’“”][A-Za-z][^）)]*[）)]/g, "")
    .replace(
      /(例如|比如)\s*['"‘“][^，。！？；：]+['"’”]\s*[，,]?/g,
      "$1用一句简短英文请对方重复问题，",
    )
    .replace(/\s+([，。！？；：])/g, "$1")
    .replace(/，{2,}/g, "，")
    .replace(/（\s*）/g, "")
    .replace(/\(\s*\)/g, "")
    .trim();
}

function normalizeSmartGuidanceOutput(guidance: SmartGuidance) {
  return smartGuidanceSchema.parse({
    ...guidance,
    currentJudgment: removeQuotedAsrNoise(guidance.currentJudgment),
    nextStep: removeQuotedAsrNoise(guidance.nextStep),
    riskNote: guidance.riskNote
      ? removeQuotedAsrNoise(guidance.riskNote)
      : undefined,
  });
}

function baseVocabularyForContext(context: string) {
  if (
    textIncludesAny(context, [
      "deployment",
      "cloud",
      "on-premise",
      "on premise",
      "security",
      "privacy",
      "integration",
    ])
  ) {
    return [
      {
        term: "technical review",
        phonetic: "/ˈteknɪkəl rɪˈvjuː/",
        chinese: "技术评审",
        example: "For a technical review, we can first confirm the data flow.",
      },
      {
        term: "deployment requirements",
        phonetic: "/dɪˈplɔɪmənt rɪˈkwaɪərmənts/",
        chinese: "部署要求",
        example: "We should confirm deployment requirements with your IT team.",
      },
      {
        term: "hands-free",
        phonetic: "/ˌhændz ˈfriː/",
        chinese: "免手持的",
        example: "Hands-free captions help users stay engaged.",
      },
    ];
  }

  return [
    {
      term: "communication friction",
      phonetic: "/kəˌmjuːnɪˈkeɪʃən ˈfrɪkʃən/",
      chinese: "沟通摩擦",
      example: "Rokid can reduce communication friction in real meetings.",
    },
    {
      term: "workflow fit",
      phonetic: "/ˈwɜːrkfloʊ fɪt/",
      chinese: "流程适配度",
      example: "A pilot should confirm the workflow fit.",
    },
  ];
}

function fallbackSmartGuidance(
  input: GenerateSmartGuidanceInput,
): SmartGuidance {
  const latestTurn = latestConversationTurn(input.transcriptTurns);
  const latestAiTurn = latestTurnBySpeaker(input.transcriptTurns, "ai_customer");

  if (!latestTurn) {
    return {
      currentJudgment: "还没有客户问题，先准备用一句简短开场进入对话。",
      nextStep: "开始后先听清客户关注点，不急着一次性介绍全部产品能力。",
      riskNote: undefined,
      sayThis:
        "Could you share the main situation where your team would use smart glasses?",
    };
  }

  const context = `${latestAiTurn?.text ?? ""} ${latestTurn.text}`;
  const isDeploymentOrSecurity =
    Boolean(latestAiTurn) &&
    textIncludesAny(context, [
      "deployment",
      "cloud",
      "on-premise",
      "on premise",
      "security",
      "privacy",
      "encrypted",
    ]);

  if (isDeploymentOrSecurity) {
    return {
      currentJudgment: `客户正在以${input.persona.label}视角确认部署方式和安全边界。`,
      nextStep: "先回应安全顾虑，再把话题引到 IT 评审、材料证据和试点确认。",
      riskNote:
        "不要直接承诺所有部署方式或安全认证，先把范围限定到客户 IT 要求和材料已确认的信息。",
      sayThis:
        "We can first review your security requirements with your IT team, then confirm the right deployment setup.",
    };
  }

  if (latestTurn.speaker === "ai_customer") {
    return {
      currentJudgment: `客户刚提出新问题，需要结合${input.persona.label}的关注点判断真实意图。`,
      nextStep: "先用一句话确认问题，再给出有边界的回答或反问一个澄清问题。",
      riskNote: undefined,
      sayThis:
        "Let me first understand your priority here, then I can explain the most relevant option.",
    };
  }

  return {
    currentJudgment: "你刚完成一轮回答，现在适合把话题推向客户场景或下一步。",
    nextStep: "如果客户还没有明确需求，优先问一个探索问题，不要继续单向介绍。",
    riskNote: undefined,
    sayThis:
      "To make this more relevant, could I ask how your team would use this in a real meeting or field scenario?",
  };
}

function fallbackSupportCue(input: GenerateSupportCueInput): SupportCueResult {
  const latestAiText =
    latestTurnBySpeaker(input.transcriptTurns, "ai_customer")?.text ??
    "当前还没有客户问题，先用开场问题确认客户的真实使用场景。";
  const latestUserText =
    latestTurnBySpeaker(input.transcriptTurns, "user")?.text ??
    "还没有捕捉到你的上一句英文。你可以先回答一句，再用这个功能优化表达。";
  const context = `${latestAiText} ${latestUserText}`;
  const focus = practiceFocus(input);

  if (input.cue === "Better Phrase") {
    return supportCueResultSchema.parse({
      id: `support_${crypto.randomUUID()}`,
      title: "更自然表达分析",
      badge: "AI 分析",
      sections: [
        {
          label: "AI 客户上下文",
          english: latestAiText,
        },
        {
          label: "客户角色",
          english: input.persona.label,
          chinese: `${input.persona.label}的沟通风格是${input.persona.communicationStyle} 本轮练习重点是${focus}。表达需要贴合对方身份和商务会谈边界。`,
        },
        {
          label: "你的原句",
          english: latestUserText,
        },
        {
          label: "语句逻辑拆解",
          chinese:
            "你的原句方向正确，但还偏泛。更自然的商务表达应该先回应客户正在追问的点，再把 Rokid 的能力转成客户可以评估的场景价值。",
        },
        {
          label: "更自然表达",
          english:
            "For a technical review, the main value is not just translation. Rokid helps multilingual teams keep the meeting flow visible and hands-free, while we confirm deployment and security requirements with your IT team.",
          chinese:
            "在技术评审中，核心价值不只是翻译。Rokid 可以帮助多语言团队在会议中保持信息可见和免手持沟通，同时我们会和你们 IT 团队确认部署与安全要求。",
        },
        {
          label: "为什么更好",
          chinese:
            "这版表达更自然，因为它同时回应了客户身份、当前问题、产品价值和下一步确认流程，没有做未经材料支持的承诺。",
        },
      ],
      vocabulary: baseVocabularyForContext(context),
    });
  }

  if (input.cue === "Ask a Discovery Question") {
    return supportCueResultSchema.parse({
      id: `support_${crypto.randomUUID()}`,
      title: "探索问题建议",
      badge: "AI 分析",
      sections: [
        {
          label: "AI 客户上下文",
          english: latestAiText,
        },
        {
          label: "推荐问题",
          english: "What does a successful pilot look like for your team?",
          chinese: "对你们团队来说，什么样的试点结果才算成功？",
        },
        {
          label: "建议原因",
          chinese:
            "这个问题能把客户从泛泛了解拉回到试点目标、评估标准和下一步决策条件。",
        },
      ],
      vocabulary: baseVocabularyForContext(context).slice(0, 2),
    });
  }

  if (input.cue === "Use Material Point") {
    const materialPoint =
      input.materialBrief?.productPoints[0] ??
      "Rokid supports real-time translated captions for multilingual conversations.";

    return supportCueResultSchema.parse({
      id: `support_${crypto.randomUUID()}`,
      title: "材料要点建议",
      badge: "AI 分析",
      sections: [
        {
          label: "AI 客户上下文",
          english: latestAiText,
        },
        {
          label: "可引用要点",
          english: materialPoint,
          chinese: "优先引用材料中已有的信息，不补充材料未确认的参数、价格或认证。",
        },
        {
          label: "使用方式",
          english:
            "In this scenario, the translated captions can help both sides follow the meeting without switching devices.",
          chinese:
            "在这个场景中，实时字幕能帮助双方持续跟上会议内容，不需要频繁切换设备。",
        },
        {
          label: "风险边界",
          note: "不要补充材料中没有确认的价格、认证或部署承诺。",
        },
      ],
      vocabulary: baseVocabularyForContext(context).slice(0, 2),
    });
  }

  return supportCueResultSchema.parse({
    id: `support_${crypto.randomUUID()}`,
    title: "挑战练习建议",
    badge: "AI 分析",
    sections: [
      {
        label: "挑战问题",
        english: "Why should we choose Rokid instead of a phone translation app?",
        chinese: "我们为什么应该选择 Rokid，而不是手机翻译应用？",
      },
      {
        label: "训练目的",
        chinese:
          "这个挑战会训练你说明智能眼镜相对手机方案的差异：免手持、会议连续性、现场协作和企业场景适配。",
      },
      {
        label: "作答抓手",
        english:
          "The difference is not only translation accuracy, but whether the user can stay engaged in the workflow.",
        chinese:
          "差异不只是翻译准确率，而是用户能否持续参与当前工作流程。",
      },
    ],
    vocabulary: baseVocabularyForContext(context).slice(0, 2),
  });
}

function buildSupportCuePrompt(input: GenerateSupportCueInput) {
  return [
    "You are generating a live coaching panel for a Rokid overseas sales English speaking practice website.",
    TEXT_ANALYSIS_BOUNDARY,
    "Return strict JSON only. Do not include Markdown.",
    "The learner clicked a support cue. Generate a coaching and analysis panel, not a customer reply. Do not instruct the AI customer to speak.",
    "Every result must consider recent transcript context, customer persona, practice goal, selected training focus, business English norms, available material brief, and prep card.",
    "Use the same analysis process for every cue: recent context -> customer intent -> learner need -> recommended action -> safe boundary. The wording can vary, but the reasoning must stay consistent with the real conversation.",
    "Ground every section in the latest transcript. Do not return canned examples or generic Rokid talking points unless the current conversation and material context support them.",
    "Do not invent product claims, prices, certifications, accuracy numbers, deployment guarantees, or unsupported security details.",
    "JSON shape: { id, title, badge, sections, vocabulary }. sections is an array of { label, english, chinese, note }. vocabulary is an array of at least 2 advanced terms when possible, each { term, phonetic, chinese, example }.",
    "For Better Phrase: analyze the learner's latest English sentence, explain strengths/weaknesses, then provide a more natural and more context-appropriate business English version. The improved sentence must be detailed enough to be useful, not a generic slogan.",
    "For Ask a Discovery Question: recommend one context-aware discovery question and explain why it advances the meeting.",
    "For Use Material Point: choose one safe point from material/prep context and explain how to use it without over-claiming.",
    "For Challenge Me: create a sharper customer challenge question and explain the practice objective, but do not trigger audio.",
    `Cue: ${input.cue}`,
    `Practice session: ${JSON.stringify(input.practiceSession)}`,
    `Persona: ${JSON.stringify(input.persona)}`,
    `Material brief: ${JSON.stringify(input.materialBrief ?? {})}`,
    `Prep card: ${JSON.stringify(input.prepCard ?? {})}`,
    `Recent transcript: ${JSON.stringify(input.transcriptTurns.slice(-8))}`,
  ].join("\n\n");
}

function buildSmartGuidancePrompt(input: GenerateSmartGuidanceInput) {
  return [
    "You are generating the realtime Smart Guidance module for a Rokid overseas sales English speaking practice website.",
    TEXT_ANALYSIS_BOUNDARY,
    "Return strict JSON only. Do not include Markdown.",
    "Generate concise live guidance for the learner based on the real latest transcript, customer persona, practice scenario, training focus, business English norms, materials, and prep card.",
    "Every field must be grounded in the actual recent transcript below. Do not reuse a canned deployment/security analysis unless the latest conversation is truly about deployment, cloud/on-premise, privacy, encryption, or security.",
    "Pay special attention to the latest AI customer turn and the latest learner turn. The guidance should match what was just said, not only the selected persona or training focus.",
    "Never quote raw unclear ASR fragments or suspected speech-recognition noise in Chinese fields. If the learner's speech appears garbled, say in Chinese that the previous answer was not recognized clearly, then suggest asking for clarification or answering again.",
    "Do not put English sample sentences inside currentJudgment, nextStep, or riskNote. Put the speakable English sentence only in sayThis.",
    "JSON shape: { currentJudgment, nextStep, riskNote, sayThis }.",
    "currentJudgment, nextStep, and riskNote must be Chinese. sayThis must be natural spoken English the learner can say next.",
    "Do not invent product claims, prices, certifications, deployment guarantees, or unsupported security details.",
    `Practice session: ${JSON.stringify(input.practiceSession)}`,
    `Persona: ${JSON.stringify(input.persona)}`,
    `Material brief: ${JSON.stringify(input.materialBrief ?? {})}`,
    `Prep card: ${JSON.stringify(input.prepCard ?? {})}`,
    `Recent transcript: ${JSON.stringify(input.transcriptTurns.slice(-8))}`,
  ].join("\n\n");
}

export async function generateSupportCue(
  input: GenerateSupportCueInput,
): Promise<SupportCueResult> {
  if (shouldUseMockMode(input)) {
    return fallbackSupportCue(input);
  }

  if (!hasTextAIApiKey()) {
    throw new Error("提示分析 AI 生成失败：缺少文本模型 API Key。");
  }

  try {
    return supportCueResultSchema.parse(
      await generateTextJSON({
        prompt: buildSupportCuePrompt(input),
        schemaName: "support cue",
        maxTokens: 2200,
        timeoutMs: 6000,
      }),
    );
  } catch (error) {
    console.warn("Support cue text model failed.", error);
    throw new Error("提示分析 AI 生成失败，请稍后重试。");
  }
}

export async function generateSmartGuidance(
  input: GenerateSmartGuidanceInput,
): Promise<SmartGuidance> {
  if (shouldUseExplicitMockMode(input)) {
    return fallbackSmartGuidance(input);
  }

  if (!hasTextAIApiKey()) {
    throw new Error("智能建议 AI 分析失败：缺少文本模型 API Key。");
  }

  try {
    return normalizeSmartGuidanceOutput(
      smartGuidanceSchema.parse(
        await generateTextJSON({
          prompt: buildSmartGuidancePrompt(input),
          schemaName: "smart guidance",
          model: smartGuidanceTextModel(),
          maxTokens: 1100,
          timeoutMs: 8000,
        }),
      ),
    );
  } catch (error) {
    console.warn("Smart guidance text model failed.", error);
    throw new Error("智能建议 AI 分析失败，请稍后重试。");
  }
}
