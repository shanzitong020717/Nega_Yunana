"use client";

import { PageHeader } from "@/components/page-header";
import { PracticeWizard } from "@/features/practice/practice-wizard";

type PracticeViewProps = {
  searchParams?: Record<string, string | string[] | undefined>;
};

function firstSearchValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export function PracticeView({ searchParams = {} }: PracticeViewProps) {
  const initialSelection = {
    goalId: firstSearchValue(searchParams.goalId),
    personaId: firstSearchValue(searchParams.personaId),
    voicePackId: firstSearchValue(searchParams.voicePackId),
    materialMode: firstSearchValue(searchParams.materialMode),
    materialId: firstSearchValue(searchParams.materialId),
  };
  const initialStep =
    firstSearchValue(searchParams.initialStep) === "confirm" ? 3 : 1;

  return (
    <>
      <PageHeader
        eyebrow="练习"
        title="创建一次练习"
        description="用 3 步选择练习目标、客户角色、AI Studio 音色和材料重点，默认设置可以直接开始。"
      />

      <PracticeWizard
        initialSelection={initialSelection}
        initialStep={initialStep}
      />
    </>
  );
}
