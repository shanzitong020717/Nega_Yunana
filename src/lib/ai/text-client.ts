import { normalizeOpenAIApiKey, normalizeOpenAIBaseURL } from "@/lib/ai/openai-client";

type GenerateTextJSONInput = {
  maxRetries?: number;
  maxTokens?: number;
  model?: string;
  prompt: string;
  retryDelayMs?: number;
  schemaName: string;
  timeoutMs?: number;
};

const DEFAULT_DEEPSEEK_BASE_URL = "https://api.deepseek.com";
const DEFAULT_DEEPSEEK_MODEL = "deepseek-v4-pro";
const DEFAULT_MAX_TOKENS = 8192;
const DEFAULT_MAX_RETRIES = 1;
const DEFAULT_RETRY_DELAY_MS = 200;

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

function retryCountFrom(input: GenerateTextJSONInput) {
  const configuredRetryCount =
    input.maxRetries ?? process.env.TEXT_AI_MAX_RETRIES;

  if (configuredRetryCount === undefined || configuredRetryCount === "") {
    return DEFAULT_MAX_RETRIES;
  }

  const rawRetryCount = Number(configuredRetryCount);
  if (!Number.isFinite(rawRetryCount)) {
    return DEFAULT_MAX_RETRIES;
  }

  return Math.max(0, Math.min(3, Math.floor(rawRetryCount)));
}

function retryDelayFrom(input: GenerateTextJSONInput) {
  const configuredDelay = input.retryDelayMs ?? process.env.TEXT_AI_RETRY_DELAY_MS;

  if (configuredDelay === undefined || configuredDelay === "") {
    return DEFAULT_RETRY_DELAY_MS;
  }

  const rawDelay = Number(configuredDelay);
  if (!Number.isFinite(rawDelay)) {
    return DEFAULT_RETRY_DELAY_MS;
  }

  return Math.max(0, Math.min(2_000, Math.floor(rawDelay)));
}

function wait(ms: number) {
  return ms > 0
    ? new Promise((resolve) => {
        setTimeout(resolve, ms);
      })
    : Promise.resolve();
}

class TextGenerationHTTPError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "TextGenerationHTTPError";
  }
}

function isRetryableTextGenerationError(error: unknown) {
  if (error instanceof TextGenerationHTTPError) {
    return [408, 409, 429, 500, 502, 503, 504].includes(error.status);
  }

  if (!(error instanceof Error)) {
    return true;
  }

  return (
    error.name === "AbortError" ||
    error.message.includes("timed out") ||
    error.message.includes("fetch failed") ||
    error.message.includes("network") ||
    error.message.includes("returned no content") ||
    error.message.includes("returned invalid JSON")
  );
}

async function requestTextJSON(input: GenerateTextJSONInput) {
  const apiKey = configuredTextApiKey();

  if (!apiKey) {
    throw new Error("DEEPSEEK_API_KEY or OPENAI_API_KEY is required.");
  }

  const controller =
    input.timeoutMs && input.timeoutMs > 0 ? new AbortController() : null;
  const timeoutId = controller
    ? setTimeout(() => controller.abort(), input.timeoutMs)
    : null;

  try {
    const response = await fetch(`${getTextAIBaseURL()}/chat/completions`, {
      method: "POST",
      headers: {
        authorization: `Bearer ${apiKey}`,
        "content-type": "application/json",
      },
      signal: controller?.signal,
      body: JSON.stringify({
        model: input.model ?? getTextAIModel(),
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
        max_tokens: input.maxTokens ?? DEFAULT_MAX_TOKENS,
        temperature: 0.2,
      }),
    });

    let payload: {
      choices?: Array<{ message?: { content?: string } }>;
      error?: { message?: string };
    };

    try {
      payload = (await response.json()) as typeof payload;
    } catch (error) {
      throw new Error(
        `${input.schemaName} generation returned invalid response JSON.`,
        { cause: error },
      );
    }

    if (!response.ok) {
      throw new TextGenerationHTTPError(
        payload.error?.message ??
          `${input.schemaName} generation failed with status ${response.status}.`,
        response.status,
      );
    }

    const content = payload.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error(`${input.schemaName} generation returned no content.`);
    }

    try {
      return JSON.parse(extractJSONContent(content)) as unknown;
    } catch (error) {
      throw new Error(
        `${input.schemaName} generation returned invalid JSON content.`,
        { cause: error },
      );
    }
  } catch (error) {
    if (controller?.signal.aborted) {
      throw new Error(
        `${input.schemaName} generation timed out after ${input.timeoutMs}ms.`,
      );
    }

    throw error;
  } finally {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  }
}

export async function generateTextJSON(input: GenerateTextJSONInput) {
  const maxRetries = retryCountFrom(input);
  const retryDelayMs = retryDelayFrom(input);
  let lastError: unknown;

  for (let attempt = 0; attempt <= maxRetries; attempt += 1) {
    try {
      return await requestTextJSON(input);
    } catch (error) {
      lastError = error;

      if (
        attempt >= maxRetries ||
        !isRetryableTextGenerationError(error)
      ) {
        throw error;
      }

      console.warn(
        `${input.schemaName} generation failed on attempt ${attempt + 1}; retrying.`,
        error,
      );
      await wait(retryDelayMs);
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error(`${input.schemaName} generation failed.`);
}
