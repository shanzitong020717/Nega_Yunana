import { normalizeOpenAIApiKey, normalizeOpenAIBaseURL } from "@/lib/ai/openai-client";

type GenerateTextJSONInput = {
  prompt: string;
  schemaName: string;
};

const DEFAULT_DEEPSEEK_BASE_URL = "https://api.deepseek.com";
const DEFAULT_DEEPSEEK_MODEL = "deepseek-v4-pro";
const DEFAULT_MAX_TOKENS = 8192;

export const TEXT_ANALYSIS_PROVIDER_NAME = "DeepSeek";
export const TEXT_ANALYSIS_BOUNDARY =
  "DeepSeek text analysis boundary: Use DeepSeek only for offline JSON text analysis outside the realtime audio loop. Do not use it for live microphone/audio turns.";

function configuredTextApiKey() {
  return (
    normalizeOpenAIApiKey(process.env.DEEPSEEK_API_KEY) ??
    normalizeOpenAIApiKey(process.env.OPENAI_API_KEY)
  );
}

export function hasTextAIApiKey() {
  return Boolean(configuredTextApiKey());
}

export function getTextAIBaseURL() {
  return (
    normalizeOpenAIBaseURL(process.env.DEEPSEEK_BASE_URL) ??
    normalizeOpenAIBaseURL(process.env.OPENAI_BASE_URL) ??
    DEFAULT_DEEPSEEK_BASE_URL
  );
}

export function getTextAIModel() {
  return (
    process.env.DEEPSEEK_TEXT_MODEL?.trim() ||
    process.env.OPENAI_TEXT_MODEL?.trim() ||
    DEFAULT_DEEPSEEK_MODEL
  );
}

function extractJSONContent(content: string) {
  const trimmedContent = content.trim();

  if (trimmedContent.startsWith("```")) {
    return trimmedContent
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```$/, "")
      .trim();
  }

  return trimmedContent;
}

export async function generateTextJSON(input: GenerateTextJSONInput) {
  const apiKey = configuredTextApiKey();

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
      model: getTextAIModel(),
      messages: [
        {
          role: "system",
          content:
            "You return valid JSON only. Do not include Markdown fences or explanatory text.",
        },
        {
          role: "user",
          content: input.prompt,
        },
      ],
      response_format: {
        type: "json_object",
      },
      max_tokens: DEFAULT_MAX_TOKENS,
      temperature: 0.2,
    }),
  });

  const payload = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
    error?: { message?: string };
  };

  if (!response.ok) {
    throw new Error(
      payload.error?.message ??
        `${input.schemaName} generation failed with status ${response.status}.`,
    );
  }

  const content = payload.choices?.[0]?.message?.content;

  if (!content) {
    throw new Error(`${input.schemaName} generation returned no content.`);
  }

  return JSON.parse(extractJSONContent(content)) as unknown;
}
