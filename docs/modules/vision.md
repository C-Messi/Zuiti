# Vision 模块

Vision 模块负责把当前屏幕转成可用于对话的去敏语义摘要。它不是监控系统，也不把屏幕原图作为长期历史保存。

## 数据流

1. `capture` 获取当前屏幕图像。
2. `privacy` 判断敏感窗口或敏感内容，必要时跳过或泛化。
3. `observe` 调用 vision model，把截图转成简短 screen summary。
4. summary 写入 `ContextSnapshotManager`，供后续文本回复使用。

## 关键文件

| 文件 | 职责 |
| --- | --- |
| `src/main/vision/capture.ts` | 截图获取 |
| `src/main/vision/privacy.ts` | 隐私过滤和敏感窗口策略 |
| `src/main/vision/observe.ts` | visionAgent 调用和摘要输出 |
| `src/main/vision/index.ts` | vision 入口 |

## 输出原则

- 只描述与陪伴或上下文理解相关的高层语义。
- 避免具体人名、手机号、邮箱、公司敏感信息。
- 不要求文本 agent 每次都提到屏幕内容。
