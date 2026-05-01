# 开发与配置

## 环境要求

- macOS
- Node.js 20+
- npm

## 快速启动

```bash
npm install
cp .env.example .env
npm run dev
```

`LLM_PROVIDER=mock` 时可以离线启动基础流程。接入真实模型时，需要配置文本模型和视觉模型。

## 环境变量

| 变量 | 取值 | 说明 |
| --- | --- | --- |
| `LLM_PROVIDER` | `openai` / `anthropic` / `mock` | LLM provider |
| `LLM_BASE_URL` | 例如 `https://api.openai.com/v1` | API 基础地址 |
| `LLM_API_KEY` | `sk-...` | API key |
| `LLM_TEXT_MODEL` | 例如 `gpt-4o-mini` | 文本 agent 模型 |
| `LLM_VISION_MODEL` | 例如 `gpt-4o-mini` | vision / review 模型 |

## 常用命令

```bash
npm run dev
npm run test:unit
npm run typecheck
npm run lint
npm run build
npm run build:mac
```

## 版本控制注意

`.gitignore` 会排除运行时生成的：

- `memory/memory.md`
- `skills/<runtime-generated-skill>/`

仓库保留：

- `memory/SOUL.md`
- `memory/memory.example.md`
- `skills/example-soft-wave/`
- `resources/icon.png`
- `pet_resources/` 下的内置宠物骨架资源与 `PET_SKELETON_STANDARD.md`

`resources/` 保留给 Electron 图标和构建资源。renderer 的 publicDir 使用 `pet_resources/`，宠物骨架 manifest、部件 SVG、动作说明和 prompt 标准都应放在 `pet_resources/` 下。

提交前建议运行 `npm run test:unit && npm run typecheck && npm run lint && npm run build`。
