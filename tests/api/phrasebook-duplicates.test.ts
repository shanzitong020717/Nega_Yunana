import { describe, expect, it } from "vitest";

import {
  GET as listPhrases,
  POST as createPhrase,
} from "@/app/api/phrasebook/route";

function jsonRequest(body: unknown) {
  return new Request("http://localhost/api/phrasebook", {
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

describe("phrasebook duplicate handling", () => {
  it("returns the existing review phrase instead of saving a duplicate", async () => {
    const english = `Review phrase ${crypto.randomUUID()} reduces communication friction.`;
    const phraseInput = {
      category: "产品应用场景",
      english,
      chinese: "这句话用于解释客户价值。",
      useCase: "Saved from review sentence upgrade.",
      simpleVersion: "It reduces communication friction.",
      professionalVersion: english,
      relatedProductPoint: "Real-time translated captions",
      relatedObjection: "Why not use a phone app?",
      tags: ["review", "business-value"],
      source: "review",
    };

    const firstResponse = await createPhrase(jsonRequest(phraseInput));
    expect(firstResponse.status).toBe(201);
    await expect(readJson(firstResponse)).resolves.toMatchObject({
      phrase: {
        category: "产品应用场景",
        masteryStatus: "needs_practice",
      },
    });

    const duplicateResponse = await createPhrase(jsonRequest(phraseInput));
    expect(duplicateResponse.status).toBe(200);
    await expect(readJson(duplicateResponse)).resolves.toMatchObject({
      status: "duplicate",
      phrase: {
        english,
        source: "review",
      },
    });

    const listResponse = await listPhrases();
    const payload = await readJson(listResponse);
    const matches = (payload.phrases as Array<{ english: string }>).filter(
      (phrase) => phrase.english === english,
    );

    expect(matches).toHaveLength(1);
  });
});
