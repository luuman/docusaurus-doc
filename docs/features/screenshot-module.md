# 截屏模块

## 概述

截屏模块是 Matrx Windows 客户端的核心功能之一，提供全屏/区域截图、窗口预选、多显示器支持、图片编辑标注等能力。模块采用主进程 + 独立渲染进程的双进程架构，每个显示器对应一个独立的截屏窗口实例。截屏渲染端基于原生 Canvas 2D API 实现画布编辑与标注功能。

## 核心文件结构

```
src/
  main/
    screenshot/
      capture-main.js          # 主进程截屏入口，IPC 事件调度
      WindowManager.js          # 截屏窗口管理器，管理多显示器窗口
      getSources.js             # 桌面源获取封装
  renderer/
    screenshot/
      main.js                   # 截屏渲染进程入口
      App.vue                   # 截屏主组件，蒙层/选区/放大镜
      App.scss                  # 截屏全局样式
      preload.js                # 预加载脚本
      constants.js              # 常量定义（透明度等）
      utils.js                  # 工具函数（坐标限制、RGB 转换等）
      toolbars.js               # 工具栏配置与常量
      store/
        index.js                # Vuex Store（actions/stack/viewer 等状态）
        types.js                # mutation 类型常量
      components/
        desktop-capturer.js     # 桌面图像捕获（screenshot-desktop / MediaDevices）
        capture-editor.js       # 编辑器常量（选区状态枚举、锚点定义）
        CaptureMagnifier/       # 放大镜组件
        CaptureToolbar/         # 工具栏组件
        Screenshots/
          index.vue             # 截屏编辑器容器组件
          ScreenshotsViewer.vue # 编辑画布核心组件
          ScreenshotsViewerBar.vue  # 工具栏 UI 组件
          ScreenshotsViewerEditPoint.vue # 编辑锚点组件
          RenderTextarea.vue    # 文本输入框渲染组件
          Color.vue             # 颜色选择器
          Size.vue              # 尺寸选择器
          SizeColor.vue         # 尺寸+颜色组合选择器
          actions/
            action.js           # Action 基类
            rect.js             # 矩形标注
            ellipse.js          # 椭圆标注
            arrow.js            # 箭头标注
            brush.js            # 画笔标注
            text.js             # 文本标注
            mosaic.js           # 马赛克标注
            undo.js             # 撤销操作
            save.js             # 保存操作
            ok.js               # 确认操作
            cancel.js           # 取消操作
```

## 主进程截屏入口：capture-main.js

### 文件位置

`src/main/screenshot/capture-main.js`

### 模块初始化

`useCapture` 是截屏模块的入口函数，在主窗口创建后调用：

```javascript
export function useCapture({mainWindow}) {
    windowManager = new WindowManager();
    windowManager.setMainWindow(mainWindow);
    windowManager.setTheScreen(screen);
    windowManager.initialize();
    handleScreenChange();
}
```

初始化流程：
1. 创建 `WindowManager` 单例实例
2. 注入主窗口引用与 Electron `screen` 模块
3. 调用 `initialize()` 为每个显示器创建截屏 BrowserWindow
4. 监听显示器增删与分辨率变化事件

### IPC 事件调度

截屏模块通过 `capture-screen` IPC 通道进行主进程与渲染进程的双向通信。主进程同时注册了 `ipcMain.on`（同步事件）和 `ipcMain.handle`（异步 invoke）两类处理器。

**同步事件（ipcMain.on）处理的 type 类型：**

| type | 描述 |
|------|------|
| `start` | 触发截屏流程，可选隐藏主窗口 |
| `complete` | 截屏完成，将截图 URL 发回主窗口 |
| `select` | 某屏幕完成选区，通知其他屏幕 |
| `reset` | 重置其他屏幕的选区状态 |
| `preselection` | 预选中状态同步到其他屏幕 |
| `close` | 关闭所有截屏窗口 |
| `Escape` | ESC 键取消截屏 |
| `register-shortcut` | 注册全局截屏快捷键 |
| `reset-capture` | 重新初始化截屏功能 |
| `getCursorScreenPoint` | 获取鼠标当前屏幕坐标 |
| `getBounds` | 获取截屏窗口边界 |
| `getDisplayBounds` | 获取显示器边界信息 |
| `getCurrentScreen` | 获取当前屏幕信息 |
| `getPrimaryDisplay` | 获取主显示器信息 |

**异步事件（ipcMain.handle）处理的 type 类型：**

| type | 描述 |
|------|------|
| `focus` | 聚焦截屏窗口 |
| `setOpacity` | 设置窗口透明度 |
| `setIgnoreMouseEvents` | 设置是否忽略鼠标事件 |
| `setBounds` | 设置窗口边界 |
| `showSaveDialog` | 弹出文件保存对话框 |
| `writeFile` | 写入截图文件到磁盘 |

### 防抖与重复调用保护

截屏触发通过时间戳进行 500ms 防抖，防止快速连续触发：

```javascript
async function captureScreen(e, args) {
    if (Date.now() - windowManager.getTimeNow() <= 500) {
        return; // 500ms 内不允许重复触发
    }
    windowManager.setTimeNow(Date.now());
    // ...
}
```

### 显示器变化处理

使用 `lodash.debounce` 对显示器增删和分辨率变化进行防抖处理：

```javascript
function handleScreenChange() {
    screen.on('display-added', (e, newDisplay) => {
        windowManager.addDispaly(newDisplay, index);
    });
    screen.on('display-removed', (e, oldDisplay) => {
        windowManager.removeDispaly(oldDisplay);
    });
    screen.on('display-metrics-changed', (e, display, changedMetrics) => {
        windowManager.setWinDisplay(display);
    });
}
```

## 窗口管理器：WindowManager.js

### 文件位置

`src/main/screenshot/WindowManager.js`

### 类设计

`WindowManager` 管理所有截屏窗口的生命周期，核心状态包括：

| 属性 | 类型 | 描述 |
|------|------|------|
| `timenow` | Number | 上次截屏时间戳，用于防抖 |
| `captureWins` | Array | 截屏窗口实例数组（模块级变量） |
| `isInitialized` | Boolean | 是否已完成初始化 |
| `initializeProcess` | Boolean | 是否正在初始化中（锁） |
| `mainWindow` | BrowserWindow | 主窗口引用 |
| `screen` | Screen | Electron Screen 模块引用 |
| `keydownShiftKey` | Boolean | 是否需要隐藏/恢复主窗口 |

### 初始化流程

```javascript
async initialize() {
    const displays = theScreen.getAllDisplays();
    for (let [index, display] of displays.entries()) {
        this.addDispaly(display, index, 'init');
    }
    this.setIsInitializeWindow(true);
    // 初始化完成后立即隐藏所有窗口
    this.setHideWindow();
}
```

### 截屏窗口创建 addDispaly

每个显示器对应一个全屏透明 BrowserWindow：

```javascript
let captureWin = new BrowserWindow({
    x: display.bounds.x,
    y: display.bounds.y,
    width: 1, height: 1,        // 初始最小化，避免闪白
    transparent: false,
    frame: false,
    show: false,
    opacity: OPACITY_HIDE,       // 0.01 初始透明
    skipTaskbar: true,
    fullscreen: false,
    webPreferences: {
        enableRemoteModule: false,
        nodeIntegration: process.env.ELECTRON_NODE_INTEGRATION,
        contextIsolation: !process.env.ELECTRON_NODE_INTEGRATION
    }
});
captureWin.__display_bounds = display.bounds;   // 挂载显示器边界
captureWin.__display_id = display.id;           // 挂载显示器 ID
captureWin.__display_index = index;             // 挂载显示器索引
```

关键行为：
- 窗口加载 `screenshot.html` 页面
- 设置 `alwaysOnTop` 为 `screen-saver` 级别
- 初始状态忽略鼠标事件 `setIgnoreMouseEvents(true)`

### 显示截屏窗口 setShowWindow

这是截屏流程的核心方法，负责获取屏幕截图并发送给渲染进程：

1. 通过 `screenshot-desktop` npm 包获取每个显示器的 PNG 截图
2. 将截图转为 base64 数据 URL
3. 匹配截屏窗口与对应显示器
4. 通过 IPC 发送 `capture-screen` 的 `show` 事件到渲染进程
5. 设置窗口全屏并移至顶层

如果 `screenshot-desktop` 失败，则回退到 Electron 的 `desktopCapturer.getSources` 获取屏幕源。

### 主窗口显隐控制

截屏时可选择隐藏主窗口（避免截到主窗口自身），通过设置透明度而非直接 hide 来避免窗口动画导致的截图阴影：

```javascript
setDisplayMainWindow({show = false} = {}) {
    if (!show && this.getKeydownShiftKey()) {
        mainWindow.setOpacity(0);   // 先透明
        mainWindow.hide();          // 再隐藏
        mainWindow.setOpacity(1);   // 恢复透明度
    }
}
```

## 截屏渲染应用

### 入口文件

`src/renderer/screenshot/main.js` 创建独立的 Vue 实例，挂载 Vuex Store 和 i18n：

```javascript
new Vue({
    store,
    i18n,
    render: h => h(App)
}).$mount('#app');
```

### Vuex Store 状态管理

Store 维护截屏编辑器的全局状态：

| 状态 | 类型 | 描述 |
|------|------|------|
| `currentScreen` | Object | 当前屏幕信息 |
| `viewer` | Object | 当前选区（x, y, w, h） |
| `action` | Object | 当前活动的编辑工具实例 |
| `actions` | Array | 可用编辑工具列表 |
| `stack` | Array | 编辑操作历史栈 |
| `border` | Number | 画笔粗细（默认 4） |
| `font` | Number | 字体大小（默认 24） |
| `color` | String | 画笔颜色（默认 #E4281D） |
| `cursor` | String | 当前光标样式 |
| `editPointers` | Array | 编辑锚点列表 |
| `titlesData` | Object | 马赛克 tiles 数据 |

### App.vue 主组件

截屏主组件负责以下核心功能：

**1. 画面捕获与展示**

收到主进程的 `show` 事件后，通过 `desktop-capturer.js` 获取桌面图像，绘制到背景 Canvas 和蒙层 Canvas 上。

**2. 选区管理**

支持四种选区操作状态（定义在 `capture-editor.js`）：

| 常量 | 值 | 描述 |
|------|------|------|
| `CREATE_RECT` | 1 | 创建新选区 |
| `MOVING_RECT` | 2 | 移动选区 |
| `RESIZE` | 3 | 调整选区大小 |
| `PREVIEW_RECT` | 4 | 窗口预选 |

**3. 窗口预选**

截屏打开时，通过 `user32.getPreviewWindowRect` 获取当前屏幕所有窗口的位置信息，鼠标悬停时自动高亮预选对应窗口区域。

**4. 放大镜**

鼠标移动时实时显示放大镜组件（3 倍放大），展示当前像素的 RGB 颜色值和坐标位置。

**5. 保存与分享**

- **确认（OK）**：将选区截图转为 JPEG DataURL，写入系统剪贴板，并通过 IPC 发送给主窗口用于消息发送
- **保存（Save）**：弹出系统保存对话框，支持 PNG/JPG/JPEG/GIF 格式
- **大图压缩**：超过 10MB 的截图自动压缩（质量比例不低于 0.6）

```javascript
getImageUrl({isOk} = {isOk: false}) {
    let result = canvas.toDataURL('image/jpeg');
    if (isOk && imgSize >= 10) {
        let ratio = Number(((9.5 * 1024 * 1024) / result.length).toFixed(2));
        ratio = ratio < 0.6 ? 0.6 : ratio;
        result = canvas.toDataURL('image/jpeg', ratio);
    }
    return result;
}
```

## 桌面图像捕获：desktop-capturer.js

### 文件位置

`src/renderer/screenshot/components/desktop-capturer.js`

### 双路径捕获策略

| 条件 | 捕获方式 | 描述 |
|------|---------|------|
| `display.src` 存在 | Image + Canvas | 主进程已通过 screenshot-desktop 获取 base64 图片 |
| `display.src` 不存在 | MediaDevices API | 回退到浏览器 getUserMedia 获取桌面流 |

MediaDevices 方式通过创建隐藏 video 元素播放桌面流，再绘制到 Canvas 上获取图像数据。

捕获过程中通过 `user32.setShowCursor(false)` 隐藏系统鼠标，避免鼠标被截入图像。

## 画布编辑工具

### 工具栏配置

工具栏在 `toolbars.js` 中定义，包含以下工具：

| 工具 | 常量 | 属性配置 |
|------|------|---------|
| 椭圆 | `JS_TOOL_OVAL` | 粗细 + 颜色 |
| 矩形 | `JS_TOOL_RECT` | 粗细 + 颜色 |
| 画笔 | `JS_TOOL_BRUSH` | 粗细 + 颜色 |
| 文本 | `JS_TOOL_TEXT` | 字号 + 颜色 |
| 马赛克 | `JS_TOOL_MOSAICS` | 粗细 |
| 保存 | `JS_TOOL_SAVE` | 触发保存对话框 |
| 撤销 | `JS_TOOL_UNDO` | 弹出最后一条 stack 记录 |
| 取消 | `JS_TOOL_CLOSE` | 关闭截屏 |
| 确认 | `JS_TOOL_OK` | 复制到剪贴板并发送 |

### ScreenshotsViewer.vue 编辑画布

编辑画布是标注功能的核心组件：

- 维护一个 Canvas 2D 上下文用于绘制标注
- 通过 `stack` 数组保存所有标注操作的历史记录
- 每次 stack 变化时重新绘制所有标注
- 支持通过 `isPointInStroke` / `isPointInPath` 判断鼠标点击命中的标注元素
- 支持 Delete 键删除选中的标注

### Action 编辑模型

每个编辑工具通过 Action 类实现，提供标准化的接口：

```
mousedown(e, args)    - 鼠标按下，开始绘制
mousemove(e, args)    - 鼠标移动，实时预览
mouseup(e, args)      - 鼠标释放，完成绘制
draw(ctx, record)     - 绘制到 Canvas 上下文
render()              - 返回工具栏选项配置
beforeUnMount()       - 工具切换前清理
```

### 工具栏选项面板

`ScreenshotsViewerBar.vue` 根据当前活动的 Action 动态渲染选项面板：

- **SizeColor** 组合面板：矩形、椭圆、箭头、画笔使用，可选粗细（3/6/9px）和颜色（6 种预设色）
- **Size** 面板：马赛克使用，仅可选粗细
- **Color** 面板：独立颜色选择

粗细预设值：`[3, 6, 9]`，字号预设值：`[14, 17, 20, 23, 26, 29, 32, 64, 96, 128]`。

## 多显示器支持

截屏模块完整支持多显示器场景：

1. **初始化**：遍历 `screen.getAllDisplays()` 为每个显示器创建独立窗口
2. **热插拔**：监听 `display-added` / `display-removed` 事件动态增删窗口
3. **分辨率变化**：监听 `display-metrics-changed` 事件重新设置窗口边界
4. **DPI 缩放**：通过 `scaleFactor` 正确处理高 DPI 显示器的坐标转换
5. **跨屏选区同步**：某屏选区后通过 IPC 通知其他屏幕禁用/重置

## 内存管理

截屏模块特别注意内存回收：

- 截屏完成后 Canvas 高度置 0 并 clearRect
- 临时变量显式赋 null（`imageCanvas = null`, `ctx = null`）
- 关闭截屏后执行 `window.location.reload()` 强制释放渲染进程内存
- 图片 DataURL 使用完毕后赋 null
