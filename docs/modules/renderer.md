# Renderer 模块

Renderer 使用 React + Tailwind + Zustand 实现桌宠界面。它不直接调用 LLM，也不负责持久化 memory 或 skill。宠物本体由主进程校验后的宠物包渲染，活动通过宠物包声明的 motion keyframes 和锚点道具叠加实现。

## 关键文件

| 文件                                           | 职责                                                                 |
| ---------------------------------------------- | -------------------------------------------------------------------- |
| `src/renderer/src/App.tsx`                     | 组合桌宠、气泡和设置面板，定义基础层级、宠物点击和窗口拖拽交互       |
| `src/renderer/src/components/PetView.tsx`      | 通过 IPC 读取宠物渲染包、渲染骨架、执行数据驱动 motion 和锚点道具    |
| `src/renderer/src/components/BubbleLayer.tsx`  | 对白气泡、输入框、发送用户文本                                       |
| `src/renderer/src/components/SettingPanel.tsx` | 看屏暂停、语气模式等轻量设置                                         |
| `src/renderer/src/store/usePetStore.ts`        | mood、bubble、activeActivity 状态                                    |
| `src/renderer/src/hooks/useIpc.ts`             | 订阅主进程 IPC 事件                                                  |
| `src/renderer/src/pet/skeletonRegistry.ts`     | 注册主进程传入的宠物渲染包并组合 SVG markup                          |
| `pet_resources/PET_SKELETON_STANDARD.md`       | 宠物包资源、manifest、SVG、motion、memory、skills 和 prompt 边界标准 |

## 层级约定

- 宠物层：`z-10`
- 气泡层：`z-30`
- 设置面板：`z-40`

设置面板必须高于宠物，避免配置项被默认猫或动态 action 遮挡。

## 宠物主体交互

启动后的默认场景只展示宠物本体。短按宠物主体时，`App` 切换气泡层和设置面板的显示/隐藏；拖动宠物主体时，renderer 通过受限 `window:drag:*` IPC 把屏幕坐标交给主进程移动当前透明窗口，并且不会触发辅助 UI 切换。气泡输入框和设置面板仍是 `no-drag` 区域，避免用户编辑设置或输入文本时误拖动窗口。

## 活动渲染

`PetView` 始终展示当前 active pet 的完整骨架，不再用 skill 生成的整张 SVG 替换宠物本体。默认猫启动后由主进程读取并校验 `pet_resources/pets/default-cat/manifest.json`，renderer 通过 `window.zuiti.petPackageGet()` 获取只读渲染包。包内必须包含所有 part SVG、mood expression、anchors、renderOrder、motionTools 和 moodDefaults；renderer 不直接把 `pet_resources` 当 publicDir 读取。

`activeActivity.motionPlan` 只执行当前宠物包注册的 motion tool。motion tool 的目标部件、参数默认值和 transform keyframes 来自 manifest，renderer 使用 Web Animations API 执行，不在 CSS 里硬编码 tool 名称。`activeActivity.prop` 是独立道具 SVG，会挂到当前宠物包声明的锚点。活动结束后 renderer 自动清空 `activeActivity`，回到 mood 对应的默认骨架状态。
