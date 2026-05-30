import { defaultScenarioPack } from "@/data/scenario-packs";
import { getDb } from "@/lib/db";
import { listMaterialRecords } from "@/lib/materials/material-store";
import { rankMemoriesForPractice } from "@/lib/memory/memory-store";
import { listPracticeSessionRecordsAsync } from "@/lib/practice/practice-session-store";
import {
  getDefaultProgressSummary,
  getProgressSummary,
} from "@/lib/progress/weakness-store";
import { getCachedReviewAnalytics } from "@/lib/progress/review-analytics-store";
import {
  buildPresetTodayRecommendationPool,
  TODAY_RECOMMENDATION_POOL_SIGNATURE,
  TODAY_RECOMMENDATION_POOL_SIZE,
  type TodayRecommendation,
} from "@/lib/recommendations/today-recommendation";

export type TodayRecommendationPoolRecord = {
  id: string;
  userId: string;
  dateKey: string;
  activeIndex: number;
  items: TodayRecommendation[];
  generatedAt: string;
  updatedAt: string;
};

const poolRecords = new Map<string, TodayRecommendationPoolRecord>();
const backendTimeZone = "Asia/Shanghai";

function canPersistTodayRecommendationPools() {
  return process.env.NODE_ENV !== "test" && Boolean(process.env.DATABASE_URL);
}

export function todayRecommendationDateKey(date = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    day: "2-digit",
    month: "2-digit",
    timeZone: backendTimeZone,
    year: "numeric",
  }).format(date);
}

function poolKey(userId: string, dateKey: string) {
  return `${userId}:${dateKey}`;
}

function isRecommendation(value: unknown): value is TodayRecommendation {
  if (!value || typeof value !== "object") {
    return false;
  }

  const recommendation = value as Record<string, unknown>;

  return (
    typeof recommendation.id === "string" &&
    typeof recommendation.title === "string" &&
    typeof recommendation.reason === "string" &&
    typeof recommendation.goalId === "string" &&
    typeof recommendation.personaId === "string" &&
    typeof recommendation.voicePackId === "string" &&
    typeof recommendation.materialMode === "string" &&
    typeof recommendation.href === "string"
  );
}

function normalizePoolItems(value: unknown) {
  return Array.isArray(value) ? value.filter(isRecommendation) : [];
}

function clampActiveIndex(activeIndex: number, size: number) {
  if (size <= 0) {
    return 0;
  }

  return Math.min(Math.max(activeIndex, 0), size - 1);
}

function persistedPoolToRecord(pool: {
  activeIndex: number;
  dateKey: string;
  generatedAt: Date;
  id: string;
  items: unknown;
  updatedAt: Date;
  userId: string;
}) {
  const items = normalizePoolItems(pool.items);

  return {
    id: pool.id,
    userId: pool.userId,
    dateKey: pool.dateKey,
    activeIndex: clampActiveIndex(pool.activeIndex, items.length),
    items,
    generatedAt: pool.generatedAt.toISOString(),
    updatedAt: pool.updatedAt.toISOString(),
  };
}

function memoryPoolToRecord(pool: TodayRecommendationPoolRecord) {
  return {
    ...pool,
    activeIndex: clampActiveIndex(pool.activeIndex, pool.items.length),
    items: pool.items,
  };
}

function hasCurrentRandomPoolSignature(pool: TodayRecommendationPoolRecord) {
  return pool.items.some((item) =>
    item.evidence.includes(TODAY_RECOMMENDATION_POOL_SIGNATURE),
  );
}

async function buildPoolItems(userId: string) {
  const scope = { userId };
  const recentTrainingCount = (await listPracticeSessionRecordsAsync(scope)).length;
  const progress = getProgressSummary(recentTrainingCount, scope);
  const resolvedProgress =
    progress.topWeaknesses.length > 0
      ? progress
      : { ...getDefaultProgressSummary(), recentTrainingCount };
  const focusTags = resolvedProgress.topWeaknesses.flatMap((weakness) => [
    weakness.label,
    weakness.recommendedDrill,
  ]);

  return buildPresetTodayRecommendationPool({
    progress: resolvedProgress,
    recentMaterials: listMaterialRecords(scope).slice(0, 5),
    memories: rankMemoriesForPractice({
      focusTags,
      limit: 6,
      userId: scope.userId,
    }),
    analytics: getCachedReviewAnalytics("7d", scope),
    mockMode: true,
  });
}

async function buildPoolRecord(userId: string, dateKey: string) {
  const now = new Date().toISOString();

  return {
    id: `today_pool_${userId}_${dateKey}`,
    userId,
    dateKey,
    activeIndex: 0,
    items: await buildPoolItems(userId),
    generatedAt: now,
    updatedAt: now,
  };
}

async function savePoolRecord(pool: TodayRecommendationPoolRecord) {
  if (!canPersistTodayRecommendationPools()) {
    poolRecords.set(poolKey(pool.userId, pool.dateKey), pool);
    return pool;
  }

  const db = getDb();
  const persistedPool = await db.todayRecommendationPool.upsert({
    where: {
      userId_dateKey: {
        userId: pool.userId,
        dateKey: pool.dateKey,
      },
    },
    create: {
      userId: pool.userId,
      dateKey: pool.dateKey,
      activeIndex: pool.activeIndex,
      items: pool.items,
      generatedAt: new Date(pool.generatedAt),
    },
    update: {
      activeIndex: pool.activeIndex,
      items: pool.items,
      generatedAt: new Date(pool.generatedAt),
    },
  });

  return persistedPoolToRecord(persistedPool);
}

async function readPoolRecord(userId: string, dateKey: string) {
  if (!canPersistTodayRecommendationPools()) {
    return poolRecords.get(poolKey(userId, dateKey)) ?? null;
  }

  const persistedPool = await getDb().todayRecommendationPool.findUnique({
    where: {
      userId_dateKey: {
        userId,
        dateKey,
      },
    },
  });

  return persistedPool ? persistedPoolToRecord(persistedPool) : null;
}

export async function getOrCreateTodayRecommendationPool({
  date = new Date(),
  force = false,
  userId,
}: {
  date?: Date;
  force?: boolean;
  userId: string;
}) {
  const dateKey = todayRecommendationDateKey(date);
  const existingPool = force ? null : await readPoolRecord(userId, dateKey);

  if (
    existingPool &&
    existingPool.items.length >= TODAY_RECOMMENDATION_POOL_SIZE &&
    hasCurrentRandomPoolSignature(existingPool)
  ) {
    return memoryPoolToRecord(existingPool);
  }

  const pool = await buildPoolRecord(userId, dateKey);

  return savePoolRecord(pool);
}

export async function advanceTodayRecommendationPool({
  date = new Date(),
  userId,
}: {
  date?: Date;
  userId: string;
}) {
  const pool = await getOrCreateTodayRecommendationPool({ date, userId });
  const nextIndex = (pool.activeIndex + 1) % pool.items.length;
  const updatedPool = {
    ...pool,
    activeIndex: nextIndex,
    updatedAt: new Date().toISOString(),
  };

  return savePoolRecord(updatedPool);
}

export function selectActiveTodayRecommendation(pool: TodayRecommendationPoolRecord) {
  return pool.items[clampActiveIndex(pool.activeIndex, pool.items.length)];
}

export async function preloadTodayRecommendationPoolsForAllUsers(date = new Date()) {
  if (!canPersistTodayRecommendationPools()) {
    return { processed: 0, dateKey: todayRecommendationDateKey(date) };
  }

  const users = await getDb().userProfile.findMany({
    select: { id: true },
  });

  for (const user of users) {
    await getOrCreateTodayRecommendationPool({
      date,
      force: true,
      userId: user.id,
    });
  }

  return {
    processed: users.length,
    dateKey: todayRecommendationDateKey(date),
  };
}

export function resetTodayRecommendationPoolsForTest() {
  poolRecords.clear();
}

export function getTodayRecommendationPoolConfig() {
  return {
    size: TODAY_RECOMMENDATION_POOL_SIZE,
    sourceGoals: defaultScenarioPack.practiceGoals.map((goal) => goal.id),
    timeZone: backendTimeZone,
  };
}
