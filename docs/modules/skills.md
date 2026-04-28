# Skills 模块

Skills 模块让桌宠从固定 mood 动图扩展到可沉淀的 SVG action skill。每个 skill 都是一个可审查、可复用的本地目录。

## Skill 包结构

```text
skills/<skill_id>/
  manifest.json
  skill.md
  action.svg
```

| 文件 | 说明 |
| --- | --- |
| `manifest.json` | id、触发词、mood 倾向、时长、创建时间、审核分、启用状态 |
| `skill.md` | 简短触发和使用说明，供后续选择动作 |
| `action.svg` | 透明背景、独立可渲染 SVG 动画 |

仓库保留 `skills/example-soft-wave/` 作为示范。真实运行时自动生成的 skill 默认被 `.gitignore` 排除。

## 生成与审核流程

1. `textAgent` 输出 action intent。
2. `skillSelector` 从 enabled skill index 中选择合适 skill。
3. 没有匹配项时，`skillAuthorAgent` 让文本 LLM 生成 SVG。
4. deterministic validator 拒绝脚本、外链、`foreignObject`、事件属性、超大 SVG 和不支持标签。
5. Electron 离屏渲染 SVG，vision model 评估视觉清晰度、风格匹配、安全性和动作贴合度。
6. 审核分达到阈值后写入 `skills/<skill_id>/` 并自动启用。

## 关键文件

| 文件 | 职责 |
| --- | --- |
| `src/main/skills/registry.ts` | skill 读取、索引、写入 |
| `src/main/skills/orchestrator.ts` | 选择、生成、审核、回退的总流程 |
| `src/main/skills/author.ts` | SVG skill 生成 prompt 与解析 |
| `src/main/skills/review.ts` | 离屏渲染和视觉审核 |
