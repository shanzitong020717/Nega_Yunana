import { afterEach, describe, expect, it, vi } from "vitest";

import { POST as translateSubtitle } from "@/app/api/subtitle-translation/route";

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
    vi.unstubAllEnvs();
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
});
