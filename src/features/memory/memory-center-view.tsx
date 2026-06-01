"use client";

import { Edit3, Filter, Save, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";

import { PageHeader } from "@/components/page-header";
import { StatusPill } from "@/components/status-pill";
import {
  memoryTypes,
  type MemoryItem,
  type MemoryType,
} from "@/lib/validation/memory";

type MemoryCenterViewProps = {
  initialMemories: MemoryItem[];
};

type CategoryFilter = "all" | MemoryType;

const typeLabels: Record<CategoryFilter, string> = {
  all: "全部记忆",
  profile: "用户画像",
  speaking_habit: "说话习惯",
  weakness: "长期弱点",
  material_context: "材料上下文",
  customer_context: "客户上下文",
  phrase_preference: "表达偏好",
  learning_preference: "学习偏好",
};

const sourceLabels: Record<MemoryItem["source"], string> = {
  review: "来自复盘",
  material: "来自材料",
  manual: "手动添加",
  system: "系统生成",
};

function sensitivityLabel(memory: MemoryItem) {
  return memory.sensitive ? "敏感" : "低敏感";
}

export function MemoryCenterView({ initialMemories }: MemoryCenterViewProps) {
  const [memories, setMemories] = useState(initialMemories);
  const [category, setCategory] = useState<CategoryFilter>("all");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const filteredMemories = useMemo(
    () =>
      memories.filter(
        (memory) => category === "all" || memory.type === category,
      ),
    [category, memories],
  );

  async function updateEnabled(memory: MemoryItem, enabledForAi: boolean) {
    setStatusMessage(null);

    try {
      const response = await fetch(`/api/memories/${memory.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          enabledForAi,
        }),
      });

      if (!response.ok) {
        throw new Error("更新失败");
      }

      const payload = (await response.json()) as { memory: MemoryItem };
      setMemories((currentMemories) =>
        currentMemories.map((item) =>
          item.id === memory.id ? payload.memory : item,
        ),
      );
      setStatusMessage("记忆设置已更新。");
    } catch {
      setStatusMessage("记忆设置更新失败。");
    }
  }

  async function deleteMemory(memory: MemoryItem) {
    setStatusMessage(null);

    try {
      const response = await fetch(`/api/memories/${memory.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("删除失败");
      }

      setMemories((currentMemories) =>
        currentMemories.filter((item) => item.id !== memory.id),
      );
      setStatusMessage("记忆已删除。");
    } catch {
      setStatusMessage("记忆删除失败。");
    }
  }

  async function saveMemoryEdits(memory: MemoryItem, formData: FormData) {
    setStatusMessage(null);

    try {
      const response = await fetch(`/api/memories/${memory.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: String(formData.get("title") ?? ""),
          summary: String(formData.get("summary") ?? ""),
        }),
      });

      if (!response.ok) {
        throw new Error("保存失败");
      }

      const payload = (await response.json()) as { memory: MemoryItem };
      setMemories((currentMemories) =>
        currentMemories.map((item) =>
          item.id === memory.id ? payload.memory : item,
        ),
      );
      setEditingId(null);
      setStatusMessage("记忆已更新。");
    } catch {
      setStatusMessage("记忆更新失败。");
    }
  }

  return (
    <>
      <PageHeader
        eyebrow="记忆中心"
        title="我的记忆"
        description="管理 AI 可以长期参考的材料、说话习惯、弱点和学习偏好。"
      />

      <section className="rounded-md border border-[var(--border)] bg-[var(--surface)] p-4">
        <div className="flex items-center gap-2">
          <Filter className="h-5 w-5 text-[var(--primary)]" aria-hidden="true" />
          <h2 className="text-base font-semibold">筛选记忆</h2>
        </div>
        <label
          className="mt-4 flex max-w-sm flex-col gap-2 text-sm font-medium"
          htmlFor="memory-type"
        >
          记忆分类
          <select
            id="memory-type"
            value={category}
            onChange={(event) => setCategory(event.target.value as CategoryFilter)}
            className="min-h-11 rounded-md border border-[var(--border)] bg-white px-3 text-sm outline-none transition focus:border-[var(--primary)]"
          >
            <option value="all">{typeLabels.all}</option>
            {memoryTypes.map((type) => (
              <option key={type} value={type}>
                {typeLabels[type]}
              </option>
            ))}
          </select>
        </label>
      </section>

      <section className="grid gap-4">
        {filteredMemories.length > 0 ? (
          filteredMemories.map((memory) => (
            <article
              key={memory.id}
              className="rounded-md border border-[var(--border)] bg-[var(--surface)] p-5"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex flex-wrap gap-2">
                    <StatusPill tone="primary">{typeLabels[memory.type]}</StatusPill>
                    <StatusPill tone="neutral">{sourceLabels[memory.source]}</StatusPill>
                    <StatusPill tone={memory.sensitive ? "warning" : "success"}>
                      {sensitivityLabel(memory)}
                    </StatusPill>
                  </div>
                  <h2 className="mt-3 text-lg font-semibold">{memory.title}</h2>
                  <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                    {memory.summary}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <label className="inline-flex min-h-11 items-center gap-2 rounded-md border border-[var(--border)] px-3 text-sm font-medium">
                    <input
                      type="checkbox"
                      aria-label="用于 AI 练习"
                      checked={memory.enabledForAi}
                      onChange={(event) => {
                        void updateEnabled(memory, event.target.checked);
                      }}
                    />
                    用于 AI 练习
                  </label>
                  <button
                    type="button"
                    onClick={() =>
                      setEditingId((current) =>
                        current === memory.id ? null : memory.id,
                      )
                    }
                    className="inline-flex min-h-11 items-center gap-2 rounded-md border border-[var(--border)] px-3 text-sm font-medium transition hover:border-[var(--primary)]"
                  >
                    <Edit3 className="h-4 w-4" aria-hidden="true" />
                    编辑
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      void deleteMemory(memory);
                    }}
                    className="inline-flex min-h-11 items-center gap-2 rounded-md border border-[#f3b8b2] px-3 text-sm font-medium text-[var(--danger)] transition hover:bg-[#fff0ee]"
                  >
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                    删除
                  </button>
                </div>
              </div>

              {editingId === memory.id ? (
                <form
                  className="mt-4 grid gap-3 md:grid-cols-[1fr_1fr_auto]"
                  onSubmit={(event) => {
                    event.preventDefault();
                    void saveMemoryEdits(memory, new FormData(event.currentTarget));
                  }}
                >
                  <label className="flex flex-col gap-2 text-sm font-medium">
                    记忆标题
                    <input
                      name="title"
                      defaultValue={memory.title}
                      className="min-h-11 rounded-md border border-[var(--border)] px-3 text-sm"
                    />
                  </label>
                  <label className="flex flex-col gap-2 text-sm font-medium">
                    记忆摘要
                    <input
                      name="summary"
                      defaultValue={memory.summary}
                      className="min-h-11 rounded-md border border-[var(--border)] px-3 text-sm"
                    />
                  </label>
                  <button
                    type="submit"
                    className="inline-flex min-h-11 items-center justify-center gap-2 self-end rounded-md border border-[var(--border)] px-3 text-sm font-medium"
                  >
                    <Save className="h-4 w-4" aria-hidden="true" />
                    保存
                  </button>
                </form>
              ) : null}
            </article>
          ))
        ) : (
          <div className="rounded-md border border-dashed border-[var(--border)] bg-[var(--surface)] p-8 text-center">
            <h2 className="text-lg font-semibold">没有匹配的记忆</h2>
            <p className="mt-2 text-sm text-[var(--muted)]">
              切换分类或从复盘、材料中保存新的记忆。
            </p>
          </div>
        )}
      </section>

      {statusMessage ? (
        <p className="rounded-md border border-[var(--border)] bg-[var(--surface-subtle)] px-3 py-2 text-sm font-medium text-[var(--foreground)]">
          {statusMessage}
        </p>
      ) : null}
    </>
  );
}
