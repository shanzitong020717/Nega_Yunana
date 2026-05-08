import OpenAI from "openai";

let cachedOpenAIClient: { apiKey: string; client: OpenAI } | null = null;

export function normalizeOpenAIApiKey(apiKey: string | undefined) {
  const trimmedApiKey = apiKey?.trim() ?? "";
  const unquotedApiKey =
    (trimmedApiKey.startsWith('"') && trimmedApiKey.endsWith('"')) ||
    (trimmedApiKey.startsWith("'") && trimmedApiKey.endsWith("'"))
      ? trimmedApiKey.slice(1, -1).trim()
      : trimmedApiKey;

  return unquotedApiKey.length > 0 ? unquotedApiKey : undefined;
}

export function hasOpenAIApiKey() {
  return Boolean(normalizeOpenAIApiKey(process.env.OPENAI_API_KEY));
}

export function getOpenAIClient() {
  const apiKey = normalizeOpenAIApiKey(process.env.OPENAI_API_KEY);

  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is required to call OpenAI.");
  }

  if (!cachedOpenAIClient || cachedOpenAIClient.apiKey !== apiKey) {
    cachedOpenAIClient = {
      apiKey,
      client: new OpenAI({ apiKey }),
    };
  }

  return cachedOpenAIClient.client;
}
