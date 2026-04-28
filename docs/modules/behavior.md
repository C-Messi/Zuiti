# Behavior 模块

Behavior 模块决定桌宠何时主动出现、何时保持安静，以及如何把用户事件转成 brain 输入。

## 关键文件

| 文件 | 职责 |
| --- | --- |
| `src/main/behavior/triggers.ts` | 周期、空闲、轻量主动触发 |
| `src/main/behavior/window-watch.ts` | 窗口切换观察 |
| `src/main/behavior/decide.ts` | 根据状态决定是否触发主动行为 |
| `src/main/behavior/index.ts` | behavior 入口 |
| `src/main/token/economy.ts` | 轻量 token / 互动节奏模型 |

## 行为原则

- 主动但不刷屏。
- 用户忙时低干扰，用户明确互动时积极回应。
- 截图和 memory 刷新可以后台运行；文本回复不等待当前后台任务。
- mood sprite / 默认 SVG 始终作为 fallback，保证桌宠有可显示状态。
