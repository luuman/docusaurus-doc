# 日志系统架构

## 概述

MATRX Windows 客户端使用基于 log4js 框架深度定制的日志系统，支持日志加密、自动轮转、多类别分离输出等特性。

## 目录结构

```
src/logs/
├── index.js                    # 日志系统入口，配置初始化
├── log.config.js               # log4js 配置生成器
├── cryptoLogUtil.js            # 加密日志工具类
├── lib/                        # log4js 定制核心
│   ├── log4js.js               # 主入口
│   ├── logger.js               # Logger 类实现
│   ├── levels.js               # 日志级别定义
│   ├── layouts.js              # 日志格式布局（含加密逻辑）
│   ├── encrypt.js              # 加密模块
│   ├── categories.js           # 类别管理
│   ├── clustering.js           # 集群支持
│   ├── configuration.js        # 配置验证
│   ├── LoggingEvent.js         # 日志事件对象
│   ├── connect-logger.js       # HTTP 日志中间件
│   └── appenders/              # 输出适配器
│       ├── index.js            # Appender 加载器
│       ├── fileSync.js         # 同步文件写入（主要使用）
│       ├── file.js             # 异步文件写入
│       ├── dateFile.js         # 按日期轮转
│       ├── console.js          # 控制台输出
│       ├── stdout.js           # 标准输出
│       ├── stderr.js           # 标准错误
│       ├── logLevelFilter.js   # 级别过滤
│       ├── categoryFilter.js   # 类别过滤
│       ├── noLogFilter.js      # 排除过滤
│       ├── multiFile.js        # 多文件输出
│       ├── multiprocess.js     # 多进程支持
│       ├── tcp.js              # TCP 传输
│       ├── tcp-server.js       # TCP 服务端
│       ├── adapters.js         # 适配器工具
│       └── recording.js        # 记录器
├── devLog.js                   # 开发日志（渲染进程）
├── devBackLog.js               # 开发日志（主进程）
├── messageLog.js               # 消息日志
├── devMsgAllLog.js             # 全量消息日志
├── meetingLog.js               # 会议 SDK 日志
├── meetingAgentLog.js          # 会议 Agent 日志
├── meetLog.js                  # 会议日志（别名）
├── meetingInviteLog.js         # 会议邀请日志
├── sdkLog.js                   # SDK 日志
├── renderSdkLog.js             # 渲染进程 SDK 日志
├── hmeetLog.js                 # H 会议 SDK 日志
├── e2eeLog.js                  # 端到端加密日志
├── cryptolog.js                # 加密模块日志
├── ackLog.js                   # ACK 确认日志
├── offlineMsgLog.js            # 离线消息日志
├── msgTaskLog.js               # 消息任务日志
├── screenshotLog.js            # 截图日志
├── screenshotLogMain.js        # 截图日志（主进程）
├── fileViewerLog.js            # 文件查看器日志
├── fileViewerMainLog.js        # 文件查看器日志（主进程）
├── pictureViewerLog.js         # 图片查看器日志
├── infoLog.js                  # 信息开发日志
├── storageDataLog.js           # 存储数据日志
├── sessionDevLog.js            # 会话开发日志
├── devFileLog.js               # 文件开发日志
├── deleteAccountLog.js         # 账号删除日志
├── deleteAccountFeedbackLog.js # 删除反馈日志
├── callfeedbackLog.js          # 通话反馈日志
├── callfeedbackLogMain.js      # 通话反馈日志（主进程）
├── setEmojiLog.js              # 表情设置日志
├── avrRiskLog.js               # AVR 风险日志
├── concat.js                   # 合并日志
└── memory-usage.js             # 内存使用日志
```

## log.config.js 配置详解

### 核心配置生成

```javascript
function initLogConfig(defaultUrl, filename = 'main', size, password) {
    return {
        appenders: {
            console: {
                type: 'console',
                layout: { type: 'colored' }
            },
            main: {
                type: 'fileSync',
                filename: path.join(defaultUrl, 'logs', filename + '.log'),
                fileNameSep: '.',
                maxLogSize: size || '6M',
                backups: 2,
                keepFileExt: true,
                pattern: 'log',
                alwaysIncludePattern: true,
                compress: false,
                layout: {
                    type: 'mypattern',
                    pattern: `[%d{yyyy-MM-dd hh:mm:ss.SSS}] (%p${joinSep}%m [%f{1}:%l]`,
                    password: password
                }
            }
        },
        categories: {
            default: {appenders: ['main'], level: 'all', enableCallStack: true},
            main: {appenders: ['main'], level: 'all', enableCallStack: true}
        }
    };
}
```

### 配置参数说明

| 参数 | 说明 | 默认值 |
|------|------|--------|
| `type` | Appender 类型 | `fileSync` |
| `filename` | 日志文件路径 | `{configDir}/logs/{name}.log` |
| `maxLogSize` | 单文件最大大小 | `6M` (msgAllLog 为 `8M`) |
| `backups` | 备份文件数量 | `2` (msgAllLog 为 `5`) |
| `keepFileExt` | 保留文件扩展名 | `true` |
| `compress` | 是否压缩 | `false` |
| `layout.type` | 布局类型 | `mypattern` (定制加密布局) |
| `layout.password` | 加密密码 | 生产环境: `'empty'`, 开发环境: `''` |

### 日志输出格式

标准格式：
```
[%d{yyyy-MM-dd hh:mm:ss.SSS}] (%p)=> %m [%f{1}:%l]
```

格式说明：
- `%d{yyyy-MM-dd hh:mm:ss.SSS}` - 时间戳，精确到毫秒
- `%p` - 日志级别 (TRACE, DEBUG, INFO, WARN, ERROR, FATAL)
- `%m` - 日志消息内容
- `%f{1}` - 源文件名（仅文件名，不含路径）
- `%l` - 行号

示例输出：
```
[2024-01-15 10:30:45.123] (INFO)=> 用户登录成功 [login.js:42]
```

## 19个日志类别 (categoryNames)

| 类别名称 | 说明 | 关联 Appender |
|----------|------|---------------|
| `appLog` | 应用主日志 | main |
| `bridgeLog` | IPC 桥接日志 | main |
| `ipcMainLog` | 主进程 IPC 日志 | main |
| `sdkLog` | SDK 通用日志 | main |
| `e2eeLog` | 端到端加密日志 | main |
| `meetingLog` | 会议相关日志 | main |
| `updaterLog` | 更新器日志 | main |
| `renderLog` | 渲染进程日志 | main |
| `callfeedbackLogMain` | 通话反馈日志 | callfeedbackLog |
| `fileViewerMainLog` | 文件查看器日志 | fileViewer |
| `screenshotLogMain` | 截图功能日志 | screenshot |
| `fileLog` | 文件操作日志 | main |
| `messageLog` | 消息处理日志 | main |
| `apiLog` | API 调用日志 | main |
| `ackLog` | 消息确认日志 | main |
| `offlineMsgLog` | 离线消息日志 | main |
| `storageDataLog` | 存储数据日志 | main |
| `msgTaskLog` | 消息任务日志 | main |
| `e2eeLog` | E2EE 加密日志 | main |

## 21个 Appender 配置

| Appender 名称 | 输出文件 | 特殊配置 |
|---------------|----------|----------|
| `avr-risk` | `avr-risk.log` | 标准配置 |
| `callfeedbackLog` | `callfeedbackLog.log` | 标准配置 |
| `deleteAccountFeedback` | `deleteAccountFeedback.log` | 标准配置 |
| `delete-account` | `delete-account.log` | 标准配置 |
| `file-dev` | `file-dev.log` | 标准配置 |
| `fileViewer` | `fileViewer.log` | 标准配置 |
| `info-dev` | `info-dev.log` | 标准配置 |
| `msgAllLog` | `msgAllLog.log` | maxLogSize: 8M, backups: 5 |
| `cst-meeting-sdk` | `cst-meeting-sdk.log` | 标准配置 |
| `cst-meeting-agent` | `CST_Meeting/agent/cst-meeting-agent.log` | 特殊路径和格式 |
| `pictureViewer` | `pictureViewer.log` | 标准配置 |
| `screenshot` | `screenshot.log` | 标准配置 |
| `h-sdk` | `h-sdk.log` | 标准配置 |
| `session-dev` | `session-dev.log` | 标准配置 |
| `setEmoji` | `setEmoji.log` | 标准配置 |
| `storage-data` | `storage-data.log` | 标准配置 |
| `ack` | `ack.log` | 标准配置 |
| `offlineMsg` | `offlineMsg.log` | 标准配置 |
| `msgTask` | `msgTask.log` | 标准配置 |
| `e2ee` | `e2ee.log` | 标准配置 |
| `{pkg.name}-usage` | `{pkg.name}-usage.log` | 内存使用监控 |

## 日志级别配置

系统支持以下日志级别（按优先级从低到高）：

| 级别 | 数值 | 颜色 | 用途 |
|------|------|------|------|
| `ALL` | MIN_VALUE | grey | 输出所有日志 |
| `TRACE` | 5000 | blue | 最详细的追踪信息 |
| `DEBUG` | 10000 | cyan | 调试信息 |
| `INFO` | 20000 | green | 常规信息 |
| `LOG` | 20000 | green | 常规日志（等同 INFO） |
| `WARN` | 30000 | yellow | 警告信息 |
| `ERROR` | 40000 | red | 错误信息 |
| `FATAL` | 50000 | magenta | 致命错误 |
| `MARK` | 2^53 | grey | 特殊标记 |
| `OFF` | MAX_VALUE | grey | 关闭日志 |

### 使用示例

```javascript
const log = require('./logs/devLog');

log.trace('详细追踪信息');
log.debug('调试信息');
log.info('常规信息');
log.warn('警告信息');
log.error('错误信息');
log.fatal('致命错误');
```

## 日志轮转策略

### 默认轮转配置

| 配置项 | 默认值 | 说明 |
|--------|--------|------|
| `maxLogSize` | 6MB | 单文件最大大小 |
| `backups` | 2 | 保留备份数量 |

### msgAllLog 特殊配置

| 配置项 | 值 | 说明 |
|--------|-----|------|
| `maxLogSize` | 8MB | 全量消息日志需要更大空间 |
| `backups` | 5 | 保留更多历史记录 |

### 轮转机制

1. 当日志文件达到 `maxLogSize` 时触发轮转
2. 现有文件重命名为 `{filename}.1`, `{filename}.2` 等
3. 超过 `backups` 数量的旧文件被删除
4. 创建新的空日志文件继续写入

轮转示例：
```
main.log        -> main.log.1 -> main.log.2 -> 删除
(当前写入)        (上一个)       (最旧)
```

## log4js 框架定制

### 定制 Layout：mypattern

位于 `lib/layouts.js`，在标准 patternLayout 基础上增加加密支持：

```javascript
layoutMakers.mypattern = function(config) {
    return patternLayout(config.pattern, config.tokens, config.password);
};
```

### 加密集成

在 `patternLayout` 函数末尾，对消息部分进行加密：

```javascript
let str = formattedString.split(joinSep);
const prev = str.shift();
if (str.length > 1) {
    str = str.join(joinSep);
}
if (password) {
    str = encryptStr(str, password);
}
formattedString = prev + joinSep + str;
```

### 定制 Appender：fileSync

使用同步写入确保日志完整性，支持：
- 按大小轮转（RollingFileSync）
- 自动创建目录
- 文件权限控制

### 主要定制点

1. **加密布局** - 生产环境自动加密敏感日志内容
2. **分隔符** - 使用 `)=> ` 作为级别和消息的分隔符
3. **调用栈** - 启用 `enableCallStack` 记录源文件位置
4. **同步写入** - 使用 `fileSync` 确保日志不丢失

## 初始化流程

```javascript
// src/logs/index.js
const password = debug ? '' : 'empty';  // 开发环境不加密
const config = initLogConfig(configDir, name, '6M', password);
handleConfig(config, {appenderNames, categoryNames}, configDir);
log4js.configure(config);
```

## 运行时日志路径

日志文件位于用户数据目录下的 `logs/` 文件夹：

- Windows: `%APPDATA%/{app-name}/logs/`
- macOS: `~/Library/Application Support/{app-name}/logs/`
- Linux: `~/.config/{app-name}/logs/`
