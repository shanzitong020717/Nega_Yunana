import OpenAI from "openai";

let cachedOpenAIClient: OpenAI | null = null;

export function getOpenAIClient() {
  if (!cachedOpenAIClient) {
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      throw new Error("OPENAI_API_KEY is required to call OpenAI.");
    }

    cachedOpenAIClient = new OpenAI({ apiKey });
  }

  return cachedOpenAIClient;
}
