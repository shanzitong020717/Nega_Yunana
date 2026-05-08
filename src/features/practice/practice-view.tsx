"use client";

import { useState } from "react";

import { PageHeader } from "@/components/page-header";
import { PracticeSetup } from "@/features/practice/practice-setup";
import { PrepCardForm } from "@/features/practice/prep-card-form";
import { PrepCardView } from "@/features/practice/prep-card-view";
import type { PrepCardRecord } from "@/lib/practice/prep-card-store";

export function PracticeView() {
  const [prepCards, setPrepCards] = useState<PrepCardRecord[]>([]);
  const [selectedPrepCard, setSelectedPrepCard] = useState<PrepCardRecord | null>(
    null,
  );

  function handlePrepCardCreated(prepCard: PrepCardRecord) {
    setPrepCards((currentPrepCards) => [prepCard, ...currentPrepCards]);
    setSelectedPrepCard(prepCard);
  }

  return (
    <>
      <PageHeader
        eyebrow="Practice"
        title="Meeting simulator setup"
        description="Generate a customer-specific prep card, choose the practice mode and persona, then enter the meeting room."
      />

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_24rem]">
        <div className="min-w-0 space-y-4">
          <PrepCardForm onCreated={handlePrepCardCreated} />
          <PrepCardView prepCard={selectedPrepCard} />
        </div>
        <PracticeSetup prepCards={prepCards} />
      </div>
    </>
  );
}
