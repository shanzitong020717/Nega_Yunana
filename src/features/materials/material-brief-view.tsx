import { BookOpenCheck, ClipboardList, PlayCircle } from "lucide-react";

import { StatusPill } from "@/components/status-pill";
import type {
  MaterialBriefPayload,
  MaterialMemoryStatus,
} from "@/lib/validation/materials";

export type MaterialBrief = MaterialBriefPayload;

type MaterialBriefViewProps = {
  brief?: MaterialBrief | null;
  status?: string;
  selectedMaterialId?: string | null;
  onCreatePrepCard?: (materialId: string) => void;
  onStartPractice?: (materialId: string) => void;
  actionStatus?: string | null;
};

const fallbackItems = [
  "材料摘要",
  "客户可能追问",
  "产品应用场景",
  "产品优点",
  "适配边界",
  "竞品差异",
  "产品参数",
  "表达和风险",
] as const;

const memoryStatusLabels: Record<MaterialMemoryStatus, string> = {
  session_only: "仅本次使用",
  available_for_future: "可用于后续练习",
  saved_to_memory: "已加入长期记忆",
  confidential: "保密材料",
};

function briefStatusLabel(status: string) {
  const labels: Record<string, string> = {
    waiting: "等待中",
    generating: "生成中",
    ready: "已就绪",
    failed: "失败",
    processing_not_supported_yet: "暂不支持解析",
  };

  return labels[status] ?? status;
}

function BriefSection({
  title,
  items,
}: {
  title: string;
  items: string[];
}) {
  return (
    <section className="rounded-md border border-[var(--border)] p-4">
      <h3 className="text-xs font-semibold text-[var(--muted)]">
        {title}
      </h3>
      <ul className="mt-2 space-y-2 text-sm leading-6 text-[var(--muted)]">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </section>
  );
}

export function MaterialBriefView({
  brief,
  status = "waiting",
  selectedMaterialId,
  onCreatePrepCard,
  onStartPractice,
  actionStatus,
}: MaterialBriefViewProps) {
  const canUseMaterial = Boolean(brief && selectedMaterialId);

  return (
    <section className="rounded-md border border-[var(--border)] bg-[var(--surface)] p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <BookOpenCheck className="h-5 w-5 text-[var(--success)]" aria-hidden="true" />
          <h2 className="text-lg font-semibold">会前准备中心</h2>
        </div>
        <span className="flex flex-wrap gap-2">
          {brief ? (
            <StatusPill tone={brief.memoryStatus === "confidential" ? "neutral" : "primary"}>
              {memoryStatusLabels[brief.memoryStatus]}
            </StatusPill>
          ) : null}
          <StatusPill tone={brief ? "success" : "neutral"}>
            {briefStatusLabel(status)}
          </StatusPill>
        </span>
      </div>

      {brief ? (
        <div className="mt-5 space-y-4">
          <section className="rounded-md border border-[var(--border)] bg-[var(--surface-subtle)] p-4">
            <h3 className="text-xs font-semibold text-[var(--muted)]">
              材料摘要
            </h3>
            <p className="mt-2 text-sm leading-6">{brief.keyMessage}</p>
          </section>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={!canUseMaterial}
              onClick={() =>
                selectedMaterialId ? onCreatePrepCard?.(selectedMaterialId) : undefined
              }
              className="inline-flex min-h-11 items-center gap-2 rounded-md bg-[var(--primary)] px-4 text-sm font-medium text-white transition hover:bg-[var(--primary-strong)] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <ClipboardList className="h-4 w-4" aria-hidden="true" />
              生成会议准备卡
            </button>
            <button
              type="button"
              disabled={!canUseMaterial}
              onClick={() =>
                selectedMaterialId ? onStartPractice?.(selectedMaterialId) : undefined
              }
              className="inline-flex min-h-11 items-center gap-2 rounded-md border border-[var(--border)] px-4 text-sm font-medium transition hover:border-[var(--primary)] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <PlayCircle className="h-4 w-4" aria-hidden="true" />
              用这份材料开始练习
            </button>
          </div>

          {actionStatus ? (
            <p className="rounded-md border border-[var(--border)] bg-[var(--surface-subtle)] px-3 py-2 text-sm text-[var(--muted)]">
              {actionStatus}
            </p>
          ) : null}

          <div className="grid gap-3 md:grid-cols-2">
            <BriefSection title="客户可能追问" items={brief.likelyQuestions} />
            <BriefSection title="产品应用场景" items={brief.applicationScenarios} />
            <BriefSection title="产品优点" items={brief.pros} />
            <BriefSection title="适配边界" items={brief.cons} />
            <BriefSection title="竞品差异" items={brief.competitorDifferences} />
            <BriefSection title="产品参数" items={brief.productParameters} />
            <BriefSection title="客户价值" items={brief.customerValue} />
            <BriefSection title="风险表述" items={brief.riskyClaims} />
            <BriefSection title="可用表达" items={brief.usefulPhrases} />
            <BriefSection title="会议结构" items={brief.outline} />
          </div>
        </div>
      ) : (
        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {fallbackItems.map((item) => (
            <div
              key={item}
              className="rounded-md border border-dashed border-[var(--border)] bg-[var(--surface-subtle)] p-3 text-sm text-[var(--muted)]"
            >
              {item}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
