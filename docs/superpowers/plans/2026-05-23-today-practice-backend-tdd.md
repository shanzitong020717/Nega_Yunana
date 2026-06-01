# 今日训练三步创建后端配置 TDD

日期：2026-05-23

## 1. 测试驱动目标

先用失败测试定义正确行为，再实现后端配置。这个任务的核心不是让按钮看起来可选，而是证明每一次选择都真实进入后端 session、实时 prompt、材料/记忆解析和后续练习上下文。

## 2. 测试范围

覆盖四层：

1. 后端创建 API：`POST /api/practice-sessions`
2. 后端解析服务：材料模式、记忆、训练重点、角色/音色解析
3. 前端 wizard：三步选择生成正确 payload 并缓存 enriched session
4. 实时会话 API：`POST /api/realtime/session` 能读取或接收 enriched session context
5. 第二步配置：角色、音色、角色-音色推荐规则必须由独立配置文件驱动

## 3. 建议新增/修改测试文件

### 3.1 新增 `tests/unit/create-practice-session.test.ts`

目的：测试后端 service，不依赖 React。

用例：

- `creates enriched session with selected goal, persona, voice, focus tags`
  - 输入：`goalId: "solution_meeting"`、`personaId: "procurement_manager"`、`voicePackId: "leda-youthful"`、`materialMode: "no_material"`。
  - 期望：返回 `resolvedContext.goal.label`、`resolvedContext.persona.label`、`resolvedContext.voicePack.providerVoiceName`。
  - 期望：`resolvedContext.material.mode === "no_material"`。
  - 期望：`resolvedContext.focus.realtimeInstructions.length > 0`。

- `does not store symbolic material mode as materialId`
  - 输入：`materialMode: "recent_material"`。
  - 期望：`practiceSession.materialId !== "recent_material"`。
  - 无真实材料时，`resolvedContext.material.resolutionStatus === "fallback_to_memory"` 或 `not_found`。

- `resolves memory context into memory snippets`
  - 输入：`materialMode: "memory_context"`、`focusTags: ["商业价值", "简短回答"]`。
  - 期望：`resolvedContext.memorySnippets.length > 0`。
  - 期望：片段来自 memory store 的 title/summary。

- `rejects invalid voice pack for scenario`
  - 输入：不存在的 `voicePackId`。
  - 期望：抛出 validation/domain error，API 层映射为 400。

### 3.2 修改 `tests/api/base-routes.test.ts` 或新增 `tests/api/practice-sessions.test.ts`

目的：测试 HTTP 层契约。

用例：

- `POST /api/practice-sessions returns enriched practice session`
  - 请求体包含三步选择。
  - 响应包含 `practiceSession.id`、`resolvedContext`、`status: "created"`。

- `POST /api/practice-sessions accepts no_material without materialId`
  - 请求体：`materialMode: "no_material"`。
  - 期望：响应没有假 materialId。

- `POST /api/practice-sessions returns readable error for invalid persona`
  - 请求体：非法 persona。
  - 期望：400 + 中文错误。

### 3.3 修改 `tests/unit/practice-wizard.test.tsx`

目的：确保三步按钮不只是视觉状态，而是影响请求体。

用例：

- `sends selected goal, persona, voice, material mode, and focus tags`
  - 选择「方案会议」。
  - 下一步选择「高管决策者」和某个音色。
  - 下一步选择「使用系统记忆」并切换训练重点。
  - 点击「开始练习」。
  - 期望 fetch body：
    - `goalId: "solution_meeting"`
    - `personaId: "executive_decision_maker"`
    - `voicePackId` 为选中音色
    - `materialMode: "memory_context"`
    - 不包含 `materialId: "memory_context"`
    - `focusTags` 为用户最终选择

- `stores enriched session returned by backend`
  - mock API 返回带 `resolvedContext` 的 session。
  - 期望 sessionStorage 中保留 resolvedContext。

### 3.4 修改 `tests/api/realtime-session.test.ts`

目的：证明创建练习的后端上下文会进入实时对话。

用例：

- `uses enriched practice session context when practiceSessionId is provided`
  - 先通过 service 或 store 创建 enriched session。
  - 请求 `/api/realtime/session` 只传 `practiceSessionId` 和必要基础字段。
  - 期望 `instructionsPreview` 包含：
    - 选中的 persona 角色重点
    - 训练重点指令
    - memory snippet 或材料 brief 信号

- `falls back to cached client context when server session is unavailable`
  - 请求体传 `practiceSessionId: "missing_session"` + `resolvedContext`。
  - 期望仍然能生成包含 cached context 的 instructions。

### 3.5 修改 `tests/unit/realtime-instructions.test.ts`

目的：测试 prompt builder 使用完整上下文。

用例：

- `includes selected focus instructions and memory snippets`
- `omits material section when materialMode is no_material`
- `includes prep card and material brief when resolved`

### 3.6 修改 `tests/unit/scenario-packs.test.ts`

目的：证明第二步不是硬编码 UI，而是由详细配置驱动。

用例：

- `defines detailed role prompts for each customer persona`
  - 每个角色必须有 `openingQuestions`、`followUpPatterns`、`challengeRules`、`defaultFocusTags`。
  - 技术负责人必须覆盖产品参数、集成、安全边界和 unsupported claims。

- `defines Gemini Live config for each AI Studio voice pack`
  - 每个音色必须有 `providerVoiceName`。
  - 每个音色必须有 `geminiLiveConfig.speech_config.voice_config.prebuilt_voice_config.voice_name`。

- `defines role to voice recommendations for the second wizard step`
  - 技术负责人默认推荐 `charon-informative`。
  - 高管决策者默认推荐 `fenrir-excitable`。

## 4. 推荐实现顺序

### Step 1：先写失败测试

新增/修改测试：

```bash
npm test -- tests/unit/create-practice-session.test.ts
npm test -- tests/api/practice-sessions.test.ts tests/unit/practice-wizard.test.tsx
npm test -- tests/api/realtime-session.test.ts tests/unit/realtime-instructions.test.ts
```

预期：新增测试先失败，失败原因应该集中在：

- `materialMode` schema 不存在。
- create session 没有 `resolvedContext`。
- 前端仍发送假 `materialId`。
- realtime session 不支持 enriched context。

### Step 2：扩展 validation schema

文件：

- `src/lib/validation/practice.ts`
- `src/lib/practice/practice-session-selection.ts`

修改：

- 新增 `materialModeSchema`。
- `createPracticeSessionInputSchema` 支持 `materialMode`。
- 保留 `materialId` 作为具体材料 ID。
- `StoredPracticeSessionSelection` 增加 `materialMode` 和 `resolvedContext`。

测试：

```bash
npm test -- tests/unit/create-practice-session.test.ts
```

### Step 3：实现创建服务

新增：

- `src/lib/practice/create-practice-session.ts`

实现：

- `resolveScenarioGoal`
- `resolvePersona`
- `resolveVoicePack`
- `resolveMaterialContext`
- `resolveFocusInstructions`
- `createResolvedPracticeSession`

先让 unit tests 通过。

测试：

```bash
npm test -- tests/unit/create-practice-session.test.ts
```

### Step 4：接入 API route

文件：

- `src/app/api/practice-sessions/route.ts`
- `src/lib/practice/practice-session-store.ts`

修改：

- `POST` 从直接 `savePracticeSessionRecord(input)` 改为调用 `createResolvedPracticeSession(input)`。
- `PracticeSessionRecord` 支持 `materialMode` 和 `resolvedContext`。
- 保持旧字段向后兼容。

测试：

```bash
npm test -- tests/api/practice-sessions.test.ts tests/api/base-routes.test.ts
```

### Step 5：接入 PracticeWizard

文件：

- `src/features/practice/practice-wizard.tsx`

修改：

- 用 `selectedMaterialMode` 管理材料模式。
- payload 发送 `materialMode`。
- 只有未来具体材料才发送真实 `materialId`。
- 保存后端返回的 enriched session。

测试：

```bash
npm test -- tests/unit/practice-wizard.test.tsx tests/unit/practice-views.test.tsx
```

### Step 6：接入实时会话

文件：

- `src/app/api/realtime/session/route.ts`
- `src/features/practice/realtime-room.tsx`
- `src/lib/ai/realtime.ts` 如有必要

修改：

- realtime request 支持 `practiceSessionId` 和 cached `resolvedContext`。
- API 优先读取 server session，失败时使用 cached context。
- 把 memorySnippets、focus instructions、material/prep context 传入 prompt builder。
- 语音 config 继续使用 `voicePack.providerVoiceName`。

测试：

```bash
npm test -- tests/api/realtime-session.test.ts tests/unit/realtime-instructions.test.ts tests/unit/realtime-room.test.tsx
```

### Step 7：回归验证

必须执行：

```bash
npm test -- tests/unit/create-practice-session.test.ts tests/api/practice-sessions.test.ts tests/unit/practice-wizard.test.tsx tests/api/realtime-session.test.ts tests/unit/realtime-instructions.test.ts
npm run typecheck
npm run lint
npm run build
```

如本地需要手动验证：

```bash
npm run dev -- --port 3000
```

浏览器路径：

```text
http://localhost:3000/practice
```

手动检查：

- 选择每个目标、角色、音色、材料模式和训练重点后开始练习。
- 打开开发者工具或测试日志确认 POST payload。
- 进入实时练习页后，检查显示的 AI 声音与选择一致。
- 检查提示/建议回答是否使用同一 session context。

## 5. 通过标准

这个任务完成时，下面几句话必须都为真：

- 前端不再把 `recent_material` 或 `memory_context` 当作 `materialId`。
- 后端返回的 `practiceSession` 包含 `resolvedContext`。
- 练习目标、客户角色、AI 音色、材料/记忆、训练重点都能被测试证明进入后端。
- 实时会话可以基于 `practiceSessionId` 或 cached context 生成正确 prompt。
- 没有真实材料时，系统会明确兜底到无材料或记忆上下文，而不是静默失败。
