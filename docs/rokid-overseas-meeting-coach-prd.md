# Rokid 海外商务会谈训练系统 PRD

版本：v1.0  
日期：2026-05-07  
项目代号：Nega_Yuna 定制版  
产品英文名：Rokid Overseas Meeting Coach  
目标用户：Rokid 智能眼镜企业海外销售与解决方案人员

## 1. 产品概述

### 1.1 背景

目标用户需要在海外商务会谈中用英语完成客户沟通、产品介绍、解决方案阐述、异议处理、试点推进和会后跟进。普通英语口语产品过于泛化，无法覆盖她真实工作里的材料、客户角色、Rokid 产品表达和商务推进任务。

本产品要做成一个高度定制化的口语训练网站。它不以“学英语”为第一目标，而以“更好完成 Rokid 海外客户会谈”为第一目标。用户可以上传真实展示材料，AI 根据材料和客户背景扮演海外客户，通过实时语音对话进行提问、追问、质疑和沟通；练习结束后，系统提供中英文对照复盘、商务表达优化、常用语句总结、个人弱点追踪和产品表达库沉淀。

### 1.2 产品定位

Rokid Overseas Meeting Coach 是一个面向单一用户或小范围内部用户的 AI 英语商务会谈训练系统，围绕 Rokid 智能眼镜海外销售场景，提供从会前准备、材料演练、实时客户模拟、异议挑战到会后复盘的完整训练闭环。

### 1.3 核心价值

- 让用户基于真实材料练习真实客户会谈，而不是泛泛聊天。
- 让用户学会把 Rokid 产品功能表达成客户价值。
- 让用户熟悉海外客户常见问题和异议。
- 让用户建立自己的商务英语表达库和弱点画像。
- 让每一次练习都能沉淀成下一次更精准的训练。

### 1.4 一句话描述

上传客户材料，选择客户角色，和 AI 进行实时英文商务会谈演练；结束后获得中英文对照复盘、表达升级、弱点追踪和 Rokid 专属产品表达库。

## 2. 目标与非目标

### 2.1 产品目标

1. 支持用户上传客户展示材料，并由 AI 生成会前准备卡和材料摘要。
2. 支持基于材料和客户角色的实时语音会谈训练。
3. 支持轻量提示，帮助用户在对话中继续表达，而不是打断学习节奏。
4. 支持会后复盘，包括会议结果、商务表现、英语表达、中英文对照、重点改进和复述练习。
5. 支持个人弱点追踪，识别用户长期问题并推荐下一次训练。
6. 支持 Rokid 产品表达库，沉淀常用句型、词汇、异议回答和材料专属表达。
7. 支持敏感材料保护，包括上传提示、删除、材料可见范围和隐私设置。

### 2.2 非目标

1. 不做泛英语课程平台。
2. 不做多人课堂或教师管理系统。
3. 不做完整 CRM。
4. 不做自动替用户生成对外正式报价或合同承诺。
5. 不让 AI 对产品参数、价格、合规、客户隐私做无依据承诺。
6. MVP 阶段不要求移动 App，只做响应式 Web。

## 3. 用户画像

### 3.1 主用户

角色：Rokid 海外销售与解决方案人员  
核心任务：向海外客户介绍 Rokid 智能眼镜，理解客户场景，回答客户问题，推进 demo、pilot、采购或合作机会。  
英语痛点：

- 能读懂材料，但现场表达不够流畅。
- 容易直接讲功能，缺少客户价值表达。
- 遇到异议时容易解释太长或不够坚定。
- 商务句型储备不足，常用简单词。
- 需要准备真实会议，但没有合适陪练对象。

### 3.2 典型使用场景

- 明天要向海外客户展示 Rokid 产品，需要练开场和产品介绍。
- 客户是渠道商，需要练渠道合作、利润、售后和市场支持问题。
- 客户是企业采购，需要练 ROI、部署、试点和采购流程问题。
- 客户是技术负责人，需要练稳定性、安全性、集成和工作流问题。
- 用户上传 PPT 或 PDF，希望 AI 根据材料模拟客户问答。
- 用户练完后想知道自己哪些句子不自然，以及如何说得更商务。

## 4. 产品范围

### 4.1 MVP 范围

MVP 必须包含：

1. 首页训练工作台
2. 材料上传与材料摘要
3. 会前准备卡
4. 客户角色模拟
5. 实时语音会谈训练
6. 对话中轻量提示
7. 会后复盘
8. 中英文对照句子升级
9. 异议题库
10. 个人弱点追踪
11. 产品表达库
12. 敏感材料模式

### 4.2 后续增强范围

后续可增加：

- 会后英文邮件生成与优化
- 60 秒快速口播训练
- 多轮训练计划
- 真实会议录音导入复盘
- PDF/PPT 页面级可视化预览
- 与公司知识库或产品 FAQ 连接
- 多用户权限和团队管理

## 5. 信息架构

### 5.1 顶级导航

1. Dashboard
2. Materials
3. Practice
4. Objection Bank
5. Phrasebook
6. Progress
7. Settings

### 5.2 页面结构

```text
Dashboard
  - 今日推荐训练
  - 会前准备入口
  - 最近材料
  - This Week's Focus
  - 最近复盘

Materials
  - 上传材料
  - 材料列表
  - 材料摘要 Meeting Brief
  - 材料专属词句

Practice
  - 选择训练模式
  - 选择客户角色
  - 选择材料
  - 实时语音会谈
  - 会后复盘

Objection Bank
  - 异议分类
  - 异议详情
  - 推荐回答
  - 高压模拟

Phrasebook
  - Rokid 产品表达
  - 我的个人表达
  - 材料专属表达
  - 词汇与短语

Progress
  - 弱点追踪
  - 能力趋势
  - 历史训练
  - 推荐下一次训练

Settings
  - 个人水平与训练偏好
  - 纠错强度
  - 隐私与数据保留
  - API / 模型配置
```

## 6. 核心用户流程

### 6.1 会前准备流程

1. 用户点击 Dashboard 上的 Prepare for a customer meeting。
2. 用户上传材料或选择已有材料。
3. 用户填写客户信息：客户类型、行业、国家/地区、会议目标、已知顾虑。
4. 系统生成 Meeting Prep Card。
5. 用户选择 Start Practice。
6. 系统进入实时会谈训练。
7. 训练结束后进入复盘页。
8. 系统更新弱点追踪和表达库。

### 6.2 材料驱动训练流程

1. 用户上传 PPT、PDF 或文档。
2. 系统解析材料，并生成 Material Brief。
3. 用户确认或编辑材料摘要。
4. 用户选择训练模式：Presentation Rehearsal、Customer Q&A、Objection Challenge、Solution Meeting。
5. 用户选择客户角色。
6. 用户进入实时语音训练。
7. AI 根据材料内容和客户角色进行提问、追问和异议挑战。
8. 系统生成材料覆盖度复盘。

### 6.3 异议专项训练流程

1. 用户进入 Objection Bank。
2. 用户选择异议主题，例如 Privacy & Security。
3. 系统展示客户顾虑、回答框架、简短回答、专业回答。
4. 用户点击 Practice。
5. AI 扮演客户进行高压追问。
6. 训练结束后系统评价用户是否正面回应、是否讲清价值、是否推进下一步。

### 6.4 表达库沉淀流程

1. 系统在复盘中识别用户说得不自然但高价值的句子。
2. 系统生成更自然的商务英文、中译和使用场景。
3. 用户点击 Save to Phrasebook。
4. 该表达进入个人表达库，并可在后续训练中作为轻提示出现。

## 7. 功能需求

## 7.1 Dashboard 首页训练工作台

### 7.1.1 目标

让用户打开网站后立即知道今天该练什么，并能快速进入真实工作场景。

### 7.1.2 页面模块

1. 今日推荐训练
   - 根据最近弱点和最近材料生成。
   - 示例：10-minute privacy objection challenge。

2. 快速入口
   - Prepare for a customer meeting
   - Upload a presentation
   - Practice customer objections
   - Review my phrasebook

3. This Week's Focus
   - 展示本周最重要的 1-2 个弱点。
   - 示例：Shorter answers + stronger objection handling。

4. 最近材料
   - 展示最近上传或练习过的材料。

5. 最近复盘
   - 展示最近一次训练分数、主要改进和继续练习按钮。

### 7.1.3 验收标准

- 用户可以在 2 次点击内开始一次训练。
- 首页必须显示下一次推荐训练。
- 首页必须显示至少一个个人弱点或学习重点。

## 7.2 Material-Based Meeting Simulator 材料驱动会谈训练

### 7.2.1 目标

让用户上传真实客户展示材料，并让 AI 根据材料模拟客户提问和商务沟通。

### 7.2.2 支持文件

MVP 支持：

- PDF
- PPTX
- DOCX
- TXT / Markdown

后续支持：

- 图片型 PDF OCR
- Google Slides / Google Docs 链接
- 多文件合并成一个会议资料包

### 7.2.3 上传字段

用户上传材料后，需要填写：

- Material name
- Customer type
- Customer industry
- Meeting goal
- Meeting language：English
- Confidential mode：on / off
- Notes：补充背景

### 7.2.4 Material Brief 输出

系统解析材料后生成：

1. Key Message
   - 这份材料最核心要表达什么。

2. Product Points
   - 产品功能点或方案点。

3. Customer Value
   - 每个功能点对应的客户价值。

4. Likely Questions
   - 客户可能提出的问题。

5. Likely Objections
   - 客户可能提出的异议。

6. Risky Claims
   - 不能随意承诺或需要谨慎表达的内容。

7. Useful Phrases
   - 介绍材料时可用的英文句子。

8. Glossary
   - 材料关键词中英文对照。

9. Slide / Section Outline
   - 材料结构，包含页码、标题、要点。

### 7.2.5 Material Brief 示例

```json
{
  "keyMessage": "Rokid Glasses help international teams communicate more smoothly with real-time translated captions.",
  "productPoints": [
    {
      "point": "Real-time translated captions",
      "customerValue": "Reduce communication friction in multilingual meetings"
    }
  ],
  "likelyQuestions": [
    "How accurate is the translation in a business meeting?",
    "How is this different from using a phone translation app?"
  ],
  "riskyClaims": [
    "Do not claim guaranteed translation accuracy unless an approved number is provided in the source material."
  ]
}
```

### 7.2.6 训练模式

1. Presentation Rehearsal
   - 用户根据材料进行英文介绍。
   - AI 主要评价是否清楚、有逻辑、有商务价值。

2. Customer Q&A
   - AI 根据材料向用户提问。
   - 问题包括理解确认、场景落地、价值追问、技术/部署问题。

3. Objection Challenge
   - AI 根据材料提出更尖锐的异议。
   - 适合练价格、隐私、准确率、竞品比较。

4. Solution Meeting
   - AI 不只问产品，还会扮演客户描述业务问题。
   - 用户需要通过提问理解需求，再推荐 Rokid 方案。

### 7.2.7 验收标准

- 上传成功后必须生成结构化 Material Brief。
- 训练问题必须引用或围绕材料内容。
- 复盘必须展示材料重点覆盖情况。
- 对材料中没有依据的内容，AI 必须避免编造产品承诺。

## 7.3 Pre-Meeting Prep 会前准备

### 7.3.1 目标

帮助用户在真实会议前 5 分钟快速完成英文热身、客户理解和表达准备。

### 7.3.2 输入

- 客户类型
- 客户行业
- 国家/地区
- 会议目标
- 上传材料或选择已有材料
- 已知客户顾虑
- 用户希望重点练习的问题

### 7.3.3 输出：Meeting Prep Card

Meeting Prep Card 包含：

1. Customer Context
   - 客户身份和可能关注点。

2. Meeting Goal
   - 本次会议目标，例如 schedule a follow-up demo。

3. Key Talking Points
   - 最该讲的 3-5 个重点。

4. Discovery Questions
   - 建议先问客户的问题。

5. Likely Objections
   - 可能出现的异议。

6. Opening Script
   - 30 秒英文开场。

7. Must-Use Phrases
   - 本场会议建议使用的英文句子。

8. Do Not Overpromise
   - 需要谨慎表达的点。

### 7.3.4 页面交互

- 用户可编辑 Meeting Prep Card。
- 用户可一键进入 Start Practice。
- 用户可将 Must-Use Phrases 保存到 Phrasebook。
- 用户可导出简短会前小抄。

### 7.3.5 验收标准

- 会前准备卡生成时间建议低于 20 秒。
- 输出必须包括至少 5 个 discovery questions。
- 输出必须包括至少 5 个本场可用英文表达。
- 所有表达必须与客户类型和材料相关。

## 7.4 Customer Persona Simulator 客户角色模拟

### 7.4.1 目标

训练用户面对不同类型海外客户时切换表达策略。

### 7.4.2 客户角色

1. Distributor
   - 关注：渠道利润、区域市场、销售支持、售后、培训。
   - 语气：务实，关注商业合作。

2. Enterprise Buyer
   - 关注：ROI、采购流程、试点价值、部署成本。
   - 语气：谨慎，关注业务结果。

3. Technical Lead
   - 关注：稳定性、安全、集成、兼容性、设备限制。
   - 语气：细节导向，追问技术条件。

4. Procurement Manager
   - 关注：价格、交付周期、合同条款、供应风险。
   - 语气：压价，关注条款。

5. Skeptical Executive
   - 关注：业务价值、差异化、是否值得投入时间。
   - 语气：时间少，问题尖锐。

6. End User Manager
   - 关注：员工是否愿意使用、培训成本、日常体验。
   - 语气：场景化，关注使用体验。

### 7.4.3 难度等级

- Easy：客户友好，问题清晰。
- Normal：客户会追问，但给用户表达空间。
- Hard：客户更怀疑，追问更尖锐。
- Executive Mode：客户只给短反馈，要求用户简洁有力。

### 7.4.4 AI 行为规则

- 一次只问一个问题。
- 每个问题必须符合 persona 关注点。
- 如果用户回答太泛，AI 应追问业务价值或具体场景。
- 如果用户只讲功能，AI 应问：Why does that matter to my business?
- 如果用户回答很好，AI 应推进到下一步，例如 pilot、demo 或 procurement。

### 7.4.5 验收标准

- 不同 persona 的问题风格必须明显不同。
- 每轮训练至少出现 3 个与 persona 相关的问题。
- Hard 模式下必须包含至少 1 个异议或反驳。

## 7.5 Realtime Practice Room 实时语音会谈

### 7.5.1 目标

提供低延迟语音对话环境，让用户像真实会议一样进行英文会谈。

### 7.5.2 页面布局

桌面端三栏布局：

1. 左侧：Material Navigator
   - 当前材料标题
   - 页码/章节
   - 核心要点
   - 可点击查看材料 brief

2. 中间：Live Meeting
   - 客户角色
   - 当前语音状态
   - 会谈目标
   - 麦克风控制
   - 结束训练按钮
   - 可选英文字幕

3. 右侧：Smart Support
   - Smart Cue Bar
   - Better Phrase
   - Use Material Point
   - Ask a Discovery Question
   - Shorten Answer
   - Translate This

移动端布局：

- 顶部显示会谈目标和客户角色。
- 中间显示语音状态。
- 底部固定麦克风和提示按钮。
- 材料与提示使用抽屉式面板。

### 7.5.3 语音状态

- Ready
- Listening
- Thinking
- Speaking
- Muted
- Reconnecting
- Mic Permission Required
- Session Ended

### 7.5.4 Smart Cue Bar

轻提示只显示一句，不展示大段答案。示例：

- Ask about their use case.
- Turn the feature into business value.
- Clarify before answering.
- Keep it shorter.
- Ask for the next step.
- Use the real-time translation point from the material.

### 7.5.5 辅助按钮

1. Better Phrase
   - 将用户刚才的话改写成更自然商务英文。

2. Help Me Continue
   - 给下一句话开头。

3. Rephrase Professionally
   - 将表达改成更正式但仍自然的商务表达。

4. Use Material Point
   - 提醒用户引用材料中的相关点。

5. Ask a Discovery Question
   - 给用户一个可反问客户的问题。

6. Translate This
   - 对当前 AI 问题或推荐表达提供中文解释。

7. Challenge Me
   - 提升客户追问难度。

### 7.5.6 纠错策略

实时会谈中默认少纠错。

- 若错误影响理解，AI 可以简短澄清。
- 若错误不影响理解，保留到会后复盘。
- 用户主动点击 Correct Me Now 时，AI 才在当下纠错。
- 不在用户表达中途频繁打断。

### 7.5.7 Realtime API 接入要求

建议浏览器端使用 OpenAI Realtime API 的 WebRTC 方式进行低延迟语音对话。标准 API key 不得暴露在浏览器端，必须由后端生成临时客户端密钥或会话凭证，再交给前端建立 WebRTC 连接。

参考官方文档：

- OpenAI Realtime API：https://platform.openai.com/docs/guides/realtime
- Realtime WebRTC：https://platform.openai.com/docs/guides/realtime-webrtc

### 7.5.8 验收标准

- 用户可以完成一次完整语音训练：开始、对话、结束、生成复盘。
- 麦克风权限失败时有明确提示。
- 网络重连时显示 Reconnecting。
- 用户可以选择显示或隐藏英文字幕。
- 训练结束后必须保存 transcript 和关键事件。

## 7.6 Review 复盘系统

### 7.6.1 目标

将一次实时训练转化为可学习、可复述、可沉淀的内容。

### 7.6.2 复盘结构

1. Meeting Outcome
   - 本轮会议目标是否达成。
   - AI 客户是否被说服。
   - 下一步是否明确。

2. Business Scorecard
   - Clarity
   - Business Confidence
   - Discovery Skill
   - Product Positioning
   - Objection Handling
   - English Naturalness

3. Top 3 Improvements
   - 只列最重要的 3 条。

4. Best Moments
   - 记录用户说得好的句子。

5. Sentence Upgrade
   - 中英文对照优化。

6. Material Coverage
   - 哪些材料重点讲到了。
   - 哪些材料重点漏掉了。
   - 哪些地方讲模糊了。

7. Replay Practice
   - 选 3 句最值得重练的句子。
   - 支持听一遍、跟读、重说、比较。

8. Phrasebook Suggestions
   - 可保存到表达库的句子和词汇。

9. Next Session Recommendation
   - 推荐下一次训练。

### 7.6.3 Sentence Upgrade 格式

```text
Original:
We have translation function.

Natural Business English:
Rokid Glasses support real-time translated captions, helping users follow multilingual conversations more smoothly.

中文解释:
不只是说“我们有翻译功能”，而是说明它如何帮助用户在多语言对话中更顺畅地沟通。

Practice Prompt:
Please say this again in your own words.
```

### 7.6.4 评分维度

每项 1-5 分：

- Clarity：表达是否清楚。
- Conciseness：回答是否简洁。
- Business Value：是否把功能转成客户价值。
- Discovery：是否主动询问客户需求。
- Objection Handling：是否正面回应异议。
- Meeting Control：是否能推进下一步。
- Natural English：英文是否自然。

### 7.6.5 验收标准

- 每次训练结束后必须生成复盘。
- 复盘必须包含中英文对照句子升级。
- 复盘必须包含下一次训练建议。
- 复盘必须能将表达保存到 Phrasebook。
- 复盘必须能更新 Weakness Tracker。

## 7.7 Objection Bank 异议题库

### 7.7.1 目标

训练用户面对 Rokid 海外销售常见异议时，能够用自然、坚定、商务化的英文回应。

### 7.7.2 分类

1. Product Value
   - Why not just use a phone translation app?
   - Is this really necessary for business meetings?

2. Accuracy & Reliability
   - How accurate is the translation?
   - What happens in noisy environments?

3. Privacy & Security
   - How is meeting data handled?
   - Can this be used in confidential meetings?

4. Deployment
   - How do we roll this out to a team?
   - Do users need training?

5. Competition
   - How is Rokid different from Meta Ray-Ban or other smart glasses?

6. Pricing & Pilot
   - What is the pilot cost?
   - Why should we invest in this now?

### 7.7.3 异议详情页

每个异议包含：

- Customer Concern
- Why It Matters
- Answer Framework
- Short Answer
- Professional Answer
- Follow-up Question
- Mistakes to Avoid
- Practice Button

### 7.7.4 推荐回答框架

默认使用：

```text
Acknowledge -> Clarify -> Position -> Support -> Next Step
```

示例：

```text
That is a fair question. A phone app can work for simple translation, but Rokid Glasses are designed for hands-free, real-time communication, especially when users need to stay engaged in the conversation without constantly looking down at another device. May I ask how your team currently handles multilingual meetings?
```

### 7.7.5 验收标准

- MVP 至少内置 30 个 Rokid 相关异议。
- 每个异议必须有简短回答和专业回答。
- 每个异议必须支持进入实时模拟。
- 训练结束后必须评价用户是否使用了合理回答框架。

## 7.8 Personal Weakness Tracker 个人弱点追踪

### 7.8.1 目标

让系统随着用户训练越来越了解她，持续推荐最有效的下一步训练。

### 7.8.2 追踪维度

- Long Answers：回答过长。
- Feature-Only Talk：只讲功能，没有讲价值。
- Weak Discovery：缺少客户需求追问。
- Unclear Positioning：产品定位不清。
- Weak Objection Handling：异议回应不够坚定。
- Repetitive Vocabulary：词汇重复。
- Missing Next Step：没有推进下一步。
- Grammar Accuracy：语法准确性。
- Pronunciation Clarity：发音可懂度。
- Fluency：流利度。

### 7.8.3 首页呈现

展示 This Week's Focus：

```text
This week: Shorter answers + stronger objection handling.
Recommended drill: 5-minute privacy objection challenge.
```

### 7.8.4 进度页

显示：

- 最近 7 天训练次数
- 各能力趋势
- 高频弱点
- 已改善弱点
- 推荐训练
- 历史复盘入口

### 7.8.5 更新逻辑

每次复盘后，AI 输出结构化 weakness update：

```json
{
  "weaknesses": [
    {
      "type": "Feature-Only Talk",
      "severity": 4,
      "evidence": "User explained real-time translation as a feature but did not connect it to multilingual meeting efficiency.",
      "recommendedDrill": "Feature-to-value conversion drill"
    }
  ]
}
```

### 7.8.6 验收标准

- 每次训练后至少更新 1 个能力维度。
- 首页必须根据弱点生成推荐训练。
- 用户可以查看每个弱点的证据句和改进建议。

## 7.9 Product Phrasebook 产品表达库

### 7.9.1 目标

建立 Rokid 海外销售专属英文表达库，并沉淀用户个人高频表达。

### 7.9.2 分类

1. Opening
2. Discovery Questions
3. Product Positioning
4. Feature Explanation
5. Business Value
6. Demo Narration
7. Objection Handling
8. Pricing & Pilot
9. Closing & Next Step
10. Follow-up Email
11. Material-Specific Phrases
12. My Saved Phrases

### 7.9.3 每条表达字段

- English sentence
- Chinese meaning
- Use case
- Simple version
- Professional version
- Related product point
- Related objection
- Tags
- Source：built-in / material / review / user-added
- Practice count
- Mastery status

### 7.9.4 示例

```text
Category:
Business Value

Simple:
Rokid Glasses support real-time translation.

Professional:
Rokid Glasses provide real-time translated captions, helping international teams reduce communication friction during multilingual meetings.

中文:
Rokid 眼镜提供实时翻译字幕，帮助国际团队在多语言会议中降低沟通障碍。

Use case:
When explaining the business value of translation in an enterprise meeting.
```

### 7.9.5 词汇库

按场景分组，而不是 A-Z：

Product & Technology:

- smart glasses：智能眼镜
- real-time translation：实时翻译
- captions / subtitles：字幕
- transcription：转写
- field of view：视场
- hands-free：免手持
- latency：延迟
- accuracy：准确率

Business & Deployment:

- use case：使用场景
- pilot：试点
- rollout：规模化部署
- procurement：采购
- stakeholder：相关决策人
- integration：集成
- compliance：合规
- after-sales support：售后支持

Sales Verbs:

- clarify：澄清
- position：定位
- demonstrate：演示
- address a concern：回应顾虑
- align with your workflow：匹配你们的工作流程
- move forward：推进下一步

### 7.9.6 验收标准

- 用户可以按分类、标签、材料、来源筛选表达。
- 用户可以从复盘页保存表达。
- 用户可以对表达进行收藏、已掌握、需要再练标记。
- 实时练习中的 Better Phrase 可以优先引用个人表达库。

## 7.10 敏感材料模式

### 7.10.1 目标

保护真实客户材料、价格、合同、客户名称和敏感项，降低用户上传真实工作资料的心理负担。

### 7.10.2 功能

- 上传前提示用户检查敏感信息。
- 支持 Confidential Mode。
- 支持手动隐藏客户名、价格、合同条款。
- 支持练习结束后一键删除材料和训练记录。
- 支持设置数据保留时间：never save、7 days、30 days、manual delete。
- AI 不主动扩展或猜测未在材料中出现的敏感内容。

### 7.10.3 验收标准

- Confidential Mode 开启时，页面必须显示明显标识。
- 用户可以删除材料和相关训练记录。
- 复盘中不得生成无依据的价格、合规或合同承诺。

## 8. AI 行为设计

## 8.1 全局 AI 原则

AI 必须遵守以下原则：

1. 始终围绕 Rokid 海外商务会谈场景。
2. 优先训练用户表达，不替用户完成所有回答。
3. 实时对话中少纠错，会后集中复盘。
4. 一次只问一个问题。
5. 对材料没有依据的信息，不编造。
6. 对价格、合规、安全、准确率、合同条款等敏感内容必须谨慎。
7. 鼓励用户把功能转化为客户价值。
8. 在用户回答太长时提醒简洁。
9. 在用户没有推进下一步时提醒 closing。
10. 输出复盘时必须给中英文对照和可复述句子。

## 8.2 Realtime Session Instructions 模板

```text
You are an overseas customer meeting simulator and English speaking coach for a Rokid overseas sales and solution professional.

Your role in this session:
- Act as a realistic overseas customer based on the selected persona.
- Ask one question at a time.
- Keep the conversation focused on smart glasses, AI/AR, real-time translation, captions, enterprise use cases, deployment, pilot programs, and business value.
- Let the user speak most of the time.
- Do not over-correct during the live conversation.
- If the user's English is understandable, continue the business conversation and save corrections for the review.
- If the user's answer is unclear, ask a short clarification question.
- If the user only describes a feature, ask how it creates business value.
- If the user avoids an objection, ask a follow-up.
- Do not invent product claims, pricing, accuracy numbers, certifications, or contract terms not provided in the source material.

Meeting context:
{meeting_context}

Customer persona:
{customer_persona}

Material brief:
{material_brief}

User training focus:
{training_focus}

Live support behavior:
- When asked for a better phrase, provide one concise business English sentence and optionally a short Chinese explanation.
- When asked to translate, provide Chinese meaning without taking over the conversation.
- When asked to challenge harder, increase objection difficulty.
```

## 8.3 复盘生成 Prompt 要求

复盘模型输出必须结构化，包含：

- meetingOutcome
- scores
- topImprovements
- bestMoments
- sentenceUpgrades
- materialCoverage
- phrasebookSuggestions
- weaknessUpdates
- nextSessionRecommendation

输出格式建议使用 JSON，再由前端渲染为复盘页面。

## 9. 技术架构建议

### 9.1 推荐技术栈

前端：

- Next.js / React
- TypeScript
- Tailwind CSS
- shadcn/ui 或同类组件库
- WebRTC 客户端

后端：

- Next.js API Routes / Node.js service
- 文件解析服务
- AI orchestration service
- 数据库：PostgreSQL
- 向量检索：OpenAI Vector Stores / File Search 或独立向量数据库
- 对象存储：本地开发可用文件系统，生产建议使用 S3/R2/Vercel Blob 等

AI：

- Realtime API：实时语音会谈
- Responses API 或同类文本生成接口：材料摘要、会前准备、复盘、表达库生成
- File Search / Vector Stores：材料检索

参考官方文档：

- OpenAI Realtime API：https://platform.openai.com/docs/guides/realtime
- OpenAI Realtime WebRTC：https://platform.openai.com/docs/guides/realtime-webrtc
- OpenAI File Search：https://platform.openai.com/docs/guides/tools-file-search

### 9.2 高层架构

```text
Browser
  - UI
  - WebRTC audio session
  - Transcript display
  - Cue controls

Backend API
  - Auth / user profile
  - Realtime session token
  - Material upload
  - Material parsing
  - Prep card generation
  - Review generation
  - Phrasebook / weakness persistence

AI Services
  - Realtime model for live conversation
  - Text model for material brief and review
  - File Search / vector retrieval for uploaded materials

Database / Storage
  - Users
  - Materials
  - Practice sessions
  - Transcripts
  - Reviews
  - Phrasebook
  - Weakness tracker
```

### 9.3 文件处理策略

1. 上传文件到对象存储。
2. 后端解析文本、页码、标题、章节。
3. 生成 Material Brief。
4. 将材料内容写入向量检索系统。
5. Realtime 会话只传压缩后的 Material Brief。
6. 若实时对话需要材料细节，由后端检索相关片段并注入上下文。

### 9.4 为什么不把全文直接塞进 Realtime Session

- 材料可能很长，影响上下文质量。
- 实时语音对话更需要低延迟和稳定角色控制。
- 压缩 brief 更适合实时会话。
- 详细材料可通过检索按需补充。

## 10. API 设计草案

### 10.1 Realtime 会话

`POST /api/realtime/session`

请求：

```json
{
  "practiceSessionId": "session_123",
  "personaId": "technical_lead",
  "materialId": "material_123",
  "mode": "customer_qa"
}
```

响应：

```json
{
  "clientSecret": "...",
  "sessionId": "rt_session_123",
  "expiresAt": "2026-05-07T13:00:00Z"
}
```

要求：

- 该接口必须在服务端调用 OpenAI API。
- 不得把标准 API key 返回给浏览器。

### 10.2 上传材料

`POST /api/materials`

请求：multipart form-data

字段：

- file
- name
- customerType
- industry
- meetingGoal
- confidentialMode
- notes

响应：

```json
{
  "materialId": "material_123",
  "status": "processing"
}
```

### 10.3 获取材料摘要

`GET /api/materials/:id/brief`

响应：

```json
{
  "materialId": "material_123",
  "status": "ready",
  "brief": {
    "keyMessage": "...",
    "productPoints": [],
    "likelyQuestions": [],
    "likelyObjections": [],
    "riskyClaims": [],
    "usefulPhrases": [],
    "glossary": []
  }
}
```

### 10.4 生成会前准备卡

`POST /api/prep-cards`

请求：

```json
{
  "materialId": "material_123",
  "customerType": "enterprise_buyer",
  "industry": "conference",
  "meetingGoal": "schedule_follow_up_demo",
  "knownConcerns": ["privacy", "translation accuracy"]
}
```

响应：

```json
{
  "prepCardId": "prep_123",
  "customerContext": "...",
  "meetingGoal": "...",
  "keyTalkingPoints": [],
  "discoveryQuestions": [],
  "likelyObjections": [],
  "openingScript": "...",
  "mustUsePhrases": [],
  "doNotOverpromise": []
}
```

### 10.5 创建训练

`POST /api/practice-sessions`

请求：

```json
{
  "mode": "objection_challenge",
  "personaId": "skeptical_executive",
  "materialId": "material_123",
  "prepCardId": "prep_123",
  "difficulty": "hard",
  "trainingFocus": ["conciseness", "business_value"]
}
```

响应：

```json
{
  "practiceSessionId": "session_123",
  "status": "created"
}
```

### 10.6 保存 transcript

`POST /api/practice-sessions/:id/transcript`

请求：

```json
{
  "turns": [
    {
      "speaker": "ai_customer",
      "text": "How is this different from using a phone translation app?",
      "timestamp": 1234
    },
    {
      "speaker": "user",
      "text": "Our glasses can translate language in real time.",
      "timestamp": 5678
    }
  ]
}
```

### 10.7 生成复盘

`POST /api/practice-sessions/:id/review`

响应：

```json
{
  "reviewId": "review_123",
  "meetingOutcome": {},
  "scores": {},
  "topImprovements": [],
  "sentenceUpgrades": [],
  "materialCoverage": {},
  "phrasebookSuggestions": [],
  "weaknessUpdates": [],
  "nextSessionRecommendation": {}
}
```

### 10.8 表达库

`POST /api/phrasebook`

请求：

```json
{
  "category": "Business Value",
  "english": "Rokid Glasses provide real-time translated captions, helping international teams reduce communication friction during multilingual meetings.",
  "chinese": "Rokid 眼镜提供实时翻译字幕，帮助国际团队在多语言会议中降低沟通障碍。",
  "useCase": "Explaining translation value in enterprise meetings",
  "source": "review",
  "tags": ["translation", "business-value", "meetings"]
}
```

## 11. 数据模型草案

### 11.1 UserProfile

```json
{
  "id": "user_123",
  "name": "Yuna",
  "role": "Overseas Sales & Solution",
  "englishLevel": "B2",
  "trainingPreferences": {
    "correctionStyle": "after_session",
    "subtitleMode": "english_only",
    "defaultDifficulty": "normal"
  }
}
```

### 11.2 Material

```json
{
  "id": "material_123",
  "ownerId": "user_123",
  "name": "Rokid Enterprise Demo Deck",
  "fileType": "pptx",
  "storageUrl": "...",
  "confidentialMode": true,
  "processingStatus": "ready",
  "createdAt": "2026-05-07T12:00:00Z"
}
```

### 11.3 MaterialBrief

```json
{
  "materialId": "material_123",
  "keyMessage": "...",
  "productPoints": [],
  "customerValue": [],
  "likelyQuestions": [],
  "likelyObjections": [],
  "riskyClaims": [],
  "usefulPhrases": [],
  "glossary": [],
  "outline": []
}
```

### 11.4 PracticeSession

```json
{
  "id": "session_123",
  "userId": "user_123",
  "mode": "customer_qa",
  "personaId": "technical_lead",
  "materialId": "material_123",
  "difficulty": "normal",
  "status": "completed",
  "startedAt": "...",
  "endedAt": "..."
}
```

### 11.5 Review

```json
{
  "id": "review_123",
  "sessionId": "session_123",
  "scores": {},
  "topImprovements": [],
  "sentenceUpgrades": [],
  "materialCoverage": {},
  "phrasebookSuggestions": [],
  "weaknessUpdates": [],
  "nextSessionRecommendation": {}
}
```

### 11.6 Phrase

```json
{
  "id": "phrase_123",
  "userId": "user_123",
  "category": "Objection Handling",
  "english": "...",
  "chinese": "...",
  "useCase": "...",
  "simpleVersion": "...",
  "professionalVersion": "...",
  "tags": [],
  "source": "review",
  "masteryStatus": "needs_practice"
}
```

### 11.7 WeaknessMetric

```json
{
  "id": "weakness_123",
  "userId": "user_123",
  "type": "Feature-Only Talk",
  "severity": 4,
  "evidence": "...",
  "recommendedDrill": "...",
  "lastUpdatedAt": "..."
}
```

## 12. 内容设计

### 12.1 对话中提示原则

- 提示必须短。
- 默认英文。
- 中文解释点击后展开。
- 不提供完整长答案。
- 优先引导用户继续说。

### 12.2 复盘内容原则

- 先讲商务结果，再讲英语问题。
- 只给最重要的 3 个改进。
- 每个改进都要给可替换英文句子。
- 必须提供中文解释。
- 必须引导用户再说一遍。

### 12.3 推荐内置句型

Opening:

- Thanks for taking the time to speak with me today.
- Before we jump into the product, may I first understand your use case?

Discovery:

- What problem are you trying to solve with smart glasses?
- Who will be the main users?
- What does a successful pilot look like for your team?

Product Positioning:

- Rokid is not just a display device; it is designed to make information accessible hands-free.
- The key value is reducing communication friction in real time.

Demo:

- Let me walk you through a simple scenario.
- Imagine your team is in a multilingual meeting.

Objection Handling:

- That is a fair concern.
- It depends on the use case, so I would first clarify your deployment environment.
- We can start with a small pilot before discussing a larger rollout.

Closing:

- Would it make sense to schedule a follow-up demo with your technical team?
- I can send over a short proposal based on what we discussed today.

## 13. 权限与隐私

### 13.1 权限

MVP 可做单用户登录，也可先做本地受保护访问。若上线使用，建议至少包含：

- 登录
- 用户数据隔离
- 文件访问权限控制
- 删除数据能力

### 13.2 数据保留

用户可选择：

- 不保存训练记录
- 保存 7 天
- 保存 30 天
- 手动删除

### 13.3 隐私提示

上传页必须提示：

```text
Please remove or mask customer-confidential information such as names, pricing, contract terms, and private business data unless you are allowed to use them for training.
```

中文：

```text
上传前请确认是否包含客户名称、价格、合同条款或其他敏感业务信息。如无授权，建议先隐藏或删除。
```

## 14. 错误状态

### 14.1 文件上传错误

- 文件格式不支持。
- 文件过大。
- 解析失败。
- 材料内容过少。
- 材料疑似扫描图片，需要 OCR。

### 14.2 实时会话错误

- 麦克风权限未开启。
- 浏览器不支持 WebRTC。
- Realtime session 创建失败。
- 网络中断。
- AI 音频无响应。
- 用户结束会话但 transcript 未保存。

### 14.3 AI 输出错误

- 复盘生成失败。
- 材料摘要生成失败。
- 输出 JSON 解析失败。
- 内容过于泛化，需要重新生成。

### 14.4 错误处理标准

- 所有错误必须给用户可执行下一步。
- 不显示底层 API key、堆栈或敏感日志。
- 可重试的错误提供 Retry。
- 不可恢复的错误保存当前可用数据。

## 15. 指标体系

### 15.1 使用指标

- 每周训练次数
- 平均训练时长
- 材料上传数量
- 复盘查看率
- 表达保存数量
- 异议练习次数

### 15.2 学习指标

- 回答简洁度改善
- Business Value 得分趋势
- Objection Handling 得分趋势
- Discovery Questions 使用次数
- Next Step 提出率
- 高频词重复下降

### 15.3 产品成功标准

MVP 成功标准：

- 用户能基于一份真实材料完成一次 10 分钟英文客户模拟。
- 复盘中能获得至少 3 条有价值改进。
- 用户能保存至少 5 条个人表达。
- 下一次训练推荐能反映上一次弱点。

## 16. MVP 优先级

### P0 必须做

- Dashboard
- 材料上传
- Material Brief
- 会前准备卡
- Persona 选择
- 实时语音会谈
- Transcript 保存
- 会后复盘
- Sentence Upgrade 中英文对照
- Phrasebook 保存
- Weakness Tracker 基础版
- Confidential Mode

### P1 应该做

- Objection Bank 内置 30 个异议
- 材料页面级 outline
- Replay Practice
- 难度等级
- 历史复盘列表
- 首页推荐训练

### P2 可后置

- 会后邮件训练
- 真实会议录音导入
- OCR
- 多用户团队版
- 高级可视化趋势
- 外部 CRM 集成

## 17. 开发里程碑

### Milestone 1：基础产品骨架

- 路由与页面框架
- Dashboard 静态版
- Materials 页面
- Practice 页面
- Phrasebook 页面
- Progress 页面

### Milestone 2：材料上传与摘要

- 文件上传
- 文本解析
- Material Brief 生成
- Brief 页面展示

### Milestone 3：Realtime 语音训练

- 后端生成 Realtime session
- 前端 WebRTC 连接
- 麦克风控制
- 语音状态管理
- Transcript 保存

### Milestone 4：复盘与表达库

- Review 生成
- Sentence Upgrade
- Material Coverage
- Phrasebook 保存
- Weakness 更新

### Milestone 5：异议题库与个性化推荐

- Objection Bank
- 异议专项训练
- This Week's Focus
- Next Session Recommendation

### Milestone 6：隐私、错误处理与体验打磨

- Confidential Mode
- 删除数据
- 错误状态
- 响应式适配
- 体验测试

## 18. 验收清单

### 18.1 端到端核心链路

- 用户上传材料。
- 系统生成 Material Brief。
- 用户生成 Meeting Prep Card。
- 用户选择客户 persona。
- 用户开始实时语音训练。
- AI 根据材料和 persona 提问。
- 用户结束训练。
- 系统生成复盘。
- 用户保存表达到 Phrasebook。
- Weakness Tracker 更新。
- Dashboard 推荐下一次训练。

### 18.2 质量验收

- AI 问题不能脱离材料和客户角色。
- 复盘不能只讲语法，必须讲商务表现。
- 中英文对照必须自然、准确、可学习。
- 提示不能遮挡或打断实时会话。
- 敏感模式下不得编造或扩展敏感承诺。

## 19. 待确认问题

1. 是否需要用户登录，还是先做本地单用户版本？
2. 是否允许上传真实客户材料到云端，还是必须本地处理？
3. Rokid 内部是否有正式 approved product messaging，可以作为表达库基础？
4. 是否需要接入真实产品参数表，避免 AI 生成不准确产品说法？
5. 是否需要保留录音，还是只保存 transcript？
6. MVP 是否需要支持中文语音输入，还是只支持英文训练？

## 20. 结论

本产品的核心不是“和 AI 聊天”，而是让用户在真实海外销售语境中反复完成以下闭环：

```text
真实材料 -> 会前准备 -> 客户模拟 -> 实时沟通 -> 商务复盘 -> 表达沉淀 -> 弱点追踪 -> 下一次训练
```

只要这个闭环成立，网站就能持续帮助用户提升 Rokid 海外商务会谈能力，而不是停留在泛英语口语练习。
