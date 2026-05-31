import { NextResponse } from "next/server";

import { requireAuthContext } from "@/lib/auth/require-user";
import { handleApiError } from "@/lib/errors";
import {
  advanceTodayRecommendationPool,
  getOrCreateTodayRecommendationPool,
  selectActiveTodayRecommendation,
} from "@/lib/recommendations/today-recommendation-pool";

export async function GET(request: Request) {
  try {
    const authContext = await requireAuthContext();
    const url = new URL(request.url);
    const shouldAdvance = url.searchParams.get("refresh") === "1";
    const pool = shouldAdvance
      ? await advanceTodayRecommendationPool({
          userId: authContext.profileId,
        })
      : await getOrCreateTodayRecommendationPool({
          userId: authContext.profileId,
        });
    const recommendation = selectActiveTodayRecommendation(pool);

    return NextResponse.json({
      recommendation,
      pool: {
        activeIndex: pool.activeIndex,
        items: pool.items,
        size: pool.items.length,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
