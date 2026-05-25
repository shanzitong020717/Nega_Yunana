import { generateLongTermReviewSnapshot } from "@/lib/ai/long-term-review";
import { LOCAL_DEMO_PROFILE_ID, type UserScope } from "@/lib/auth/user-scope";
import { listMemories } from "@/lib/memory/memory-store";
import {
  listPracticeSessionRecordsAsync,
  listReviewRecords,
  listReviewRecordsAsync,
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
} & UserScope;

const cache = new Map<string, CacheEntry>();

function cacheKey(range: ReviewAnalyticsRange, scope?: UserScope) {
  return `${scope?.userId ?? LOCAL_DEMO_PROFILE_ID}:${range}`;
}

async function buildSourceSignature(scope?: UserScope) {
  return (await listReviewRecordsAsync(scope))
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

function buildMemorySummaries(scope?: UserScope) {
  return listMemories({ enabledForAi: true, userId: scope?.userId }).map((memory) => ({
    title: memory.title,
    summary: memory.summary,
  }));
}

export function getCachedReviewAnalytics(
  range: ReviewAnalyticsRange,
  scope?: UserScope,
) {
  return cache.get(cacheKey(range, scope))?.snapshot ?? null;
}

export function clearReviewAnalyticsCache() {
  cache.clear();
}

export async function getOrGenerateReviewAnalytics(
  input: GetOrGenerateReviewAnalyticsInput,
) {
  const scope = { userId: input.userId };
  const key = cacheKey(input.range, scope);
  const signature = await buildSourceSignature(scope);
  const cached = cache.get(key);

  if (
    cached &&
    !input.force &&
    cached.signature === signature &&
    !isExpired(cached.snapshot)
  ) {
    return cached.snapshot;
  }

  const [reviews, sessions] = await Promise.all([
    listReviewRecordsAsync(scope),
    listPracticeSessionRecordsAsync(scope),
  ]);
  const draft = buildReviewAnalyticsDraft({
    range: input.range,
    reviews,
    sessions,
    memories: listMemories({ enabledForAi: true, userId: scope.userId }),
  });
  const snapshot =
    draft.trainingCount >= 2
      ? await generateLongTermReviewSnapshot({
          draft,
          sentenceReviewSummaries: buildSentenceReviewSummaries(reviews),
          weaknessSummaries: buildWeaknessSummaries(reviews),
          memorySummaries: buildMemorySummaries(scope),
        })
      : draft;

  cache.set(key, {
    signature,
    snapshot,
  });

  return snapshot;
}
