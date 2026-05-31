# 复盘会话回放与逐轮分析 SDD

日期：2026-06-01

## 1. 背景

当前系统已经具备单次复盘、逐句精修、长期复盘、表达库、记忆候选和弱项统计，但用户在复盘页里看不到一次练习的完整对话过程。现有复盘更像“报告摘要”，而不是“可回放、可定位、可继续学习的教练记录”。

用户真正需要的是：

1. 能选择某一次和 AI 客户的练习记录。
2. 能看到当时完整对话，包括 AI 客户问题、用户回答、英文转写和中文翻译。
3. 能点开任意一句或任意一轮，查看客户这句话的目的、用户回答是否答到点上、哪里好、哪里错、怎么改。
4. 能把高价值表达、常犯错误和长期说话习惯沉淀到表达库、记忆和长期复盘。

本设计保留当前所有复盘功能，并在其上增加“会话回放式复盘”。

## 2. 竞品参考

### 2.1 ELSA

ELSA Speech Analyzer 的重点是把口语表现拆到发音、语调、流利度、语法、词汇等维度，并给出具体改进建议。ELSA Feedback 还支持点击具体文本查看问题和示范。参考价值：

- 复盘不能只给总评，必须能定位到具体句子。
- 用户需要看到自己哪里好、哪里错、怎么修。
- 维度评分要和具体证据绑定，否则用户不信。

参考：

- https://elsaspeak.com/en/speech-analyzer
- https://elsanow.freshdesk.com/en/support/solutions/articles/31000177480-feedback

### 2.2 Yoodli

Yoodli 更接近商务沟通教练，强调转写、回放、时间戳反馈、结构化评分和组织标准。参考价值：

- 复盘应该有完整 transcript 和时间线。
- 反馈最好带时间点或轮次，用户能回到上下文。
- 商务会谈训练不仅评英语，还要评结构、清晰度、推进和异议处理。

参考：

- https://e.yoodli.ai/platform/ai-feedback
- https://e.yoodli.ai/use-cases/speech-coaches

### 2.3 SmallTalk2Me

SmallTalk2Me 偏考试口语复盘，重点在 fluency、coherence、vocabulary、grammar、pronunciation 等标准。参考价值：

- 长期统计需要稳定维度。
- 用户需要能看出自己一周、一个月在哪些方面成长。

参考：

- https://smalltalk2.me/

### 2.4 Duolingo Max

Duolingo Max 的 Explain My Answer 价值在于解释“为什么错”和“规则如何应用到这一次回答”。参考价值：

- 复盘不能只有改写结果，还要解释原因。
- 解释要贴合用户刚才说的句子，而不是泛泛讲语法。

参考：

- https://www.techlearning.com/how-to/what-is-duolingo-max-the-gpt-4-powered-learning-tool-explained-by-the-apps-product-manager

## 3. 产品目标

### 3.1 核心目标

把复盘从“练习后的报告页”升级为“可回看、可筛选、可逐轮学习、可沉淀资产的复盘工作台”。

### 3.2 用户问题

复盘必须能回答：

1. 我刚才和 AI 客户具体聊了什么？
2. 客户每次提问真正想获得什么信息？
3. 我的回答有没有回答到客户问题？
4. 我的英文哪里有语法、用词、自然度或商务语气问题？
5. 哪些地方说得好，值得保留和复用？
6. 这次最值得保存到表达库的句子是什么？
7. 这次有哪些长期习惯应该记住？
8. 下一次应该练同类问题的哪一块？

## 4. 非目标

本阶段不做以下内容：

- 不保存原始音频。
- 不做视频回放。
- 不做发音声学级评分，例如音素、音高、波形。
- 不重构实时语音链路。
- 不废弃现有复盘页内容。
- 不一次性重建所有历史复盘数据。旧数据走兼容展示。

## 5. 信息架构

### 5.1 复盘首页

`/progress` 从“长期复盘为主”调整为“复盘中心”。

页面结构：

1. 顶部：长期复盘概览，保留现有 7 天、30 天、全部时间统计。
2. 中部：练习记录列表，成为新的核心模块。
3. 底部：弱项追踪、成长亮点、下一次练习建议，保留现有能力。

练习记录卡片展示：

- 练习日期和时间。
- 练习时长。
- 对话轮数。
- 场景目标，例如“应用场景说明”“异议处理”。
- AI 客户角色，例如“企业买家”“技术负责人”。
- 音色包。
- 使用材料模式。
- 本次摘要。
- 关键标签。
- 复盘状态：已生成、生成失败、可重新生成。
- 操作：查看复盘、继续练同类场景、删除记录。

### 5.2 单次复盘详情页

`/reviews/[reviewId]` 保留现有结构，但调整为：

1. 30 秒教练结论。
2. 对话回放与逐轮分析。
3. 逐句精修。
4. 整体分析。
5. 表达沉淀。
6. 长期记忆。
7. 下一次训练建议。
8. 隐私控制。

## 6. 核心体验设计

### 6.1 对话回放模块

模块名：`完整对话`

布局：

- 左侧或上方：对话时间线。
- 右侧或下方：选中轮次的详细分析。
- 桌面端使用左右布局。
- 移动端使用上下布局。

每条对话展示：

- 说话人：AI 客户 / 你。
- 英文原文。
- 中文翻译。
- 时间戳。
- 轮次序号。
- 分析状态：有分析 / 无分析 / 旧记录无分析。

用户点击任意一条后，显示：

- 这句话在对话中的作用。
- 客户意图或用户表达目的。
- 如果是 AI 客户：客户想获得的信息。
- 如果是用户：是否答到客户问题。
- 句子问题和亮点。
- 更好的回答或下一步建议。
- 可保存表达。

### 6.2 逐轮分析

一轮对话以一个 AI 客户提问和随后的用户回答为核心。

逐轮分析字段：

- 客户刚才问什么。
- 客户真实意图。
- 用户回答摘要。
- 回答匹配度：good / partial / missed / off_topic。
- 匹配度中文解释。
- 应该如何回应。
- 推荐说法。
- 推荐说法中文。
- 关键商务逻辑。
- 可保存表达。

### 6.3 逐句精修

保留现有 `sentenceReviews`，但和 transcript 绑定。

每个用户句子应包含：

- 原句。
- 中文意思。
- 质量等级。
- 语法问题。
- 用词问题。
- 自然度问题。
- 商务语气问题。
- 逻辑问题。
- 亮点。
- 更自然表达。
- 为什么更好。
- 高级词汇。
- 来源轮次。

如果句子已经自然：

- 不强行改写。
- 显示肯定反馈。
- 显示可复用场景。

### 6.4 整体分析

整体分析保留现有评分卡，并新增“会谈流程地图”。

会谈流程地图阶段：

1. 开场寒暄。
2. 确认客户场景。
3. 介绍产品价值。
4. 回答细节追问。
5. 处理异议。
6. 推进下一步。

每个阶段展示：

- 状态：completed / partial / missing。
- 证据轮次。
- 做得好的地方。
- 缺口。
- 下一次建议。

### 6.5 表达沉淀

保留现有表达库建议，并增加来源上下文。

表达分三组：

- 本次必须掌握。
- 可替换说法。
- 高级词汇和短语。

每条表达展示：

- 英文。
- 中文。
- 使用场景。
- 适合客户角色。
- 来源轮次。
- 来源原句。
- 一键加入表达库。
- 一键加入下次训练。

### 6.6 长期记忆

保留现有记忆候选，增加透明解释。

每条记忆候选展示：

- 记忆类型。
- AI 为什么建议记住。
- 证据来自哪些轮次或句子。
- 敏感度。
- 置信度。
- 用户操作：确认记住、忽略、编辑后记住。

## 7. 数据模型设计

### 7.1 当前可复用模型

当前数据库已经有：

- `PracticeSession`
- `TranscriptTurn`
- `Review`
- `Phrase`
- `WeaknessMetric`
- `TodayRecommendationPool`

本阶段优先复用 `Review.payload` 保存结构化复盘，不新增数据库表。

### 7.2 Review Payload 新增字段

新增 `conversationReview`。

```ts
type ConversationReview = {
  summaryZh: string;
  turns: ConversationTurnReview[];
  stages: ConversationStageReview[];
  overallFlow: OverallConversationFlowReview;
};
```

### 7.3 ConversationTurnReview

```ts
type ConversationTurnReview = {
  id: string;
  turnId?: string;
  pairedTurnId?: string;
  pairIndex: number;
  speaker: "ai_customer" | "user";
  text: string;
  translationZh: string;
  timestamp: number;
  intentZh: string;
  roleInConversationZh: string;
  customerNeedZh?: string;
  answerFit?: "good" | "partial" | "missed" | "off_topic";
  answerFitReasonZh?: string;
  strengths: string[];
  issues: ConversationTurnIssue[];
  betterResponse?: {
    english: string;
    chinese: string;
    reasonZh: string;
  };
  relatedSentenceReviewIds: string[];
  phrasebookCandidate?: {
    english: string;
    chinese: string;
    useCase: string;
    tags: string[];
  };
};
```

### 7.4 ConversationTurnIssue

```ts
type ConversationTurnIssue = {
  type:
    | "answer_relevance"
    | "business_logic"
    | "missing_detail"
    | "overlong"
    | "grammar"
    | "word_choice"
    | "naturalness"
    | "tone";
  severity: 1 | 2 | 3 | 4 | 5;
  summaryZh: string;
  evidence: string;
  suggestionZh: string;
};
```

### 7.5 ConversationStageReview

```ts
type ConversationStageReview = {
  stage:
    | "opening"
    | "scenario_discovery"
    | "value_positioning"
    | "detail_answering"
    | "objection_handling"
    | "next_step";
  labelZh: string;
  status: "completed" | "partial" | "missing";
  evidenceTurnIds: string[];
  summaryZh: string;
  improvementZh: string;
};
```

### 7.6 OverallConversationFlowReview

```ts
type OverallConversationFlowReview = {
  answeredCustomerNeedsZh: string[];
  missedCustomerNeedsZh: string[];
  strongestMomentZh: string;
  weakestMomentZh: string;
  nextConversationStrategyZh: string;
};
```

## 8. 数据流

### 8.1 练习结束

当前流程：

1. 用户点击结束并复盘。
2. 前端保存 transcript。
3. 调用 `/api/practice-sessions/[sessionId]/review`。
4. 后端生成 review。
5. 跳转 `/reviews/[reviewId]`。

保持不变。

### 8.2 复盘生成

`generatePracticeReview` 输入：

- `practiceSession`
- `transcriptTurns`
- `persona`
- `materialBrief`
- `prepCard`
- `suggestedAnswers`

输出新增：

- `conversationReview`

要求：

- AI 必须基于真实 transcript。
- AI 客户句子只做意图和问题拆解。
- 用户句子做回答匹配、语言问题、商务逻辑和更好表达。
- `turnId` 必须尽量绑定 `TranscriptTurn.id`。
- 旧数据没有 turnId 时，可用 `pairIndex + speaker + timestamp` 做 UI key。

### 8.3 复盘查看

`/reviews/[reviewId]` 除了读取 review，还需要读取：

- 对应 `PracticeSession`
- 对应 `TranscriptTurn[]`

并传给 `ReviewView`。

如果 `review.conversationReview` 不存在：

- 仍显示 transcript。
- 右侧显示“该历史复盘没有逐轮分析，可点击重新生成复盘”。
- 保留现有句子升级、评分、表达库建议和记忆模块。

## 9. AI Prompt 设计

复盘 prompt 新增要求：

1. 输出 `conversationReview`。
2. 不要分析系统消息。
3. AI 客户内容用于拆解客户意图。
4. 用户内容用于语言和商务表现分析。
5. 每个用户回答必须判断是否回应了上一个 AI 客户问题。
6. 逐轮分析必须引用真实 transcript，不允许返回模板。
7. 不能编造产品参数、价格、认证、准确率、合同条款。
8. 如果材料中没有依据，要建议“确认/技术评审/试点验证”。
9. 推荐表达必须适合当前场景、客户角色和会谈阶段。

## 10. UI 组件设计

新增组件：

- `ReviewHistoryList`
- `ReviewHistoryCard`
- `ConversationReplayPanel`
- `ConversationTurnTimeline`
- `ConversationTurnDetail`
- `ConversationStageMap`

修改组件：

- `ProgressView`
- `ReviewView`
- `ReviewSummaryCard`
- `SentenceReviewPanel`

### 10.1 ReviewHistoryList

职责：

- 展示练习记录。
- 支持按时间倒序。
- 支持空状态。
- 点击进入复盘详情。

### 10.2 ConversationReplayPanel

职责：

- 展示完整对话。
- 管理当前选中 turn。
- 支持筛选：全部 / 只看我的回答 / 只看有问题 / 只看亮点。
- 响应式布局。

### 10.3 ConversationTurnDetail

职责：

- 展示选中 turn 的详细分析。
- 对 AI 客户 turn 展示客户意图。
- 对用户 turn 展示回答匹配、问题、亮点和更好表达。

### 10.4 ConversationStageMap

职责：

- 展示会谈流程地图。
- 标出完成、部分完成、缺失阶段。
- 点击阶段可跳转到相关 turn。

## 11. 隐私与安全

保留现有隐私控制：

- 删除本次复盘。
- 删除转写。
- 删除练习会话。

新增要求：

- 删除转写后，复盘页不再显示完整对话文本。
- 如果复盘 payload 中仍有对话摘录，隐私控制要提示“复盘分析中仍包含摘要文本，可删除本次复盘彻底移除”。
- 不保存音频。
- 不把客户材料原文重复写入每个 turn，只保存引用和必要摘要。

## 12. 兼容策略

旧复盘数据可能没有：

- `reviewSnapshot`
- `sentenceReviews`
- `conversationReview`
- `memoryCandidates.evidence`

兼容展示策略：

- 没有 `conversationReview`：显示 transcript + “无逐轮分析”提示。
- 没有 transcript：显示“该练习未保存对话记录”。
- 没有 `reviewSnapshot`：使用 `meetingOutcome.summary`、`bestMoments`、`topImprovements`。
- 没有 `sentenceReviews`：保留现有 `sentenceUpgrades`。

## 13. 验收标准

1. 复盘首页能看到每一次练习记录。
2. 用户能点击任意练习进入单次复盘。
3. 单次复盘能展示完整 AI 客户和用户对话。
4. 对话中每一句都有英文和中文翻译。
5. 用户可以点击任意一句查看详细分析。
6. 用户回答能显示是否答到客户问题。
7. 每个用户回答能关联逐句精修结果。
8. 现有 30 秒总结、评分卡、句子升级、表达库建议、记忆候选、长期统计都保留。
9. 旧复盘数据不报错。
10. 复盘内容不会在 API 失败时显示假模板。

## 14. 分阶段落地

### 第一阶段

- 扩展 `Review.payload.conversationReview`。
- 调整复盘生成 prompt。
- 单次复盘展示完整对话与逐轮分析。
- 复盘首页展示练习记录列表。

### 第二阶段

- 增加会谈流程地图。
- 增加逐轮筛选和跳转。
- 优化表达沉淀和记忆确认交互。

### 第三阶段

- 长期复盘使用逐轮数据做错误聚类。
- 根据历史对话自动生成下一次训练包。

