import type { TodayRecommendation } from "@/lib/recommendations/today-recommendation";

export type TodayRecommendationCacheRecord = {
  completedRecommendationIds: string[];
  date: string;
  recommendation: TodayRecommendation;
  shownRecommendationIds: string[];
  updatedAt: string;
};

const cacheKeyPrefix = "today-recommendation";

function canUseLocalStorage() {
  return typeof window !== "undefined" && Boolean(window.localStorage);
}

function localDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export function todayRecommendationCacheKey(date = new Date()) {
  return `${cacheKeyPrefix}:${localDateKey(date)}`;
}

function isCacheRecord(value: unknown): value is TodayRecommendationCacheRecord {
  if (!value || typeof value !== "object") {
    return false;
  }

  const record = value as Record<string, unknown>;
  const recommendation = record.recommendation as Record<string, unknown> | undefined;

  return (
    typeof record.date === "string" &&
    typeof record.updatedAt === "string" &&
    Array.isArray(record.completedRecommendationIds) &&
    Boolean(recommendation) &&
    typeof recommendation?.id === "string" &&
    typeof recommendation?.title === "string" &&
    typeof recommendation?.goalId === "string" &&
    typeof recommendation?.personaId === "string" &&
    typeof recommendation?.voicePackId === "string"
  );
}

function stringArray(value: unknown) {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string" && item.length > 0)
    : [];
}

function unique(values: string[]) {
  return Array.from(new Set(values));
}

export function readTodayRecommendationCache(date = new Date()) {
  if (!canUseLocalStorage()) {
    return null;
  }

  const key = todayRecommendationCacheKey(date);
  const serializedCache = window.localStorage.getItem(key);

  if (!serializedCache) {
    return null;
  }

  try {
    const parsedCache = JSON.parse(serializedCache) as unknown;

    if (!isCacheRecord(parsedCache) || parsedCache.date !== localDateKey(date)) {
      return null;
    }

    return {
      ...parsedCache,
      completedRecommendationIds: unique(
        stringArray(parsedCache.completedRecommendationIds),
      ),
      shownRecommendationIds: unique([
        ...stringArray(
          (parsedCache as Partial<TodayRecommendationCacheRecord>)
            .shownRecommendationIds,
        ),
        parsedCache.recommendation.id,
      ]),
    };
  } catch {
    return null;
  }
}

export function writeTodayRecommendationCache(
  recommendation: TodayRecommendation,
  options: {
    completedRecommendationIds?: string[];
    date?: Date;
    shownRecommendationIds?: string[];
  } = {},
) {
  if (!canUseLocalStorage()) {
    return null;
  }

  const date = options.date ?? new Date();
  const currentCache = readTodayRecommendationCache(date);
  const completedRecommendationIds = unique(
    options.completedRecommendationIds ??
      currentCache?.completedRecommendationIds ??
      [],
  );
  const shownRecommendationIds = unique([
    ...(options.shownRecommendationIds ??
      currentCache?.shownRecommendationIds ??
      []),
    recommendation.id,
  ]);
  const cacheRecord: TodayRecommendationCacheRecord = {
    date: localDateKey(date),
    recommendation,
    completedRecommendationIds,
    shownRecommendationIds,
    updatedAt: new Date().toISOString(),
  };

  window.localStorage.setItem(
    todayRecommendationCacheKey(date),
    JSON.stringify(cacheRecord),
  );

  return cacheRecord;
}

export function markTodayRecommendationCompleted(
  recommendationId: string,
  date = new Date(),
) {
  const currentCache = readTodayRecommendationCache(date);
  const completedRecommendationIds = Array.from(
    new Set([
      ...(currentCache?.completedRecommendationIds ?? []),
      recommendationId,
    ]),
  );

  if (!currentCache) {
    return {
      completedRecommendationIds,
      recommendation: null,
    };
  }

  writeTodayRecommendationCache(currentCache.recommendation, {
    completedRecommendationIds,
    date,
  });

  return {
    completedRecommendationIds,
    recommendation: currentCache.recommendation,
  };
}

export function buildTodayRecommendationRequestURL({
  excludedRecommendationIds = [],
  refresh = false,
}: {
  excludedRecommendationIds?: string[];
  refresh?: boolean;
} = {}) {
  const params = new URLSearchParams();

  if (refresh) {
    params.set("refresh", "1");
  }

  excludedRecommendationIds.forEach((recommendationId) => {
    params.append("exclude", recommendationId);
  });

  const queryString = params.toString();

  return queryString
    ? `/api/today-recommendation?${queryString}`
    : "/api/today-recommendation";
}

export async function fetchTodayRecommendationPackage({
  excludedRecommendationIds = [],
  refresh = false,
  signal,
}: {
  excludedRecommendationIds?: string[];
  refresh?: boolean;
  signal?: AbortSignal;
} = {}) {
  const response = await fetch(
    buildTodayRecommendationRequestURL({
      excludedRecommendationIds,
      refresh,
    }),
    { signal },
  );

  if (!response.ok) {
    throw new Error("Failed to load today recommendation.");
  }

  const payload = (await response.json()) as {
    recommendation?: TodayRecommendation;
  };

  if (!payload.recommendation) {
    throw new Error("Today recommendation payload is empty.");
  }

  return payload.recommendation;
}

export async function completeTodayRecommendationAndPrefetch(
  recommendationId: string,
) {
  const completedState = markTodayRecommendationCompleted(recommendationId);
  const controller = new AbortController();

  try {
    const nextRecommendation = await fetchTodayRecommendationPackage({
      excludedRecommendationIds: completedState.completedRecommendationIds,
      refresh: true,
      signal: controller.signal,
    });

    writeTodayRecommendationCache(nextRecommendation, {
      completedRecommendationIds: completedState.completedRecommendationIds,
    });

    return nextRecommendation;
  } catch {
    return null;
  }
}
