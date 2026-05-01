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

| 变量               | 取值                             | 说明                 |
| ------------------ | -------------------------------- | -------------------- |
| `ENABLED_PET`      | 例如 `default-cat`               | active pet 包 id     |
| `LLM_PROVIDER`     | `openai` / `anthropic` / `mock`  | LLM provider         |
| `LLM_BASE_URL`     | 例如 `https://api.openai.com/v1` | API 基础地址         |
| `LLM_API_KEY`      | `sk-...`                         | API key              |
| `LLM_TEXT_MODEL`   | 例如 `gpt-4o-mini`               | 文本 agent 模型      |
| `LLM_VISION_MODEL` | 例如 `gpt-4o-mini`               | vision / review 模型 |

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

- `pet_resources/pets/<pet_id>/memory/memory.md`
- `pet_resources/pets/<pet_id>/skills/<runtime-generated-skill>/`

仓库保留：

- `pet_resources/pets/default-cat/memory/SOUL.md`
- `pet_resources/pets/default-cat/memory/memory.example.md`
- `pet_resources/pets/default-cat/skills/example-soft-wave/`
- `resources/icon.png`
- `pet_resources/` 下的内置宠物包资源与 `PET_SKELETON_STANDARD.md`

`resources/` 保留给 Electron 图标和构建资源。`pet_resources/` 是主进程加载的宠物包根；renderer 不把整个目录作为 publicDir 暴露，避免 runtime memory 和生成 skills 被当成静态资源访问。

提交前建议运行 `npm run test:unit && npm run typecheck && npm run lint && npm run build`。
