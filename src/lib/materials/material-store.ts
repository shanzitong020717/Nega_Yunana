import type {
  CreateMaterialInput,
  MaterialBriefPayload,
  MaterialMemoryStatus,
} from "@/lib/validation/materials";
import { LOCAL_DEMO_PROFILE_ID, type UserScope } from "@/lib/auth/user-scope";

export type MaterialProcessingStatus =
  | "uploaded"
  | "processing"
  | "ready"
  | "failed"
  | "processing_not_supported_yet";

type MaterialCore = Omit<
  CreateMaterialInput,
  "customerType" | "industry" | "meetingGoal" | "notes"
> &
  Partial<
    Pick<CreateMaterialInput, "customerType" | "industry" | "meetingGoal" | "notes">
  >;

export type MaterialRecord = MaterialCore & {
  id: string;
  userId: string;
  processingStatus: MaterialProcessingStatus;
  memoryStatus: MaterialMemoryStatus;
  extractedText?: string;
  extractionStatus?: string;
  createdAt: string;
  updatedAt: string;
};

const materialRecords = new Map<string, MaterialRecord>();
const materialBriefRecords = new Map<string, MaterialBriefRecord>();

export type MaterialBriefRecord = MaterialBriefPayload & {
  id: string;
  materialId: string;
  createdAt: string;
  updatedAt: string;
};

export function listMaterialRecords(scope?: UserScope) {
  const records = Array.from(materialRecords.values()).filter((material) =>
    scope?.userId ? material.userId === scope.userId : true,
  );

  return records.sort((left, right) =>
    right.createdAt.localeCompare(left.createdAt),
  );
}

export function getMaterialRecord(materialId: string, scope?: UserScope) {
  const material = materialRecords.get(materialId) ?? null;

  if (!material || (scope?.userId && material.userId !== scope.userId)) {
    return null;
  }

  return material;
}

export function saveMaterialRecord(
  input: MaterialCore & {
    userId?: string;
    processingStatus?: MaterialProcessingStatus;
    memoryStatus?: MaterialMemoryStatus;
    extractedText?: string;
    extractionStatus?: string;
  },
) {
  const now = new Date().toISOString();
  const material: MaterialRecord = {
    id: `material_${crypto.randomUUID()}`,
    userId: input.userId ?? LOCAL_DEMO_PROFILE_ID,
    processingStatus: input.processingStatus ?? "processing",
    memoryStatus:
      input.memoryStatus ?? (input.confidentialMode ? "confidential" : "session_only"),
    createdAt: now,
    updatedAt: now,
    ...input,
  };

  materialRecords.set(material.id, material);
  return material;
}

export function updateMaterialRecord(
  materialId: string,
  updates: Partial<
    Pick<
      MaterialRecord,
      "processingStatus" | "extractedText" | "extractionStatus"
    >
  >,
) {
  const material = getMaterialRecord(materialId);

  if (!material) {
    return null;
  }

  const updatedMaterial: MaterialRecord = {
    ...material,
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  materialRecords.set(materialId, updatedMaterial);
  return updatedMaterial;
}

export function getMaterialBriefRecord(materialId: string) {
  return materialBriefRecords.get(materialId) ?? null;
}

export function saveMaterialBriefRecord(
  materialId: string,
  brief: MaterialBriefPayload,
) {
  const existingBrief = getMaterialBriefRecord(materialId);
  const now = new Date().toISOString();
  const record: MaterialBriefRecord = {
    id: existingBrief?.id ?? `brief_${crypto.randomUUID()}`,
    materialId,
    createdAt: existingBrief?.createdAt ?? now,
    updatedAt: now,
    ...brief,
  };

  materialBriefRecords.set(materialId, record);
  updateMaterialRecord(materialId, { processingStatus: "ready" });

  return record;
}

export function deleteMaterialRecord(materialId: string, scope?: UserScope) {
  const material = getMaterialRecord(materialId, scope);

  if (!material) {
    return null;
  }

  materialRecords.delete(materialId);
  materialBriefRecords.delete(materialId);
  return material;
}
