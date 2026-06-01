import { z } from "zod";

import {
  getTextAIBaseURL,
  hasTextAIApiKey,
} from "@/lib/ai/text-client";
import { normalizeOpenAIApiKey } from "@/lib/ai/openai-client";

export const subtitleTranslationSchema = z.object({
  translationZh: z.string().trim().min(1),
});

export type SubtitleTranslationPayload = z.infer<
  typeof subtitleTranslationSchema
>;

export type GenerateSubtitleTranslationInput = {
  speaker: "ai_customer" | "user";
  text: string;
  mockMode?: boolean;
};

const mockTranslations: Record<string, string> = {
  "Yes, I can.": "是的，我可以。",
  "Could you define the product use case first?": "你可以先明确产品应用场景吗？",
  "What business problem are you trying to solve with smart glasses?":
    "你想用智能眼镜解决什么业务问题？",
  "How would you measure success in a pilot?": "你们会如何衡量试点是否成功？",
};

const DEFAULT_GEMINI_FLASH_TEXT_MODEL = "gemini-2.5-flash";
const DEFAULT_SUBTITLE_DEEPSEEK_MODEL = "deepseek-v4-flash";
const SUBTITLE_DEEPSEEK_MAX_TOKENS = 384;
const SUBTITLE_TRANSLATION_CACHE_LIMIT = 200;
const GEMINI_GENERATE_CONTENT_BASE_URL =
  "https://generativelanguage.googleapis.com/v1beta/models";
const GEMINI_SUBTITLE_MAX_OUTPUT_TOKENS = 512;

const subtitleTranslationCache = new Map<string, SubtitleTranslationPayload>();

type GeminiGenerateContentPayload = {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        text?: string;
      }>;
    };
  }>;
  error?: {
    message?: string;
  };
};

type DeepSeekChatCompletionsPayload = {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
  error?: {
    message?: string;
  };
};

function normalizeSubtitleText(text: string) {
  return text.replace(/\s+/g, " ").trim();
}

function subtitleSentenceUnits(text: string) {
  const normalizedText = normalizeSubtitleText(text);

  if (!normalizedText) {
    return [];
  }

  return (
    normalizedText.match(/[^.!?。！？]+(?:[.!?。！？]+|$)/g) ?? [normalizedText]
  )
    .map((sentence) => sentence.trim())
    .filter(Boolean);
}

function hasTerminalSentencePunctuation(text: string) {
  return /[.!?。！？]["')\]]?$/.test(text.trim());
}

function completedSentenceCount(text: string) {
  return subtitleSentenceUnits(text).filter(hasTerminalSentencePunctuation).length;
}

function normalizeGeminiApiKey(value: string | undefined) {
  const trimmedValue = value?.trim() ?? "";

  if (
    (trimmedValue.startsWith('"') && trimmedValue.endsWith('"')) ||
    (trimmedValue.startsWith("'") && trimmedValue.endsWith("'"))
  ) {
    return trimmedValue.slice(1, -1).trim();
  }

  return trimmedValue || undefined;
}

function configuredGeminiApiKey() {
  return (
    normalizeGeminiApiKey(process.env.GEMINI_API_KEY) ??
    normalizeGeminiApiKey(process.env.GOOGLE_GENERATIVE_AI_API_KEY)
  );
}

function hasGeminiFlashApiKey() {
  return Boolean(configuredGeminiApiKey());
}

function getGeminiFlashTextModel() {
  return (
    process.env.GEMINI_FLASH_TEXT_MODEL?.trim().replace(/^models\//, "") ||
    DEFAULT_GEMINI_FLASH_TEXT_MODEL
  );
}

function getSubtitleDeepSeekModel() {
  return (
    process.env.SUBTITLE_DEEPSEEK_MODEL?.trim() ||
    DEFAULT_SUBTITLE_DEEPSEEK_MODEL
  );
}

function configuredSubtitleDeepSeekApiKey() {
  return (
    normalizeOpenAIApiKey(process.env.DEEPSEEK_API_KEY) ??
    normalizeOpenAIApiKey(process.env.OPENAI_API_KEY)
  );
}

function getSubtitleTranslationProvider() {
  const configuredProvider = process.env.SUBTITLE_TRANSLATION_PROVIDER?.trim();

  if (configuredProvider === "deepseek") {
    return "deepseek";
  }

  if (configuredProvider === "gemini_flash" || hasGeminiFlashApiKey()) {
    return "gemini_flash";
  }

  return "deepseek";
}

function shouldUseMockMode(input: GenerateSubtitleTranslationInput) {
  return (
    input.mockMode === true ||
    process.env.AI_MOCK_MODE === "true" ||
    process.env.NODE_ENV === "test" ||
    (!hasTextAIApiKey() && !hasGeminiFlashApiKey())
  );
}

function generateMockSubtitleTranslation(
  input: GenerateSubtitleTranslationInput,
): SubtitleTranslationPayload {
  const normalizedText = normalizeSubtitleText(input.text);

  return {
    translationZh: mockTranslations[normalizedText] ?? `中文翻译：${normalizedText}`,
  };
}

function buildDeepSeekSubtitleMessages(input: GenerateSubtitleTranslationInput) {
  return [
    {
      role: "system",
      content:
        "Translate English business subtitles to natural Simplified Chinese. Return only the Chinese translation.",
    },
    {
      role: "user",
      content: [
        "Translate every sentence completely. No summary. Keep Rokid in English.",
        `Speaker: ${input.speaker}`,
        `Subtitle: ${normalizeSubtitleText(input.text)}`,
      ].join("\n"),
    },
  ];
}

function buildGeminiFlashSubtitleTranslationPrompt(
  input: GenerateSubtitleTranslationInput,
) {
  return [
    "Translate the complete sentence into accurate, natural Simplified Chinese for an English learner review transcript.",
    "Do not summarize, shorten, omit, or paraphrase away details.",
    "If the subtitle contains multiple English sentences, translate every sentence in order and preserve the same number of Chinese sentences.",
    "Return only the Chinese translation text. Do not return JSON, speaker labels, Markdown, timestamps, explanations, or alternatives.",
    "Keep product names such as Rokid in English.",
    `Speaker: ${input.speaker}`,
    `Subtitle: ${normalizeSubtitleText(input.text)}`,
  ].join("\n");
}

function looksLikeMalformedStructuredTranslation(text: string) {
  return (
    text.startsWith("{") ||
    text.startsWith("[") ||
    /["“]?translationZh["”]?\s*:/.test(text)
  );
}

function extractPlainChineseTranslation(text: string) {
  const strippedText = text
    .trim()
    .replace(/^```(?:json|text)?\s*/i, "")
    .replace(/\s*```$/, "")
    .trim();

  try {
    const parsed = JSON.parse(strippedText) as unknown;

    if (typeof parsed === "string") {
      return parsed.trim();
    }

    if (
      parsed &&
      typeof parsed === "object" &&
      typeof (parsed as Record<string, unknown>).translationZh === "string"
    ) {
      return (parsed as Record<string, string>).translationZh.trim();
    }
  } catch {
    // Gemini can return either JSON or plain text depending on model settings.
  }

  if (looksLikeMalformedStructuredTranslation(strippedText)) {
    throw new Error("Gemini Flash subtitle translation returned malformed JSON.");
  }

  return strippedText.replace(/^["“]|["”]$/g, "").trim();
}

function assertCompleteSubtitleTranslation(
  input: GenerateSubtitleTranslationInput,
  translationZh: string,
) {
  const sourceSentenceCount = subtitleSentenceUnits(input.text).length;

  if (sourceSentenceCount <= 1) {
    return translationZh;
  }

  const translationSentenceCount = completedSentenceCount(translationZh);

  if (translationSentenceCount < sourceSentenceCount) {
    throw new Error(
      `Subtitle translation incomplete: expected ${sourceSentenceCount} translated sentences, got ${translationSentenceCount}.`,
    );
  }

  return translationZh;
}

function subtitleTranslationCacheKey(input: GenerateSubtitleTranslationInput) {
  return [
    getSubtitleTranslationProvider(),
    getSubtitleDeepSeekModel(),
    input.speaker,
    normalizeSubtitleText(input.text).toLowerCase(),
  ].join("::");
}

function readSubtitleTranslationCache(input: GenerateSubtitleTranslationInput) {
  return subtitleTranslationCache.get(subtitleTranslationCacheKey(input));
}

function writeSubtitleTranslationCache(
  input: GenerateSubtitleTranslationInput,
  translation: SubtitleTranslationPayload,
) {
  if (subtitleTranslationCache.size >= SUBTITLE_TRANSLATION_CACHE_LIMIT) {
    const firstKey = subtitleTranslationCache.keys().next().value;

    if (firstKey) {
      subtitleTranslationCache.delete(firstKey);
    }
  }

  subtitleTranslationCache.set(subtitleTranslationCacheKey(input), translation);
}

async function generateGeminiFlashSubtitleTranslation(
  input: GenerateSubtitleTranslationInput,
) {
  const apiKey = configuredGeminiApiKey();

  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is required for Gemini Flash subtitles.");
  }

  const model = getGeminiFlashTextModel();
  const response = await fetch(
    `${GEMINI_GENERATE_CONTENT_BASE_URL}/${model}:generateContent?key=${encodeURIComponent(apiKey)}`,
    {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [
              {
                text: buildGeminiFlashSubtitleTranslationPrompt(input),
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0,
          maxOutputTokens: GEMINI_SUBTITLE_MAX_OUTPUT_TOKENS,
          responseMimeType: "text/plain",
        },
      }),
    },
  );
  const payload = (await response.json()) as GeminiGenerateContentPayload;

  if (!response.ok) {
    throw new Error(
      payload.error?.message ??
        `Gemini Flash subtitle translation failed with status ${response.status}.`,
    );
  }

  const text = payload.candidates?.[0]?.content?.parts
    ?.map((part) => part.text ?? "")
    .join("")
    .trim();

  if (!text) {
    throw new Error("Gemini Flash subtitle translation returned no content.");
  }

  const parsed = subtitleTranslationSchema.parse({
    translationZh: extractPlainChineseTranslation(text),
  });

  return {
    translationZh: assertCompleteSubtitleTranslation(input, parsed.translationZh),
  };
}

async function generateDeepSeekSubtitleTranslation(
  input: GenerateSubtitleTranslationInput,
) {
  const apiKey = configuredSubtitleDeepSeekApiKey();

  if (!apiKey) {
    throw new Error("DEEPSEEK_API_KEY or OPENAI_API_KEY is required.");
  }

  const response = await fetch(`${getTextAIBaseURL()}/chat/completions`, {
    method: "POST",
    headers: {
      authorization: `Bearer ${apiKey}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      max_tokens: SUBTITLE_DEEPSEEK_MAX_TOKENS,
      messages: buildDeepSeekSubtitleMessages(input),
      model: getSubtitleDeepSeekModel(),
      temperature: 0,
    }),
  });
  const payload = (await response.json()) as DeepSeekChatCompletionsPayload;

  if (!response.ok) {
    throw new Error(
      payload.error?.message ??
        `Subtitle translation failed with status ${response.status}.`,
    );
  }

  const text = payload.choices?.[0]?.message?.content?.trim();

  if (!text) {
    throw new Error("Subtitle translation returned no content.");
  }

  const parsed = subtitleTranslationSchema.parse({
    translationZh: extractPlainChineseTranslation(text),
  });

  return subtitleTranslationSchema.parse({
    translationZh: assertCompleteSubtitleTranslation(input, parsed.translationZh),
  });
}

export async function generateSubtitleTranslation(
  input: GenerateSubtitleTranslationInput,
): Promise<SubtitleTranslationPayload> {
  if (shouldUseMockMode(input)) {
    return generateMockSubtitleTranslation(input);
  }

  const cachedTranslation = readSubtitleTranslationCache(input);

  if (cachedTranslation) {
    return cachedTranslation;
  }

  let translation: SubtitleTranslationPayload;

  if (getSubtitleTranslationProvider() === "gemini_flash") {
    try {
      translation = await generateGeminiFlashSubtitleTranslation(input);
      writeSubtitleTranslationCache(input, translation);

      return translation;
    } catch (error) {
      if (!hasTextAIApiKey()) {
        throw error;
      }
    }
  }

  translation = await generateDeepSeekSubtitleTranslation(input);
  writeSubtitleTranslationCache(input, translation);

  return translation;
}
