"use client";

import { PageHeader } from "@/components/page-header";
import { PracticeWizard } from "@/features/practice/practice-wizard";

export function PracticeView() {
  return (
    <>
      <PageHeader
        eyebrow="练习"
        title="创建一次练习"
        description="用 3 步选择练习目标、客户角色、AI Studio 音色和材料重点，默认设置可以直接开始。"
      />

      <PracticeWizard />
    </>
  );
}
