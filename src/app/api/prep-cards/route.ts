import { NextResponse } from "next/server";

import { generatePrepCard } from "@/lib/ai/prep-card";
import { handleApiError, readJsonBody } from "@/lib/errors";
import { getMaterialBriefRecord } from "@/lib/materials/material-store";
import {
  listPrepCardRecords,
  savePrepCardRecord,
} from "@/lib/practice/prep-card-store";
import { createPrepCardInputSchema } from "@/lib/validation/practice";

export function GET() {
  return NextResponse.json({
    prepCards: listPrepCardRecords(),
  });
}

export async function POST(request: Request) {
  try {
    const input = createPrepCardInputSchema.parse(await readJsonBody(request));
    const materialBrief = input.materialId
      ? getMaterialBriefRecord(input.materialId)
      : null;
    const generatedPrepCard = await generatePrepCard({
      ...input,
      materialBrief,
    });
    const prepCard = savePrepCardRecord(input, generatedPrepCard);

    return NextResponse.json(
      {
        prepCard,
      },
      { status: 201 },
    );
  } catch (error) {
    return handleApiError(error);
  }
}
