import type { TodayRecommendation } from "@/lib/recommendations/today-recommendation";

export type TodayRecommendationCacheRecord = {
  completedRecommendationIds: string[];
  date: string;
  pool?: TodayRecommendationPoolCacheSnapshot;
  recommendation: TodayRecommendation;
  shownRecommendationIds: string[];
  updatedAt: string;
};

export type TodayRecommendationPoolCacheSnapshot = {
  activeIndex: number;
  items: TodayRecommendation[];
  size: number;
};

export type TodayRecommendationPackageResponse = {
  pool?: TodayRecommendationPoolCacheSnapshot;
  recommendation: TodayRecommendation;
};

const cacheKeyPrefix = "today-recommendation";
const recommendationRolloverHour = 4;

function canUseLocalStorage() {
  return typeof window !== "undefined" && Boolean(window.localStorage);
}

function formatLocalDateKey(date: Date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function localDateKey(date = new Date()) {
  if (date.getHours() >= recommendationRolloverHour) {
    return formatLocalDateKey(date);
  }

  return formatLocalDateKey(
    new Date(date.getFullYear(), date.getMonth(), date.getDate() - 1),
  );
}

export function todayRecommendationCacheKey(date = new Date()) {
  return `${cacheKeyPrefix}:${localDateKey(date)}`;
}

export function millisecondsUntilNextTodayRecommendationRollover(
  date = new Date(),
) {
  const nextRollover = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
    recommendationRolloverHour,
    0,
    0,
    0,
  );

  if (date.getTime() >= nextRollover.getTime()) {
    nextRollover.setDate(nextRollover.getDate() + 1);
  }

  return Math.max(nextRollover.getTime() - date.getTime(), 0);
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

function isRecommendation(value: unknown): value is TodayRecommendation {
  if (!value || typeof value !== "object") {
    return false;
  }

  const recommendation = value as Record<string, unknown>;

  return (
    typeof recommendation.id === "string" &&
    typeof recommendation.title === "string" &&
    typeof recommendation.goalId === "string" &&
    typeof recommendation.personaId === "string" &&
    typeof recommendation.voicePackId === "string" &&
    typeof recommendation.materialMode === "string"
  );
}

function normalizePoolSnapshot(value: unknown) {
  if (!value || typeof value !== "object") {
    return undefined;
  }

  const pool = value as Record<string, unknown>;
  const items = Array.isArray(pool.items)
    ? pool.items.filter(isRecommendation)
    : [];

  if (items.length === 0) {
    return undefined;
  }

  const activeIndex =
    typeof pool.activeIndex === "number" && Number.isFinite(pool.activeIndex)
      ? Math.min(Math.max(Math.round(pool.activeIndex), 0), items.length - 1)
      : 0;

  return {
    activeIndex,
    items,
    size:
      typeof pool.size === "number" && Number.isFinite(pool.size)
        ? Math.max(Math.round(pool.size), items.length)
        : items.length,
  };
}

function stringArray(value: unknown) {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string" && item.length > 0)
    : [];
}

function unique(values: string[]) {
  return Array.from(new Set(values));
}

function clampPoolActiveIndex(activeIndex: number, size: number) {
  if (size <= 0) {
    return 0;
  }

  return Math.min(Math.max(Math.round(activeIndex), 0), size - 1);
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
      pool: normalizePoolSnapshot(
        (parsedCache as Partial<TodayRecommendationCacheRecord>).pool,
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
    poolActiveIndex?: number;
    poolItems?: TodayRecommendation[];
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
  const poolItems = options.poolItems ?? currentCache?.pool?.items;
  const matchedPoolIndex = poolItems?.findIndex(
    (item) => item.id === recommendation.id,
  );
  const resolvedPoolActiveIndex =
    options.poolActiveIndex ??
    (matchedPoolIndex !== undefined && matchedPoolIndex >= 0
      ? matchedPoolIndex
      : currentCache?.pool?.activeIndex ?? 0);
  const pool =
    poolItems && poolItems.length > 0
      ? {
          activeIndex: clampPoolActiveIndex(
            resolvedPoolActiveIndex,
            poolItems.length,
          ),
          items: poolItems,
          size: poolItems.length,
        }
      : undefined;
  const cacheRecord: TodayRecommendationCacheRecord = {
    date: localDateKey(date),
    recommendation,
    completedRecommendationIds,
    pool,
    shownRecommendationIds,
    updatedAt: new Date().toISOString(),
  };

  window.localStorage.setItem(
    todayRecommendationCacheKey(date),
    JSON.stringify(cacheRecord),
  );

  return cacheRecord;
}

export function advanceCachedTodayRecommendation(date = new Date()) {
  const currentCache = readTodayRecommendationCache(date);
  const poolItems = currentCache?.pool?.items ?? [];

  if (!currentCache || poolItems.length < 2) {
    return null;
  }

  const currentIndex = poolItems.findIndex(
    (item) => item.id === currentCache.recommendation.id,
  );
  const activeIndex =
    currentIndex >= 0 ? currentIndex : currentCache.pool?.activeIndex ?? 0;
  const nextIndex = (activeIndex + 1) % poolItems.length;
  const nextRecommendation = poolItems[nextIndex];

  if (!nextRecommendation) {
    return null;
  }

  return writeTodayRecommendationCache(nextRecommendation, {
    completedRecommendationIds: currentCache.completedRecommendationIds,
    date,
    poolActiveIndex: nextIndex,
    poolItems,
    shownRecommendationIds: currentCache.shownRecommendationIds,
  });
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
  refresh = false,
}: {
  refresh?: boolean;
} = {}) {
  const params = new URLSearchParams();

  if (refresh) {
    params.set("refresh", "1");
  }

  const queryString = params.toString();

  return queryString
    ? `/api/today-recommendation?${queryString}`
    : "/api/today-recommendation";
}

export async function fetchTodayRecommendationPackage({
  refresh = false,
  signal,
}: {
  refresh?: boolean;
  signal?: AbortSignal;
} = {}) {
  const response = await fetch(
    buildTodayRecommendationRequestURL({
      refresh,
    }),
    { signal },
  );

  if (!response.ok) {
    throw new Error("Failed to load today recommendation.");
  }

  const payload = (await response.json()) as {
    pool?: unknown;
    recommendation?: TodayRecommendation;
  };

  if (!payload.recommendation) {
    throw new Error("Today recommendation payload is empty.");
  }

  return {
    pool: normalizePoolSnapshot(payload.pool),
    recommendation: payload.recommendation,
  };
}

export async function completeTodayRecommendationAndPrefetch(
  recommendationId: string,
) {
  const completedState = markTodayRecommendationCompleted(recommendationId);
  const controller = new AbortController();

  try {
    const nextPackage = await fetchTodayRecommendationPackage({
      refresh: true,
      signal: controller.signal,
    });

    writeTodayRecommendationCache(nextPackage.recommendation, {
      completedRecommendationIds: completedState.completedRecommendationIds,
      poolActiveIndex: nextPackage.pool?.activeIndex,
      poolItems: nextPackage.pool?.items,
    });

    return nextPackage.recommendation;
  } catch {
    return null;
  }
}
