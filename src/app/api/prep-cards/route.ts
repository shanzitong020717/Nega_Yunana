import { NextResponse } from "next/server";

import { requireAuthContext } from "@/lib/auth/require-user";
import { generatePrepCard } from "@/lib/ai/prep-card";
import { handleApiError, readJsonBody } from "@/lib/errors";
import {
  getMaterialBriefRecord,
  getMaterialRecord,
} from "@/lib/materials/material-store";
import {
  listPrepCardRecords,
  savePrepCardRecord,
} from "@/lib/practice/prep-card-store";
import { createPrepCardInputSchema } from "@/lib/validation/practice";

export async function GET() {
  try {
    const authContext = await requireAuthContext();

    return NextResponse.json({
      prepCards: listPrepCardRecords({ userId: authContext.profileId }),
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const authContext = await requireAuthContext();
    const scope = { userId: authContext.profileId };
    const input = createPrepCardInputSchema.parse(await readJsonBody(request));

    const ownedMaterial = input.materialId
      ? getMaterialRecord(input.materialId, scope)
      : null;
    const materialBrief = ownedMaterial
      ? getMaterialBriefRecord(ownedMaterial.id)
      : null;
    const generatedPrepCard = await generatePrepCard({
      ...input,
      materialBrief,
    });
    const prepCard = savePrepCardRecord(input, generatedPrepCard, scope);

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
