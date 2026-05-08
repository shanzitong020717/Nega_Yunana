import { mkdtemp, readdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { DELETE as deleteMaterial } from "@/app/api/materials/[materialId]/route";
import { POST as uploadMaterial } from "@/app/api/materials/route";
import { DELETE as deletePracticeSession } from "@/app/api/practice-sessions/[sessionId]/route";
import { POST as createPracticeSession } from "@/app/api/practice-sessions/route";
import {
  DELETE as deleteReview,
  POST as createReview,
} from "@/app/api/practice-sessions/[sessionId]/review/route";
import {
  DELETE as deleteTranscript,
  POST as saveTranscript,
} from "@/app/api/practice-sessions/[sessionId]/transcript/route";
import {
  getMaterialRecord,
  listMaterialRecords,
} from "@/lib/materials/material-store";
import {
  getPracticeSessionRecord,
  getReviewBySessionId,
  getTranscriptTurns,
} from "@/lib/practice/practice-session-store";
import type { PracticeReviewPayload } from "@/lib/validation/reviews";

let uploadDir: string;

function multipartRequest(formData: FormData) {
  return {
    formData: async () => formData,
  } as Request;
}

function jsonRequest(body?: unknown) {
  return new Request("http://localhost/api-test", {
    method: body === undefined ? "DELETE" : "POST",
    body: body === undefined ? undefined : JSON.stringify(body),
    headers:
      body === undefined
        ? undefined
        : {
            "content-type": "application/json",
          },
  });
}

function materialContext(materialId: string) {
  return {
    params: Promise.resolve({
      materialId,
    }),
  };
}

function sessionContext(sessionId: string) {
  return {
    params: Promise.resolve({
      sessionId,
    }),
  };
}

function validUploadForm() {
  const formData = new FormData();
  formData.set("file", new File(["Rokid private notes"], "private-notes.txt", { type: "text/plain" }));
  formData.set("name", "Rokid private notes");
  formData.set("customerType", "Enterprise buyer");
  formData.set("meetingGoal", "Qualify a pilot");
  return formData;
}

async function readJson(response: Response) {
  return response.json() as Promise<Record<string, unknown>>;
}

const reviewPayload: PracticeReviewPayload = {
  meetingOutcome: {
    summary: "The customer understood the value.",
    customerReaction: "Interested.",
    nextStep: "Book a pilot discussion.",
  },
  scores: {
    clarity: { score: 4, rationale: "Clear." },
    businessConfidence: { score: 4, rationale: "Confident." },
    discoverySkill: { score: 3, rationale: "Some discovery." },
    productPositioning: { score: 4, rationale: "Good positioning." },
    objectionHandling: { score: 3, rationale: "Safe answer." },
    englishNaturalness: { score: 3, rationale: "Understandable." },
  },
  topImprovements: ["Ask one more discovery question."],
  bestMoments: ["Kept the answer safe."],
  sentenceUpgrades: [],
  materialCoverage: {
    covered: ["Real-time translated captions"],
    missed: [],
    unclear: [],
  },
  phrasebookSuggestions: [],
  weaknessUpdates: [],
  nextSessionRecommendation: {
    focus: "privacy",
    drill: "Technical buyer Q&A.",
    prompt: "Explain data handling safely.",
  },
};

async function createSessionWithTranscriptAndReview(materialId?: string) {
  const sessionResponse = await createPracticeSession(
    jsonRequest({
      mode: "customer_qa",
      personaId: "technical_lead",
      materialId,
      difficulty: "normal",
      trainingFocus: ["privacy"],
    }),
  );
  const sessionPayload = await readJson(sessionResponse);
  const sessionId = (
    sessionPayload.practiceSession as {
      id: string;
    }
  ).id;

  await saveTranscript(
    jsonRequest({
      turns: [
        {
          speaker: "user",
          text: "We can review data handling with your IT team.",
          timestamp: 0,
        },
      ],
    }),
    sessionContext(sessionId),
  );
  await createReview(jsonRequest(reviewPayload), sessionContext(sessionId));

  return sessionId;
}

describe("privacy deletion APIs", () => {
  beforeEach(async () => {
    uploadDir = await mkdtemp(join(tmpdir(), "rokid-privacy-"));
    vi.stubEnv("UPLOAD_DIR", uploadDir);
  });

  afterEach(async () => {
    vi.unstubAllEnvs();
    await rm(uploadDir, { force: true, recursive: true });
  });

  it("deletes a material, its stored file, and connected practice records", async () => {
    const uploadResponse = await uploadMaterial(multipartRequest(validUploadForm()));
    const uploadPayload = await readJson(uploadResponse);
    const materialId = uploadPayload.materialId as string;
    const sessionId = await createSessionWithTranscriptAndReview(materialId);

    expect(await readdir(uploadDir)).toHaveLength(1);

    const response = await deleteMaterial(jsonRequest(), materialContext(materialId));

    expect(response.status).toBe(200);
    await expect(readJson(response)).resolves.toMatchObject({
      materialId,
      deleted: true,
      deletedPracticeSessions: [sessionId],
    });
    expect(await readdir(uploadDir)).toHaveLength(0);
    expect(getMaterialRecord(materialId)).toBeNull();
    expect(listMaterialRecords().some((material) => material.id === materialId)).toBe(false);
    expect(getPracticeSessionRecord(sessionId)).toBeNull();
    expect(getTranscriptTurns(sessionId)).toEqual([]);
    expect(getReviewBySessionId(sessionId)).toBeNull();
  });

  it("deletes transcript, review, and practice session records by session id", async () => {
    const sessionId = await createSessionWithTranscriptAndReview();

    const transcriptResponse = await deleteTranscript(jsonRequest(), sessionContext(sessionId));
    expect(transcriptResponse.status).toBe(200);
    expect(getTranscriptTurns(sessionId)).toEqual([]);
    expect(getPracticeSessionRecord(sessionId)).not.toBeNull();

    const reviewResponse = await deleteReview(jsonRequest(), sessionContext(sessionId));
    expect(reviewResponse.status).toBe(200);
    expect(getReviewBySessionId(sessionId)).toBeNull();
    expect(getPracticeSessionRecord(sessionId)).not.toBeNull();

    const sessionResponse = await deletePracticeSession(jsonRequest(), sessionContext(sessionId));
    expect(sessionResponse.status).toBe(200);
    expect(getPracticeSessionRecord(sessionId)).toBeNull();
  });
});
