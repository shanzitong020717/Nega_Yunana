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
  suggestedAnswerCoreSchema,
  suggestedAnswerRecordSchema,
  type SuggestedAnswerAiTurn,
  type SuggestedAnswerCore,
  type SuggestedAnswerRecord,
} from "@/lib/validation/suggested-answer";

export type SuggestedAnswerPersona = {
  id: string;
  label?: string;
  name?: string;
  communicationStyle?: string;
  focusAreas?: string[];
  rolePrompt?: string;
};

export type GenerateSuggestedAnswerInput = {
  latestAiTurn: SuggestedAnswerAiTurn;
  materialBrief?: MaterialBriefPayload | null;
  mockMode?: boolean;
  persona: SuggestedAnswerPersona;
  practiceSession: PracticeSessionRecord;
  prepCard?: PrepCardPayload | null;
  transcriptTurns: TranscriptTurnInput[];
};

const SUGGESTED_ANSWER_TIMEOUT_MS = 20_000;

function shouldUseMockMode(input: Pick<GenerateSuggestedAnswerInput, "mockMode">) {
  return (
    input.mockMode === true ||
    process.env.AI_MOCK_MODE === "true" ||
    process.env.NODE_ENV === "test"
  );
}

function suggestedAnswerTextModel() {
  return (
    process.env.SUGGESTED_ANSWER_TEXT_MODEL?.trim() ||
    process.env.SUPPORT_CUE_FAST_TEXT_MODEL?.trim() ||
    process.env.SUBTITLE_DEEPSEEK_MODEL?.trim() ||
    undefined
  );
}

function personaEnglishDescriptor(personaId: string) {
  const descriptors: Record<string, string> = {
    channel_partner: "channel partner",
    enterprise_buyer: "enterprise buyer",
    executive_decision_maker: "executive decision maker",
    procurement_manager: "procurement manager",
    technical_lead: "technical buyer",
  };

  return descriptors[personaId] ?? "customer stakeholder";
}

type SuggestedVocabularyItem = SuggestedAnswerCore["vocabulary"][number];

const vocabularyPatterns: SuggestedVocabularyItem[] = [
  {
    term: "remote support team",
    phonetic: "/rɪˈmoʊt səˈpɔːrt tiːm/",
    chinese: "远程支持团队",
    example: "a remote support team can guide the field engineer",
  },
  {
    term: "equipment maintenance",
    phonetic: "/ɪˈkwɪpmənt ˈmeɪntənəns/",
    chinese: "设备维护",
    example: "use Rokid glasses during equipment maintenance",
  },
  {
    term: "remote expert guidance",
    phonetic: "/rɪˈmoʊt ˈekspɜːrt ˈɡaɪdəns/",
    chinese: "远程专家指导",
    example: "follow remote expert guidance through the glasses",
  },
  {
    term: "field engineer",
    phonetic: "/fiːld ˌendʒɪˈnɪr/",
    chinese: "现场工程师",
    example: "the field engineer can keep both hands free",
  },
  {
    term: "at rest",
    phonetic: "/æt rest/",
    chinese: "静态存储时",
    example: "data encrypted at rest",
  },
  {
    term: "in transit",
    phonetic: "/ɪn ˈtrænzɪt/",
    chinese: "传输过程中",
    example: "data encrypted in transit",
  },
  {
    term: "data flow",
    phonetic: "/ˈdeɪtə floʊ/",
    chinese: "数据流",
    example: "map the data flow with your IT team",
  },
  {
    term: "encryption requirements",
    phonetic: "/ɪnˈkrɪpʃən rɪˈkwaɪərmənts/",
    chinese: "加密要求",
    example: "confirm encryption requirements before deployment",
  },
  {
    term: "deployment options",
    phonetic: "/dɪˈplɔɪmənt ˈɑːpʃənz/",
    chinese: "部署选项",
    example: "clarify the deployment options",
  },
  {
    term: "on-premise",
    phonetic: "/ɑːn ˈpremɪs/",
    chinese: "本地部署的",
    example: "cloud or on-premise deployment",
  },
  {
    term: "return on investment",
    phonetic: "/rɪˈtɜːrn ɑːn ɪnˈvestmənt/",
    chinese: "投资回报",
    example: "define the expected return on investment",
  },
  {
    term: "payback period",
    phonetic: "/ˈpeɪbæk ˈpɪriəd/",
    chinese: "回本周期",
    example: "estimate the payback period",
  },
  {
    term: "application scenario",
    phonetic: "/ˌæplɪˈkeɪʃən səˈnærioʊ/",
    chinese: "应用场景",
    example: "connect the answer to the customer's application scenario",
  },
  {
    term: "product differentiation",
    phonetic: "/ˈprɑːdʌkt ˌdɪfəˌrenʃiˈeɪʃən/",
    chinese: "产品差异化",
    example: "explain Rokid's product differentiation clearly",
  },
  {
    term: "hands-free",
    phonetic: "/ˌhændz ˈfriː/",
    chinese: "免手持的",
    example: "hands-free guidance helps users stay focused",
  },
  {
    term: "multilingual meetings",
    phonetic: "/ˌmʌltiˈlɪŋɡwəl ˈmiːtɪŋz/",
    chinese: "多语言会议",
    example: "reduce friction during multilingual meetings",
  },
  {
    term: "smart glasses",
    phonetic: "/smɑːrt ˈɡlæsɪz/",
    chinese: "智能眼镜",
    example: "use smart glasses in customer meetings",
  },
  {
    term: "business problem",
    phonetic: "/ˈbɪznəs ˈprɑːbləm/",
    chinese: "业务问题",
    example: "understand the customer's business problem",
  },
  {
    term: "customer segment",
    phonetic: "/ˈkʌstəmər ˈseɡmənt/",
    chinese: "客户细分群体",
    example: "identify the first customer segment to target",
  },
  {
    term: "use case",
    phonetic: "/juːs keɪs/",
    chinese: "使用场景",
    example: "connect the answer to the customer's use case",
  },
  {
    term: "target customer",
    phonetic: "/ˈtɑːrɡɪt ˈkʌstəmər/",
    chinese: "目标客户",
    example: "clarify the target customer before the pilot",
  },
  {
    term: "technical review",
    phonetic: "/ˈteknɪkəl rɪˈvjuː/",
    chinese: "技术评审",
    example: "propose a technical review with the IT team",
  },
  {
    term: "pilot scope",
    phonetic: "/ˈpaɪlət skoʊp/",
    chinese: "试点范围",
    example: "define the pilot scope with the customer",
  },
  {
    term: "workflow fit",
    phonetic: "/ˈwɜːrkfloʊ fɪt/",
    chinese: "流程适配度",
    example: "confirm the workflow fit before the pilot",
  },
];

const genericVocabularyStopWords = new Set([
  "about",
  "answer",
  "before",
  "both",
  "could",
  "during",
  "first",
  "from",
  "glasses",
  "have",
  "help",
  "into",
  "make",
  "more",
  "question",
  "rather",
  "rokid",
  "should",
  "than",
  "that",
  "their",
  "then",
  "there",
  "these",
  "this",
  "through",
  "while",
  "with",
  "would",
  "your",
]);

const fillerVocabularyWords = new Set([
  "a",
  "am",
  "an",
  "and",
  "are",
  "asked",
  "asking",
  "be",
  "been",
  "being",
  "but",
  "can",
  "certainly",
  "clarify",
  "could",
  "did",
  "do",
  "does",
  "for",
  "how",
  "i",
  "is",
  "it",
  "me",
  "of",
  "ok",
  "okay",
  "or",
  "please",
  "question",
  "sure",
  "the",
  "they",
  "to",
  "was",
  "we",
  "were",
  "what",
  "when",
  "where",
  "which",
  "why",
  "would",
  "you",
]);

const meaningfulVocabularyKeywords = new Set([
  "application",
  "business",
  "caption",
  "captions",
  "customer",
  "data",
  "deployment",
  "differentiation",
  "encryption",
  "engineer",
  "equipment",
  "expert",
  "field",
  "flow",
  "guidance",
  "hands-free",
  "integration",
  "maintenance",
  "meeting",
  "meetings",
  "multilingual",
  "on-premise",
  "pilot",
  "privacy",
  "product",
  "remote",
  "requirement",
  "requirements",
  "return",
  "roi",
  "scenario",
  "security",
  "segment",
  "smart",
  "support",
  "target",
  "team",
  "technical",
  "translation",
  "workflow",
]);

const fallbackChineseByKeyword: Array<[string, string]> = [
  ["remote", "远程"],
  ["support", "支持"],
  ["team", "团队"],
  ["equipment", "设备"],
  ["maintenance", "维护"],
  ["customer", "客户"],
  ["business", "业务"],
  ["scenario", "场景"],
  ["technical", "技术"],
  ["deployment", "部署"],
  ["security", "安全"],
  ["privacy", "隐私"],
  ["integration", "集成"],
  ["pilot", "试点"],
  ["data", "数据"],
  ["meeting", "会议"],
  ["translation", "翻译"],
  ["caption", "字幕"],
  ["workflow", "流程"],
  ["segment", "细分群体"],
  ["target", "目标"],
  ["field", "现场"],
  ["engineer", "工程师"],
];

const fallbackChineseByPhrase: Record<string, string> = {
  "business requirement": "业务需求",
  "customer segment": "客户细分群体",
  "customer use case": "客户使用场景",
  "target customer": "目标客户",
  "use case": "使用场景",
};

const knownVocabularyTerms = new Set(
  vocabularyPatterns.map((item) => item.term.toLowerCase()),
);

function normalizeVocabularyTerm(term: string) {
  return term
    .toLowerCase()
    .replace(/[^a-z0-9-\s]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function isUsefulVocabularyTerm(term: string) {
  const normalizedTerm = normalizeVocabularyTerm(term);

  if (!normalizedTerm) {
    return false;
  }

  if (knownVocabularyTerms.has(normalizedTerm)) {
    return true;
  }

  const words = normalizedTerm.split(/\s+/);

  if (words.length > 4 || words.length === 0) {
    return false;
  }

  if (words.some((word) => fillerVocabularyWords.has(word))) {
    return false;
  }

  if (words.every((word) => word.length < 4)) {
    return false;
  }

  return words.some((word) => meaningfulVocabularyKeywords.has(word));
}

function phraseToFallbackChinese(phrase: string) {
  const normalizedPhrase = normalizeVocabularyTerm(phrase);

  if (fallbackChineseByPhrase[normalizedPhrase]) {
    return fallbackChineseByPhrase[normalizedPhrase];
  }

  const translatedWords = phrase
    .split(/\s+/)
    .map((word) => {
      const normalizedWord = word.toLowerCase();
      return (
        fallbackChineseByKeyword.find(([keyword]) =>
          normalizedWord.includes(keyword),
        )?.[1] ?? word
      );
    })
    .join("");

  return translatedWords || phrase;
}

function phraseToFallbackPhonetic(phrase: string) {
  return `/${phrase.toLowerCase().replace(/[^a-z0-9-]+/g, " ").trim()}/`;
}

function vocabularyCandidateFromPhrase(phrase: string): SuggestedVocabularyItem {
  return {
    term: phrase,
    phonetic: phraseToFallbackPhonetic(phrase),
    chinese: phraseToFallbackChinese(phrase),
    example: phrase,
  };
}

function extractVocabularyPhrases(text: string) {
  const words = text
    .toLowerCase()
    .replace(/[^a-z0-9-\s]+/g, " ")
    .split(/\s+/)
    .filter(Boolean);
  const phrases: string[] = [];

  for (const length of [3, 2]) {
    for (let index = 0; index <= words.length - length; index += 1) {
      const slice = words.slice(index, index + length);
      const phrase = slice.join(" ");

      if (
        slice.some((word) => genericVocabularyStopWords.has(word)) ||
        slice.every((word) => word.length < 4) ||
        !isUsefulVocabularyTerm(phrase)
      ) {
        continue;
      }

      phrases.push(phrase);
    }
  }

  return phrases;
}

function normalizeVocabularyItems(
  vocabularyItems: SuggestedVocabularyItem[],
  input: GenerateSuggestedAnswerInput,
  suggestedReplies: SuggestedAnswerCore["suggestedReplies"],
) {
  const normalizedVocabulary: SuggestedVocabularyItem[] = [];
  const seenTerms = new Set<string>();

  function addVocabularyItem(item: SuggestedVocabularyItem) {
    const normalizedTerm = normalizeVocabularyTerm(item.term);

    if (!isUsefulVocabularyTerm(item.term) || seenTerms.has(normalizedTerm)) {
      return;
    }

    seenTerms.add(normalizedTerm);
    normalizedVocabulary.push({
      ...item,
      term: normalizedTerm,
      phonetic: item.phonetic.trim(),
      chinese: item.chinese.trim(),
      example: item.example?.trim(),
    });
  }

  vocabularyItems.forEach(addVocabularyItem);

  if (normalizedVocabulary.length < 2) {
    deriveVocabularyFromContext(input, suggestedReplies).forEach(addVocabularyItem);
  }

  return normalizedVocabulary.slice(0, Math.max(normalizedVocabulary.length, 2));
}

function deriveVocabularyFromContext(
  input: GenerateSuggestedAnswerInput,
  suggestedReplies: SuggestedAnswerCore["suggestedReplies"],
) {
  const sourceText = [
    input.latestAiTurn.text,
    ...suggestedReplies.map((reply) => reply.english),
  ].join(" ");
  const lowerSourceText = sourceText.toLowerCase();
  const vocabulary: SuggestedVocabularyItem[] = [];
  const seenTerms = new Set<string>();

  function addVocabularyItem(item: SuggestedVocabularyItem) {
    const normalizedTerm = normalizeVocabularyTerm(item.term);

    if (!isUsefulVocabularyTerm(item.term) || seenTerms.has(normalizedTerm)) {
      return;
    }

    seenTerms.add(normalizedTerm);
    vocabulary.push({
      ...item,
      term: normalizedTerm,
    });
  }

  vocabularyPatterns.forEach((item) => {
    if (lowerSourceText.includes(item.term.toLowerCase())) {
      addVocabularyItem(item);
    }
  });

  if (vocabulary.length < 2) {
    extractVocabularyPhrases(sourceText).forEach((phrase) => {
      addVocabularyItem(vocabularyCandidateFromPhrase(phrase));
    });
  }

  if (vocabulary.length < 2) {
    [
      vocabularyCandidateFromPhrase("customer use case"),
      vocabularyCandidateFromPhrase("business requirement"),
    ].forEach(addVocabularyItem);
  }

  return vocabulary.slice(0, Math.max(vocabulary.length, 2));
}

function withoutChineseCharacters(text: string, fallback: string) {
  const normalizedText = text
    .replace(/[\u4e00-\u9fff，。！？；：“”‘’、（）【】《》]+/g, " ")
    .replace(/\s+/g, " ")
    .replace(/\s+([,.!?;:])/g, "$1")
    .trim();

  return normalizedText || fallback;
}

function normalizeEnglishText(
  text: string,
  input: GenerateSuggestedAnswerInput,
  fallback: string,
) {
  const personaLabel = input.persona.label ?? input.persona.name;
  const personaDescriptor = personaEnglishDescriptor(
    input.practiceSession.personaId,
  );
  const withoutPersonaLabel = personaLabel
    ? text.replaceAll(personaLabel, personaDescriptor)
    : text;

  return withoutChineseCharacters(withoutPersonaLabel, fallback);
}

function normalizeSuggestedAnswerCore(
  core: SuggestedAnswerCore,
  input: GenerateSuggestedAnswerInput,
): SuggestedAnswerCore {
  const personaDescriptor = personaEnglishDescriptor(
    input.practiceSession.personaId,
  );

  return suggestedAnswerCoreSchema.parse({
    ...core,
    analysis: normalizeEnglishText(
      core.analysis,
      input,
      `This ${personaDescriptor} needs a clear and bounded answer.`,
    ),
    responseStrategy: {
      ...core.responseStrategy,
      english: normalizeEnglishText(
        core.responseStrategy.english,
        input,
        "Acknowledge the concern, answer within known facts, and propose a practical next step.",
      ),
    },
    suggestedReplies: core.suggestedReplies.map((reply) => ({
      ...reply,
      reason: normalizeEnglishText(
        reply.reason,
        input,
        "It answers the concern safely and moves the conversation toward a concrete next step.",
      ),
    })),
    vocabulary: normalizeVocabularyItems(
      core.vocabulary,
      input,
      core.suggestedReplies,
    ),
  });
}

function buildFallbackLogicBreakdown(question: string, isTechnical: boolean) {
  const lowerQuestion = question.toLowerCase();

  if (
    lowerQuestion.includes("encrypted") ||
    lowerQuestion.includes("at rest") ||
    lowerQuestion.includes("in transit")
  ) {
    return {
      surfaceMeaningZh: "客户在询问数据在静态存储和传输过程中的加密方式。",
      customerIntentZh:
        "客户想确认方案是否符合企业安全要求，避免数据保护机制不清。",
      informationNeededZh:
        "客户需要了解数据流、加密边界、传输安全和 IT 审查方式。",
      responseFocusZh:
        "回应时先聚焦安全边界和确认流程，再说明可以与客户 IT 团队一起核对细节。",
    };
  }

  return {
    surfaceMeaningZh: isTechnical
      ? "客户在询问 Rokid 的部署方式，以及是否支持云端或本地部署。"
      : "客户在确认 Rokid 是否能解决实际业务问题。",
    customerIntentZh: isTechnical
      ? "客户想确认方案是否符合企业安全要求，避免数据、系统和部署边界不清。"
      : "客户想判断产品价值是否足够明确，是否值得继续推进试点。",
    informationNeededZh: isTechnical
      ? "客户需要了解部署选项、数据流、加密要求、IT 审查方式和落地边界。"
      : "客户需要了解应用场景、业务收益、试点范围和成功衡量方式。",
    responseFocusZh: isTechnical
      ? "回应时先聚焦安全和部署边界，再说明可以与客户 IT 团队一起确认细节。"
      : "回应时先聚焦客户场景和可验证价值，再提出低风险的下一步。",
  };
}

function latestUserTurnText(turns: TranscriptTurnInput[]) {
  return [...turns].reverse().find((turn) => turn.speaker === "user")?.text;
}

function buildFallbackContextBreakdown(
  input: GenerateSuggestedAnswerInput,
  isTechnical: boolean,
) {
  const question = input.latestAiTurn.text;
  const lowerQuestion = question.toLowerCase();
  const priorUserText = latestUserTurnText(input.transcriptTurns);
  const priorUserAnswerZh = priorUserText
    ? `用户前面说过：“${priorUserText}”，说明当前还没有形成完整、确定的回答。`
    : "用户前面还没有给出具体回答，因此这次需要先建立清晰的回答框架。";

  if (
    lowerQuestion.includes("deployment") ||
    lowerQuestion.includes("cloud") ||
    lowerQuestion.includes("on-premise") ||
    lowerQuestion.includes("on premise")
  ) {
    return {
      conversationStateZh: "当前对话正在围绕部署方式和安全边界展开。",
      customerQuestionReasonZh:
        "客户已经进入技术评估阶段，所以现在追问云端、本地部署和安全边界。",
      priorUserAnswerZh,
      missingInformationZh:
        "还缺少客户的 IT 政策、系统环境、部署偏好和允许的数据处理边界。",
      responseBoundaryZh:
        "不要直接承诺所有云端或本地部署方式，先说明需要结合客户 IT 要求确认。",
    };
  }

  if (
    lowerQuestion.includes("encrypted") ||
    lowerQuestion.includes("at rest") ||
    lowerQuestion.includes("in transit")
  ) {
    return {
      conversationStateZh: "当前对话正在围绕数据安全、加密方式和企业审查要求展开。",
      customerQuestionReasonZh:
        "客户正在确认 Rokid 是否能通过企业安全评估，而不是只听产品价值介绍。",
      priorUserAnswerZh,
      missingInformationZh:
        "还缺少客户的数据流要求、加密标准、传输边界和 IT 审查细节。",
      responseBoundaryZh:
        "不要直接承诺具体认证、加密等级或所有部署能力，先把回答限定在可确认的流程和下一步技术评审。",
    };
  }

  return {
    conversationStateZh: isTechnical
      ? "当前对话正在从产品价值转向技术可行性和落地边界。"
      : "当前对话正在确认客户业务场景、价值判断和下一步推进方式。",
    customerQuestionReasonZh: isTechnical
      ? "客户希望判断 Rokid 是否适合进入技术评估或试点。"
      : "客户希望确认这个方案是否真的匹配自己的业务问题。",
    priorUserAnswerZh,
    missingInformationZh: isTechnical
      ? "还缺少客户环境、技术限制、审批流程和成功标准。"
      : "还缺少客户应用场景、优先级、预算或试点成功标准。",
    responseBoundaryZh: isTechnical
      ? "避免做未经材料支持的技术承诺，优先提出确认流程。"
      : "避免泛泛推销，优先把回答绑定到客户真实场景。",
  };
}

function generateMockSuggestedAnswer(
  input: GenerateSuggestedAnswerInput,
): SuggestedAnswerCore {
  const question = input.latestAiTurn.text;
  const personaDescriptor = personaEnglishDescriptor(
    input.practiceSession.personaId,
  );
  const productPoint =
    input.materialBrief?.productPoints[0] ?? "Rokid smart glasses";
  const valuePoint =
    input.materialBrief?.customerValue[0] ??
    "reduce communication friction during multilingual meetings";
  const isTechnical = input.practiceSession.personaId.includes("technical");
  const suggestedEnglish = isTechnical
    ? "That is an important security question. For a pilot, we can first map the data flow with your IT team and confirm encryption requirements before deployment."
    : "That is a fair question. I would first connect the answer to your use case, then suggest a small pilot to validate the value before a larger rollout.";
  const suggestedChinese = isTechnical
    ? "这是一个很重要的安全问题。试点阶段我们可以先和你们 IT 团队梳理数据流，并在部署前确认加密要求。"
    : "这是一个合理的问题。我会先把回答连接到你们的使用场景，再建议用小规模试点验证价值。";

  return normalizeSuggestedAnswerCore(
    suggestedAnswerCoreSchema.parse({
    aiQuestion: {
      english: question,
      translationZh:
        input.latestAiTurn.translationZh ??
        "这句话需要结合当前客户问题进行中文理解。",
    },
    analysis: `This ${personaDescriptor} is asking for a precise answer. Respond by acknowledging the concern, giving a bounded answer, connecting it to ${productPoint}, and proposing a concrete next step without unsupported claims.`,
    responseStrategy: {
      english: `For a ${personaDescriptor}, acknowledge the ${isTechnical ? "security and deployment" : "business"} concern first, then give a bounded Rokid answer and propose a practical next step.`,
      chinese: isTechnical
        ? "先承认客户对安全和部署方式的顾虑，再给出有边界的 Rokid 回答，并建议和 IT 团队确认下一步。"
        : "先承认客户的业务顾虑，再把回答连接到实际使用场景，并建议用小规模试点验证价值。",
    },
    contextBreakdown: buildFallbackContextBreakdown(input, isTechnical),
    logicBreakdown: buildFallbackLogicBreakdown(question, isTechnical),
    suggestedReplies: [
      {
        english: suggestedEnglish,
        chinese: suggestedChinese,
        reason: `It answers the question safely, matches the ${personaDescriptor}'s concern, and turns ${valuePoint} into a concrete next step.`,
      },
    ],
    vocabulary: deriveVocabularyFromContext(input, [
      {
        english: suggestedEnglish,
        chinese: suggestedChinese,
        reason: `It answers the question safely, matches the ${personaDescriptor}'s concern, and turns ${valuePoint} into a concrete next step.`,
      },
    ]),
    phrasebookEntry: {
      category: isTechnical ? "Objection Handling" : "Business Value",
      english: suggestedEnglish,
      chinese: suggestedChinese,
      useCase: `Suggested answer for a ${personaDescriptor} during live Rokid practice.`,
      simpleVersion: "Let me answer this carefully and confirm the next step.",
      professionalVersion: suggestedEnglish,
      relatedProductPoint: productPoint,
      relatedObjection: question,
      tags: ["suggested-answer", "live-coaching", input.practiceSession.personaId],
      source: "review",
      masteryStatus: "needs_practice",
    },
    }),
    input,
  );
}

function buildSuggestedAnswerPrompt(input: GenerateSuggestedAnswerInput) {
  return [
    "You are generating a live suggested answer for a Rokid overseas sales English practice website.",
    TEXT_ANALYSIS_BOUNDARY,
    "Return strict JSON only. Do not include Markdown.",
    "The learner clicked Suggested Answer because they do not know how to answer the AI customer's latest question.",
    "Analyze the latest AI question and recommend how the learner should respond.",
    "Consider the selected scenario, practice goal, customer persona, communication style, training focus, material brief, prep card, and recent transcript.",
    "Use the same reasoning process as other live support panels: recent context -> customer intent -> learner need -> recommended action -> safe boundary. The answer must be consistent with the same conversation state.",
    "Ground the analysis in the latest transcript. Do not return canned security, deployment, ROI, or pilot language unless the current conversation actually supports it.",
    "Do not invent product claims, pricing, accuracy numbers, certifications, encryption guarantees, or contract terms not provided in the material. If details are unknown, suggest a safe answer that proposes confirmation or technical review.",
    "JSON shape: aiQuestion { english, translationZh }, analysis, responseStrategy { english, chinese }, contextBreakdown { conversationStateZh, customerQuestionReasonZh, priorUserAnswerZh, missingInformationZh, responseBoundaryZh }, logicBreakdown { surfaceMeaningZh, customerIntentZh, informationNeededZh, responseFocusZh }, suggestedReplies array of 1-3 items { english, chinese, reason }, vocabulary array of at least 2 items with no upper limit { term, phonetic, chinese, example }, phrasebookEntry.",
    "Strict language separation: responseStrategy.english and suggestedReplies[].reason must be English only. responseStrategy.chinese, aiQuestion.translationZh, every contextBreakdown field, and every logicBreakdown field must be Chinese only.",
    "Do not put Chinese persona labels, Chinese focus tags, or mixed-language fragments inside English fields. Use English role descriptions such as technical buyer, enterprise buyer, procurement manager, channel partner, or executive decision maker.",
    "The contextBreakdown should explain the conversational context, not only the latest sentence: what the conversation is about, why the customer asks now, what the learner already said, what information is still missing, and what answer boundaries or risks matter.",
    "The logicBreakdown should explain the customer's sentence logic: surface meaning, underlying intent, information they want, and the response focus.",
    "phrasebookEntry must use one valid category and source='review', masteryStatus='needs_practice', and tags including suggested-answer and live-coaching.",
    "Vocabulary must include at least 2 advanced words or phrases from the AI question or suggested reply, and there is no maximum item limit. Include phonetic notation in slashes.",
    "Vocabulary must be generated for this exact conversation. Do not output generic filler terms like workflow fit, pilot scope, technical review, or business value unless those exact ideas are central to the latest question or suggested reply.",
    `Practice session: ${JSON.stringify(input.practiceSession)}`,
    `Persona: ${JSON.stringify(input.persona)}`,
    `Material brief: ${JSON.stringify(input.materialBrief ?? {})}`,
    `Prep card: ${JSON.stringify(input.prepCard ?? {})}`,
    `Latest AI question: ${JSON.stringify(input.latestAiTurn)}`,
    `Recent transcript: ${JSON.stringify(input.transcriptTurns.slice(-6))}`,
  ].join("\n\n");
}

export async function generateSuggestedAnswer(
  input: GenerateSuggestedAnswerInput,
): Promise<SuggestedAnswerRecord> {
  let core: SuggestedAnswerCore;

  if (shouldUseMockMode(input)) {
    core = generateMockSuggestedAnswer(input);
  } else {
    if (!hasTextAIApiKey()) {
      throw new Error("建议回答 AI 生成失败：缺少文本模型 API Key。");
    }

    try {
      core = normalizeSuggestedAnswerCore(
        suggestedAnswerCoreSchema.parse(
          await generateTextJSON({
            prompt: buildSuggestedAnswerPrompt(input),
            schemaName: "suggested answer",
            model: suggestedAnswerTextModel(),
            maxTokens: 2400,
            timeoutMs: SUGGESTED_ANSWER_TIMEOUT_MS,
          }),
        ),
        input,
      );
    } catch (error) {
      console.warn("Suggested answer text model failed.", error);
      throw new Error("建议回答 AI 生成失败，请稍后重试。");
    }
  }

  return suggestedAnswerRecordSchema.parse({
    id: `suggestion_${crypto.randomUUID()}`,
    createdAt: new Date().toISOString(),
    ...core,
  });
}
