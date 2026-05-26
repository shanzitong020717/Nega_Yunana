import { NextResponse } from "next/server";

import { handleApiError } from "@/lib/errors";
import {
  getTodayRecommendationPoolConfig,
  preloadTodayRecommendationPoolsForAllUsers,
} from "@/lib/recommendations/today-recommendation-pool";

export async function GET(request: Request) {
  try {
    const cronSecret = process.env.CRON_SECRET;
    const authHeader = request.headers.get("authorization");

    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const result = await preloadTodayRecommendationPoolsForAllUsers();

    return NextResponse.json({
      ok: true,
      ...result,
      config: getTodayRecommendationPoolConfig(),
    });
  } catch (error) {
    return handleApiError(error);
  }
}
