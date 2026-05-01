# AGENTS.md

本文件给后续在本仓库工作的 AI 编码代理使用。目标是让改动贴合 Zuiti 的架构、隐私边界和本地优先状态策略。

## 项目概览

Zuiti 是一个 Electron + React + TypeScript 桌面宠物应用。渲染进程负责透明悬浮 UI、稳定 SVG 骨架和锚点道具渲染，主进程负责系统能力、LLM 调用、上下文快照、vision、memory、behavior、motion plan 校验和 SVG prop skills。

核心数据流：

1. 用户输入、周期触发或窗口切换进入主进程行为决策。
2. `ContextSnapshotManager` 维护最近完成的 `visionSummary`、`memoryText`、`skillIndex` 和短期对话窗口。
3. `textAgent` 基于稳定快照输出 `dialogue`、`mood_tag`、可选 `motion_plan` 和可选 `prop_intent`。
4. 主进程校验 motion plan；skills 模块选择已有 enabled 道具 skill，或生成、校验、审核新的 SVG prop skill。
5. 主进程通过 IPC 把 mood、对白和 activity 发给 renderer。

主回复 prompt 的稳定顺序是：

```text
SOUL -> memory -> skill index -> recent window -> current event
```

## 目录地图

- `src/main/`：Electron 主进程、LLM provider、vision、memory、skills、behavior、IPC 注册。
- `src/preload/`：安全暴露给 renderer 的 `window.zuiti` API。
- `src/renderer/src/`：React UI、Zustand store、IPC wiring、桌宠和气泡组件。
- `src/shared/types.ts`：跨进程共享类型与 IPC channel 常量。
- `pet_resources/`：renderer publicDir，存放内置宠物骨架资源、部件 SVG、动作元数据和 `PET_SKELETON_STANDARD.md`。
- `resources/`：Electron 图标和构建资源，不放宠物骨架资源。
- `docs/`：架构与模块文档。改动模块行为时同步更新对应文档。
- `tests/`：Node test runner 单元测试，使用 `scripts/register-ts.cjs` 注册 TS 源码。
- `memory/SOUL.md`：桌宠人格源文件，应纳入版本控制。
- `memory/memory.example.md`：长期记忆示例。
- `skills/example-soft-wave/`：可提交的示例 skill 包。

## 运行命令

常用命令：

```bash
npm install
npm run dev
npm run test:unit
npm run typecheck
npm run lint
npm run build
```

提交前优先运行：

```bash
npm run test:unit
npm run typecheck
npm run lint
```

涉及打包、Electron 配置或跨进程入口时，再运行：

```bash
npm run build
```

开发环境要求见 `docs/modules/development.md`。`LLM_PROVIDER=mock` 可离线启动基础流程；接入真实模型时需要配置 `.env`，但不要提交 `.env`。

## 编码约定

- 使用 TypeScript，遵守现有 ESLint、Prettier 和 electron-vite 结构。
- 优先复用本仓库已有模块边界，不要把主进程职责塞进 renderer。
- 跨进程协议统一从 `src/shared/types.ts` 扩展；新增 IPC channel 时同步更新 preload API 和 renderer 类型。
- renderer 只通过 `window.zuiti` 与主进程交互，不直接使用 Node/Electron 主进程能力。
- 新增 UI 状态优先放在现有 renderer store / hook 结构中，保持 `PetView`、`BubbleLayer`、`SettingPanel` 职责清晰。
- 宠物骨架资源放在 `pet_resources/`，并遵守 `pet_resources/PET_SKELETON_STANDARD.md`；不要把骨架资源放进 Electron 的 `resources/`。
- 骨架动作只暴露受限语义 motion tool；新增 tool 时同步 shared 类型、主进程校验、renderer CSS、prompt 和测试。
- 主进程后台任务应避免阻塞用户输入路径；文本回复优先使用最近完成的稳定快照。
- 注释保持简短，只解释不明显的安全、隐私或异步时序原因。

## 隐私与本地状态

- 不要提交 `.env`、API key、日志、截图、真实用户长期记忆或运行时生成的个人数据。
- `memory/memory.md` 是运行时生成的长期记忆，默认保持本地，不要加入版本控制。
- `skills/<runtime-generated-skill>/` 是运行时沉淀的道具 skill，默认保持本地；只有人工整理过的示例或内置 skill 才应提交。
- vision 模块只应把屏幕转成去敏语义摘要，不要把原始截图作为长期历史保存。
- 处理屏幕内容时避免保留具体人名、邮箱、手机号、公司敏感信息或支付/密码相关内容。

## Skills 约定

每个 prop skill 包结构为：

```text
skills/<skill_id>/
  manifest.json
  skill.md
  prop.svg
```

维护 skills 相关代码时注意：

- `src/main/skills/registry.ts` 负责索引、读写和 deterministic SVG 安全校验。
- SVG prop 必须是透明背景、独立可渲染、带 `viewBox` 的 SVG，并声明有效骨架锚点。
- 不允许脚本、外链、`foreignObject`、事件属性、远程资源、data URL 资源或超大 SVG。
- 生成和审核流程应保留失败回退，不能让 prop 失败影响基础对白或骨架 motion。
- 旧整宠 `action.svg` skill 不再加载；宠物本体动作由 renderer 的稳定骨架和 motion tools 负责。

## Memory 与 Prompt 约定

- `SOUL.md` 是人格源文件；改动语气、安全边界或人格设定时优先改这里，并评估 README / docs 是否需要同步。
- `memory.md` 应保持极简，通常约 400-800 个中文字符，只记录稳定偏好、重要当前上下文和明确互动禁忌。
- text agent 不应强迫每次引用屏幕内容；只有在视觉摘要对当前回应有帮助时才使用。
- 避免让模型重复口头禅、过度打扰用户或制造监控感。

## 测试指南

- 单元测试放在 `tests/*.test.cjs`，沿用 Node test runner。
- 修改 shared 类型、IPC、brain 输出协议、skills 校验、memory 写入或 vision 隐私策略时，优先补充针对性测试。
- UI 改动至少运行 `npm run typecheck:web`；主进程改动至少运行 `npm run typecheck:node`。
- 修复 bug 时先复现或新增失败测试，再做最小实现。

## 文档同步

改动以下模块时同步检查文档：

- renderer/UI：`docs/modules/renderer.md`
- brain/prompt/provider：`docs/modules/brain-agents.md`
- pet skeleton resources：`pet_resources/PET_SKELETON_STANDARD.md`、`docs/modules/renderer.md`
- skills：`docs/modules/skills.md`
- memory：`docs/modules/memory.md`
- vision/privacy：`docs/modules/vision.md`
- behavior/triggers：`docs/modules/behavior.md`
- 环境变量、命令、打包：`docs/modules/development.md`

README 和 README-zh 保持同等信息密度；面向用户的能力变化尽量双语同步。

## 变更原则

- 保持改动小而可验证，避免无关重构。
- 不要覆盖用户本地生成的 memory 或 skills。
- 不要引入新的长期存储、网络调用或后台采集行为，除非同时补齐隐私说明、设置入口和测试。
- 任何会改变桌宠主动发言频率、屏幕读取范围或持久化数据的改动，都要视为高风险改动并重点验证。
