"use client";

import { useEffect, useMemo, useState } from "react";
import {
  BookOpenText,
  Filter,
  Languages,
  LibraryBig,
  RotateCcw,
  ShieldQuestion,
  Sparkles,
  Upload,
  UserRound,
} from "lucide-react";

import { PageHeader } from "@/components/page-header";
import { StatusPill } from "@/components/status-pill";
import {
  DailyPhrasePractice,
  type PhraseMasteryStatus,
} from "@/features/phrasebook/daily-phrase-practice";
import {
  phraseCategories,
  seedPhrases,
  type PhraseCategory,
  type SeedPhrase,
} from "@/data/seed-phrases";

type PhraseSource = "all" | "built_in" | "material" | "review" | "user_added";
type MasteryFilter = "all" | PhraseMasteryStatus;
type CategoryFilter = "all" | PhraseCategory;

type PhraseItem = SeedPhrase & {
  id: string;
  source: Exclude<PhraseSource, "all">;
  masteryStatus: PhraseMasteryStatus;
  createdAt?: string | null;
};

type PhraseSectionProps = {
  title: string;
  description: string;
  phrases: PhraseItem[];
  emptyText: string;
  icon: typeof LibraryBig;
};

const productCategories: PhraseCategory[] = [
  "Product Positioning",
  "Feature Explanation",
  "Business Value",
  "Demo Narration",
  "产品应用场景",
  "产品优点与缺点",
  "竞品差异与替代方案对比",
  "产品详细参数",
];

const builtInPhrases: PhraseItem[] = seedPhrases.map((phrase, index) => ({
  ...phrase,
  id: `seed-${index}`,
  source: "built_in",
  masteryStatus:
    index < 3 ? "needs_practice" : index < 5 ? "reviewing" : "new",
}));

const sourceLabels: Record<PhraseSource, string> = {
  all: "全部来源",
  built_in: "内置表达",
  review: "最近复盘保存",
  material: "材料专属表达",
  user_added: "我的个人表达",
};

const masteryLabels: Record<MasteryFilter, string> = {
  all: "全部掌握状态",
  new: "新表达",
  needs_practice: "需要练习",
  reviewing: "复习中",
  mastered: "已掌握",
};

const categoryLabels: Record<CategoryFilter, string> = {
  all: "全部类别",
  Opening: "开场",
  "Discovery Questions": "探索式问题",
  "Product Positioning": "产品定位",
  "Feature Explanation": "功能说明",
  "Business Value": "商业价值",
  "Demo Narration": "演示讲解",
  产品应用场景: "产品应用场景",
  产品优点与缺点: "产品优点与缺点",
  竞品差异与替代方案对比: "竞品差异与替代方案对比",
  产品详细参数: "产品详细参数",
  "Objection Handling": "异议处理",
  "Pricing & Pilot": "价格与试点",
  "Closing & Next Step": "收尾与下一步",
  "Follow-up Email": "跟进邮件",
};

const phraseSourceLabels: Record<PhraseItem["source"], string> = {
  built_in: "内置表达",
  material: "来自材料",
  review: "来自复盘",
  user_added: "手动添加",
};

function normalizeMasteryStatus(status: unknown): PhraseMasteryStatus {
  if (
    status === "new" ||
    status === "needs_practice" ||
    status === "reviewing" ||
    status === "mastered"
  ) {
    return status;
  }

  if (status === "practicing") {
    return "reviewing";
  }

  return "needs_practice";
}

function normalizeSavedPhrase(phrase: PhraseItem): PhraseItem {
  return {
    ...phrase,
    masteryStatus: normalizeMasteryStatus(phrase.masteryStatus),
  };
}

function PhraseCard({ phrase }: { phrase: PhraseItem }) {
  return (
    <article className="rounded-md border border-[var(--border)] bg-[var(--surface)] p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          <StatusPill tone="primary">{categoryLabels[phrase.category]}</StatusPill>
          <StatusPill tone="neutral">{phraseSourceLabels[phrase.source]}</StatusPill>
        </div>
        <BookOpenText className="h-5 w-5 shrink-0 text-[var(--primary)]" aria-hidden="true" />
      </div>

      <h3 className="mt-3 text-base font-semibold leading-7">
        {phrase.english}
      </h3>
      <div className="mt-3 rounded-md border border-[var(--border)] bg-[var(--surface-subtle)] p-3">
        <div className="flex items-center gap-2">
          <Languages className="h-4 w-4 text-[var(--accent)]" aria-hidden="true" />
          <p className="text-xs font-semibold uppercase text-[var(--muted)]">
            中文含义
          </p>
        </div>
        <p className="mt-2 text-sm leading-6">{phrase.chinese}</p>
      </div>
      <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
        {phrase.useCase}
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        {phrase.tags.map((item) => (
          <span
            key={item}
            className="rounded-md border border-[var(--border)] px-2 py-1 text-xs text-[var(--muted)]"
          >
            {item}
          </span>
        ))}
      </div>
      <button
        type="button"
        className="mt-4 inline-flex min-h-10 items-center justify-center rounded-md border border-[var(--border)] px-3 text-sm font-medium transition hover:border-[var(--primary)]"
      >
        练这句
      </button>
    </article>
  );
}

function PhraseSection({
  title,
  description,
  phrases,
  emptyText,
  icon: Icon,
}: PhraseSectionProps) {
  return (
    <section className="rounded-md border border-[var(--border)] bg-[var(--surface)] p-5">
      <div className="flex items-start gap-3">
        <Icon className="mt-0.5 h-5 w-5 text-[var(--primary)]" aria-hidden="true" />
        <div>
          <h2 className="text-lg font-semibold">{title}</h2>
          <p className="mt-1 text-sm leading-6 text-[var(--muted)]">
            {description}
          </p>
        </div>
      </div>

      {phrases.length > 0 ? (
        <div className="mt-4 grid gap-3 lg:grid-cols-2">
          {phrases.slice(0, 4).map((phrase) => (
            <PhraseCard key={phrase.id} phrase={phrase} />
          ))}
        </div>
      ) : (
        <div className="mt-4 rounded-md border border-dashed border-[var(--border)] bg-[var(--surface-subtle)] p-4">
          <p className="text-sm font-semibold">{emptyText}</p>
        </div>
      )}
    </section>
  );
}

export function PhrasebookView() {
  const [category, setCategory] = useState<CategoryFilter>("all");
  const [source, setSource] = useState<PhraseSource>("all");
  const [tag, setTag] = useState("all");
  const [mastery, setMastery] = useState<MasteryFilter>("all");
  const [savedPhrases, setSavedPhrases] = useState<PhraseItem[]>([]);

  useEffect(() => {
    let isMounted = true;

    async function loadSavedPhrases() {
      try {
        const response = await fetch("/api/phrasebook");

        if (!response.ok) {
          return;
        }

        const payload = (await response.json()) as { phrases?: PhraseItem[] };

        if (isMounted) {
          setSavedPhrases(
            (payload.phrases ?? [])
              .filter((phrase) => phrase.source !== "built_in")
              .map(normalizeSavedPhrase),
          );
        }
      } catch {
        return;
      }
    }

    void loadSavedPhrases();

    return () => {
      isMounted = false;
    };
  }, []);

  const allPhrases = useMemo(
    () => [...builtInPhrases, ...savedPhrases],
    [savedPhrases],
  );
  const dailyPhrases = useMemo(
    () =>
      allPhrases
        .filter((phrase) => phrase.masteryStatus !== "mastered")
        .slice(0, 5),
    [allPhrases],
  );
  const tagOptions = useMemo(
    () =>
      Array.from(new Set(allPhrases.flatMap((phrase) => phrase.tags))).sort(),
    [allPhrases],
  );

  const phrases = useMemo(() => {
    return allPhrases.filter((phrase) => {
      const matchesCategory = category === "all" || phrase.category === category;
      const matchesSource = source === "all" || phrase.source === source;
      const matchesTag = tag === "all" || phrase.tags.includes(tag);
      const matchesMastery =
        mastery === "all" || phrase.masteryStatus === mastery;

      return matchesCategory && matchesSource && matchesTag && matchesMastery;
    });
  }, [allPhrases, category, source, tag, mastery]);

  const reviewPhrases = savedPhrases.filter((phrase) => phrase.source === "review");
  const productPhrases = allPhrases.filter((phrase) =>
    productCategories.includes(phrase.category),
  );
  const objectionPhrases = allPhrases.filter(
    (phrase) => phrase.category === "Objection Handling",
  );
  const userPhrases = savedPhrases.filter(
    (phrase) => phrase.source === "user_added",
  );
  const materialPhrases = savedPhrases.filter(
    (phrase) => phrase.source === "material",
  );

  return (
    <>
      <PageHeader
        eyebrow="每日复习"
        title="表达库"
        description="每天优先复习少量高频表达，再按来源和场景查找需要练的句子。"
      />

      <DailyPhrasePractice phrases={dailyPhrases} />

      <section className="rounded-md border border-[var(--border)] bg-[var(--surface)] p-4">
        <div className="flex items-center gap-2">
          <Filter className="h-5 w-5 text-[var(--primary)]" aria-hidden="true" />
          <h2 className="text-base font-semibold">筛选表达</h2>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <label className="flex flex-col gap-2 text-sm font-medium" htmlFor="phrase-category">
            类别
            <select
              id="phrase-category"
              value={category}
              onChange={(event) => setCategory(event.target.value as CategoryFilter)}
              className="min-h-11 rounded-md border border-[var(--border)] bg-white px-3 text-sm outline-none transition focus:border-[var(--primary)]"
            >
              <option value="all">{categoryLabels.all}</option>
              {phraseCategories.map((item) => (
                <option key={item} value={item}>
                  {categoryLabels[item]}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-2 text-sm font-medium" htmlFor="phrase-source">
            来源
            <select
              id="phrase-source"
              value={source}
              onChange={(event) => setSource(event.target.value as PhraseSource)}
              className="min-h-11 rounded-md border border-[var(--border)] bg-white px-3 text-sm outline-none transition focus:border-[var(--primary)]"
            >
              {Object.entries(sourceLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-2 text-sm font-medium" htmlFor="phrase-tag">
            标签
            <select
              id="phrase-tag"
              value={tag}
              onChange={(event) => setTag(event.target.value)}
              className="min-h-11 rounded-md border border-[var(--border)] bg-white px-3 text-sm outline-none transition focus:border-[var(--primary)]"
            >
              <option value="all">全部标签</option>
              {tagOptions.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-2 text-sm font-medium" htmlFor="phrase-mastery">
            掌握状态
            <select
              id="phrase-mastery"
              value={mastery}
              onChange={(event) => setMastery(event.target.value as MasteryFilter)}
              className="min-h-11 rounded-md border border-[var(--border)] bg-white px-3 text-sm outline-none transition focus:border-[var(--primary)]"
            >
              {Object.entries(masteryLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </section>

      <section
        aria-label="全部表达检索"
        className="rounded-md border border-[var(--border)] bg-[var(--surface)] p-5"
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <LibraryBig className="h-5 w-5 text-[var(--primary)]" aria-hidden="true" />
            <h2 className="text-lg font-semibold">全部表达检索</h2>
          </div>
          <StatusPill tone="neutral">{`${phrases.length} 句`}</StatusPill>
        </div>

        {phrases.length > 0 ? (
          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            {phrases.map((phrase) => (
              <PhraseCard key={phrase.id} phrase={phrase} />
            ))}
          </div>
        ) : (
          <div className="mt-4 rounded-md border border-dashed border-[var(--border)] bg-[var(--surface-subtle)] p-8 text-center">
            <h2 className="text-lg font-semibold">没有匹配的表达</h2>
            <p className="mt-2 text-sm text-[var(--muted)]">
              调整类别、来源、标签或掌握状态后继续查找。
            </p>
          </div>
        )}
      </section>

      <div className="grid gap-4 xl:grid-cols-2">
        <PhraseSection
          title="最近复盘保存"
          description="从复盘句子升级中保存下来的表达。"
          phrases={reviewPhrases}
          emptyText="复盘中保存的表达会出现在这里。"
          icon={RotateCcw}
        />
        <PhraseSection
          title="Rokid 高频产品表达"
          description="围绕应用场景、产品优缺点、竞品差异和参数说明的高频表达。"
          phrases={productPhrases}
          emptyText="暂无产品表达。"
          icon={Sparkles}
        />
        <PhraseSection
          title="异议回答表达"
          description="用于隐私、安全、部署、价格、竞品等客户异议。"
          phrases={objectionPhrases}
          emptyText="暂无异议回答表达。"
          icon={ShieldQuestion}
        />
        <PhraseSection
          title="我的个人表达"
          description="用户手动添加或长期沉淀的个人表达。"
          phrases={userPhrases}
          emptyText="还没有收藏个人表达。"
          icon={UserRound}
        />
        <PhraseSection
          title="材料专属表达"
          description="从客户材料和会前准备中沉淀的表达。"
          phrases={materialPhrases}
          emptyText="上传材料后，专属表达会出现在这里。"
          icon={Upload}
        />
      </div>
    </>
  );
}
