# 会谈节奏策略设计

## 背景

当前实时练习中的 AI 客户会在开场直接提出产品参数、安全、部署、ROI 等细节问题。这种方式适合压力测试，但不符合多数真实商务沟通的节奏。真实会议通常会先完成问候、会议目的确认、客户背景确认，再逐步进入场景、价值、技术和采购等问题。

本设计采用“角色 + 音色 + 训练目标”共同决定会谈开场节奏的方案，让 AI 客户既有真实商务礼仪，又能保持不同角色的差异化。

## 目标

- 让 AI 客户的前 3 轮对话更符合真实商务会谈流程。
- 避免 AI 客户第一句就进入技术审查、价格谈判、ROI 压力或部署细节。
- 让不同客户角色、AI 音色和训练目标组合出不同的开场节奏。
- 保持实时语音练习足够轻量，每轮问题短、自然、适合口语回应。
- 为后续扩展到日常英语、社交英语、AI 行业英语等场景预留配置能力。

## 非目标

- 不改变 Gemini Live 或实时 relay 的连接方式。
- 不在本阶段重构完整练习 UI。
- 不让 AI 在实时语音中调用 DeepSeek 做长分析。
- 不要求每次对话都严格固定相同句子，策略只约束节奏和边界。

## 核心概念

### 会谈节奏策略

新增一个概念：`conversationOpeningStrategy`。

它描述 AI 客户在实时会谈前几轮中的行为方式，包括：

- 开场模式：正式商务、用户先介绍、轻量高效。
- 前 3 轮阶段：每轮应该完成的沟通任务。
- 深入节奏：什么时候可以进入技术、采购、价格、ROI 等细节。
- 压力等级：何时从友好提问升级到挑战式追问。
- 礼仪规则：问候、确认时间、确认会议目标、感谢介绍。

### 三种基础模式

`formal_business`

- 先问候和确认会议目标。
- 适合企业买家、采购经理、正式客户会谈。

`learner_led_intro`

- AI 客户先邀请用户介绍产品、方案或合作方式。
- 适合渠道合作伙伴、产品演示、销售拜访训练。

`efficient_warm_start`

- 简短寒暄后快速进入业务场景。
- 适合技术负责人、高管决策者、高效商务沟通。

## 策略组合规则

最终开场策略由三个维度合成：

1. 客户角色决定“客户为什么来”和“主要关注什么”。
2. 音色决定“客户怎么说话”和“开场温度”。
3. 训练目标决定“进入主题的速度”和“追问方向”。

优先级：

1. 训练目标可以改变切入速度。
2. 客户角色决定问题领域和压力上限。
3. 音色只改变表达方式，不改变客户身份。

## 角色默认节奏

| 角色 | 默认组合 | 开场特点 | 进入细节时机 |
| --- | --- | --- | --- |
| 企业买家 | formal_business + efficient_warm_start | 先确认会议目标，再问应用场景和业务价值 | 第 4 轮后进入 ROI、试点风险 |
| 技术负责人 | efficient_warm_start + formal_business | 简短寒暄，先确认使用场景和系统背景 | 第 4 轮后进入参数、部署、安全 |
| 采购经理 | formal_business + efficient_warm_start | 先确认采购阶段和评估范围 | 第 4 轮后进入价格、交付、竞品 |
| 渠道合作伙伴 | learner_led_intro + formal_business | 先让用户介绍产品和合作方式 | 第 3 轮后进入销售支持、售后、利润 |
| 高管决策者 | efficient_warm_start + learner_led_intro | 很短寒暄，请用户 30 秒说明价值 | 第 3 轮后进入战略价值、ROI、下一步 |

## 音色修饰规则

| 音色 | 修饰方式 |
| --- | --- |
| Kore 坚定专业 | 更正式、稳重，适合清晰会议议程 |
| Zephyr 明亮友好 | 更友好、鼓励用户多说，降低开场压力 |
| Puck 轻快外向 | 更开放、互动感强，适合合作探索 |
| Charon 清晰信息型 | 更理性、结构清楚，但不能第一句进入技术审查 |
| Fenrir 高能追问 | 前 2 轮保持礼貌，第 3 轮后逐步增强追问压力 |
| Leda 年轻自然 | 更自然直接，适合平衡商务沟通 |

音色不应该覆盖角色。例如选择 Leda 女声但角色是技术负责人时，AI 仍然是技术负责人，只是表达更自然直接。

## 训练目标修饰规则

| 训练目标 | 节奏变化 |
| --- | --- |
| 客户问答 | 标准三阶段：问候、背景确认、场景切入 |
| 演示讲解 | 更偏 learner_led_intro，让用户先介绍产品或 demo flow |
| 异议处理 | 可以更快进入挑战，但必须先有一句商务过渡 |
| 方案会议 | 先确认客户目标、利益相关方和下一步，再推进方案 |
| 60 秒快速表达 | 简短问候后直接邀请用户用 30-60 秒说明价值 |

## 前 3 轮约束

第 1 轮：商务开场

- 问候、感谢参会、确认今天讨论方向。
- 不问产品参数、部署、安全、价格、ROI。
- 可以邀请用户先介绍，也可以问一个轻量背景问题。

第 2 轮：背景确认

- 确认客户当前业务场景、评估阶段、会议目标或用户想先讲什么。
- 问题仍然应该开放、轻量。

第 3 轮：场景切入

- 从应用场景、业务问题、客户价值、使用人群开始。
- 如果是技术或采购角色，可以埋下后续细节方向，但不立即连环追问。

第 4 轮以后：角色化深入

- 技术负责人可以进入数据流、部署、产品参数。
- 采购经理可以进入价格、交付、竞品差异。
- 高管可以进入 ROI、战略价值和下一步。
- Fenrir 等高压音色可以在此后逐步提高挑战强度。

## Prompt 拼装设计

实时 prompt 中新增一个独立段落：`Conversation opening strategy`。

该段落应包含：

- `Opening mode mix`
- `First three turns`
- `Escalation rules`
- `Persona-specific opening behavior`
- `Voice temperament modifier`
- `Do-not-start-with list`

建议英文 prompt 规则：

```text
Conversation opening strategy:
- Start like a real business meeting, not a product audit.
- Do not begin with detailed objections, technical audit, pricing, ROI, security, or deployment questions.
- Turn 1 should be a natural greeting, meeting-context check, or invitation for the learner to introduce the topic.
- Turn 2 should clarify customer context, meeting goal, evaluation stage, or the learner's preferred starting point.
- Turn 3 may enter application scenarios, customer pain points, business value, or demo framing.
- Only after context is established should you escalate into persona-specific detailed questions.
- Keep each customer turn concise and natural for spoken practice.
```

## 示例

企业买家 + Kore + 客户问答：

```text
Hi, thanks for taking the time today. Before we get into details, could you briefly share which customer scenario you would like to focus on first?
```

技术负责人 + Charon + 产品参数解释：

```text
Thanks for joining. Before I ask technical questions, could you first explain the main use case and what part of the Rokid solution you want us to evaluate?
```

渠道合作伙伴 + Puck + 演示讲解：

```text
Great to meet you. Could you first walk me through how you would introduce Rokid to a potential overseas customer in a simple demo?
```

高管决策者 + Fenrir + 60 秒快速表达：

```text
Thanks for joining. I only have a short window today, so could you give me the 30-second version of why Rokid is worth our attention?
```

## 数据结构建议

新增配置文件：

```text
src/config/scenarios/rokid-overseas-sales/conversation-opening-strategies.ts
```

建议类型：

```ts
type OpeningMode = "formal_business" | "learner_led_intro" | "efficient_warm_start";

type ConversationOpeningStrategy = {
  roleId: string;
  defaultModeMix: OpeningMode[];
  firstTurnGoal: string;
  secondTurnGoal: string;
  thirdTurnGoal: string;
  escalationAfterTurn: number;
  doNotStartWith: string[];
  preferredOpeningMoves: string[];
};
```

音色配置可新增：

```ts
type VoiceTemperamentModifier = {
  voicePackId: string;
  openingTone: string;
  pressureRamp: "slow" | "medium" | "fast_after_context";
  wordingStyle: string;
};
```

## 数据流

1. 用户在创建练习时选择目标、客户角色、音色、材料和训练重点。
2. 后端创建或解析 practice session。
3. 系统根据 `goalId + personaId + voicePackId` 解析会谈节奏策略。
4. `buildRealtimeInstructions` 把策略写入实时 prompt。
5. Gemini Live 根据该策略控制前 3 轮会谈。
6. 后续实时辅助、建议回答和复盘可以读取同一策略，用于判断用户是否过早进入细节或是否缺少商务开场。

## 测试计划

单元测试：

- `buildRealtimeInstructions` 应包含 `Conversation opening strategy`。
- 技术负责人开场策略不应允许第一句直接进入 security/deployment audit。
- 渠道合作伙伴应包含 learner-led intro 规则。
- Fenrir 音色应包含前 2 轮礼貌、后续再增强压力的规则。
- 60 秒快速表达目标应包含短寒暄和 30-60 秒价值说明邀请。

API 测试：

- `/api/realtime/session` 返回的 `instructionsPreview` 应包含节奏策略关键词。
- relay token 中的 instructions 应包含对应角色和音色的策略。

手动验收：

- 开始练习后，AI 第一轮不是细节质询。
- 不同角色开场方式有明显差异。
- 选择不同音色后，语气变化明显，但角色身份不改变。
- 第 4 轮后可以自然进入更深入的问题。

## 验收标准

- 企业买家开场先问场景或会议目标，不直接问 ROI。
- 技术负责人开场先确认 use case，不直接问数据加密或部署方式。
- 渠道合作伙伴会邀请用户先介绍产品或合作方式。
- 高管决策者开场短，但仍有礼貌过渡。
- Fenrir 不会第一句就高压追问，而是在背景建立后增强压力。
- 实时对话整体更像真实商务会谈，而不是产品考试。
