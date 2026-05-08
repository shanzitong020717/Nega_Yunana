import { FileText, Trash2 } from "lucide-react";

import { StatusPill } from "@/components/status-pill";
import type { UploadedMaterialSummary } from "@/features/materials/material-upload";

type MaterialListProps = {
  materials: UploadedMaterialSummary[];
  selectedMaterialId?: string | null;
  onSelectMaterial?: (material: UploadedMaterialSummary) => void;
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

export function MaterialList({
  materials,
  selectedMaterialId,
  onSelectMaterial,
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
                className="flex items-start justify-between gap-3 py-4 first:pt-0 last:pb-0"
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
                </button>
                <div className="flex shrink-0 flex-col items-end gap-2">
                  <span className="flex flex-wrap justify-end gap-2">
                    {material.confidentialMode ? (
                      <StatusPill tone="neutral">保密</StatusPill>
                    ) : null}
                    <StatusPill tone={statusTone(material.processingStatus)}>
                      {statusLabel(material.processingStatus)}
                    </StatusPill>
                  </span>
                  {onDeleteMaterial ? (
                    <button
                      type="button"
                      aria-label={`删除材料 ${material.name}`}
                      disabled={deletingMaterialId === material.id}
                      onClick={() => onDeleteMaterial(material.id)}
                      className="inline-flex min-h-9 items-center gap-1.5 rounded-md border border-[#f3b8b2] px-2.5 text-xs font-medium text-[var(--danger)] transition hover:bg-[#fff0ee] disabled:cursor-not-allowed disabled:opacity-60"
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
