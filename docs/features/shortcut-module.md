# 快捷键模块

## 概述

快捷键模块为 Matrx Windows 客户端提供全局/窗口级快捷键绑定、自定义快捷键配置、冲突检测与持久化功能。模块分为三层：主进程全局快捷键注册层、渲染进程快捷键服务层、独立的快捷键设置窗口。用户可通过设置窗口自定义各功能快捷键，配置通过 `appdataStorage` 持久化到本地存储。

## 核心文件结构

```
src/
  main/
    globalShortcut.js               # 全局快捷键注册（Electron globalShortcut）
    shortcut/
      index.js                      # 快捷键设置窗口管理（主进程）
    screenshot/
      capture-main.js               # 截屏快捷键注册（register-shortcut）
  renderer/
    shortcut/
      index.js                      # 快捷键设置窗口入口
      App.vue                       # 快捷键设置界面
      components.config.js          # 组件注册配置
  utils/
    shortcut/
      index.js                      # ShortCut 类（渲染进程快捷键服务）
  components/
    settings/
      util/
        ShortcutSettings/
          shortcut.js               # 快捷键初始化与截屏快捷键通知
```

## 全局快捷键注册：globalShortcut.js

### 文件位置

`src/main/globalShortcut.js`

### 功能说明

该文件在主进程中注册 Electron `globalShortcut` 的查询与注销接口：

```javascript
import {globalShortcut, ipcMain} from 'electron';

export function registerShortcut() {
    ipcMain.on('isRegistered_keys', (e, keys) => {
        e.reply('isRegistered_keys_RES', globalShortcut.isRegistered(keys));
    });

    ipcMain.on('unregister_keys', (e, arr) => {
        globalShortcut.unregister(arr.join('+'));
    });
}
```

提供两个 IPC 通道：
- `isRegistered_keys`：查询指定快捷键是否已被注册
- `unregister_keys`：注销指定快捷键组合

截屏快捷键的注册在 `capture-main.js` 中通过 `register-shortcut` type 完成：

```javascript
if (type === 'register-shortcut') {
    const returnValue = globalShortcut.register(params.valueKeys, async () => {
        // 获取截屏配置
        isCapture = await getFromLocalStorage(mainWindow, 'SCREEN_CAPTURE_isCapture');
        isHideMainWindow = await getFromLocalStorage(mainWindow, 'SCREEN_CAPTURE_HideMainWindow');
        // 触发截屏
        isCapture && captureScreen();
    });
    event.returnValue = returnValue;
}
```

## 快捷键设置窗口管理：shortcut/index.js

### 文件位置

`src/main/shortcut/index.js`

### 窗口创建

快捷键设置窗口是一个独立的 BrowserWindow，尺寸为 500x800：

```javascript
function createWindow(data = {}) {
    winInstance = new BrowserWindow({
        width: 500,
        height: 800,
        show: false,
        frame: false,
        hasShadow: false,
        webPreferences: {
            ...commonWebPreferences,
            preload: path.join(__static, 'shortcut/preload.js')
        }
    });
    // 加载 shortcut.html
}
```

### IPC 事件处理

通过 `shortcut-win` IPC 通道管理窗口生命周期：

| type | 描述 |
|------|------|
| `open` | 打开快捷键设置窗口 |
| `minimize` | 最小化窗口 |
| `maximize` | 最大化窗口 |
| `unmaximize` | 取消最大化 |
| `restore` | 恢复窗口 |
| `close` | 关闭窗口 |
| `update-shortcut` | 将快捷键更新同步到主窗口 |

窗口打开时自动定位到鼠标所在显示器的中心位置：

```javascript
function setWindowSize(winInstance) {
    const cursorScreenPoint = screen.getCursorScreenPoint();
    const display = screen.getDisplayNearestPoint(cursorScreenPoint);
    winInstance.setPosition(display.bounds.x, display.bounds.y);
    winInstance.center();
}
```

## 渲染进程快捷键服务：ShortCut 类

### 文件位置

`src/utils/shortcut/index.js`

### 默认快捷键配置

模块定义了两类默认快捷键：

**可自定义快捷键（defaultShortcutKeys）：**

| 快捷键 | 功能标识 | 描述 |
|--------|---------|------|
| `Alt+A` | AI_Assistant | 打开 AI 助手 |
| `Ctrl+U` | Unread_workspace | 跳转未读工作区 |
| `Alt+U` | Unread_Chat | 跳转未读聊天 |
| `Ctrl+N` | New_Chat | 新建聊天 |
| `Ctrl+Alt+Z` | Screen_Capture | 截屏 |
| `Ctrl+Shift+M` | New_Meeting | 新建会议 |
| `Ctrl+B` | Bold | 加粗 |
| `Ctrl+I` | Italic | 斜体 |
| `Ctrl+Shift+U` | Underline | 下划线 |
| `Ctrl+Shift+X` | Strikethrough | 删除线 |
| `Ctrl+Shift+7` | Ordered_List | 有序列表 |
| `Ctrl+Shift+8` | Bulleted_List | 无序列表 |
| `Ctrl+Shift+9` | Blockquote | 引用 |
| `Ctrl+Shift+C` | Code | 代码 |
| `Ctrl+Shift+T` | To_do | 待办 |
| `Ctrl+0` | Open_workspace_list | 打开工作区列表 |

**固定快捷键（defaultShortcutMapKeys）：**

| 快捷键 | 功能 |
|--------|------|
| `Ctrl+/` | 打开快捷键设置 |
| `Alt+1~6` | 切换导航标签 |
| `Ctrl+1~9` | 切换工作区 |
| `Ctrl+Down/Up` | 下/上一个工作区 |
| `Ctrl+Shift+S` | 切换工作区选择器 |
| `Ctrl+F` | 搜索 |
| `F1` | 帮助中心 |

### ShortCut 类核心方法

```javascript
class ShortCut {
    shortcutMap = defaultShortcutMapKeys();

    init(sourceWin) {
        this._initShortcutKeys();
        document.addEventListener('keydown', this._handleMainWinKeyDown);
    }

    destroy() {
        document.removeEventListener('keydown', this._handleMainWinKeyDown);
    }
}
```

**初始化快捷键映射 `_initShortcutKeys`：**

1. 清空 shortcutMap
2. 加载 defaultShortcutKeys（可自定义）
3. 加载 defaultShortcutMapKeys（固定）
4. 从 `appdataStorage.getItem('shortcutKeys')` 读取用户自定义配置
5. 用户自定义配置覆盖默认配置（先删除旧映射，再添加新映射）

**按键事件处理 `_handleMainWinKeyDown`：**

1. 检测当前焦点元素是否为输入框，如果是则不处理快捷键
2. 解析修饰键（Ctrl/Shift/Alt/Cmd）和主键
3. 标准化按键名称（`_normalizeKey`）
4. 组合成 combo 字符串（如 `Ctrl+Shift+M`）
5. 查询 shortcutMap 执行对应动作

**按键标准化 `_normalizeKey`：**

处理各类特殊键名映射：
- 空格键: `Space`
- 方向键: `ArrowUp` -> `Up`
- 数字键: `Digit1` -> `1`
- 符号键: `Slash` -> `/`，`Minus` -> `-`
- 功能键: 保持原名

### 快捷键动作执行 `_executeShortcut`

通过 Vue Bus 事件系统或 IPC 分发快捷键动作：

```javascript
_executeShortcut(combo, key) {
    switch (key) {
        case 'Open_shortcut':
            ipcRenderer.send('shortcut-win', {type: 'open'});
            break;
        case 'Toggle_specific_navigation':
            Bus.$emit('switch-menu-shortcut', Number(value));
            break;
        case 'Screen_Capture':
            ipcRenderer.send('capture-screen', {
                type: 'start',
                isHideMainWindow: getHideMainWindow()
            });
            break;
        // ...
    }
}
```

## 快捷键设置界面：App.vue

### 文件位置

`src/renderer/shortcut/App.vue`

### 界面结构

设置界面分为四个分组：

| 分组 | 包含快捷键 |
|------|-----------|
| Navigation | 导航切换、工作区切换器、搜索、帮助、AI 助手、工作区列表 |
| WorkspaceSwitching | 未读工作区、下/上一个工作区、指定工作区 |
| Chats | 未读聊天、新建聊天、截屏 |
| Meetings | 新建会议 |

界面支持搜索功能，通过正则匹配高亮搜索词。

### 快捷键编辑流程

1. 用户点击快捷键项触发 `onEditShortcut`
2. 显示输入框，聚焦等待按键
3. `onKeydown` 捕获按键事件，组合修饰键和主键
4. 调用 `registryShortcut` 进行注册

### 冲突检测

当用户输入新的快捷键组合时，系统会检测是否与已有快捷键冲突：

```javascript
registryShortcut(combo, key) {
    const localeKey = ShortcutService.getShortcutByCombo(combo, true);
    if (localeKey && localeKey !== key) {
        // 标记冲突
        this.$set(this.shortcutMap[localeKey], 'conflict', true);
        this.$set(this.shortcutMap[key], 'conflict', true);
        // 维护冲突列表
        // ...
    } else {
        // 无冲突，保存配置
        localshortcut[combo] = key;
        appdataStorage.setItem('shortcutKeys', localshortcut);
        window.shortcutWindow.updateShortcut();
    }
}
```

冲突时界面显示红色提示：`This key combination has already been taken by xxx. Please modify.`

### 快捷键持久化

用户自定义的快捷键配置通过 `appdataStorage` 存储在本地：

```javascript
// 存储格式: { "Ctrl+Alt+Z": "Screen_Capture", "Ctrl+N": "New_Chat" }
appdataStorage.setItem('shortcutKeys', localshortcut);
```

### 重置功能

每个可编辑的快捷键项支持重置为默认值：

```javascript
onReset(key) {
    this.shortcutMap[key].value = this.shortcutValueMap[key]; // 恢复默认
    // 从本地存储中删除自定义配置
    const localshortcut = appdataStorage.getItem('shortcutKeys') || {};
    const deleteKey = Object.keys(localshortcut).filter(item => localshortcut[item] === key);
    if (deleteKey) delete localshortcut[deleteKey];
    appdataStorage.setItem('shortcutKeys', localshortcut);
    // 清除冲突标记
    // ...
    window.shortcutWindow.updateShortcut();
}
```

### 快捷键同步机制

快捷键设置窗口修改配置后需同步到主窗口：

1. 设置窗口调用 `window.shortcutWindow.updateShortcut()`
2. 主进程 `shortcut-win` 处理 `update-shortcut` 类型
3. 通过 `sendWinMsg` 将更新发送到主窗口
4. 主窗口的 ShortCut 实例重新初始化快捷键映射

## 截屏快捷键特殊处理

截屏快捷键通过 Electron `globalShortcut` 注册为系统级全局快捷键，即使应用不在前台也能触发：

```javascript
// capture-main.js 中注册
globalShortcut.register(params.valueKeys, async () => {
    let isCapture = await getFromLocalStorage(mainWindow, 'SCREEN_CAPTURE_isCapture');
    let isHideMainWindow = await getFromLocalStorage(mainWindow, 'SCREEN_CAPTURE_HideMainWindow');
    windowManager.setKeydownShiftKey(isHideMainWindow);
    if (isHideMainWindow && isCapture) {
        windowManager.setDisplayMainWindow({show: false});
    }
    isCapture && captureScreen();
});
```

修改截屏快捷键时，需先注销旧快捷键再注册新快捷键，通过 `emitShortcut` 函数通知主进程完成重新注册。

## 架构总结

```
用户按键
  |
  v
[ShortCut._handleMainWinKeyDown]  (渲染进程，窗口级)
  |
  +---> Bus.$emit('xxx-shortcut')  ---> Vue 组件响应
  |
  +---> ipcRenderer.send('capture-screen')  ---> 主进程截屏
  |
  +---> ipcRenderer.send('shortcut-win')  ---> 打开设置窗口

[globalShortcut.register]  (主进程，系统级)
  |
  +---> captureScreen()  ---> 截屏流程
```
