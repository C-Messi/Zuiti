# Pet Sprite Generation Prompts

## 风格统一约束

- 透明背景 PNG（必须）
- 256×256 或 512×512 正方形
- 卡通可爱风、线条圆润、配色温暖
- 角色：一只圆滚滚的奶牛猫（黑白花），大眼睛、表情夸张
- 视角：正面、不带阴影或自带柔和投影

## 8 个 Mood × 关键帧

| Mood | Prompt 关键词 | 必需帧数 |
| --- | --- | --- |
| idle | "calm sitting, blinking, tail swaying" | 4 |
| happy | "smiling, ears up, paws raised" | 2 |
| angry_for_user | "angry pout, fist raised, steam from head" | 2 |
| cuddling | "leaning forward affectionately, eyes closed" | 2 |
| hungry | "thin, droopy eyes, drooling, sad pout" | 2 |
| sleeping | "eyes closed, zZ above head" | 2 |
| excited | "jumping, sparkles, mouth open laughing" | 2 |
| sad | "tear drop, ears flat, sitting hunched" | 2 |

## V0 优先（如果 AI 风格统一困难）

只做 4 个 mood × 1 帧静图：idle / happy / angry_for_user / hungry。
切换时仅做 CSS opacity 过渡，不做帧动画。

## 推荐工具

- Midjourney v7 + `--no shadow --transparent --ar 1:1`
- 或 OpenAI gpt-image-1 / Nano Banana
- 失败兜底：itch.io 免费像素风宠物 sprite（注意 LICENSE）

## 占位资产（已生成）

仓库已用 `scripts/gen-placeholder-sprites.cjs` 生成 8 mood × 4 帧 的纯色占位 PNG，
保证应用首跑就有图像。等真实 AI 美术资产到位后，按相同的命名（`<mood>/<n>.png`）
覆盖即可，无需改动代码。

```bash
# 重新生成占位（颜色调整需改脚本）
npm run gen:placeholders
```
