import { afterEach, describe, expect, it, vi } from "vitest";

import {
  POST as translateSubtitle,
  preferredRegion as subtitleTranslationPreferredRegion,
  runtime as subtitleTranslationRuntime,
} from "@/app/api/subtitle-translation/route";

function jsonRequest(body: unknown) {
  return new Request("http://localhost/api/subtitle-translation", {
    method: "POST",
    body: JSON.stringify(body),
    headers: {
      "content-type": "application/json",
    },
  });
}

async function readJson(response: Response) {
  return response.json() as Promise<Record<string, unknown>>;
}

describe("subtitle translation API", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("translates an AI customer subtitle into Chinese in mock mode", async () => {
    vi.stubEnv("AI_MOCK_MODE", "true");

    const response = await translateSubtitle(
      jsonRequest({
        speaker: "ai_customer",
        text: "Yes, I can.",
      }),
    );

    expect(response.status).toBe(201);
    await expect(readJson(response)).resolves.toEqual({
      translationZh: "是的，我可以。",
    });
  });

  it("prefers Asia Vercel regions to reduce subtitle translation latency", () => {
    expect(subtitleTranslationPreferredRegion).toEqual(["hkg1", "sin1"]);
  });

  it("runs subtitle translation on the Edge runtime for lower request overhead", () => {
    expect(subtitleTranslationRuntime).toBe("edge");
  });

  it("rejects empty subtitle text", async () => {
    const response = await translateSubtitle(
      jsonRequest({
        speaker: "ai_customer",
        text: "",
      }),
    );

    expect(response.status).toBe(400);
    await expect(readJson(response)).resolves.toEqual({
      error: {
        code: "VALIDATION_ERROR",
        message: "字幕内容不能为空",
      },
    });
  });

  it("uses DeepSeek v4 Flash for subtitle translation without changing the global text model", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("AI_MOCK_MODE", "false");
    vi.stubEnv("SUBTITLE_TRANSLATION_PROVIDER", "deepseek");
    vi.stubEnv("SUBTITLE_DEEPSEEK_MODEL", "deepseek-v4-flash");
    vi.stubEnv("DEEPSEEK_TEXT_MODEL", "deepseek-v4-pro");
    vi.stubEnv("DEEPSEEK_API_KEY", "deepseek-secret");
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          choices: [
            {
              message: {
                content: "你可以先明确产品应用场景吗？",
              },
            },
          ],
        }),
        { status: 200 },
      ),
    );
    vi.stubGlobal("fetch", fetchMock);

    const response = await translateSubtitle(
      jsonRequest({
        speaker: "ai_customer",
        text: "Could you define the product use case first?",
      }),
    );

    expect(response.status).toBe(201);
    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.deepseek.com/chat/completions",
      expect.objectContaining({
        method: "POST",
      }),
    );
    const [, requestInit] = fetchMock.mock.calls[0];
    const requestBody = JSON.parse(String(requestInit.body)) as {
      messages: Array<{ content: string; role: string }>;
      model: string;
      max_tokens: number;
      response_format?: unknown;
    };

    expect(requestBody.model).toBe("deepseek-v4-flash");
    expect(requestBody.max_tokens).toBeLessThanOrEqual(384);
    expect(requestBody.response_format).toBeUndefined();
    expect(requestBody.messages[0]?.content.length).toBeLessThan(240);
    expect(requestBody.messages[1]?.content.length).toBeLessThan(260);
    await expect(readJson(response)).resolves.toEqual({
      translationZh: "你可以先明确产品应用场景吗？",
    });
  });

  it("caches identical DeepSeek subtitle translations to avoid repeated model calls", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("AI_MOCK_MODE", "false");
    vi.stubEnv("SUBTITLE_TRANSLATION_PROVIDER", "deepseek");
    vi.stubEnv("SUBTITLE_DEEPSEEK_MODEL", "deepseek-v4-flash");
    vi.stubEnv("DEEPSEEK_API_KEY", "deepseek-secret");
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          choices: [
            {
              message: {
                content: "你们会如何衡量试点是否成功？",
              },
            },
          ],
        }),
        { status: 200 },
      ),
    );
    vi.stubGlobal("fetch", fetchMock);
    const request = {
      speaker: "ai_customer",
      text: "How would you measure success in a pilot?",
    };

    const firstResponse = await translateSubtitle(jsonRequest(request));
    const secondResponse = await translateSubtitle(jsonRequest(request));

    expect(firstResponse.status).toBe(201);
    expect(secondResponse.status).toBe(201);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    await expect(readJson(secondResponse)).resolves.toEqual({
      translationZh: "你们会如何衡量试点是否成功？",
    });
  });

  it("uses Gemini Flash for fast subtitle translation when configured", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("AI_MOCK_MODE", "false");
    vi.stubEnv("SUBTITLE_TRANSLATION_PROVIDER", "gemini_flash");
    vi.stubEnv("GEMINI_API_KEY", "gemini-secret");
    vi.stubEnv("GEMINI_FLASH_TEXT_MODEL", "gemini-flash-test");
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          candidates: [
            {
              content: {
                parts: [
                  {
                    text: "你可以先明确产品应用场景吗？",
                  },
                ],
              },
            },
          ],
        }),
        { status: 200 },
      ),
    );
    vi.stubGlobal("fetch", fetchMock);

    const response = await translateSubtitle(
      jsonRequest({
        speaker: "ai_customer",
        text: "Could you define the product use case first?",
      }),
    );

    expect(response.status).toBe(201);
    expect(fetchMock).toHaveBeenCalledWith(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-test:generateContent?key=gemini-secret",
      expect.objectContaining({
        method: "POST",
      }),
    );
    const [, requestInit] = fetchMock.mock.calls[0];
    const requestBody = JSON.parse(String(requestInit.body)) as {
      contents: Array<{ parts: Array<{ text: string }> }>;
      generationConfig: { maxOutputTokens: number };
    };

    expect(requestBody.generationConfig.maxOutputTokens).toBeGreaterThanOrEqual(384);
    expect(requestBody.contents[0]?.parts[0]?.text).toContain(
      "Translate the complete sentence",
    );
    expect(requestBody.contents[0]?.parts[0]?.text).toContain(
      "Do not summarize, shorten, omit, or paraphrase away details",
    );
    await expect(readJson(response)).resolves.toEqual({
      translationZh: "你可以先明确产品应用场景吗？",
    });
  });

  it("parses Gemini JSON translations so long subtitles can remain complete", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("AI_MOCK_MODE", "false");
    vi.stubEnv("SUBTITLE_TRANSLATION_PROVIDER", "gemini_flash");
    vi.stubEnv("GEMINI_API_KEY", "gemini-secret");
    const longSubtitle =
      "Before we decide whether Rokid is a good fit, I need to understand the exact use case, the expected meeting workflow, how the captions are displayed, and what data is stored after the call.";
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          candidates: [
            {
              content: {
                parts: [
                  {
                    text: JSON.stringify({
                      translationZh:
                        "在我们决定 Rokid 是否适合之前，我需要了解具体的使用场景、预期的会议流程、字幕如何显示，以及通话结束后会存储哪些数据。",
                    }),
                  },
                ],
              },
            },
          ],
        }),
        { status: 200 },
      ),
    );
    vi.stubGlobal("fetch", fetchMock);

    const response = await translateSubtitle(
      jsonRequest({
        speaker: "ai_customer",
        text: longSubtitle,
      }),
    );

    expect(response.status).toBe(201);
    await expect(readJson(response)).resolves.toEqual({
      translationZh:
        "在我们决定 Rokid 是否适合之前，我需要了解具体的使用场景、预期的会议流程、字幕如何显示，以及通话结束后会存储哪些数据。",
    });
  });

  it("falls back instead of returning malformed Gemini JSON fragments", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("AI_MOCK_MODE", "false");
    vi.stubEnv("SUBTITLE_TRANSLATION_PROVIDER", "gemini_flash");
    vi.stubEnv("GEMINI_API_KEY", "gemini-secret");
    vi.stubEnv("DEEPSEEK_API_KEY", "deepseek-secret");
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            candidates: [
              {
                content: {
                  parts: [
                    {
                      text: '{ "translationZh":',
                    },
                  ],
                },
              },
            ],
          }),
          { status: 200 },
        ),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            choices: [
              {
                message: {
                  content: JSON.stringify({
                    translationZh:
                      "我理解你可能想聊其他话题，但我在这里的角色是作为关注你们技术的商务客户。",
                  }),
                },
              },
            ],
          }),
          { status: 200 },
        ),
      );
    vi.stubGlobal("fetch", fetchMock);

    const response = await translateSubtitle(
      jsonRequest({
        speaker: "ai_customer",
        text: "I understand you might want to chat about something different, but my role here is to act as a business customer focused on your technology.",
      }),
    );

    expect(response.status).toBe(201);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    await expect(readJson(response)).resolves.toEqual({
      translationZh:
        "我理解你可能想聊其他话题，但我在这里的角色是作为关注你们技术的商务客户。",
    });
  });

  it("falls back when Gemini returns an incomplete multi-sentence translation", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("AI_MOCK_MODE", "false");
    vi.stubEnv("SUBTITLE_TRANSLATION_PROVIDER", "gemini_flash");
    vi.stubEnv("GEMINI_API_KEY", "gemini-secret");
    vi.stubEnv("DEEPSEEK_API_KEY", "deepseek-secret");
    const sourceText =
      "I've been reviewing your specifications. My core concern is around data integrity. Can you detail how data is encrypted both at rest and in transit when interacting with our existing systems?";
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            candidates: [
              {
                content: {
                  parts: [
                    {
                      text: "我一直在审阅你们的规格说明书。我最核心的顾虑是数据完整性",
                    },
                  ],
                },
              },
            ],
          }),
          { status: 200 },
        ),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            choices: [
              {
                message: {
                  content: JSON.stringify({
                    translationZh:
                      "我一直在审阅你们的规格说明书。我的核心顾虑是数据完整性。你能详细说明在与我们现有系统交互时，数据在静态存储和传输过程中是如何加密的吗？",
                  }),
                },
              },
            ],
          }),
          { status: 200 },
        ),
      );
    vi.stubGlobal("fetch", fetchMock);

    const response = await translateSubtitle(
      jsonRequest({
        speaker: "ai_customer",
        text: sourceText,
      }),
    );

    expect(response.status).toBe(201);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    await expect(readJson(response)).resolves.toEqual({
      translationZh:
        "我一直在审阅你们的规格说明书。我的核心顾虑是数据完整性。你能详细说明在与我们现有系统交互时，数据在静态存储和传输过程中是如何加密的吗？",
    });
  });
});
