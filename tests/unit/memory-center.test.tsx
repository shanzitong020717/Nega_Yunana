import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { MemoryCenterView } from "@/features/memory/memory-center-view";
import type { MemoryItem } from "@/lib/validation/memory";

const memories: MemoryItem[] = [
  {
    id: "memory_1",
    scenarioPackId: "rokid-overseas-sales",
    type: "speaking_habit",
    title: "Feature-first answering pattern",
    summary:
      "The learner tends to explain product features before customer value.",
    source: "review",
    sourceCreatedAt: "2026-05-16T09:00:00.000Z",
    confidence: 0.86,
    importance: 4,
    lastUsedAt: null,
    useCount: 2,
    enabledForAi: true,
    sensitive: false,
    expiresAt: null,
    createdAt: "2026-05-16T09:00:00.000Z",
    updatedAt: "2026-05-16T09:00:00.000Z",
  },
  {
    id: "memory_2",
    scenarioPackId: "rokid-overseas-sales",
    type: "material_context",
    title: "Hospital pilot material",
    summary: "The uploaded material focuses on privacy review and pilot scope.",
    source: "material",
    sourceCreatedAt: "2026-05-15T09:00:00.000Z",
    confidence: 0.72,
    importance: 3,
    lastUsedAt: null,
    useCount: 1,
    enabledForAi: false,
    sensitive: true,
    expiresAt: null,
    createdAt: "2026-05-15T09:00:00.000Z",
    updatedAt: "2026-05-15T09:00:00.000Z",
  },
];

describe("MemoryCenterView", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("renders memory cards with filters and management controls", () => {
    render(<MemoryCenterView initialMemories={memories} />);

    expect(screen.getByRole("heading", { name: "我的记忆" })).toBeInTheDocument();
    expect(screen.getByLabelText("记忆分类")).toBeInTheDocument();
    expect(screen.getByText("Feature-first answering pattern")).toBeInTheDocument();
    expect(screen.getByText("Hospital pilot material")).toBeInTheDocument();
    expect(screen.getByText("来自复盘")).toBeInTheDocument();
    expect(screen.getByText("敏感")).toBeInTheDocument();
    expect(screen.getAllByLabelText("用于 AI 练习")).toHaveLength(2);
    expect(screen.getAllByRole("button", { name: "编辑" })).toHaveLength(2);
    expect(screen.getAllByRole("button", { name: "删除" })).toHaveLength(2);

    fireEvent.change(screen.getByLabelText("记忆分类"), {
      target: { value: "material_context" },
    });

    expect(screen.getByText("Hospital pilot material")).toBeInTheDocument();
    expect(screen.queryByText("Feature-first answering pattern")).not.toBeInTheDocument();
  });

  it("updates enabled state and deletes memories through API calls", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            memory: {
              ...memories[0],
              title: "Updated speaking pattern",
            },
          }),
          { status: 200 },
        ),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            memory: {
              ...memories[0],
              enabledForAi: false,
            },
          }),
          { status: 200 },
        ),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ deleted: true, memoryId: "memory_1" }), {
          status: 200,
        }),
      );
    vi.stubGlobal("fetch", fetchMock);

    render(<MemoryCenterView initialMemories={memories} />);

    const firstCard = screen
      .getByText("Feature-first answering pattern")
      .closest("article");
    expect(firstCard).not.toBeNull();

    fireEvent.click(within(firstCard!).getByRole("button", { name: "编辑" }));
    fireEvent.change(within(firstCard!).getByLabelText("记忆标题"), {
      target: { value: "Updated speaking pattern" },
    });
    fireEvent.click(within(firstCard!).getByRole("button", { name: "保存" }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/memories/memory_1",
        expect.objectContaining({
          method: "PATCH",
          body: expect.stringContaining("Updated speaking pattern"),
        }),
      );
    });

    fireEvent.click(within(firstCard!).getByLabelText("用于 AI 练习"));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/memories/memory_1",
        expect.objectContaining({
          method: "PATCH",
        }),
      );
    });

    fireEvent.click(within(firstCard!).getByRole("button", { name: "删除" }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/memories/memory_1",
        expect.objectContaining({
          method: "DELETE",
        }),
      );
    });
  });
});
