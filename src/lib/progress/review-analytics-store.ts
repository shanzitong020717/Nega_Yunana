import { generateLongTermReviewSnapshot } from "@/lib/ai/long-term-review";
import { listMemories } from "@/lib/memory/memory-store";
import {
  listPracticeSessionRecords,
  listReviewRecords,
} from "@/lib/practice/practice-session-store";
import { buildReviewAnalyticsDraft } from "@/lib/progress/review-analytics";
import type {
  ReviewAnalyticsRange,
  ReviewAnalyticsSnapshot,
} from "@/lib/validation/review-analytics";

type CacheEntry = {
  signature: string;
  snapshot: ReviewAnalyticsSnapshot;
};

type GetOrGenerateReviewAnalyticsInput = {
  force?: boolean;
  range: ReviewAnalyticsRange;
};

const cache = new Map<ReviewAnalyticsRange, CacheEntry>();

function buildSourceSignature() {
  return listReviewRecords()
    .map((review) => `${review.id}:${review.updatedAt}`)
    .sort()
    .join("|");
}

function isExpired(snapshot: ReviewAnalyticsSnapshot) {
  return new Date(snapshot.staleAfter).getTime() < Date.now();
}

function buildSentenceReviewSummaries(reviews = listReviewRecords()) {
  return reviews.flatMap((review) =>
    review.sentenceReviews.map((sentenceReview) => ({
      original: sentenceReview.original,
      issueTypes: [
        ...sentenceReview.grammarIssues,
        ...sentenceReview.wordChoiceIssues,
        ...sentenceReview.naturalnessIssues,
      ].map((issue) => issue.type),
      correction:
        sentenceReview.upgradedExpression ??
        sentenceReview.wordChoiceIssues[0]?.correction ??
        sentenceReview.naturalnessIssues[0]?.correction,
    })),
  );
}

function buildWeaknessSummaries(reviews = listReviewRecords()) {
  return reviews.flatMap((review) =>
    review.weaknessUpdates.map((weakness) => ({
      type: weakness.type,
      evidence: weakness.evidence,
    })),
  );
}

function buildMemorySummaries() {
  return listMemories({ enabledForAi: true }).map((memory) => ({
    title: memory.title,
    summary: memory.summary,
  }));
}

export function getCachedReviewAnalytics(range: ReviewAnalyticsRange) {
  return cache.get(range)?.snapshot ?? null;
}

export function clearReviewAnalyticsCache() {
  cache.clear();
}

export async function getOrGenerateReviewAnalytics(
  input: GetOrGenerateReviewAnalyticsInput,
) {
  const signature = buildSourceSignature();
  const cached = cache.get(input.range);

  if (
    cached &&
    !input.force &&
    cached.signature === signature &&
    !isExpired(cached.snapshot)
  ) {
    return cached.snapshot;
  }

  const reviews = listReviewRecords();
  const draft = buildReviewAnalyticsDraft({
    range: input.range,
    reviews,
    sessions: listPracticeSessionRecords(),
    memories: listMemories({ enabledForAi: true }),
  });
  const snapshot =
    draft.trainingCount >= 2
      ? await generateLongTermReviewSnapshot({
          draft,
          sentenceReviewSummaries: buildSentenceReviewSummaries(reviews),
          weaknessSummaries: buildWeaknessSummaries(reviews),
          memorySummaries: buildMemorySummaries(),
        })
      : draft;

  cache.set(input.range, {
    signature,
    snapshot,
  });

  return snapshot;
}
