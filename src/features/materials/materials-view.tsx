"use client";

import { useState } from "react";

import { PageHeader } from "@/components/page-header";
import {
  MaterialBriefView,
  type MaterialBrief,
} from "@/features/materials/material-brief-view";
import { MaterialList } from "@/features/materials/material-list";
import {
  MaterialUpload,
  type UploadedMaterialSummary,
} from "@/features/materials/material-upload";

export function MaterialsView() {
  const [materials, setMaterials] = useState<UploadedMaterialSummary[]>([]);
  const [selectedMaterialId, setSelectedMaterialId] = useState<string | null>(null);
  const [brief, setBrief] = useState<MaterialBrief | null>(null);
  const [briefStatus, setBriefStatus] = useState("waiting");
  const [deletingMaterialId, setDeletingMaterialId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  async function fetchBrief(material: UploadedMaterialSummary) {
    setBrief(null);

    if (material.processingStatus === "processing_not_supported_yet") {
      setBriefStatus("processing_not_supported_yet");
      return;
    }

    setBriefStatus("generating");

    try {
      const response = await fetch(`/api/materials/${material.id}/brief`);
      const payload = (await response.json()) as {
        status?: string;
        brief?: MaterialBrief;
        error?: { message?: string };
      };

      if (!response.ok || !payload.brief) {
        throw new Error(payload.error?.message ?? "简报生成失败");
      }

      setBrief(payload.brief);
      setBriefStatus(payload.status ?? "ready");
    } catch {
      setBriefStatus("failed");
    }
  }

  function handleUploaded(material: UploadedMaterialSummary) {
    setMaterials((currentMaterials) => [material, ...currentMaterials]);
    setSelectedMaterialId(material.id);
    void fetchBrief(material);
  }

  function handleSelectMaterial(material: UploadedMaterialSummary) {
    setSelectedMaterialId(material.id);
    void fetchBrief(material);
  }

  async function handleDeleteMaterial(materialId: string) {
    setDeletingMaterialId(materialId);
    setDeleteError(null);

    try {
      const response = await fetch(`/api/materials/${materialId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("材料删除失败");
      }

      setMaterials((currentMaterials) =>
        currentMaterials.filter((material) => material.id !== materialId),
      );

      if (selectedMaterialId === materialId) {
        setSelectedMaterialId(null);
        setBrief(null);
        setBriefStatus("waiting");
      }
    } catch {
      setDeleteError("无法删除该材料，请稍后重试。");
    } finally {
      setDeletingMaterialId(null);
    }
  }

  return (
    <>
      <PageHeader
        eyebrow="材料"
        title="客户材料库"
        description="Upload decks, PDFs, proposals, and customer notes, then generate meeting briefs for practice sessions."
      />

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="min-w-0 space-y-4">
          <MaterialUpload onUploaded={handleUploaded} />
          <MaterialBriefView brief={brief} status={briefStatus} />
        </div>
        <div className="space-y-3">
          {deleteError ? (
            <p
              role="alert"
              className="rounded-md border border-[#f3b8b2] bg-[#fff0ee] px-3 py-2 text-sm text-[var(--danger)]"
            >
              {deleteError}
            </p>
          ) : null}
          <MaterialList
            materials={materials}
            selectedMaterialId={selectedMaterialId}
            onSelectMaterial={handleSelectMaterial}
            onDeleteMaterial={handleDeleteMaterial}
            deletingMaterialId={deletingMaterialId}
          />
        </div>
      </div>
    </>
  );
}
