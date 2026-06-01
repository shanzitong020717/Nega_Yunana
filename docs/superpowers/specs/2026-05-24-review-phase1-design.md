# 单次练习复盘第一阶段 SDD

日期：2026-05-24

## 1. 背景

当前系统已经具备练习会话、转写保存、基础复盘、表达库、弱项追踪和记忆中心的雏形，但复盘结果还不够贴近英语口语学习的核心需求。现在的 `sentenceUpgrades` 只覆盖“原句是否需要升级”，缺少更完整的句子级诊断：

- 语法错误和用词错误没有结构化拆分。
- 用户说得好的地方没有被充分肯定，也没有沉淀高级词汇、同义替换和商务语气亮点。
- 不地道、不够精炼、不够商务的表达没有按问题类型拆开。
- 复盘结果没有稳定转化为长期记忆和后续训练数据。

第一阶段目标是先把“单次练习复盘”做扎实，让用户每完成一次实时对话，都能得到清晰、可操作、能沉淀的复盘。

## 2. 第一阶段目标

本阶段只解决一次练习结束后的详细复盘。

用户完成练习后，复盘页面必须能回答：

1. 我这次哪里说错了？
2. 我这次哪里说得好？
3. 哪些表达不够地道、不够精炼、不够商务？
4. 我应该怎么改成更自然、更适合商务会谈的英文？
5. 哪些内容应该保存到表达库？
6. 哪些说话习惯、弱点或亮点应该进入长期记忆？

成功后，复盘结果要能驱动：

- 复盘页面的第一屏总结。
- 逐句精修模块。
- 表达库候选。
- 长期记忆候选。
- 弱项统计更新。
- 下一次训练建议。

## 3. 非目标

第一阶段不做以下内容：

- 不完整实现周/月/长期趋势复盘页面。
- 不做复杂图表和趋势可视化。
- 不重构所有历史 Review 数据。
- 不改 Gemini 实时语音链路。
- 不把所有内存 store 一次性迁移到 Supabase。

但第一阶段必须为第二阶段预留结构化数据，使后续可以按 7 天、30 天、全部时间做统计。

## 4. 产品结构

单次复盘页面采用三层结构。

### 4.1 30 秒复盘结论

第一屏给用户快速理解本次表现。

内容包括：

- 本次总评：一句中文总结。
- 说得好的 2-3 点。
- 最需要改进的 2-3 点。
- 本次新增表达库候选数量。
- 本次新增长期记忆候选数量。
- 下一次推荐训练方向。

示例：

```text
本次总评：
你能清楚说明 Rokid 的会议翻译价值，但在客户追问隐私和部署时回答偏长，需要更短、更有边界感。

说得好的地方：
- 能把实时字幕连接到跨语言会议场景。
- 使用了 workflow fit 这类更商务的表达。

最需要改：
- 安全问题回答偏长。
- 有些句子还停留在功能描述，没有转成客户价值。
```

### 4.2 逐句精修

这是第一阶段的核心模块。只分析用户说过的话，不分析 AI 客户句子。

每一句用户英文都生成一个 `SentenceReview`，包含：

- 原句。
- 中文意思。
- 质量等级：优秀、良好、需要改进。
- 语法错误。
- 用词错误。
- 不自然/不精炼/不商务的问题。
- 亮点。
- 更自然表达。
- 为什么这样改。
- 可保存到表达库的表达。

如果原句已经自然，不强行改写。系统要明确肯定用户：

```text
这句话已经很自然，结构清晰，适合商务会谈。它先限定 pilot 范围，再说明评估维度。
```

### 4.3 本次沉淀

这一层把复盘结果转成资产。

包含：

- 表达库候选：高价值句子、升级后表达、高级词汇。
- 长期记忆候选：常见错误、说话习惯、表达亮点、下次训练重点。
- 弱项更新：语法准确性、词汇重复、回答过长、只讲功能、缺少下一步等。
- 下一次练习建议：目标、客户角色、训练重点。

## 5. 数据模型设计

### 5.1 扩展 Review Payload

保留当前 `sentenceUpgrades` 以兼容旧页面，同时新增更完整的 `sentenceReviews`。

```ts
type SentenceReviewQuality = "excellent" | "good" | "needs_improvement";

type SentenceIssue = {
  type:
    | "grammar"
    | "word_choice"
    | "naturalness"
    | "conciseness"
    | "business_tone"
    | "logic";
  severity: 1 | 2 | 3 | 4 | 5;
  originalFragment: string;
  correction: string;
  explanationZh: string;
};

type SentenceHighlight = {
  type:
    | "advanced_word"
    | "business_tone"
    | "good_structure"
    | "synonym_usage"
    | "clear_next_step"
    | "customer_empathy";
  text: string;
  explanationZh: string;
  alternatives?: string[];
};

type ReviewVocabularyItem = {
  term: string;
  phonetic?: string;
  chinese: string;
  example: string;
  sourceSentence: string;
};

type SentenceReview = {
  id: string;
  turnId?: string;
  original: string;
  translationZh: string;
  quality: SentenceReviewQuality;
  grammarIssues: SentenceIssue[];
  wordChoiceIssues: SentenceIssue[];
  naturalnessIssues: SentenceIssue[];
  highlights: SentenceHighlight[];
  upgradedExpression?: string;
  upgradedExpressionZh?: string;
  reasonZh: string;
  practicePrompt: string;
  vocabulary: ReviewVocabularyItem[];
  phrasebookCandidate?: {
    english: string;
    chinese: string;
    useCase: string;
    tags: string[];
  };
};
```

### 5.2 新增 Review Summary 字段

```ts
type ReviewSnapshot = {
  overallSummaryZh: string;
  strengths: string[];
  priorityImprovements: string[];
  phrasebookCandidateCount: number;
  memoryCandidateCount: number;
  nextPracticeFocus: string;
};
```

现有 `meetingOutcome`、`bestMoments`、`topImprovements` 可以继续存在，但 UI 第一屏优先使用 `reviewSnapshot`。如果旧数据没有 `reviewSnapshot`，则从现有字段兜底。

### 5.3 长期记忆候选

当前 `memoryCandidates` 字段只包含 `type/title/summary/sensitivity/confidence`。第一阶段扩展为：

```ts
type ReviewMemoryCandidate = {
  type:
    | "recurring_error"
    | "speaking_habit"
    | "strength"
    | "learning_preference"
    | "practice_focus";
  title: string;
  summary: string;
  evidence: string[];
  sensitivity: "low" | "medium" | "high";
  confidence: number;
  importance: 1 | 2 | 3 | 4 | 5;
  enabledForAi: boolean;
};
```

写入记忆中心时映射到现有 `MemoryItem`：

- `recurring_error` → `weakness`
- `speaking_habit` → `speaking_habit`
- `strength` → `strength`
- `learning_preference` → `learning_preference`
- `practice_focus` → `weakness` 或 `learning_preference`

### 5.4 弱项更新

第一阶段继续使用现有 `weaknessUpdates`，但 DeepSeek prompt 必须要求从逐句结果中提取证据。

重点弱项包括：

- `grammar_accuracy`
- `repetitive_vocabulary`
- `long_answers`
- `feature_only_talk`
- `missing_next_step`
- `weak_discovery`
- `unclear_positioning`
- `weak_objection_handling`
- `fluency`

## 6. AI 分析设计

### 6.1 模型分工

- Gemini Live：只负责实时语音对话。
- DeepSeek：负责单次复盘、逐句精修、表达库候选、记忆候选、弱项更新。
- 数据库/Supabase：保存 Review、TranscriptTurn、Phrase、Memory、WeaknessMetric。

### 6.2 Prompt 重点

复盘 prompt 必须明确：

- 只分析用户发言。
- 每一句用户发言都要进入 `sentenceReviews`。
- 对每句分别输出 grammar、wordChoice、naturalness 三类问题。
- 有亮点必须肯定，不要只挑错。
- 如果句子已经自然，不要硬改写。
- 更自然表达要结合客户角色、练习目标、商务语境和上下文。
- 不允许编造产品参数、价格、认证、客户案例。
- 记忆候选必须是长期可复用的信息，不能保存敏感客户内容。

### 6.3 Mock 复盘

测试和缺少 API key 时，mock review 也必须包含 `sentenceReviews`，避免开发环境页面与生产结构脱节。

## 7. 页面设计

### 7.1 ReviewView 页面顺序

建议顺序：

1. `ReviewSummaryCard`：30 秒复盘结论。
2. `SentenceReviewPanel`：逐句精修。
3. `ReviewHighlightsPanel`：亮点表达和高级词汇。
4. `ReviewImprovementsPanel`：语法、用词、不自然表达汇总。
5. `SentenceUpgradeTable`：保留兼容，也可以逐步被 `SentenceReviewPanel` 吸收。
6. `PhrasebookSuggestions`：保存表达。
7. `MemoryCandidates`：保存长期记忆。
8. 隐私控制。

### 7.2 逐句卡片

每张卡片分为：

- 顶部：原句 + 中文意思 + 质量标签。
- 左侧：问题列表。
- 右侧：更自然表达/肯定反馈。
- 底部：高级词汇、保存到表达库、练习提示。

质量展示：

- `excellent`：重点肯定亮点，不展示“必须修改”。
- `good`：展示小幅升级建议。
- `needs_improvement`：展示错误和改写。

## 8. 数据流

```text
用户结束练习
  ↓
保存 transcript
  ↓
POST /api/practice-sessions/:sessionId/review
  ↓
generatePracticeReview()
  ↓
DeepSeek 输出结构化 JSON
  ↓
parseReviewPayload() 校验
  ↓
保存 Review
  ↓
upsertWeaknessUpdates()
  ↓
生成 memoryCandidates
  ↓
用户在复盘页选择保存/编辑/忽略记忆
```

第一阶段不自动把所有记忆候选写入长期记忆。默认展示候选，让用户确认保存，避免错误记忆污染数据库。

## 9. 错误处理

- DeepSeek 输出不合法：返回 retryable error，前端显示“复盘生成失败，可重试”。
- `sentenceReviews` 为空：尝试从 `sentenceUpgrades` 兜底；如果仍为空，显示总评和改进点。
- Transcript 为空：不生成逐句复盘，返回可读错误。
- 记忆保存失败：只影响该条记忆，不影响复盘页面。
- 表达库保存失败：按钮显示“重试保存”。

## 10. 第二阶段预留

第一阶段产生的数据必须能支撑第二阶段长期统计：

- 每个 `SentenceIssue` 带 type/severity/evidence。
- 每个 `SentenceHighlight` 带 type/text。
- 每次 Review 有 createdAt/sessionId/persona/goal。
- `weaknessUpdates` 有 type/severity/evidence/recommendedDrill。
- `memoryCandidates` 有 evidence/confidence/importance。

第二阶段可基于这些数据实现：

- 近 7 天、近 30 天、长期成长总结。
- 高频错误 Top 5。
- 高级表达掌握趋势。
- 每 100 词语法/用词错误率。
- 弱项复发率和改善趋势。

## 11. 验收标准

- 单次复盘第一屏能给出清晰中文结论。
- 用户每句英文都有逐句复盘。
- 语法错误、用词错误、不自然表达分开展示。
- 亮点表达会被肯定，并给出同义替换或可复用表达。
- 自然句不会被强行改写。
- 每次复盘能生成表达库候选。
- 每次复盘能生成长期记忆候选。
- 弱项更新能进入现有进步/复盘统计。
- 测试环境 mock review 与生产 payload 结构一致。

