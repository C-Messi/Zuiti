# 架构说明

Zuiti 采用 Electron 双进程结构：渲染进程负责透明桌宠界面和宠物包渲染，主进程负责系统能力、LLM 调用、上下文快照、pet package 加载校验、memory、motion plan 校验和道具 skill 管理。

![Zuiti architecture](../images/architecture.png)

## 运行时数据流

1. 用户输入、周期触发或窗口切换触发主进程行为决策。
2. 主进程从 `pet_resources/pets/default-cat/` 加载 active pet 包，并把 memory、skill index、motion prompt 放入稳定快照。
3. `ContextSnapshotManager` 保存最近完成的 `visionSummary`、`memoryText`、`skillIndex`、motion prompt 和短期对话窗口。
4. `textAgent` 使用稳定快照生成对白、mood、可选 `motion_plan` 和可选 `prop_intent`。
5. 主进程按 active pet manifest 校验 motion plan；无效计划降级为该 mood 的包内默认动作。
6. `skillSelector` 从 active pet 的 enabled 道具 skill 中选择；没有合适道具时进入生成和审核流程。
7. 主进程通过 IPC 向 renderer 发送只读宠物渲染包、mood、对白和 activity。
8. renderer 在 `PetView` 中渲染宠物包 SVG，按包内 motion keyframes 做受限动画，并把道具 SVG 挂到包内锚点。

## Agent 分工

| Agent         | 输入                                                                    | 输出                                     | 触发方式                       |
| ------------- | ----------------------------------------------------------------------- | ---------------------------------------- | ------------------------------ |
| `visionAgent` | `SOUL.md`、compact memory、当前截图                                     | 去敏屏幕摘要                             | 周期、切窗、空闲刷新           |
| `textAgent`   | `SOUL.md`、memory、skill index、最新 vision summary、短期窗口、当前事件 | dialogue、mood、motion plan、prop intent | 用户输入或行为触发             |
| `memoryAgent` | `SOUL.md`、最新屏幕摘要、短期窗口                                       | 重写后的 compact `memory.md`             | 空闲 debounce 或足够多有效轮次 |

## Prompt 顺序

主回复 prompt 采用固定顺序，降低缓存抖动和重复输出：

```text
SOUL -> memory -> skill index -> recent window -> current event
```

视觉和记忆任务在后台刷新快照；文本回复优先使用最近一次完成的快照，因此不会因为当前截图分析或 memory 总结未完成而阻塞。

## 本地状态策略

`pet_resources/pets/<pet_id>/memory/memory.md` 与 `pet_resources/pets/<pet_id>/skills/<skill_id>/` 是运行时沉淀结果，默认不进入版本控制。当前 skills 只沉淀道具，不沉淀整宠动作 SVG。仓库只保留：

- `pet_resources/pets/default-cat/memory/SOUL.md`：人格源文件。
- `pet_resources/pets/default-cat/memory/memory.example.md`：长期记忆示例。
- `pet_resources/pets/default-cat/skills/example-soft-wave/`：skill 包结构示例。
