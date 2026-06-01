import { FileText, Trash2 } from "lucide-react";

import { StatusPill } from "@/components/status-pill";
import type { UploadedMaterialSummary } from "@/features/materials/material-upload";
import type { MaterialMemoryStatus } from "@/lib/validation/materials";

type MaterialListProps = {
  materials: UploadedMaterialSummary[];
  selectedMaterialId?: string | null;
  onSelectMaterial?: (material: UploadedMaterialSummary) => void;
  onMemoryStatusChange?: (
    materialId: string,
    memoryStatus: MaterialMemoryStatus,
  ) => void;
  onDeleteMaterial?: (materialId: string) => void;
  deletingMaterialId?: string | null;
};

function statusTone(status: string) {
  if (status === "ready") {
    return "success" as const;
  }
  if (status === "failed" || status === "processing_not_supported_yet") {
    return "warning" as const;
  }
  return "primary" as const;
}

function statusLabel(status: string) {
  const labels: Record<string, string> = {
    uploaded: "已上传",
    processing: "处理中",
    ready: "已就绪",
    failed: "失败",
    processing_not_supported_yet: "暂不支持解析",
  };

  return labels[status] ?? status;
}

const memoryStatusLabels: Record<MaterialMemoryStatus, string> = {
  session_only: "仅本次使用",
  available_for_future: "可用于后续练习",
  saved_to_memory: "已加入长期记忆",
  confidential: "保密材料",
};

export function MaterialList({
  materials,
  selectedMaterialId,
  onSelectMaterial,
  onMemoryStatusChange,
  onDeleteMaterial,
  deletingMaterialId,
}: MaterialListProps) {
  return (
    <section className="rounded-md border border-[var(--border)] bg-[var(--surface)] p-5">
      <div className="flex items-center gap-2">
        <FileText className="h-5 w-5 text-[var(--accent)]" aria-hidden="true" />
        <h2 className="text-lg font-semibold">最近材料</h2>
      </div>

      {materials.length > 0 ? (
        <div className="mt-4 divide-y divide-[var(--border)]">
          {materials.map((material) => {
            const isSelected = selectedMaterialId === material.id;

            return (
              <div
                key={material.id}
                className="flex flex-col items-stretch gap-3 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-start sm:justify-between"
              >
                <button
                  type="button"
                  onClick={() => onSelectMaterial?.(material)}
                  className={[
                    "min-w-0 flex-1 text-left transition",
                    isSelected
                      ? "text-[var(--primary-strong)]"
                      : "text-[var(--foreground)]",
                  ].join(" ")}
                >
                  <span className="block text-sm font-semibold">{material.name}</span>
                  <span className="mt-1 block text-xs text-[var(--muted)]">
                    {material.originalFileName} · {material.fileType}
                  </span>
                  <span className="mt-2 block text-xs text-[var(--muted)]">
                    {memoryStatusLabels[material.memoryStatus ?? "session_only"]}
                  </span>
                </button>
                <div className="flex min-w-0 flex-col items-start gap-2 sm:shrink-0 sm:items-end">
                  <span className="flex flex-wrap gap-2 sm:justify-end">
                    <StatusPill tone={material.memoryStatus === "confidential" ? "neutral" : "primary"}>
                      {memoryStatusLabels[material.memoryStatus ?? "session_only"]}
                    </StatusPill>
                    <StatusPill tone={statusTone(material.processingStatus)}>
                      {statusLabel(material.processingStatus)}
                    </StatusPill>
                  </span>
                  {onMemoryStatusChange ? (
                    <label className="flex flex-col gap-1 text-xs font-medium text-[var(--muted)]">
                      记忆状态
                      <select
                        aria-label={`${material.name} 记忆状态`}
                        value={material.memoryStatus ?? "session_only"}
                        onChange={(event) =>
                          onMemoryStatusChange(
                            material.id,
                            event.target.value as MaterialMemoryStatus,
                          )
                        }
                        className="min-h-11 rounded-md border border-[var(--border)] bg-white px-2 text-xs outline-none transition focus:border-[var(--primary)]"
                      >
                        {Object.entries(memoryStatusLabels).map(([value, label]) => (
                          <option key={value} value={value}>
                            {label}
                          </option>
                        ))}
                      </select>
                    </label>
                  ) : null}
                  {onDeleteMaterial ? (
                    <button
                      type="button"
                      aria-label={`删除材料 ${material.name}`}
                      disabled={deletingMaterialId === material.id}
                      onClick={() => onDeleteMaterial(material.id)}
                      className="inline-flex min-h-11 items-center gap-1.5 rounded-md border border-[#f3b8b2] px-2.5 text-xs font-medium text-[var(--danger)] transition hover:bg-[#fff0ee] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                      {deletingMaterialId === material.id ? "删除中" : "删除"}
                    </button>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="mt-4 rounded-md border border-dashed border-[var(--border)] bg-[var(--surface-subtle)] p-4">
          <p className="text-sm font-semibold">还没有上传材料</p>
          <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
            Upload a customer deck or notes file to generate a focused meeting brief.
          </p>
        </div>
      )}
    </section>
  );
}
