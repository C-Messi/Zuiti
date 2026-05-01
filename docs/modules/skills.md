# Skills 模块

Skills 模块现在只沉淀可挂载的 SVG 道具 skill。宠物本体动作由 renderer 的稳定骨架和 motion tools 负责，避免 LLM 每次重新绘制出不同的宠物。

## Skill 包结构

```text
skills/<skill_id>/
  manifest.json
  skill.md
  prop.svg
```

| 文件 | 说明 |
| --- | --- |
| `manifest.json` | `kind: "prop"`、id、触发词、mood 倾向、锚点、时长、创建时间、审核分、启用状态 |
| `skill.md` | 简短触发和使用说明，供后续选择道具 |
| `prop.svg` | 透明背景、独立可渲染 SVG 道具 |

仓库保留 `skills/example-soft-wave/` 作为示范道具。真实运行时自动生成的 skill 默认被 `.gitignore` 排除。旧的整宠 `action.svg` 包不会被加载。

## 生成与审核流程

1. `textAgent` 输出 `motion_plan` 和可选 `prop_intent`。
2. 主进程校验 motion plan，并从 enabled prop skill index 中选择合适道具。
3. 没有匹配项时，`skillAuthorAgent` 让文本 LLM 只生成道具 SVG 和锚点。
4. deterministic validator 拒绝脚本、外链、`foreignObject`、事件属性、超大 SVG 和不支持标签。
5. Electron 离屏渲染 SVG，vision model 评估视觉清晰度、锚点适配、安全性和是否误画完整宠物。
6. 审核分达到阈值后写入 `skills/<skill_id>/` 并自动启用。

## 关键文件

| 文件 | 职责 |
| --- | --- |
| `src/main/skills/registry.ts` | skill 读取、索引、写入 |
| `src/main/skills/orchestrator.ts` | 选择、生成、审核、回退的总流程 |
| `src/main/skills/author.ts` | SVG skill 生成 prompt 与解析 |
| `src/main/skills/review.ts` | 离屏渲染和视觉审核 |
