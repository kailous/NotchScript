# FluidNotch (NotchScript) 技术路径与开发计划

## 1. 总体目标

FluidNotch 的第一阶段目标不是一次性做完整插件生态，而是先验证三个核心命题：

1. Electron 是否能在 macOS 刘海区域附近稳定渲染一个透明、置顶、可穿透的灵动岛窗口。
2. 前端动画是否能达到足够接近系统级体验的流体弹簧质感。
3. Node.js 是否能稳定接入系统通知、脚本扩展和本地事件源，并驱动灵动岛状态变化。

项目应按“先视觉闭环，再事件闭环，最后扩展闭环”的顺序推进。

## 2. 技术选型建议

### 2.1 基础技术栈

| 层级 | 推荐技术 | 用途 |
| --- | --- | --- |
| 桌面壳 | Electron | 创建透明置顶窗口、管理主进程、系统能力接入 |
| 主语言 | TypeScript | 降低 IPC、插件协议和状态模型维护成本 |
| 前端框架 | React 或 Vanilla TS | 早期可用 Vanilla TS，后续复杂 UI 再引入 React |
| 动画引擎 | Framer Motion 或 Motion One | 管理弹簧动画、布局过渡和状态切换 |
| 样式 | CSS Modules 或普通 CSS | 早期保持轻量，避免过早引入大型 UI 框架 |
| 本地配置 | JSON + Zod | 校验 `manifest.json`、用户配置和插件输入 |
| 扩展沙盒 | Node.js `vm` / `vm2` 备选 | 加载第三方 JS 扩展脚本 |
| 打包发布 | electron-builder | 生成 macOS 应用包 |

### 2.2 早期不建议引入

- 大型状态管理库，例如 Redux。
- 复杂插件市场系统。
- 数据库。
- 原生 Swift 模块。
- 过早的多窗口复杂交互。

早期架构应保持可替换：能跑通体验比一次性抽象完美更重要。

## 3. 推荐目录结构

```text
NotchScript/
  package.json
  tsconfig.json
  electron.vite.config.ts
  src/
    main/
      main.ts
      window/
        island-window.ts
        window-position.ts
      ipc/
        channels.ts
        handlers.ts
      notification/
        macos-log-stream.ts
        notification-parser.ts
      widgets/
        widget-registry.ts
        manifest-loader.ts
        sandbox-runner.ts
      config/
        app-config.ts
    preload/
      preload.ts
      api.ts
    renderer/
      index.html
      app.ts
      styles/
        base.css
        island.css
      island/
        IslandRoot.ts
        island-state.ts
        animation-presets.ts
      widgets/
        WidgetHost.ts
        builtins/
          clock-widget.ts
          message-widget.ts
  widgets/
    examples/
      hello-world/
        manifest.json
        index.js
  docs/
    architecture.md
    plugin-api.md
```

## 4. 核心架构路径

### 4.1 主进程

主进程负责系统级能力和生命周期管理。

主要职责：

- 创建灵动岛窗口。
- 计算窗口位置和屏幕尺寸。
- 控制置顶、透明、鼠标穿透和窗口展开状态。
- 监听系统事件，例如通知日志流。
- 加载 Widget manifest。
- 执行扩展脚本。
- 通过 IPC 向渲染层推送状态。

关键模块：

- `island-window.ts`：封装 BrowserWindow 创建与控制。
- `window-position.ts`：处理不同屏幕、缩放比例、刘海位置估算。
- `macos-log-stream.ts`：启动、停止、重启系统日志监听。
- `widget-registry.ts`：注册内置与第三方 Widget。

### 4.2 预加载层

预加载层负责安全暴露有限 API，不让渲染层直接访问 Node.js。

建议暴露：

```ts
window.notchScript = {
  onIslandEvent(callback),
  requestExpand(widgetId),
  requestCollapse(),
  invokeWidgetAction(widgetId, actionId, payload)
}
```

原则：

- 渲染层不直接使用 `ipcRenderer`。
- 所有 IPC channel 统一命名和类型化。
- 所有来自渲染层的请求都必须在主进程校验。

### 4.3 渲染层

渲染层负责视觉、动画、布局和交互。

核心状态：

```ts
type IslandMode = "idle" | "compact" | "expanded" | "peek" | "error";

type IslandState = {
  mode: IslandMode;
  activeWidgetId?: string;
  compactText?: string;
  icon?: string;
  expandedContent?: WidgetCard;
};
```

视觉目标：

- 常驻状态：贴合刘海底部或菜单栏中线。
- 收起状态：小尺寸、低干扰、鼠标穿透。
- 展开状态：圆角、宽高、模糊、内容透明度同步动画。
- 回弹状态：略微过冲，但不能夸张。

动画优先级：

1. 宽高变化。
2. 圆角变化。
3. 内容淡入淡出。
4. 图标与文本位移。
5. 背景模糊与边框透明度。

### 4.4 Widget 扩展系统

Widget 由 `manifest.json` 和 JS 入口组成。

示例：

```json
{
  "id": "hello-world",
  "name": "Hello World",
  "version": "0.1.0",
  "entry": "index.js",
  "permissions": ["timer"],
  "display": {
    "icon": "sparkles",
    "compactText": "Hello"
  }
}
```

JS 扩展可注册事件处理：

```js
export default function setup(api) {
  api.setCompactText("Hello");
  api.on("click", () => {
    api.expand({
      title: "Hello World",
      body: "This widget is running from JavaScript."
    });
  });
}
```

沙盒 API 第一阶段只开放：

- `setIcon(icon)`
- `setCompactText(text)`
- `expand(card)`
- `collapse()`
- `on(event, handler)`
- `emit(event, payload)`

禁止第一阶段开放：

- 任意文件系统访问。
- 任意网络访问。
- 子进程执行。
- 原生模块加载。

## 5. 微信通知 MVP 技术路径

### 5.1 日志流监听方案

主进程启动子进程：

```sh
log stream --predicate 'subsystem == "com.apple.notificationcenterui"'
```

实现步骤：

1. 创建 `MacOSLogStream` 类。
2. 通过 `child_process.spawn` 启动日志流。
3. 按行读取 stdout。
4. 过滤 `com.tencent.xinWeChat`。
5. 将原始日志交给 parser。
6. parser 输出标准事件：

```ts
type NotificationEvent = {
  appId: string;
  title?: string;
  body?: string;
  timestamp: number;
  raw: string;
};
```

7. 主进程将事件转换为 Island state。
8. 渲染层展开消息 Widget。

### 5.2 解析策略

第一阶段不要追求一次性精准解析所有字段，建议保存两类数据：

- 结构化字段：能稳定提取的 appId、title、body。
- 原始日志：用于调试不同 macOS 版本。

建议提供调试开关：

```sh
NOTCHSCRIPT_DEBUG_NOTIFICATIONS=1 npm run dev
```

开启后把匹配到的原始日志输出到开发控制台，便于迭代 parser。

### 5.3 WebHook 方案

本地服务可作为第二条输入通道：

```text
POST http://127.0.0.1:17421/events/message
```

请求体：

```json
{
  "source": "wechat",
  "sender": "Alice",
  "content": "今晚开会吗？",
  "timestamp": 1760000000000
}
```

处理流程：

1. 启动本地 HTTP server。
2. 校验请求来源和 token。
3. 转换为统一 `NotificationEvent`。
4. 复用同一套 Island state 更新逻辑。

## 6. 开发阶段计划

### Phase 0：项目初始化

目标：建立可运行、可构建、可调试的 Electron + TypeScript 项目。

任务：

- 初始化 `package.json`。
- 选择构建工具，建议 `electron-vite`。
- 配置 TypeScript。
- 配置 ESLint 和 Prettier。
- 创建 `src/main`、`src/preload`、`src/renderer`。
- 建立基础开发命令：
  - `npm run dev`
  - `npm run build`
  - `npm run package`

验收标准：

- 能打开透明 Electron 窗口。
- 主进程、预加载层、渲染层能正常热更新或重启。
- 项目能完成一次 production build。

### Phase 1：灵动岛窗口原型

目标：完成 macOS 顶部灵动岛基础显示。

任务：

- 创建无边框透明窗口。
- 设置 always-on-top。
- 禁用 Dock 显示或最小化干扰。
- 根据主显示器宽度计算窗口位置。
- 实现鼠标穿透。
- 提供开发调试快捷键切换穿透状态。

验收标准：

- 窗口能稳定显示在顶部中间。
- 背景透明，无白边或黑边。
- 非交互状态下不影响菜单栏点击。
- 展开状态下可以接收鼠标事件。

### Phase 2：动画与视觉系统

目标：建立接近苹果风格的流体弹簧动效。

任务：

- 定义 `idle`、`compact`、`expanded` 三种状态。
- 实现状态机。
- 建立动画参数表。
- 实现宽高、圆角、透明度同步动画。
- 实现内容切换时的淡入淡出和位移。
- 调试毛玻璃、边框、阴影。

建议初始参数：

| 场景 | Stiffness | Damping | Mass |
| --- | --- | --- | --- |
| compact -> expanded | 300 | 28 | 0.8 |
| expanded -> compact | 360 | 32 | 0.75 |
| peek bounce | 420 | 24 | 0.6 |

验收标准：

- 展开和收起没有明显卡顿。
- 圆角变化与尺寸变化同步。
- 内容不会在动画中挤压错位。
- 视觉风格接近系统控件，而不是网页弹窗。

### Phase 3：事件总线与 IPC

目标：打通主进程事件到 UI 状态更新的完整链路。

任务：

- 定义 IPC channel。
- 定义 `IslandEvent`。
- 主进程维护当前 active widget。
- 渲染层订阅状态变更。
- 支持手动触发测试事件。

事件模型：

```ts
type IslandEvent =
  | { type: "widget:update"; widgetId: string; payload: WidgetState }
  | { type: "island:expand"; widgetId: string }
  | { type: "island:collapse" }
  | { type: "notification:received"; payload: NotificationEvent };
```

验收标准：

- 主进程能通过 IPC 控制展开和收起。
- 渲染层不依赖 Node.js 全局能力。
- 所有事件有类型定义。

### Phase 4：微信通知 MVP

目标：实现微信消息触发灵动岛展开。

任务：

- 实现日志流监听。
- 实现微信日志过滤。
- 实现 parser。
- 建立消息 Widget。
- 消息到达时自动展开。
- 设置自动收起时间，例如 4 秒。
- 增加调试面板或控制台输出。

验收标准：

- 收到微信系统通知后，灵动岛能展示消息来源和摘要。
- 多条消息连续到达时不会动画错乱。
- 监听进程异常退出后可以重启。
- 未授权或无法读取日志时有明确错误状态。

### Phase 5：Widget 扩展 API

目标：支持从 `widgets/` 目录加载第三方扩展。

任务：

- 扫描 `widgets/` 目录。
- 读取 `manifest.json`。
- 用 Zod 校验 manifest。
- 加载 JS entry。
- 提供有限 API。
- 建立 Widget 生命周期：
  - `load`
  - `activate`
  - `deactivate`
  - `dispose`

验收标准：

- 示例 Widget 能被发现、加载并显示。
- manifest 错误不会导致整个应用崩溃。
- 扩展脚本异常会被捕获并展示错误。
- 第三方 Widget 不能直接访问危险 Node.js API。

### Phase 6：配置、权限与稳定性

目标：让项目从原型走向可长期使用。

任务：

- 增加用户配置文件。
- 支持开机启动选项。
- 支持启用或禁用某个 Widget。
- 支持日志级别。
- 增加错误边界。
- 增加 crash recovery。
- 增加基础隐私说明。

验收标准：

- 关闭重开后配置保留。
- 错误 Widget 不影响其他 Widget。
- 通知监听失败时可恢复或明确提示。

### Phase 7：打包发布

目标：生成可分发的 macOS 应用。

任务：

- 配置 `electron-builder`。
- 设置应用图标。
- 配置应用名称、bundle id、版本号。
- 验证 arm64 构建。
- 评估签名与 notarization。
- 编写安装与权限说明。

验收标准：

- 能生成 `.dmg` 或 `.zip`。
- 新机器安装后能启动。
- 基础功能不依赖开发环境。

## 7. 测试计划

### 7.1 单元测试

重点覆盖：

- manifest 校验。
- 通知日志解析。
- Widget 注册逻辑。
- 状态机转换。

### 7.2 集成测试

重点覆盖：

- 主进程向渲染进程推送事件。
- Widget 加载失败隔离。
- 日志流进程重启。

### 7.3 手动视觉测试

每次改动画都应检查：

- 收起状态位置。
- 展开状态位置。
- 毛玻璃效果。
- 圆角变化。
- 连续消息触发。
- 鼠标穿透切换。
- 多显示器表现。

## 8. 关键风险与应对

| 风险 | 影响 | 应对 |
| --- | --- | --- |
| macOS 日志字段变化 | 微信通知解析失效 | 保存 raw log，parser 分版本适配 |
| 透明窗口性能问题 | 动画掉帧 | 控制 DOM 层级，减少滤镜面积 |
| 鼠标穿透状态错误 | 影响菜单栏操作 | 提供快捷键强制切换 |
| Widget 沙盒不足 | 安全风险 | 默认最小权限，危险能力后置 |
| 多显示器定位不准 | 体验不稳定 | 第一阶段只保证主屏，后续扩展 |
| Electron 打包权限复杂 | 发布受阻 | 先做开发者版本，再处理签名 |

## 9. 优先级排序

### P0

- Electron 骨架。
- 透明置顶窗口。
- 灵动岛展开和收起动画。
- IPC 状态链路。
- 手动测试事件。

### P1

- 微信日志监听 MVP。
- 消息 Widget。
- 自动展开和自动收起。
- 基础错误处理。

### P2

- Widget manifest。
- 示例插件。
- 沙盒执行。
- 用户配置。

### P3

- 本地 WebHook。
- 打包发布。
- 多显示器优化。
- 更完整的插件 API。

## 10. 第一周建议任务清单

第一周只做“能看见、能动、能被事件驱动”的最小闭环。

1. 初始化 Electron + TypeScript 项目。
2. 创建透明置顶窗口。
3. 固定窗口到顶部中间。
4. 实现 `compact` 和 `expanded` 两个状态。
5. 增加测试按钮或快捷键触发展开。
6. 实现基础毛玻璃样式。
7. 建立主进程到渲染进程 IPC。
8. 用模拟通知事件驱动灵动岛展开。
9. 整理第一版截图和动效参数。

第一周结束时，应能用一条测试事件完成：

```text
主进程事件 -> IPC -> 渲染层状态更新 -> 灵动岛展开 -> 自动收起
```

这条链路一旦跑通，后续接入微信、Widget 和 WebHook 都只是增加事件来源。
