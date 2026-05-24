import { defaultScenarioPack, type PracticeGoalId } from "@/data/scenario-packs";
import type {
  PracticeSessionRecord,
  ReviewRecord,
} from "@/lib/practice/practice-session-store";
import type { MemoryItem } from "@/lib/validation/memory";
import type { SentenceIssue } from "@/lib/validation/reviews";
import type {
  MemoryInsight,
  NaturalnessPattern,
  NextTrainingPlan,
  PhraseGrowth,
  RecurringMistake,
  ReviewAnalyticsRange,
  ReviewAnalyticsSnapshot,
} from "@/lib/validation/review-analytics";

type BuildReviewAnalyticsDraftInput = {
  memories?: MemoryItem[];
  now?: string;
  range: ReviewAnalyticsRange;
  reviews: ReviewRecord[];
  sessions?: PracticeSessionRecord[];
};

type IssueBucket = {
  category: RecurringMistake["category"];
  correction: string;
  examples: RecurringMistake["examples"];
  explanations: string[];
  lastSeenAt: string;
  originalFragment: string;
  recommendedDrills: string[];
  severityTotal: number;
};

const weaknessGoalMap: Partial<
  Record<ReviewRecord["weaknessUpdates"][number]["type"], PracticeGoalId>
> = {
  feature_only_talk: "application_scenarios",
  grammar_accuracy: "customer_qa",
  fluency: "quick_pitch",
  long_answers: "quick_pitch",
  missing_next_step: "solution_meeting",
  pronunciation_clarity: "customer_qa",
  repetitive_vocabulary: "demo_narration",
  unclear_positioning: "competitive_differences",
  weak_discovery: "customer_qa",
  weak_objection_handling: "privacy_security",
};

function dayEndIso(now: string) {
  const date = new Date(now);
  date.setUTCHours(23, 59, 59, 999);
  return date.toISOString();
}

function normalizeId(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fa5]+/gi, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 80);
}

function isInRange(review: ReviewRecord, range: ReviewAnalyticsRange, now: string) {
  if (range === "all") {
    return true;
  }

  const days = range === "7d" ? 7 : 30;
  const start = new Date(now).getTime() - days * 86_400_000;

  return new Date(review.createdAt).getTime() >= start;
}

function sortReviews(reviews: ReviewRecord[]) {
  return [...reviews].sort(
    (left, right) =>
      new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime(),
  );
}

function pickRecommendedDrill(review: ReviewRecord) {
  return (
    review.weaknessUpdates[0]?.recommendedDrill ??
    review.nextSessionRecommendation.drill ??
    "围绕客户问题做更短、更清楚的商务回答"
  );
}

function addIssue(
  buckets: Map<string, IssueBucket>,
  review: ReviewRecord,
  issue: SentenceIssue,
) {
  const category =
    issue.type === "business_tone" || issue.type === "logic"
      ? issue.type
      : issue.type;
  const key = `${category}:${issue.originalFragment}:${issue.correction}`;
  const existing = buckets.get(key);
  const example = {
    reviewId: review.id,
    sessionId: review.sessionId,
    original:
      review.sentenceReviews.find((sentenceReview) =>
        sentenceReview.original.includes(issue.originalFragment),
      )?.original ?? issue.originalFragment,
    correction: issue.correction,
    explanationZh: issue.explanationZh,
  };

  buckets.set(key, {
    category,
    correction: issue.correction,
    examples: existing ? [...existing.examples, example].slice(0, 3) : [example],
    explanations: existing
      ? Array.from(new Set([...existing.explanations, issue.explanationZh]))
      : [issue.explanationZh],
    lastSeenAt:
      existing && existing.lastSeenAt.localeCompare(review.createdAt) > 0
        ? existing.lastSeenAt
        : review.createdAt,
    originalFragment: issue.originalFragment,
    recommendedDrills: existing
      ? Array.from(new Set([...existing.recommendedDrills, pickRecommendedDrill(review)]))
      : [pickRecommendedDrill(review)],
    severityTotal: (existing?.severityTotal ?? 0) + issue.severity,
  });
}

function buildRecurringMistakes(reviews: ReviewRecord[]): RecurringMistake[] {
  const buckets = new Map<string, IssueBucket>();

  reviews.forEach((review) => {
    review.sentenceReviews.forEach((sentenceReview) => {
      [
        ...sentenceReview.grammarIssues,
        ...sentenceReview.wordChoiceIssues,
        ...sentenceReview.naturalnessIssues,
      ].forEach((issue) => addIssue(buckets, review, issue));
    });
  });

  return Array.from(buckets.entries())
    .map(([key, bucket]) => {
      const occurrenceCount = bucket.examples.length;

      return {
        id: `mistake_${normalizeId(key)}`,
        category: bucket.category,
        title: `${bucket.originalFragment} → ${bucket.correction}`,
        occurrenceCount,
        averageSeverity: Number((bucket.severityTotal / occurrenceCount).toFixed(1)),
        lastSeenAt: bucket.lastSeenAt,
        examples: bucket.examples,
        recommendedDrill: bucket.recommendedDrills[0],
      };
    })
    .sort((left, right) => {
      if (right.occurrenceCount !== left.occurrenceCount) {
        return right.occurrenceCount - left.occurrenceCount;
      }

      if (right.averageSeverity !== left.averageSeverity) {
        return right.averageSeverity - left.averageSeverity;
      }

      return right.lastSeenAt.localeCompare(left.lastSeenAt);
    })
    .slice(0, 6);
}

function buildNaturalnessPatterns(reviews: ReviewRecord[]): NaturalnessPattern[] {
  const patterns = new Map<string, NaturalnessPattern>();

  reviews.forEach((review) => {
    review.sentenceReviews.forEach((sentenceReview) => {
      sentenceReview.naturalnessIssues.forEach((issue) => {
        const key = `${issue.originalFragment}:${issue.correction}`;
        const existing = patterns.get(key);

        patterns.set(key, {
          id: `pattern_${normalizeId(key)}`,
          title: `${issue.originalFragment} 不够自然`,
          patternZh: issue.explanationZh,
          betterExpression: issue.correction,
          examples: Array.from(
            new Set([...(existing?.examples ?? []), sentenceReview.original]),
          ).slice(0, 3),
        });
      });
    });
  });

  return Array.from(patterns.values()).slice(0, 4);
}

function buildGrowthSignals(reviews: ReviewRecord[]) {
  const signalMap = new Map<string, { evidence: string[]; summary: string }>();

  reviews.forEach((review) => {
    review.reviewSnapshot?.strengths.forEach((strength) => {
      const key = normalizeId(strength);
      const existing = signalMap.get(key);
      signalMap.set(key, {
        summary: strength,
        evidence: Array.from(
          new Set([
            ...(existing?.evidence ?? []),
            ...review.sentenceReviews
              .flatMap((sentenceReview) =>
                sentenceReview.highlights.map((highlight) =>
                  `${highlight.text}: ${highlight.explanationZh}`,
                ),
              )
              .slice(0, 2),
          ]),
        ).slice(0, 3),
      });
    });
  });

  return Array.from(signalMap.entries())
    .map(([key, value]) => ({
      id: `growth_${key}`,
      title: value.summary,
      summaryZh: value.evidence[0] ?? value.summary,
      evidence: value.evidence,
      confidence: Math.min(0.55 + value.evidence.length * 0.12, 0.92),
    }))
    .slice(0, 4);
}

function buildPhraseGrowth(reviews: ReviewRecord[]): PhraseGrowth {
  const vocabulary = new Map<
    string,
    { chinese: string; count: number; example: string; term: string }
  >();
  const reusableSentences = new Map<
    string,
    { chinese: string; english: string; useCase: string }
  >();

  reviews.forEach((review) => {
    review.phrasebookSuggestions.forEach((phrase) => {
      reusableSentences.set(phrase.english, {
        english: phrase.english,
        chinese: phrase.chinese,
        useCase: phrase.useCase,
      });
    });

    review.sentenceReviews.forEach((sentenceReview) => {
      sentenceReview.vocabulary.forEach((item) => {
        const key = item.term.toLowerCase();
        const existing = vocabulary.get(key);

        vocabulary.set(key, {
          term: item.term,
          chinese: item.chinese,
          example: existing?.example ?? item.example,
          count: (existing?.count ?? 0) + 1,
        });
      });

      if (sentenceReview.phrasebookCandidate) {
        reusableSentences.set(sentenceReview.phrasebookCandidate.english, {
          english: sentenceReview.phrasebookCandidate.english,
          chinese: sentenceReview.phrasebookCandidate.chinese,
          useCase: sentenceReview.phrasebookCandidate.useCase,
        });
      }
    });
  });

  return {
    newPhraseCount: reusableSentences.size,
    reviewGeneratedPhraseCount: reusableSentences.size,
    vocabularyItems: Array.from(vocabulary.values())
      .sort((left, right) => right.count - left.count)
      .slice(0, 8),
    reusableSentences: Array.from(reusableSentences.values()).slice(0, 5),
  };
}

function buildMemoryInsights(
  reviews: ReviewRecord[],
  memories: MemoryItem[],
): MemoryInsight[] {
  const insights = new Map<string, MemoryInsight>();

  reviews.forEach((review) => {
    review.memoryCandidates.forEach((candidate) => {
      const existingMemory = memories.find(
        (memory) =>
          memory.title.toLowerCase() === candidate.title.toLowerCase() ||
          memory.summary.toLowerCase().includes(candidate.title.toLowerCase()),
      );
      const id = `memory_${normalizeId(candidate.title)}`;

      insights.set(id, {
        id,
        type: existingMemory ? "reinforced_memory" : "new_memory",
        title: candidate.title,
        summaryZh: candidate.summary,
        evidence: candidate.evidence.slice(0, 3),
        action:
          candidate.sensitivity === "high"
            ? "review_manually"
            : existingMemory
              ? "merge"
              : "keep",
      });
    });
  });

  return Array.from(insights.values()).slice(0, 5);
}

function buildNextTrainingPlan(reviews: ReviewRecord[]): NextTrainingPlan {
  const weakness = reviews
    .flatMap((review) => review.weaknessUpdates)
    .sort((left, right) => right.severity - left.severity)[0];
  const goal =
    defaultScenarioPack.practiceGoals.find(
      (item) => item.id === weaknessGoalMap[weakness?.type ?? "feature_only_talk"],
    ) ??
    defaultScenarioPack.practiceGoals.find(
      (item) => item.id === "application_scenarios",
    ) ??
    defaultScenarioPack.practiceGoals[0];
  const persona =
    defaultScenarioPack.personas.find((item) =>
      goal.recommendedPersonaIds.includes(item.id),
    ) ?? defaultScenarioPack.personas[0];
  const voicePack =
    defaultScenarioPack.voicePacks.find(
      (item) => item.id === goal.recommendedVoicePackIds[0],
    ) ?? defaultScenarioPack.voicePacks[0];

  return {
    title: `${persona.label} · ${goal.label}`,
    reasonZh: weakness
      ? `长期复盘显示「${weakness.recommendedDrill}」仍值得加强，适合继续练 ${goal.label}。`
      : `当前适合从 ${goal.label} 开始沉淀可复用商务表达。`,
    goalId: goal.id,
    mode: goal.mode,
    personaId: persona.id,
    voicePackId: voicePack.id,
    materialMode: "memory_context",
    focusTags: goal.defaultFocusTags.slice(0, 3),
    estimatedMinutes: 8,
  };
}

function emptyPhraseGrowth(): PhraseGrowth {
  return {
    newPhraseCount: 0,
    reviewGeneratedPhraseCount: 0,
    vocabularyItems: [],
    reusableSentences: [],
  };
}

export function buildReviewAnalyticsDraft(
  input: BuildReviewAnalyticsDraftInput,
): ReviewAnalyticsSnapshot {
  const now = input.now ?? new Date().toISOString();
  const reviews = sortReviews(
    input.reviews.filter((review) => isInRange(review, input.range, now)),
  );
  const base = {
    id: `review_analytics_${input.range}`,
    range: input.range,
    generatedAt: now,
    staleAfter: dayEndIso(now),
    sourceReviewIds: reviews.map((review) => review.id),
    sourceSessionIds: reviews.map((review) => review.sessionId),
    trainingCount: reviews.length,
  };

  if (reviews.length < 2) {
    return {
      ...base,
      summaryZh: "数据还不够形成长期趋势。完成 2 次以上练习后，系统会生成长期复盘。",
      topGrowthSignals: [],
      recurringMistakes: [],
      naturalnessPatterns: [],
      phraseGrowth: emptyPhraseGrowth(),
      memoryInsights: [],
      nextTrainingPlan: buildNextTrainingPlan(reviews),
      aiGenerated: false,
    };
  }

  const recurringMistakes = buildRecurringMistakes(reviews);
  const topMistake = recurringMistakes[0];

  return {
    ...base,
    summaryZh: topMistake
      ? `这段时间你完成了 ${reviews.length} 次练习，最需要优先处理的是「${topMistake.title}」。`
      : `这段时间你完成了 ${reviews.length} 次练习，整体表达正在变得更稳定。`,
    topGrowthSignals: buildGrowthSignals(reviews),
    recurringMistakes,
    naturalnessPatterns: buildNaturalnessPatterns(reviews),
    phraseGrowth: buildPhraseGrowth(reviews),
    memoryInsights: buildMemoryInsights(reviews, input.memories ?? []),
    nextTrainingPlan: buildNextTrainingPlan(reviews),
    aiGenerated: false,
  };
}
