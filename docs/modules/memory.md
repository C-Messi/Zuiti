# Memory 模块

Memory 模块维护桌宠人格和极简长期记忆。短期上下文不写文件，而是由 `ContextSnapshotManager` 维护滑动窗口。

## 文件策略

运行时 memory 归属于 active pet 包，默认路径为 `pet_resources/pets/default-cat/memory/`：

| 文件        | 说明                     |
| ----------- | ------------------------ |
| `SOUL.md`   | 桌宠人格、语气、安全边界 |
| `memory.md` | LLM 总结出的极简长期记忆 |

仓库中额外保留 `memory.example.md` 作为提交示例；真实 `memory.md` 被 `.gitignore` 排除，避免把个人偏好或本地交互状态推到远端。renderer 不直接公开 `pet_resources`，memory 文件只由主进程读写。

## 记忆预算

`memory.md` 应保持极短，通常约 400-800 个中文字符。它只记录稳定偏好、重要当前上下文和明确互动禁忌，不保存完整聊天记录。

## 关键文件

| 文件                                            | 职责                                 |
| ----------------------------------------------- | ------------------------------------ |
| `src/main/memory/files.ts`                      | 初始化和读写 memory 文件             |
| `src/main/memory/analyze.ts`                    | 调用 memoryAgent 重写 compact memory |
| `src/main/memory/store.ts`                      | 旧行为事件存储兼容                   |
| `pet_resources/pets/default-cat/memory/SOUL.md` | 默认猫人格源文件                     |
