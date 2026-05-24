import {
  upsertMemoryFromReviewCandidate,
  type ReviewMemoryUpsertResult,
} from "@/lib/memory/memory-store";
import type { ReviewRecord } from "@/lib/practice/practice-session-store";
import type { MemoryCandidate } from "@/lib/validation/reviews";

type SkippedMemoryCandidate = {
  candidate: MemoryCandidate;
  reason: "disabled_for_ai" | "high_sensitivity" | "medium_sensitivity";
};

export type ReviewMemoryConsolidationResult = {
  created: ReviewMemoryUpsertResult[];
  merged: ReviewMemoryUpsertResult[];
  skipped: SkippedMemoryCandidate[];
};

export function consolidateReviewMemoryCandidates(
  review: ReviewRecord,
): ReviewMemoryConsolidationResult {
  const result: ReviewMemoryConsolidationResult = {
    created: [],
    merged: [],
    skipped: [],
  };

  review.memoryCandidates.forEach((candidate) => {
    if (!candidate.enabledForAi) {
      result.skipped.push({
        candidate,
        reason: "disabled_for_ai",
      });
      return;
    }

    if (candidate.sensitivity === "high") {
      result.skipped.push({
        candidate,
        reason: "high_sensitivity",
      });
      return;
    }

    if (candidate.sensitivity === "medium") {
      result.skipped.push({
        candidate,
        reason: "medium_sensitivity",
      });
      return;
    }

    const upsertResult = upsertMemoryFromReviewCandidate(candidate, {
      reviewId: review.id,
      sessionId: review.sessionId,
      sourceCreatedAt: review.createdAt,
    });

    if (upsertResult.action === "created") {
      result.created.push(upsertResult);
    } else {
      result.merged.push(upsertResult);
    }
  });

  return result;
}
