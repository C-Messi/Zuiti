# Renderer 模块

Renderer 使用 React + Tailwind + Zustand 实现桌宠界面。它不直接调用 LLM，也不负责持久化 memory 或 skill。宠物本体由稳定的 inline SVG 骨架渲染，活动只通过受限 motion class 和锚点道具叠加实现。

## 关键文件

| 文件 | 职责 |
| --- | --- |
| `src/renderer/src/App.tsx` | 组合桌宠、气泡和设置面板，定义基础层级 |
| `src/renderer/src/components/PetView.tsx` | 渲染资源注册后的默认猫骨架、受限 motion 和锚点道具 |
| `src/renderer/src/components/BubbleLayer.tsx` | 对白气泡、输入框、发送用户文本 |
| `src/renderer/src/components/SettingPanel.tsx` | 看屏暂停、语气模式等轻量设置 |
| `src/renderer/src/store/usePetStore.ts` | mood、bubble、activeActivity 状态 |
| `src/renderer/src/hooks/useIpc.ts` | 订阅主进程 IPC 事件 |
| `src/renderer/src/pet/skeleton.ts` | 默认猫骨架部件、锚点和 motion tool 注册 |
| `src/renderer/src/pet/skeletonRegistry.ts` | 从 `pet_resources` 读取骨架资源、注册默认猫部件并提供失败回退 |
| `pet_resources/PET_SKELETON_STANDARD.md` | 宠物骨架资源、manifest、SVG 部件、动作和 prompt 边界标准 |

## 层级约定

- 宠物层：`z-10`
- 气泡层：`z-30`
- 设置面板：`z-40`

设置面板必须高于宠物，避免配置项被默认猫或动态 action 遮挡。

## 活动渲染

`PetView` 始终展示同一套默认猫骨架，不再用 skill 生成的整张 SVG 替换宠物本体。默认猫启动后从 `pet_resources/skeletons/default-cat/manifest.json` 读取资源包，并加载 `head`、`ears` 和 `tail` 三个可控 SVG 部件；资源缺失或校验失败时回退到代码内置 SVG。`activeActivity.motionPlan` 只映射到受限 CSS motion tool，例如点头、摇头、挥手、跳起、唱歌、歪头、竖耳和摇尾；`activeActivity.prop` 是独立道具 SVG，会挂到 `left_hand`、`right_hand`、`head_top`、`mouth`、`beside_left` 或 `beside_right` 锚点。

活动结束后 renderer 自动清空 `activeActivity`，回到 mood 对应的默认骨架状态。第一版只注册仓库内置 SVG 部件资源，不读取运行时本地资源目录。Electron 图标和构建资源保留在 `resources/`，renderer publicDir 指向 `pet_resources/`，避免宠物资源与 Electron 资源混用。
