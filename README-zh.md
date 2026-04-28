# 嘴替 Zuiti

**语言**： [English](README.md) | 简体中文

![Zuiti poster](images/poster.png)

🐱 **Zuiti** 是一个运行在桌面上的 AI 电子宠物。它通过透明悬浮窗口陪在用户屏幕旁，能够理解当前屏幕的大致情境、维护极简长期记忆，并在合适的时候用自然短句和动态动作回应用户。

项目的核心目标不是构建一个传统效率助手，而是探索一种更有在场感、更懂分寸的陪伴型桌面 AI：它会关心用户，但不过度打扰；它能看见上下文，但不制造监控感；它可以逐步沉淀自己的 SVG 动作 skill，让桌宠从固定素材变成可成长的交互体。

更多背景见 [项目说明](docs/overview.md)。

## ✨ 关键特点

- **自适应 SVG 动作 skill**：LLM 可以根据 action intent 生成 SVG 动作，经过安全校验和视觉审核后沉淀到本地 `skills/`。
- **稳定上下文快照**：文本回复使用最近完成的 vision、memory、skill index 和短期窗口，不阻塞在当前截图或记忆分析上。
- **极简长期记忆**：`SOUL.md` 保存人格底色，`memory.md` 只保存高价值、低 token 的长期偏好和上下文。
- **低干扰屏幕理解**：屏幕原图不作为长期历史保存；进入对话上下文的是去敏语义摘要。
- **透明桌宠界面**：Electron + React 渲染默认 SVG 猫、动态 action、对白气泡和轻量配置面板。
- **本地优先状态管理**：运行时生成的 memory 和 skill 默认不进入 git，便于隐私隔离和本地实验。

## 🚀 快速开始

```bash
git clone https://github.com/C-Messi/Zuiti.git
cd Zuiti/zuiti-claude-opus-4.7
npm install
cp .env.example .env
npm run dev
```

`.env` 关键配置：

| 变量 | 取值 | 说明 |
| --- | --- | --- |
| `LLM_PROVIDER` | `openai` / `anthropic` / `mock` | LLM provider；`mock` 可离线启动基础流程 |
| `LLM_BASE_URL` | 例如 `https://api.openai.com/v1` | API 基础地址，支持兼容服务 |
| `LLM_API_KEY` | `sk-...` | API key |
| `LLM_TEXT_MODEL` | 例如 `gpt-4o-mini` | 文本对话、memory、skill author 模型 |
| `LLM_VISION_MODEL` | 例如 `gpt-4o-mini` | 截图摘要和 skill review 模型 |

常用命令：

```bash
npm run test:unit
npm run typecheck
npm run lint
npm run build
npm run build:mac
```

更多开发说明见 [开发与配置](docs/modules/development.md)。

## 🏗️ 架构

![Zuiti architecture](images/architecture.png)

Zuiti 的运行时由 renderer、main process、context snapshot、brain agents、vision、memory 和 skills 几部分组成。主回复 prompt 的稳定顺序为：

```text
SOUL -> memory -> skill index -> recent window -> current event
```

完整说明见 [架构说明](docs/architecture.md)。

## 📚 模块说明

| 模块 | 说明 | 文档 |
| --- | --- | --- |
| Renderer | 默认猫、动态 SVG action、对白气泡、配置面板 | [docs/modules/renderer.md](docs/modules/renderer.md) |
| Brain Agents | textAgent、visionAgent、memoryAgent 的 prompt 和输出协议 | [docs/modules/brain-agents.md](docs/modules/brain-agents.md) |
| Skills | SVG skill 包结构、生成、校验、审核、启用 | [docs/modules/skills.md](docs/modules/skills.md) |
| Memory | `SOUL.md`、`memory.md`、短期滑动窗口和 git 策略 | [docs/modules/memory.md](docs/modules/memory.md) |
| Vision | 截图获取、隐私过滤、去敏屏幕摘要 | [docs/modules/vision.md](docs/modules/vision.md) |
| Behavior | 主动触发、窗口观察、节奏控制 | [docs/modules/behavior.md](docs/modules/behavior.md) |
| Development | 环境变量、命令、提交注意事项 | [docs/modules/development.md](docs/modules/development.md) |

仓库保留一个示范 skill：[`skills/example-soft-wave/`](skills/example-soft-wave/)，以及一个长期记忆示例：[`memory/memory.example.md`](memory/memory.example.md)。真实运行时生成的 `skills/<skill_id>/` 和 `memory/memory.md` 默认被 `.gitignore` 排除。

## 🚶 接下来的 Roadmap

- **更稳的 skill review**：增加本地像素检查、风格一致性评分和失败原因记录。
- **动作组合能力**：支持把多个 SVG skill 组合成短序列，而不是一次只播放一个动作。
- **更细的隐私控制**：为应用黑名单、敏感窗口和截图暂停提供更清晰的 UI。
- **memory 可视化审查**：提供只读面板查看当前 `memory.md`，并支持一键清空或回滚。
- **多桌宠人格配置**：允许切换不同 `SOUL.md` 模版，支持不同陪伴风格。
- **打包与签名完善**：补齐 macOS 签名、公证、自动更新和 release workflow。

## 📜 License

应用代码使用 MIT License。默认视觉为仓库内 SVG；自动生成的 action SVG 默认保存在本地 `skills/`。
