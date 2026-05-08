import type { PrepCardPayload } from "@/lib/ai/prep-card";
import type { CreatePrepCardInput } from "@/lib/validation/practice";

export type PrepCardRecord = CreatePrepCardInput &
  PrepCardPayload & {
    id: string;
    createdAt: string;
    updatedAt: string;
  };

const prepCardRecords = new Map<string, PrepCardRecord>();

export function listPrepCardRecords() {
  return Array.from(prepCardRecords.values()).sort((left, right) =>
    right.createdAt.localeCompare(left.createdAt),
  );
}

export function getPrepCardRecord(prepCardId: string) {
  return prepCardRecords.get(prepCardId) ?? null;
}

export function savePrepCardRecord(
  input: CreatePrepCardInput,
  generatedPrepCard: PrepCardPayload,
) {
  const now = new Date().toISOString();
  const prepCard: PrepCardRecord = {
    id: `prep_${crypto.randomUUID()}`,
    createdAt: now,
    updatedAt: now,
    ...input,
    ...generatedPrepCard,
  };

  prepCardRecords.set(prepCard.id, prepCard);
  return prepCard;
}

export function deletePrepCardsByMaterialId(materialId: string) {
  const deletedPrepCardIds: string[] = [];

  for (const prepCard of prepCardRecords.values()) {
    if (prepCard.materialId === materialId) {
      prepCardRecords.delete(prepCard.id);
      deletedPrepCardIds.push(prepCard.id);
    }
  }

  return deletedPrepCardIds;
}
