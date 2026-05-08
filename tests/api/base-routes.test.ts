import { describe, expect, it } from "vitest";

import { POST as createPhrase } from "@/app/api/phrasebook/route";
import {
  GET as listPracticeSessions,
  POST as createPracticeSession,
} from "@/app/api/practice-sessions/route";
import { GET as listWeaknesses } from "@/app/api/weaknesses/route";

function jsonRequest(body: unknown) {
  return new Request("http://localhost/api-test", {
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

describe("base API route handlers", () => {
  it("creates a mock practice session for valid input", async () => {
    const response = await createPracticeSession(
      jsonRequest({
        mode: "customer_qa",
        personaId: "technical_lead",
        difficulty: "normal",
        trainingFocus: ["business_value"],
      }),
    );

    expect(response.status).toBe(201);
    await expect(readJson(response)).resolves.toMatchObject({
      practiceSession: {
        mode: "customer_qa",
        personaId: "technical_lead",
        status: "created",
      },
    });
  });

  it("returns consistent validation errors", async () => {
    const response = await createPracticeSession(
      jsonRequest({
        mode: "customer_qa",
        personaId: "random_customer",
      }),
    );

    expect(response.status).toBe(400);
    await expect(readJson(response)).resolves.toEqual({
      error: {
        code: "VALIDATION_ERROR",
        message: "Invalid customer persona",
      },
    });
  });

  it("lists practice sessions with a stable response shape", async () => {
    const response = await listPracticeSessions();

    expect(response.status).toBe(200);
    await expect(readJson(response)).resolves.toMatchObject({
      practiceSessions: expect.any(Array),
    });
  });

  it("creates a phrasebook item for valid input", async () => {
    const english = `The key value is reducing communication friction in real time ${crypto.randomUUID()}.`;
    const response = await createPhrase(
      jsonRequest({
        category: "Business Value",
        english,
        chinese: "核心价值是实时降低沟通阻力。",
        useCase: "Explaining Rokid business value.",
        tags: ["business-value"],
      }),
    );

    expect(response.status).toBe(201);
    await expect(readJson(response)).resolves.toMatchObject({
      phrase: {
        category: "Business Value",
        source: "user_added",
      },
    });
  });

  it("rejects invalid phrasebook input", async () => {
    const response = await createPhrase(
      jsonRequest({
        category: "Business Value",
        english: "",
        chinese: "核心价值是实时降低沟通阻力。",
        useCase: "Explaining Rokid business value.",
      }),
    );

    expect(response.status).toBe(400);
    await expect(readJson(response)).resolves.toEqual({
      error: {
        code: "VALIDATION_ERROR",
        message: "English sentence is required",
      },
    });
  });

  it("lists weaknesses with a stable response shape", async () => {
    const response = await listWeaknesses();

    expect(response.status).toBe(200);
    await expect(readJson(response)).resolves.toMatchObject({
      weaknesses: expect.any(Array),
    });
  });
});
