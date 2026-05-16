import { describe, expect, it } from "vitest";

import {
  GET as listMemories,
  POST as createMemory,
} from "@/app/api/memories/route";
import {
  DELETE as deleteMemory,
  PATCH as updateMemory,
} from "@/app/api/memories/[memoryId]/route";

function jsonRequest(body?: unknown) {
  return new Request("http://localhost/api-test", {
    method: body === undefined ? "GET" : "POST",
    body: body === undefined ? undefined : JSON.stringify(body),
    headers:
      body === undefined
        ? undefined
        : {
            "content-type": "application/json",
          },
  });
}

async function readJson(response: Response) {
  return response.json() as Promise<Record<string, unknown>>;
}

function routeContext(memoryId: string) {
  return {
    params: Promise.resolve({
      memoryId,
    }),
  };
}

describe("memories API", () => {
  it("lists, creates, updates, and deletes memory items", async () => {
    const listResponse = await listMemories();
    expect(listResponse.status).toBe(200);
    await expect(readJson(listResponse)).resolves.toMatchObject({
      memories: expect.any(Array),
    });

    const createResponse = await createMemory(
      jsonRequest({
        type: "speaking_habit",
        title: "Feature-first answering pattern",
        summary:
          "The learner tends to explain product features before customer value.",
        source: "review",
        confidence: 0.86,
        importance: 4,
        sensitive: false,
      }),
    );
    expect(createResponse.status).toBe(201);
    const createPayload = await readJson(createResponse);
    const memory = createPayload.memory as { id: string };
    expect(createPayload).toMatchObject({
      memory: {
        id: expect.stringMatching(/^memory_/),
        scenarioPackId: "rokid-overseas-sales",
        type: "speaking_habit",
        title: "Feature-first answering pattern",
        enabledForAi: true,
        useCount: 0,
      },
    });

    const patchResponse = await updateMemory(
      jsonRequest({
        enabledForAi: false,
      }),
      routeContext(memory.id),
    );
    expect(patchResponse.status).toBe(200);
    await expect(readJson(patchResponse)).resolves.toMatchObject({
      memory: {
        id: memory.id,
        enabledForAi: false,
      },
    });

    const deleteResponse = await deleteMemory(jsonRequest(), routeContext(memory.id));
    expect(deleteResponse.status).toBe(200);
    await expect(readJson(deleteResponse)).resolves.toMatchObject({
      deleted: true,
      memoryId: memory.id,
    });
  });

  it("returns a Chinese validation error for invalid memory input", async () => {
    const response = await createMemory(
      jsonRequest({
        type: "unknown",
        title: "",
        summary: "",
        source: "review",
      }),
    );

    expect(response.status).toBe(400);
    await expect(readJson(response)).resolves.toMatchObject({
      error: {
        code: "VALIDATION_ERROR",
        message: expect.any(String),
      },
    });
  });
});
