# Word Memory Master — PRD

> 单词记忆大师 — 本地 Web 应用
> 状态: 草案 v1
> 来源: grill-me 会话 (14 个决策回合)

---

## Problem Statement

学习英语单词时，学习者面对的核心困难不是"查询字典"（这一步已经被各种工具解决了），而是**记住并会用**。市面上的查词工具（词典、Anki、各种 APP）大多：

1. 只给出单词的字面定义，缺乏**词源拆解、记忆钩子、搭配**等多维度刺激；
2. 单词之间是孤立的，缺少**关联记忆**（一个生词和之前学过的单词串联起来）；
3. 没有针对**自测反馈**的设计（学习者不知道哪些单词真记住了）；
4. 数据往往锁死在某个云服务或专有格式中，无法掌控。

学习者真正需要的是一个工具，能够在查词的同时，把单词转化为**多维度、可发音、可串联、可自测**的记忆卡片，并且这些数据由自己完全掌控。

---

## Solution

一个**本地 Web 应用**：在 Chrome / Edge 中打开 HTML 文件，输入一个陌生单词，应用通过**可配置的 LLM** 调用，返回结构化 JSON 记忆卡片并自动保存。卡片包含：音标 + 难度评级 + 中文释义 + 词源拆解 + 记忆钩子 + 3 个常见搭配 + 中英双语例句（日常 + 学术）+ 自测题 + 与最近 30 个已学单词串联的句子。

每个已学单词自动进入本地历史，按日期分组（今天 / 昨天 / 本周 / 更早）展示，支持搜索和点击查看完整卡片。学习者可以通过**浏览器内置 SpeechSynthesis** 听到单词和例句的发音，可以通过 3 按钮（记住了 / 模糊 / 没记住）自评记忆效果。

所有数据保存在浏览器 `localStorage`，可一键导出 / 导入 JSON 备份。LLM 的 API key、base URL、模型、提示词模板、历史注入大小 N、TTS 语音等所有配置都在设置面板中可编辑，并可一键重置默认值。

**核心差异化**：提示词中明确要求 LLM 把新单词和**用户的历史词汇**编织进一个串联句子，这是市面上大多数查词工具都没有的"联想网络"功能。

---

## User Stories

### 查词与卡片生成

1. As a **学习者**, I want to **输入一个陌生单词并按回车**, so that **应用开始生成对应的记忆卡片**。
2. As a **学习者**, I want to **看到单词的音标（IPA）**, so that **我知道它的标准发音**。
3. As a **学习者**, I want to **看到单词的 CEFR 难度评级（A1-C2）**, so that **我了解它的难度定位**。
4. As a **学习者**, I want to **看到单词的中文核心释义**, so that **我快速理解它的含义**。
5. As a **学习者**, I want to **看到单词的词源拆解（前缀 / 词根 / 后缀）**, so that **我从结构层面理解单词**。
6. As a **学习者**, I want to **看到同词根的相关单词**, so that **我把单词归入已有的词族**。
7. As a **学习者**, I want to **看到词源的"内在逻辑"解释**, so that **我理解为什么这个组合代表这个意思**。
8. As a **学习者**, I want to **看到一个生动 / 视觉化的记忆钩子**, so that **我能更快记住这个单词**。
9. As a **学习者**, I want to **看到 3 个常见搭配（collocations）**, so that **我学到单词的自然用法**。
10. As a **学习者**, I want to **看到至少 1 个日常口语例句 + 1 个学术书面例句（均中英双语）**, so that **我了解单词在不同语境下的用法**。
11. As a **学习者**, I want to **看到每个例句旁有一个播放按钮**, so that **我能听到例句的英语发音**。
12. As a **学习者**, I want to **看到单词旁有一个播放按钮**, so that **我能听到单词的标准发音**。
13. As a **学习者**, I want to **看到一个自测题（填充 / 词义匹配）**, so that **我能主动回忆而不是被动阅读**。
14. As a **学习者**, I want to **看到一个把新单词和最近学过的单词串联起来的例句**, so that **我建立单词之间的联想网络**。

### 历史与复习

15. As a **学习者**, I want to **看到一个"今天的单词"分组**，so that **我能快速回顾当天学习的内容**。
16. As a **学习者**, I want to **看到按日期分组的历史列表（今天 / 昨天 / 本周 / 更早）**, so that **我能按时间维度浏览所有学过的单词**。
17. As a **学习者**, I want to **有一个搜索框**, so that **我能通过单词文本快速找到某个历史单词**。
18. As a **学习者**, I want to **点击历史中的一个单词**, so that **我能打开它的完整卡片并重新学习**。
19. As a **学习者**, I want to **在复习时隐藏自测题答案**, so that **我能先主动回忆再核对**。
20. As a **学习者**, I want to **用一个三按钮（记住了 / 模糊 / 没记住）评价我的回忆**, so that **我跟踪自己的记忆效果**。
21. As a **学习者**, I want to **删除历史中的某个单词**, so that **我能清理掉无效 / 错误的条目**。

### 设置与配置

22. As a **学习者**, I want to **在设置面板中输入 LLM 的 API key**, so that **应用能调用 LLM**。
23. As a **学习者**, I want to **在设置面板中配置 API base URL**, so that **我能切换不同的 LLM 提供商**。
24. As a **学习者**, I want to **在设置面板中配置模型名称**, so that **我能切换不同的模型**。
25. As a **学习者**, I want to **在设置面板中编辑提示词模板**, so that **我能自定义 LLM 的回复风格和字段**。
26. As a **学习者**, I want to **在设置面板中配置历史注入大小 N（默认 30）**, so that **我能平衡串联质量和 token 成本**。
27. As a **学习者**, I want to **在设置面板中选择 TTS 语音（语种 + 名称）**, so that **我能听到我喜欢的声音**。
28. As a **学习者**, I want to **在设置面板中调节 TTS 语速和音调**, so that **我调整到舒适的播放效果**。
29. As a **学习者**, I want to **每个设置都有"恢复默认值"按钮**, so that **我能在配错时快速回到正常状态**。
30. As a **学习者**, I want to **切换"使用本地代理"开关**, so that **当 LLM 提供商不允许浏览器 CORS 时，我能通过代理调用**。

### 数据持久化与备份

31. As a **学习者**, I want to **我的所有数据（设置 + 单词历史）在浏览器关闭后依然保留**, so that **我不丢失学习进度**。
32. As a **学习者**, I want to **一键导出所有数据为 JSON 文件**, so that **我能在换电脑或清理浏览器前备份**。
33. As a **学习者**, I want to **从一个 JSON 文件导入数据**, so that **我能恢复或迁移到新设备**。

### 错误处理与鲁棒性

34. As a **学习者**, I want to **当 LLM 返回的 JSON 无法解析时，应用自动重试一次（使用更严格的提示）**, so that **我不用手动处理偶发错误**。
35. As a **学习者**, I want to **当自动重试仍失败时，应用显示原始返回内容 + 一个手动重试按钮**, so that **我能查看发生了什么并主动恢复**。
36. As a **学习者**, I want to **当正在等待 LLM 响应时，输入框被禁用**, so that **我不会意外发起多次请求**。
37. As a **学习者**, I want to **看到加载指示（spinner + "生成中…"）**, so that **我知道应用正在工作而不是卡死**。
38. As a **学习者**, I want to **应用在第一次查词（无历史）时不报错**，so that **我可以用单个单词开始学习**。

### 平台与运行

39. As a **学习者**, I want to **通过在 Chrome / Edge 中打开 HTML 文件运行应用**, so that **我不需要安装任何东西**。
40. As a **学习者**, I want to **应用在 Windows 上运行**, so that **我能在我的工作环境中使用**。
41. As a **学习者 / 代理**, I want to **所有核心逻辑封装在可独立测试的模块中**, so that **重构不会引入回归**。

---

## Implementation Decisions

### 整体架构

- **应用形态**：本地 Web 应用，由 `index.html` + `app.js` + `styles.css` + 可选的 `proxy-example.js` 组成，在 Chrome / Edge 中直接打开 `index.html` 运行。**无构建步骤，无服务器，无打包**。
- **目标浏览器**：Chrome / Edge（Windows 上的 SpeechSynthesis 语音质量更好，特别是 Edge 自带的 Microsoft 自然语音）。
- **数据存储**：浏览器 `localStorage`，两个键：`settings`（配置对象）和 `words`（单词历史数组）。
- **LLM 调用**：通过标准 `fetch` 直接调用 OpenAI 兼容端点；CORS 失败时切换到本地代理。

### 卡片 JSON Schema（来自用户提示词 + 大串联 + 自测题）

```jsonc
{
  "word": "abandon",
  "phonetic": "/əˈbændən/",
  "cefr": "B2",
  "coreMeaning": "放弃；抛弃",
  "etymology": {
    "rootAffix": "a- (加强) + bandon (权威/控制)",
    "relatedWords": ["ban", "bandage", "bandit"],
    "logic": "放弃对某物的控制权 → 完全放弃"
  },
  "mnemonic": {
    "association": "想象你丢掉王冠的瞬间..."
  },
  "usage": {
    "collocations": ["abandon hope", "abandon oneself to", "abandon ship"],
    "examples": [
      { "type": "daily",    "en": "...", "zh": "..." },
      { "type": "academic", "en": "...", "zh": "..." }
    ]
  },
  "quiz": {
    "question": "填空：He ___ his car in the snow.",
    "answer": "abandoned"
  },
  "chain": "After he abandoned his post, the bandit tried to bandage his wounds."
}
```

> 该 schema 通过原型迭代得出，编码了"用户提示词模板中的所有字段 + 自测题 + 大串联"的精确结构。

### 模块列表（10 个深度模块）

| # | 模块 | 接口 | 职责 |
|---|---|---|---|
| 1 | `llmClient` | `complete({systemMsg, userMsg, settings}) → {ok: true, card} \| {ok: false, raw}` | fetch 调用、JSON 解析、解析失败时自动重试一次（追加"仅返回原始 JSON"）、仍失败时返回原始文本 |
| 2 | `promptBuilder` | `buildMessages({word, history, settings, isFirstWord}) → {system, user}` | 拼接系统消息（用户原版提示词 + 追加的 JSON schema）+ 用户消息（单词 + 可选历史） |
| 3 | `schemaValidator` | `validateCard(obj) → {ok: true, card} \| {ok: false, errors[]}` | 校验 LLM 返回的 JSON 符合预期结构，所有下游模块都依赖它通过 |
| 4 | `cardRenderer` | `renderCard(card) → HTMLElement` | 把卡片对象渲染成 DOM（新卡片 / 历史详情 / 迷你预览三处复用） |
| 5 | `ttsEngine` | `speak(text, opts)`, `pickVoice(lang)` | 包装 SpeechSynthesis，异步加载语音列表、按语言挑选、排队避免重叠 |
| 6 | `storage` | `getSettings()`, `setSettings()`, `getWords()`, `addWord(entry)`, `deleteWord(id)` | localStorage 封装、默认值注入、序列化、版本号字段预留 |
| 7 | `historyIndex` | `groupByDate(words)`, `filterByQuery(words, q)`, `recentN(words, n)` | 纯函数，对单词数组做分组 / 搜索 / 取最近 N |
| 8 | `settingsPanel` | `renderSettings()`, `bindSettings()` | 设置面板 DOM ↔ 配置对象双向绑定 + 字段级 reset-to-default |
| 9 | `exporter` | `exportAll()`, `importAll(json)` | 导出整个 localStorage 为 JSON 文件 / 从 JSON 文件导入并校验结构 |
| 10 | `appShell` | `init()`, `onLookupSubmit()`, `onWordClick()`, `onSettingsChange()` 等 | 主循环，连接 DOM 事件与其他模块 |

### 关键技术决策

#### LLM 客户端 (`llmClient`)

- **OpenAI 兼容端点**：调用 `POST {apiBaseUrl}/chat/completions`，body 为 `{model, messages: [{role:'system', content:systemMsg}, {role:'user', content:userMsg}], temperature, max_tokens, response_format?}`。
- **`response_format: {type: 'json_object'}`**：当 settings 启用时使用，强制 LLM 返回合法 JSON。前提是提供商支持（OpenAI / 部分兼容提供商支持）。
- **自动重试策略**：第一次解析失败 → 重新发送同样的 messages，但 user message 末尾追加 `\n\n重要：仅返回原始 JSON 对象，不要使用 markdown 代码块包裹，不要有任何前后解释。`；第二次解析仍失败 → 返回 `{ok: false, raw: <原始文本>}`，由 `appShell` 显示原始内容 + 重试按钮。
- **超时**：默认 30s，可配置。

#### 提示词构造 (`promptBuilder`)

- **系统消息**：用户的提示词原文 + 在末尾追加一段 JSON schema + `"输出格式：仅返回上述 JSON 对象，无 markdown 代码块，无前后解释。"`。
- **用户消息**：
  - 当 `isFirstWord === true` 或历史为空：仅 `"请处理以下单词：{word}\n\n仅返回 JSON。"`。
  - 否则：`"请处理以下单词：{word}\n\n用户已学过的最近 N 个单词（用于'大串联'）：\n{history}\n\n仅返回 JSON。"`。
- **历史格式**：每行一个 `"word (coreMeaning)"`，最多 N 条（N 默认 30，settings 可配）。

#### 设置对象 (`settings`)

```jsonc
{
  "apiBaseUrl": "https://api.MiniMax.chat/v1",
  "apiKey": "<user-key>",
  "model": "MiniMax-M3",
  "promptTemplate": "<用户提供的提示词原文>",
  "historySize": 30,
  "useProxy": false,
  "proxyUrl": "http://localhost:8787/v1",
  "voice": "en-US",
  "rate": 1.0,
  "pitch": 1.0,
  "temperature": 0.7,
  "maxTokens": 2000,
  "requestTimeoutMs": 30000,
  "useJsonMode": true
}
```

首次启动时种子化默认值（用户可在 settings 面板修改）。

#### 历史条目结构 (`words[]`)

```jsonc
{
  "id": "<uuid>",
  "addedAt": <unix-ms>,
  "card": { /* 校验通过的 card JSON */ },
  "rating": "knew" | "fuzzy" | "didnt" | null,
  "ratedAt": <unix-ms> | null
}
```

#### CORS 策略

- **首选**：直接从浏览器调用 LLM 端点（多数 OpenAI 兼容提供商允许 CORS）。
- **回退**：当 `useProxy === true` 时，所有 `llmClient` 请求发往 `proxyUrl`（默认 `http://localhost:8787/v1`）；用户运行 `node proxy-example.js` 启动一个 30 行的本地代理（接收任意路径，转发到 `apiBaseUrl`，添加 CORS 头）。

#### TTS

- **使用浏览器 SpeechSynthesis API**。
- `pickVoice('en-US')` 从 `speechSynthesis.getVoices()` 中按语言匹配；中文例句（如未来需要）走 `pickVoice('zh-CN')`。
- 单词和英语例句播放；中文翻译不播放（聚焦目标语言）。
- 语音列表是异步加载的（`voiceschanged` 事件），应用启动时立即请求一次 + 监听事件刷新缓存。

#### UI 视图

- **主视图**：顶部输入框 + 中部卡片渲染区 + 底部"今日单词"小列表。
- **历史视图**：日期分组的完整列表（今天 / 昨天 / 本周 / 更早）+ 搜索框。
- **详情视图**：点击历史中的单词打开完整卡片 + 自测题 + 自评按钮 + 删除按钮。
- **设置视图**：齿轮图标入口，全字段编辑 + reset-to-default。
- **加载状态**：spinner + "生成中…" 文字 + 输入框禁用。
- **失败状态**：显示原始 LLM 返回内容 + 重试按钮。

#### 保存流程

- **自动保存**：LLM 成功响应且 `schemaValidator` 通过 → 立即写入 `words` 数组。
- **删除**：仅支持删除（不支持内联编辑）；删除前需确认。

---

## Testing Decisions

### 测试原则

- **只测外部行为，不测实现细节**：针对每个模块的公开接口断言输入输出，不绑定内部数据结构。
- **纯函数模块可以无 mock 直接断言**；有副作用的模块（`llmClient` / `ttsEngine` / `storage`）在测试入口处 mock 依赖。
- **测试环境**：使用浏览器原生 fetch / localStorage / SpeechSynthesis 的 stub，测试在 Node 中运行（使用 jsdom 或类似的轻量 DOM）。

### 待测模块

1. **`promptBuilder`**（必测）
   - 输入：`{word: "abandon", history: [...30 items], settings, isFirstWord: false}`
   - 输出：`{system: <含 JSON schema 的字符串>, user: <含历史格式化的字符串>}`
   - 边界用例：
     - 历史为空 → user 消息不包含"用户已学过的最近"段
     - `isFirstWord: true` → user 消息不包含历史段
     - 历史条目数量 < N → 只注入实际数量
     - 历史条目缺 `coreMeaning` → 回退到只用 `word`
     - `promptTemplate` 为空 → 使用内置默认提示词

2. **`schemaValidator`**（必测）
   - 输入：任意 JSON 对象
   - 输出：`{ok: true, card}` 或 `{ok: false, errors: ['...', '...']}`
   - 边界用例：
     - 完整合法对象 → 通过
     - 缺 `word` / `phonetic` / 任何必填字段 → 失败 + 列出缺失字段
     - `examples` 不是数组 → 失败
     - `etymology.relatedWords` 不是字符串数组 → 失败
     - `quiz.question` 为空 → 失败
     - `chain` 缺失 → 通过（chain 可选）

3. **`historyIndex`**（必测）
   - 输入：`words[]` 数组
   - 输出：分组 / 搜索 / 最近 N
   - 边界用例：
     - 空数组 → 分组返回 `{Today: [], Yesterday: [], ThisWeek: [], Earlier: []}`
     - 跨日期边界（UTC vs 本地时区）正确分组
     - 搜索 "aban" 匹配 "abandon"（大小写不敏感、子串匹配）
     - `recentN(..., 30)` 在 100 条历史中返回最近 30 条（按 `addedAt` 降序）

4. **`llmClient`**（必测）
   - mock `fetch`
   - 输入：`{systemMsg, userMsg, settings}`
   - 输出：`{ok: true, card}` 或 `{ok: false, raw}`
   - 边界用例：
     - 第一次 fetch 返回合法 JSON → 通过，调用 `fetch` 一次
     - 第一次返回非法 JSON，第二次返回合法 JSON → 通过，调用 `fetch` 两次，第二次的 userMsg 包含追加的严格指令
     - 两次都返回非法 JSON → 返回 `{ok: false, raw: <最后一次的原始文本>}`
     - `useProxy === true` → 请求 URL 改为 `proxyUrl`
     - `useJsonMode === true` → body 包含 `response_format: {type: 'json_object'}`
     - 超时 → 抛错并被调用方捕获

### 不直接测试的模块（依赖人工 / E2E 验证）

- `cardRenderer`：DOM 渲染通过浏览器手动验证。
- `ttsEngine`：语音行为通过浏览器手动验证。
- `storage`：localStorage 通过浏览器手动验证；导入 / 导出通过手动验证。
- `settingsPanel`：UI 行为通过浏览器手动验证。
- `exporter`：导入 / 导出通过浏览器手动验证。
- `appShell`：事件流通过手动验证。

### 测试运行

- 测试框架：**Vitest**（轻量、零配置、原生支持 ESM、可以直接跑 TypeScript / JS）。
- 命令：`npm test`（`package.json` 中配置 `vitest run`）。
- CI：本项目无 CI 流水线（个人本地项目），由用户在本地手动跑测试。

---

## Out of Scope（v1 不做）

以下功能明确**不在 v1 范围内**，留待后续版本：

1. **间隔重复（Anki-style SRS）**：自评按钮收集了数据，但 v1 不基于评分自动调度复习。后续可基于 `rating` + `addedAt` 实现简单 SRS。
2. **多用户 / 账号系统**：v1 是单用户单浏览器。
3. **云同步**：所有数据本地。备份靠手动导出 / 导入。
4. **移动端响应式**：v1 假设桌面 / 大屏浏览器使用。
5. **音频文件缓存**：每次播放重新合成（SpeechSynthesis 极快，不值得缓存）。
6. **例句中文翻译的音频播放**：v1 只播放英语单词和英语例句。
7. **词族 / 主题浏览**：按 `etymology.relatedWords` 跳转、CEFR 过滤、收藏 / 星标。
8. **批量导入单词**：v1 一次输入一个。
9. **生词本导出为 Anki / CSV**：只导出 / 导入 JSON。
10. **插件系统 / 第三方提示词市场**：v1 单提示词模板。
11. **语音输入**：用户必须键入单词。
12. **图片 / 视频辅助记忆**：仅文本 + 音频。
13. **学习曲线 / 统计仪表板**：v1 不展示"本月学了多少"等统计。
14. **多语言支持（学习日语 / 法语等）**：v1 假设学习英语，中文为界面 / 释义语言。

---

## Further Notes

### 已知风险

1. **CORS**：MiniMax 是否允许浏览器直接调用需要在第一次运行前用一个 30 秒测试验证（详见会话 Q7）。如果失败，立即切到本地代理。
2. **LLM 输出质量**：用户提示词包含 8 个字段 + 自测题 + 大串联，模型需要严格按照 JSON 输出。`response_format: {type: 'json_object'}` 大幅提升成功率但部分提供商不支持；不支持时退回到纯提示词约束 + 自动重试。
3. **Chain 字段在第一次查词时为空**：通过 `isFirstWord` 分支处理，user 消息中不注入历史段，模型自然返回无串联的卡片或短句。
4. **localStorage 容量**：约 5MB 上限。每条历史 ~300 字节 → 理论上限 ~15,000 条单词。日常使用远低于此上限。
5. **SpeechSynthesis 语音依赖系统**：Windows 上 Chrome 默认语音机械；Edge 自带 Microsoft 自然语音，体验明显更好。设置面板允许用户在浏览器内手动选择任何已安装的语音。

### 后续可能的演进方向（仅备忘，不在 v1）

- 基于 `rating` 的简单 SRS（`didnt` → 1 天后复习，`fuzzy` → 3 天，`knew` → 7 天）。
- 词族图谱视图（基于 `etymology.relatedWords` 建立关联）。
- 暗色模式切换。
- 批量查词（粘贴一列单词 → 批量生成卡片）。
- Anki 包导出（`.apkg`）。
- 浏览器扩展形式（保留数据但不用每次开 HTML）。

### 决策溯源

本 PRD 的所有架构决策来源于一个 14 回合的 grill-me 会话。决策 ID 与会话中的 Q 号对齐：

| 决策 | 来源 |
|---|---|
| 本地 Web 应用 | Q1 → (d) |
| 结构化 JSON | Q2 → (b) |
| Schema（含 quiz + chain） | Q3 + 用户提示词 |
| 注入最近 30 个单词 | Q4 → (a) |
| 浏览器 SpeechSynthesis | Q5 → (a) |
| 历史列表 + 每词自测 | Q6 → (a)+(d) |
| Quiz 字段放在 JSON 里 | Q6 → (i) |
| OpenAI 兼容可配置客户端 | Q7 → (g) |
| MiniMax 作为默认提供商 | Q7 |
| CORS 直接 / 代理双路径 | Q7 → (i) |
| localStorage + Export/Import | Q8 → (a) |
| 完整设置面板 | Q9 → (a) |
| 日期分组 + 搜索 | Q10 → (c) |
| 历史格式：word (meaning) | Q10 → (ii) |
| 自动保存 | Q11 → (a) |
| 三按钮自评 | Q11 → (i) |
| 自动重试 + 原始回退 | Q12 → (b) |
| 仅删除，不编辑 | Q12 → (iii) |
| 提示词原文 + 追加 JSON schema | Q13 → (i) |
| 空历史时省略历史段 | Q13 → (α) |
| 非流式 LLM 调用 | Q14 → (a) |
