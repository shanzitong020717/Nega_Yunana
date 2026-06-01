import {
  TEXT_ANALYSIS_BOUNDARY,
  generateTextJSON,
} from "@/lib/ai/text-client";
import {
  reviewAnalyticsSnapshotSchema,
  type ReviewAnalyticsSnapshot,
} from "@/lib/validation/review-analytics";

export type SentenceReviewSummary = {
  correction?: string;
  issueTypes: string[];
  original: string;
};

export type WeaknessSummary = {
  evidence: string;
  type: string;
};

export type MemorySummary = {
  summary: string;
  title: string;
};

type GenerateLongTermReviewSnapshotInput = {
  draft: ReviewAnalyticsSnapshot;
  memorySummaries: MemorySummary[];
  sentenceReviewSummaries: SentenceReviewSummary[];
  weaknessSummaries: WeaknessSummary[];
};

function buildPrompt(input: GenerateLongTermReviewSnapshotInput) {
  return `${TEXT_ANALYSIS_BOUNDARY}

你是一个面向 Rokid 海外销售/解决方案人员的英语口语教练。请基于确定性统计草稿，生成“长期复盘”JSON。

要求：
- 只输出 JSON，不要 Markdown。
- 不要编造客户、价格、认证、合同、参数。
- 重点总结长期成长、经常犯的错误、不自然表达、表达资产、下一阶段训练计划。
- 输出字段必须与 draft 的结构一致。
- 保留 draft 中的 id、range、generatedAt、staleAfter、sourceReviewIds、sourceSessionIds、trainingCount。
- aiGenerated 必须为 true。

确定性统计草稿:
${JSON.stringify(input.draft, null, 2)}

逐句复盘摘要:
${JSON.stringify(input.sentenceReviewSummaries, null, 2)}

弱项摘要:
${JSON.stringify(input.weaknessSummaries, null, 2)}

长期记忆摘要:
${JSON.stringify(input.memorySummaries, null, 2)}

Return JSON only.`;
}

export async function generateLongTermReviewSnapshot(
  input: GenerateLongTermReviewSnapshotInput,
) {
  try {
    const payload = await generateTextJSON({
      schemaName: "long-term review analytics",
      prompt: buildPrompt(input),
      maxTokens: 4000,
      timeoutMs: 12_000,
    });
    const parsed = reviewAnalyticsSnapshotSchema.parse({
      ...input.draft,
      ...(payload as Record<string, unknown>),
      id: input.draft.id,
      range: input.draft.range,
      generatedAt: input.draft.generatedAt,
      staleAfter: input.draft.staleAfter,
      sourceReviewIds: input.draft.sourceReviewIds,
      sourceSessionIds: input.draft.sourceSessionIds,
      trainingCount: input.draft.trainingCount,
      aiGenerated: true,
    });

    return parsed;
  } catch {
    return {
      ...input.draft,
      aiGenerated: false,
    };
  }
}
