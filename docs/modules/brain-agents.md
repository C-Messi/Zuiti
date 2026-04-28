# Brain Agents 模块

Brain agents 负责把人格、记忆、屏幕摘要、短期对话和用户事件组织成 LLM 输入，并把模型输出转成桌宠可执行的结果。

## 关键文件

| 文件 | 职责 |
| --- | --- |
| `src/main/brain/index.ts` | 主回复入口，调用 provider、解析输出、触发 skill |
| `src/main/brain/prompt.ts` | prompt 片段构造和输出格式约束 |
| `src/main/brain/provider.ts` | OpenAI / Anthropic / mock provider 适配 |
| `src/main/brain/guardrails.ts` | 输出安全和隐私护栏 |
| `src/main/context/snapshot.ts` | 稳定上下文快照 |
| `src/main/context/runtime.ts` | 全局 runtime context |

## 输出约定

文本 agent 输出应包含：

- `dialogue`：展示给用户的短对白。
- `mood_tag`：兼容旧 mood 系统的 mood。
- `action_intent`：可选动作意图，用于 skill 选择或生成。
- `skill_id`：可选已选 skill id。

## Prompt 风格

prompt 不强迫每次回复引用屏幕，也不强迫 token 喂养梗。模型只有在屏幕内容对用户当前状态有帮助时才使用视觉摘要，并应避免重复口头禅。
