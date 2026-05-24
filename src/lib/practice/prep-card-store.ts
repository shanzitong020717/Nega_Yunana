import type { PrepCardPayload } from "@/lib/ai/prep-card";
import { LOCAL_DEMO_PROFILE_ID, type UserScope } from "@/lib/auth/user-scope";
import type { CreatePrepCardInput } from "@/lib/validation/practice";

export type PrepCardRecord = CreatePrepCardInput &
  PrepCardPayload & {
    id: string;
    userId?: string;
    createdAt: string;
    updatedAt: string;
  };

const prepCardRecords = new Map<string, PrepCardRecord>();

function getRecordUserId(record: { userId?: string }) {
  return record.userId ?? LOCAL_DEMO_PROFILE_ID;
}

export function listPrepCardRecords(scope?: UserScope) {
  return Array.from(prepCardRecords.values()).filter((prepCard) =>
    scope?.userId ? getRecordUserId(prepCard) === scope.userId : true,
  ).sort((left, right) =>
    right.createdAt.localeCompare(left.createdAt),
  );
}

export function getPrepCardRecord(prepCardId: string, scope?: UserScope) {
  const prepCard = prepCardRecords.get(prepCardId) ?? null;

  if (!prepCard || (scope?.userId && getRecordUserId(prepCard) !== scope.userId)) {
    return null;
  }

  return prepCard;
}

export function savePrepCardRecord(
  input: CreatePrepCardInput,
  generatedPrepCard: PrepCardPayload,
  scope?: UserScope,
) {
  const now = new Date().toISOString();
  const prepCard: PrepCardRecord = {
    id: `prep_${crypto.randomUUID()}`,
    userId: scope?.userId ?? LOCAL_DEMO_PROFILE_ID,
    createdAt: now,
    updatedAt: now,
    ...input,
    ...generatedPrepCard,
  };

  prepCardRecords.set(prepCard.id, prepCard);
  return prepCard;
}

export function deletePrepCardsByMaterialId(
  materialId: string,
  scope?: UserScope,
) {
  const deletedPrepCardIds: string[] = [];

  for (const prepCard of prepCardRecords.values()) {
    if (
      prepCard.materialId === materialId &&
      (!scope?.userId || getRecordUserId(prepCard) === scope.userId)
    ) {
      prepCardRecords.delete(prepCard.id);
      deletedPrepCardIds.push(prepCard.id);
    }
  }

  return deletedPrepCardIds;
}
