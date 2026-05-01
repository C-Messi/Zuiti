# 架构说明

Zuiti 采用 Electron 双进程结构：渲染进程负责透明桌宠界面和稳定骨架动画，主进程负责系统能力、LLM 调用、上下文快照、memory、motion plan 校验和道具 skill 管理。

![Zuiti architecture](../images/architecture.png)

## 运行时数据流

1. 用户输入、周期触发或窗口切换触发主进程行为决策。
2. `ContextSnapshotManager` 保存最近完成的 `visionSummary`、`memoryText`、`skillIndex` 和短期对话窗口。
3. `textAgent` 使用稳定快照生成对白、mood、可选 `motion_plan` 和可选 `prop_intent`。
4. 主进程校验 motion plan；无效计划降级为 mood 对应默认动作。
5. `skillSelector` 选择已有 enabled 道具 skill；没有合适道具时进入生成和审核流程。
6. 主进程通过 IPC 向 renderer 发送 mood、对白和 activity。
7. renderer 在 `PetView` 中始终渲染默认猫骨架，只对部件做受限动画，并把道具 SVG 挂到骨架锚点。

## Agent 分工

| Agent | 输入 | 输出 | 触发方式 |
| --- | --- | --- | --- |
| `visionAgent` | `SOUL.md`、compact memory、当前截图 | 去敏屏幕摘要 | 周期、切窗、空闲刷新 |
| `textAgent` | `SOUL.md`、memory、skill index、最新 vision summary、短期窗口、当前事件 | dialogue、mood、motion plan、prop intent | 用户输入或行为触发 |
| `memoryAgent` | `SOUL.md`、最新屏幕摘要、短期窗口 | 重写后的 compact `memory.md` | 空闲 debounce 或足够多有效轮次 |

## Prompt 顺序

主回复 prompt 采用固定顺序，降低缓存抖动和重复输出：

```text
SOUL -> memory -> skill index -> recent window -> current event
```

视觉和记忆任务在后台刷新快照；文本回复优先使用最近一次完成的快照，因此不会因为当前截图分析或 memory 总结未完成而阻塞。

## 本地状态策略

`memory/memory.md` 与 `skills/<skill_id>/` 是运行时沉淀结果，默认不进入版本控制。当前 skills 只沉淀道具，不沉淀整宠动作 SVG。仓库只保留：

- `memory/SOUL.md`：人格源文件。
- `memory/memory.example.md`：长期记忆示例。
- `skills/example-soft-wave/`：skill 包结构示例。
