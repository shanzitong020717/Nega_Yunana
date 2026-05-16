import { z } from "zod";

import {
  TEXT_ANALYSIS_BOUNDARY,
  generateTextJSON,
  hasTextAIApiKey,
} from "@/lib/ai/text-client";

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

function shouldUseMockMode(input: GenerateSubtitleTranslationInput) {
  return (
    input.mockMode === true ||
    process.env.AI_MOCK_MODE === "true" ||
    process.env.NODE_ENV === "test" ||
    !hasTextAIApiKey()
  );
}

const mockTranslations: Record<string, string> = {
  "Yes, I can.": "是的，我可以。",
  "Could you define the product use case first?": "你可以先明确产品应用场景吗？",
  "What business problem are you trying to solve with smart glasses?":
    "你想用智能眼镜解决什么业务问题？",
  "How would you measure success in a pilot?": "你们会如何衡量试点是否成功？",
};

function normalizeSubtitleText(text: string) {
  return text.replace(/\s+/g, " ").trim();
}

function generateMockSubtitleTranslation(
  input: GenerateSubtitleTranslationInput,
): SubtitleTranslationPayload {
  const normalizedText = normalizeSubtitleText(input.text);

  return {
    translationZh: mockTranslations[normalizedText] ?? `中文翻译：${normalizedText}`,
  };
}

function buildSubtitleTranslationPrompt(input: GenerateSubtitleTranslationInput) {
  return [
    "You translate one English live-conversation subtitle into concise, natural Simplified Chinese for a learner review transcript.",
    TEXT_ANALYSIS_BOUNDARY,
    "Return strict JSON with one key: translationZh.",
    "Keep product names such as Rokid in English. Do not add explanations, timestamps, speaker labels, Markdown, or teaching notes.",
    `Speaker: ${input.speaker}`,
    `Subtitle: ${normalizeSubtitleText(input.text)}`,
  ].join("\n\n");
}

async function generateAISubtitleTranslation(
  input: GenerateSubtitleTranslationInput,
) {
  const parsed = await generateTextJSON({
    prompt: buildSubtitleTranslationPrompt(input),
    schemaName: "subtitle translation",
  });

  return subtitleTranslationSchema.parse(parsed);
}

export async function generateSubtitleTranslation(
  input: GenerateSubtitleTranslationInput,
): Promise<SubtitleTranslationPayload> {
  if (shouldUseMockMode(input)) {
    return generateMockSubtitleTranslation(input);
  }

  return generateAISubtitleTranslation(input);
}
