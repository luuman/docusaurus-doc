# 调试与排错指南

## 开发环境调试

### 1. 启用开发者工具

```bash
# 启动调试模式
npm run debug
```

在代码中启用 DevTools:

```javascript
// src/main/mainWindow/index.js
if (process.env.NODE_ENV === 'development') {
  win.webContents.openDevTools();
}
```

### 2. 主进程调试

**VS Code 配置** (`.vscode/launch.json`):

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Debug Main Process",
      "type": "node",
      "request": "launch",
      "cwd": "${workspaceFolder}",
      "runtimeExecutable": "${workspaceFolder}/node_modules/.bin/electron",
      "windows": {
        "runtimeExecutable": "${workspaceFolder}/node_modules/.bin/electron.cmd"
      },
      "args": [".", "--remote-debugging-port=9222"],
      "outputCapture": "std",
      "console": "integratedTerminal"
    }
  ]
}
```

### 3. 渲染进程调试

使用 Chrome DevTools:

1. 按 `Ctrl+Shift+I` 打开 DevTools
2. 使用 Sources 面板设置断点
3. 使用 Console 面板执行代码

### 4. 日志查看

**日志位置**: `app.getPath('userData')/logs/`

```javascript
// 在代码中使用日志
import { devLog } from '@/logs/devLog';

devLog.info('操作信息', { data });
devLog.error('错误信息', error);
devLog.debug('调试信息', debugData);
```

## 常见问题排查

### 问题 1: 应用启动白屏

**可能原因**:
1. Vue 编译错误
2. 预加载脚本错误
3. 路由配置问题

**排查步骤**:

```javascript
// 1. 检查主进程控制台
// 启动时添加 --enable-logging

// 2. 检查渲染进程错误
win.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
  console.error('Load failed:', errorCode, errorDescription);
});

// 3. 检查预加载脚本
win.webContents.on('preload-error', (event, preloadPath, error) => {
  console.error('Preload error:', preloadPath, error);
});
```

### 问题 2: IPC 通信失败

**排查步骤**:

```javascript
// 1. 检查频道名称是否一致
// 主进程
ipcMain.handle('getData', ...);
// 渲染进程
ipcRenderer.invoke('getData', ...);

// 2. 添加日志
ipcMain.handle('getData', async (event, ...args) => {
  console.log('Received getData:', args);
  // ...
});

// 3. 检查 preload 白名单
const validChannels = ['getData']; // 确保包含所需频道
```

### 问题 3: 原生模块加载失败

**错误示例**:
```
Error: Cannot find module '@journeyapps/sqlcipher'
```

**解决方案**:

```bash
# 1. 重建原生模块
npm run electron-rebuild

# 2. 检查 Node.js 版本
node -v  # 应为 v16.x

# 3. 清理并重新安装
rm -rf node_modules
npm cache clean --force
npm install --force
```

### 问题 4: 窗口无法显示

**排查步骤**:

```javascript
// 1. 检查窗口是否创建
const win = new BrowserWindow({...});
console.log('Window created:', win.id);

// 2. 检查 show 事件
win.once('ready-to-show', () => {
  console.log('Window ready to show');
  win.show();
});

// 3. 检查窗口位置是否在可见区域
const { screen } = require('electron');
const displays = screen.getAllDisplays();
console.log('Displays:', displays);
console.log('Window bounds:', win.getBounds());
```

### 问题 5: 内存泄漏

**排查工具**:

```javascript
// 1. 使用 Chrome DevTools Memory 面板

// 2. 监控 Node.js 内存
const v8 = require('v8');
setInterval(() => {
  const stats = v8.getHeapStatistics();
  console.log('Heap used:', (stats.used_heap_size / 1024 / 1024).toFixed(2), 'MB');
}, 10000);

// 3. 检查事件监听器泄漏
const EventEmitter = require('events');
EventEmitter.defaultMaxListeners = 20;
process.on('warning', (warning) => {
  console.warn('Warning:', warning);
});
```

## 性能分析

### 1. 启动性能分析

```javascript
// 添加启动时间点记录
const startTime = Date.now();

app.on('ready', () => {
  console.log('App ready time:', Date.now() - startTime, 'ms');
});

win.once('ready-to-show', () => {
  console.log('Window ready time:', Date.now() - startTime, 'ms');
});

win.webContents.on('did-finish-load', () => {
  console.log('Content loaded time:', Date.now() - startTime, 'ms');
});
```

### 2. 渲染性能分析

```javascript
// Vue 性能追踪
Vue.config.performance = true;

// 使用 Chrome Performance 面板
// 1. 打开 DevTools
// 2. 选择 Performance 标签
// 3. 点击 Record 开始录制
// 4. 执行操作
// 5. 停止录制并分析
```

### 3. 内存分析

```javascript
// 使用 Chrome Memory 面板
// 1. 打开 DevTools
// 2. 选择 Memory 标签
// 3. 选择 Heap snapshot
// 4. Take snapshot
// 5. 分析对象分布
```

## 生产环境调试

### 1. 收集崩溃日志

```javascript
// src/main/crashReporter.js
const { crashReporter } = require('electron');

crashReporter.start({
  productName: 'Matrx',
  companyName: 'YourCompany',
  submitURL: 'https://your-crash-server.com/submit',
  uploadToServer: true
});
```

### 2. 远程日志

```javascript
// 将日志发送到远程服务器
const log = require('electron-log');

log.transports.remote = {
  level: 'error',
  url: 'https://your-log-server.com/log'
};
```

### 3. 用户反馈收集

```javascript
// 提供反馈入口
ipcMain.handle('submit-feedback', async (event, feedback) => {
  // 收集系统信息
  const systemInfo = {
    platform: process.platform,
    arch: process.arch,
    version: app.getVersion(),
    electron: process.versions.electron
  };

  // 发送到服务器
  await submitFeedback({ ...feedback, systemInfo });
});
```

## 调试技巧

### 1. 条件断点

在 Chrome DevTools 中右键点击行号，选择 "Add conditional breakpoint":

```javascript
// 仅当条件满足时中断
message.type === 'error'
```

### 2. 日志断点

使用 `console.log` 无需中断执行:

```javascript
// 在 DevTools Sources 面板
// 右键 → Add logpoint
// 输入: "Message received:", message
```

### 3. 网络请求调试

```javascript
// 在 DevTools Network 面板
// 1. 启用 Preserve log
// 2. 筛选请求类型
// 3. 查看请求详情和响应
```

### 4. 源码映射

确保 vue.config.js 配置正确:

```javascript
module.exports = {
  configureWebpack: {
    devtool: process.env.NODE_ENV === 'development'
      ? 'eval-source-map'
      : 'source-map'
  }
};
```
