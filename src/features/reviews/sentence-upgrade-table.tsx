"use client";

import { useState } from "react";
import { BookmarkPlus } from "lucide-react";

import type { PracticeReviewPayload } from "@/lib/validation/reviews";

type SentenceUpgradeTableProps = {
  upgrades: PracticeReviewPayload["sentenceUpgrades"];
};

type SaveState = "idle" | "saving" | "saved" | "error";

export function SentenceUpgradeTable({ upgrades }: SentenceUpgradeTableProps) {
  const [saveStates, setSaveStates] = useState<Record<string, SaveState>>({});

  async function saveUpgrade(upgrade: PracticeReviewPayload["sentenceUpgrades"][number]) {
    const key = `${upgrade.original}-${upgrade.naturalEnglish}`;

    setSaveStates((currentStates) => ({
      ...currentStates,
      [key]: "saving",
    }));

    try {
      const response = await fetch("/api/phrasebook", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          category: "Business Value",
          english: upgrade.naturalEnglish,
          chinese: upgrade.chineseExplanation,
          useCase: upgrade.practicePrompt,
          simpleVersion: upgrade.original,
          professionalVersion: upgrade.naturalEnglish,
          tags: ["review", "sentence-upgrade"],
          source: "review",
          masteryStatus: "needs_practice",
        }),
      });

      if (!response.ok) {
        throw new Error("保存表达失败。");
      }

      setSaveStates((currentStates) => ({
        ...currentStates,
        [key]: "saved",
      }));
    } catch {
      setSaveStates((currentStates) => ({
        ...currentStates,
        [key]: "error",
      }));
    }
  }

  return (
    <div className="overflow-x-auto rounded-md border border-[var(--border)]">
      <table className="min-w-[52rem] w-full border-collapse text-left text-sm">
        <thead className="bg-[var(--surface-subtle)] text-xs font-semibold uppercase text-[var(--muted)]">
          <tr>
            <th className="border-b border-[var(--border)] px-3 py-3">原句</th>
            <th className="border-b border-[var(--border)] px-3 py-3">
              自然商务英语
            </th>
            <th className="border-b border-[var(--border)] px-3 py-3">中文解释</th>
            <th className="border-b border-[var(--border)] px-3 py-3">
              练习提示
            </th>
            <th className="border-b border-[var(--border)] px-3 py-3">
              保存到表达库
            </th>
          </tr>
        </thead>
        <tbody>
          {upgrades.map((upgrade) => {
            const key = `${upgrade.original}-${upgrade.naturalEnglish}`;
            const saveState = saveStates[key] ?? "idle";

            return (
              <tr key={key}>
                <td className="align-top border-b border-[var(--border)] px-3 py-3 text-[var(--muted)]">
                  {upgrade.original}
                </td>
                <td className="align-top border-b border-[var(--border)] px-3 py-3 font-medium text-[var(--foreground)]">
                  {upgrade.naturalEnglish}
                </td>
                <td className="align-top border-b border-[var(--border)] px-3 py-3 text-[var(--muted)]">
                  {upgrade.chineseExplanation}
                </td>
                <td className="align-top border-b border-[var(--border)] px-3 py-3 text-[var(--muted)]">
                  {upgrade.practicePrompt}
                </td>
                <td className="align-top border-b border-[var(--border)] px-3 py-3">
                  <button
                    type="button"
                    disabled={saveState === "saving" || saveState === "saved"}
                    onClick={() => {
                      void saveUpgrade(upgrade);
                    }}
                    className="inline-flex min-h-10 items-center gap-2 rounded-md border border-[var(--border)] px-3 text-sm font-medium transition hover:border-[var(--primary)] disabled:cursor-not-allowed disabled:bg-[var(--surface-subtle)] disabled:text-[var(--muted)]"
                  >
                    <BookmarkPlus className="h-4 w-4" aria-hidden="true" />
                    {saveState === "saving"
                      ? "保存中..."
                      : saveState === "saved"
                        ? "已保存"
                        : saveState === "error"
                          ? "重试保存"
                          : "保存到表达库"}
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
