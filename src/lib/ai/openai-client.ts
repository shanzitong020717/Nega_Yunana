import OpenAI from "openai";

let cachedOpenAIClient:
  | { apiKey: string; baseURL?: string; client: OpenAI }
  | null = null;

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

export function normalizeOpenAIBaseURL(baseURL: string | undefined) {
  const trimmedBaseURL = baseURL?.trim() ?? "";
  const unquotedBaseURL =
    (trimmedBaseURL.startsWith('"') && trimmedBaseURL.endsWith('"')) ||
    (trimmedBaseURL.startsWith("'") && trimmedBaseURL.endsWith("'"))
      ? trimmedBaseURL.slice(1, -1).trim()
      : trimmedBaseURL;

  if (unquotedBaseURL.length === 0) {
    return undefined;
  }

  return unquotedBaseURL.replace(/\/+$/, "");
}

export function getOpenAIClient() {
  const apiKey = normalizeOpenAIApiKey(process.env.OPENAI_API_KEY);
  const baseURL = normalizeOpenAIBaseURL(process.env.OPENAI_BASE_URL);

  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is required to call OpenAI.");
  }

  if (
    !cachedOpenAIClient ||
    cachedOpenAIClient.apiKey !== apiKey ||
    cachedOpenAIClient.baseURL !== baseURL
  ) {
    cachedOpenAIClient = {
      apiKey,
      baseURL,
      client: new OpenAI({
        apiKey,
        ...(baseURL ? { baseURL } : {}),
      }),
    };
  }

  return cachedOpenAIClient.client;
}
