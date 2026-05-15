"use client";

import { PracticeWizard } from "@/features/practice/practice-wizard";
import type { PrepCardRecord } from "@/lib/practice/prep-card-store";

type PracticeSetupProps = {
  prepCards?: PrepCardRecord[];
};

export function PracticeSetup({ prepCards = [] }: PracticeSetupProps) {
  return <PracticeWizard materialId={prepCards[0]?.materialId} />;
}
