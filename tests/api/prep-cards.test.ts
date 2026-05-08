import { afterEach, describe, expect, it, vi } from "vitest";

import {
  GET as listPrepCards,
  POST as createPrepCard,
} from "@/app/api/prep-cards/route";

function jsonRequest(body: unknown) {
  return new Request("http://localhost/api/prep-cards", {
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

describe("prep card API", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("creates a prep card with mocked AI output and lists it", async () => {
    vi.stubEnv("AI_MOCK_MODE", "true");

    const response = await createPrepCard(
      jsonRequest({
        materialId: "material_123",
        customerType: "Enterprise buyer",
        industry: "Healthcare",
        countryOrRegion: "Singapore",
        meetingGoal: "Qualify a pilot for multilingual meetings",
        knownConcerns: ["privacy", "translation accuracy"],
        trainingFocus: ["business value", "discovery questions"],
      }),
    );

    expect(response.status).toBe(201);
    const payload = await readJson(response);
    expect(payload).toMatchObject({
      prepCard: {
        id: expect.stringMatching(/^prep_/),
        materialId: "material_123",
        customerContext: expect.stringContaining("Singapore"),
        meetingGoal: "Qualify a pilot for multilingual meetings",
        keyTalkingPoints: expect.any(Array),
        discoveryQuestions: expect.any(Array),
        likelyObjections: expect.any(Array),
        openingScript: expect.any(String),
        mustUsePhrases: expect.any(Array),
        doNotOverpromise: expect.any(Array),
      },
    });

    const listResponse = await listPrepCards();

    expect(listResponse.status).toBe(200);
    await expect(readJson(listResponse)).resolves.toMatchObject({
      prepCards: expect.arrayContaining([
        expect.objectContaining({
          id: (payload.prepCard as { id: string }).id,
        }),
      ]),
    });
  });
});
