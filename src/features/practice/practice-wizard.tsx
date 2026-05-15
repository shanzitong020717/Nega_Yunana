"use client";

import { CheckCircle2, FileText, Mic2, UserRound } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { defaultScenarioPack, type PracticeGoalId } from "@/data/scenario-packs";
import { VoicePackSelector } from "@/features/practice/voice-pack-selector";

type PracticeWizardProps = {
  materialId?: string;
};

type WizardStep = 1 | 2 | 3;

const focusTags = [
  "商业价值",
  "隐私安全",
  "试点推进",
  "简短回答",
  "探索式提问",
  "产品演示表达",
  "应用场景说明",
  "优缺点对比",
  "竞品差异",
  "产品参数解释",
] as const;

const materialChoices = [
  {
    id: "recent_material",
    label: "最近客户材料",
    description: "使用最近上传或最近练习过的材料。",
  },
  {
    id: "no_material",
    label: "不使用材料",
    description: "直接练通用客户会谈场景。",
  },
  {
    id: "memory_context",
    label: "使用系统记忆",
    description: "根据长期弱点、表达库和材料记忆生成训练。",
  },
] as const;

const modeByGoalId: Record<PracticeGoalId, string> = {
  customer_qa: "customer_qa",
  demo_narration: "demo_narration",
  objection_handling: "objection_handling",
  solution_meeting: "solution_meeting",
  quick_pitch: "quick_pitch",
};

export function PracticeWizard({ materialId }: PracticeWizardProps) {
  const router = useRouter();
  const defaultPersona =
    defaultScenarioPack.personas.find((persona) => persona.id === "technical_lead") ??
    defaultScenarioPack.personas[0];
  const defaultVoicePack =
    defaultScenarioPack.voicePacks.find(
      (voicePack) => voicePack.id === "ethan-technical-lead",
    ) ?? defaultScenarioPack.voicePacks[0];
  const [step, setStep] = useState<WizardStep>(1);
  const [goalId, setGoalId] = useState<PracticeGoalId>("customer_qa");
  const [personaId, setPersonaId] = useState<string>(defaultPersona.id);
  const [voicePackId, setVoicePackId] = useState<string>(defaultVoicePack.id);
  const [selectedMaterialId, setSelectedMaterialId] = useState(
    materialId ?? "recent_material",
  );
  const [selectedFocusTags, setSelectedFocusTags] = useState<string[]>([
    "商业价值",
    "隐私安全",
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function toggleFocusTag(tag: string) {
    setSelectedFocusTags((currentTags) =>
      currentTags.includes(tag)
        ? currentTags.filter((currentTag) => currentTag !== tag)
        : [...currentTags, tag],
    );
  }

  async function createPracticeSession() {
    setError(null);
    setIsSubmitting(true);

    const payload = {
      scenarioPackId: defaultScenarioPack.id,
      goalId,
      mode: modeByGoalId[goalId],
      personaId,
      voicePackId,
      materialId:
        selectedMaterialId === "no_material" ? undefined : selectedMaterialId,
      focusTags: selectedFocusTags,
      trainingFocus: selectedFocusTags,
      difficulty: "normal",
    };

    try {
      const response = await fetch("/api/practice-sessions", {
        method: "POST",
        body: JSON.stringify(payload),
        headers: {
          "content-type": "application/json",
        },
      });
      const result = (await response.json()) as {
        practiceSession?: { id: string };
        error?: { message?: string };
      };

      if (!response.ok || !result.practiceSession) {
        throw new Error(result.error?.message ?? "练习会话创建失败");
      }

      router.push(`/practice/${result.practiceSession.id}`);
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "练习会话创建失败",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="rounded-md border border-[var(--border)] bg-[var(--surface)] p-5">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border)] pb-4">
        <div>
          <p className="text-sm font-semibold text-[var(--primary)]">
            第 {step} 步 / 共 3 步
          </p>
          <h2 className="mt-1 text-xl font-semibold text-[var(--foreground)]">
            {step === 1
              ? "这次想练什么？"
              : step === 2
                ? "让 AI 扮演谁？"
                : "要使用什么材料或记忆？"}
          </h2>
        </div>
        <div className="flex gap-2 text-xs text-[var(--muted)]">
          {[1, 2, 3].map((item) => (
            <span
              key={item}
              className={[
                "h-2.5 w-10 rounded-full",
                item <= step ? "bg-[var(--primary)]" : "bg-[var(--border)]",
              ].join(" ")}
              aria-hidden="true"
            />
          ))}
        </div>
      </div>

      {step === 1 ? (
        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          {defaultScenarioPack.practiceGoals.map((goal) => {
            const isSelected = goalId === goal.id;

            return (
              <button
                key={goal.id}
                type="button"
                aria-pressed={isSelected}
                onClick={() => setGoalId(goal.id)}
                className={[
                  "min-h-36 rounded-md border bg-[var(--surface)] p-4 text-left transition",
                  isSelected
                    ? "border-[var(--primary)] bg-[#e7f4f2]"
                    : "border-[var(--border)] hover:border-[var(--primary)] hover:bg-[#f6fbfa]",
                ].join(" ")}
              >
                <Mic2 className="h-5 w-5 text-[var(--primary)]" aria-hidden="true" />
                <span className="mt-3 block text-sm font-semibold">{goal.label}</span>
                <span className="mt-2 block text-sm leading-6 text-[var(--muted)]">
                  {goal.description}
                </span>
              </button>
            );
          })}
        </div>
      ) : null}

      {step === 2 ? (
        <div className="mt-5 grid gap-5">
          <div>
            <h3 className="text-sm font-semibold">客户角色</h3>
            <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
              {defaultScenarioPack.personas.map((persona) => {
                const isSelected = personaId === persona.id;

                return (
                  <button
                    key={persona.id}
                    type="button"
                    aria-pressed={isSelected}
                    onClick={() => setPersonaId(persona.id)}
                    className={[
                      "min-h-36 rounded-md border bg-[var(--surface)] p-4 text-left transition",
                      isSelected
                        ? "border-[var(--primary)] bg-[#e7f4f2]"
                        : "border-[var(--border)] hover:border-[var(--primary)] hover:bg-[#f6fbfa]",
                    ].join(" ")}
                  >
                    <UserRound className="h-5 w-5 text-[var(--primary)]" aria-hidden="true" />
                    <span className="mt-3 block text-sm font-semibold">
                      {persona.label}
                    </span>
                    <span className="mt-2 block text-sm leading-6 text-[var(--muted)]">
                      {persona.communicationStyle}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold">声音包</h3>
            <div className="mt-3">
              <VoicePackSelector
                voicePacks={defaultScenarioPack.voicePacks}
                selectedVoicePackId={voicePackId}
                onSelect={setVoicePackId}
              />
            </div>
          </div>
        </div>
      ) : null}

      {step === 3 ? (
        <div className="mt-5 grid gap-5">
          <div>
            <h3 className="text-sm font-semibold">材料与记忆</h3>
            <div className="mt-3 grid gap-3 md:grid-cols-3">
              {materialChoices.map((choice) => {
                const isSelected = selectedMaterialId === choice.id;

                return (
                  <button
                    key={choice.id}
                    type="button"
                    aria-pressed={isSelected}
                    onClick={() => setSelectedMaterialId(choice.id)}
                    className={[
                      "min-h-28 rounded-md border bg-[var(--surface)] p-4 text-left transition",
                      isSelected
                        ? "border-[var(--primary)] bg-[#e7f4f2]"
                        : "border-[var(--border)] hover:border-[var(--primary)] hover:bg-[#f6fbfa]",
                    ].join(" ")}
                  >
                    <FileText className="h-5 w-5 text-[var(--primary)]" aria-hidden="true" />
                    <span className="mt-3 block text-sm font-semibold">
                      {choice.label}
                    </span>
                    <span className="mt-2 block text-sm leading-6 text-[var(--muted)]">
                      {choice.description}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold">训练重点</h3>
            <div className="mt-3 flex flex-wrap gap-2">
              {focusTags.map((tag) => {
                const isSelected = selectedFocusTags.includes(tag);

                return (
                  <button
                    key={tag}
                    type="button"
                    aria-pressed={isSelected}
                    onClick={() => toggleFocusTag(tag)}
                    className={[
                      "inline-flex min-h-10 items-center gap-2 rounded-md border px-3 text-sm font-medium transition",
                      isSelected
                        ? "border-[var(--primary)] bg-[#e7f4f2] text-[var(--primary-strong)]"
                        : "border-[var(--border)] bg-[var(--surface)] text-[var(--muted)] hover:border-[var(--primary)]",
                    ].join(" ")}
                  >
                    {isSelected ? (
                      <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                    ) : null}
                    {tag}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      ) : null}

      {error ? (
        <p className="mt-5 rounded-md border border-[#f3b8b2] bg-[#fff0ee] px-3 py-2 text-sm text-[var(--danger)]">
          {error}
        </p>
      ) : null}

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          disabled={step === 1 || isSubmitting}
          onClick={() => setStep((currentStep) => (currentStep - 1) as WizardStep)}
          className="inline-flex min-h-11 items-center rounded-md border border-[var(--border)] px-4 text-sm font-medium transition hover:border-[var(--primary)] disabled:cursor-not-allowed disabled:opacity-50"
        >
          上一步
        </button>

        {step < 3 ? (
          <button
            type="button"
            onClick={() => setStep((currentStep) => (currentStep + 1) as WizardStep)}
            className="inline-flex min-h-11 items-center rounded-md bg-[var(--primary)] px-4 text-sm font-medium text-white transition hover:bg-[var(--primary-strong)]"
          >
            下一步
          </button>
        ) : (
          <button
            type="button"
            disabled={isSubmitting}
            onClick={createPracticeSession}
            className="inline-flex min-h-11 items-center rounded-md bg-[var(--primary)] px-4 text-sm font-medium text-white transition hover:bg-[var(--primary-strong)] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? "创建中..." : "开始练习"}
          </button>
        )}
      </div>
    </section>
  );
}
