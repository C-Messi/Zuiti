# 嘴替 Sidekick Pet

> 你的电子宠物，永远站你这边。

不做最聪明的助手，做最懂情绪价值的电子嘴替。它会看着你的屏幕，
在你被老板 push、代码报错、深夜加班时主动凑过来陪你骂、陪你笑、陪你扛——
同时像 duolingo 那只绿小鸟一样厚着脸皮缠你互动。

## 三件核心 hook

1. **窥屏共振**：宠物看到你 IDE 里的报错、微信里的 push、B 站的搞笑片段时，主动接话。屏幕原图永远不落盘、不出本机；只有一行去敏感化的「语义摘要」会与 LLM 通讯。
2. **主动撒娇**：你 3 分钟没理它，它会先饿瘦，再凑上来撒娇——不是被动等 prompt，而是主动上门。
3. **token 即猫粮**：每一次你跟它聊天产生的 token，都会变成它的「猫粮」累计。冷落久了它会肉眼可见地饿瘦。

## 安装（macOS）

1. 在 Releases 中下载 `嘴替 Sidekick Pet-*.dmg`。
2. 双击挂载，把 app 拖入 Applications。
3. **首次打开右键 → 打开**（V0 未做代码签名，直接双击会被 Gatekeeper 拦）。
4. macOS 会请求屏幕录制权限，授予后宠物才能「看见你的屏幕」。

## 隐私

- **屏幕原图永远不落盘、不出本机**
- 仅一行去敏感化的语义摘要 / 用户输入会与 LLM 通讯
- ⚙ → 一键暂停 30min / 切换温和模式 / 静音模式
- 自定义 app 黑名单（默认含 1Password、钥匙串、银行类、支付类）
- 内置红线护栏：去人名 / 去手机号 / 去邮箱 / 去具体身份称呼
- V0 不提供对话导出 / 分享，避免 AI 言论被截图扩散

## 开发

```bash
git clone https://github.com/Hruish/zuiti.git
cd zuiti
npm install
cp .env.example .env       # 填 LLM_PROVIDER 和 key（mock 也能跑）
npm run dev                # 开发模式（热重载）
npm run build:mac          # 打包 dmg
npm run gen:placeholders   # 重新生成占位 sprite（替换为 AI 美术资产前用）
```

`.env` 关键变量：

| 变量 | 取值 | 说明 |
| --- | --- | --- |
| `LLM_PROVIDER` | `openai` / `anthropic` / `mock` | API 兼容格式，选 `mock` 离线也能跑 |
| `LLM_BASE_URL` | 例：`https://api.openai.com/v1` | API 基础地址，方便接入第三方兼容服务 |
| `LLM_API_KEY` | sk-xxx | API 密钥 |
| `LLM_TEXT_MODEL` | 例：`gpt-4o-mini` | 文本对白模型 |
| `LLM_VISION_MODEL` | 例：`gpt-4o-mini` | 多模态屏幕情境分析模型 |

## 架构（5 模块）

```
PetView ──┐
          ├── Renderer (React + Tailwind + Zustand)
BubbleLayer ┘            │ contextBridge
                         ▼
              Brain ◀── ipc.ts ──▶ Behavior (triggers / decide)
                                       │
              Vision ◀──────────────── ┘
              Memory + Token (electron-store)
```

| 模块 | 单一职责 |
| --- | --- |
| **PetView** | 帧动画切换（8 mood × N 帧） |
| **BubbleLayer** | 对白气泡 + 输入框 + 打字机 |
| **Brain** | LLM Provider 抽象 + prompt + 红线护栏 |
| **Vision Pipeline** | 截图 + 隐私过滤 + 多模态 LLM → ScreenObservation |
| **Behavior Engine** | 周期 / 切窗 / 静默触发 → 决策中枢 |

## 致谢

- 灵感参考：BongoCat / clawd-on-desk / yourfriendly.ai / Duolingo Owl
- 技术栈：Electron + React + TypeScript + Tailwind + Zustand + electron-store

## License

- 应用代码：MIT
- 视觉资产：占位 PNG (CC0)；正式 AI 美术资产到位后改 CC-BY 4.0
