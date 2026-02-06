# 日志分类参考

本文档详细说明 MATRX Windows 客户端中各个日志模块的用途、输出位置和使用场景。

## 开发日志

### devLog.js - 渲染进程开发日志

```javascript
const {renderLog} = require('./index');
module.exports = renderLog;
```

**用途**: 记录渲染进程（前端 UI）中的开发调试信息。

**输出文件**: `{configDir}/logs/main.log`

**使用场景**:
- Vue 组件生命周期追踪
- 用户交互事件记录
- 前端状态变化监控
- UI 渲染问题调试

**使用示例**:
```javascript
const devLog = require('@/logs/devLog');
devLog.info('组件已挂载', componentName);
devLog.debug('状态更新', { oldState, newState });
```

### devBackLog.js - 主进程开发日志

```javascript
const {appLog} = require('./index');
module.exports = appLog;
```

**用途**: 记录主进程（Electron main process）中的开发调试信息。

**输出文件**: `{configDir}/logs/main.log`

**使用场景**:
- 应用启动流程记录
- 窗口管理操作
- 系统级事件处理
- 进程间通信追踪

**使用示例**:
```javascript
const devBackLog = require('@/logs/devBackLog');
devBackLog.info('主窗口创建完成');
devBackLog.error('系统托盘初始化失败', error);
```

---

## 消息日志

### messageLog.js - 消息处理日志

```javascript
const {messageLog} = require('./index');
module.exports = messageLog;
```

**用途**: 记录即时消息的处理流程。

**输出文件**: `{configDir}/logs/main.log`

**使用场景**:
- 消息发送/接收状态
- 消息解析处理
- 消息存储操作
- 消息同步流程

**使用示例**:
```javascript
const messageLog = require('@/logs/messageLog');
messageLog.info('收到新消息', { msgId, from, type });
messageLog.debug('消息入库成功', msgId);
```

### devMsgAllLog.js - 全量消息日志

```javascript
const {log4js} = require('./index');
const name = 'msgAllLog';
module.exports = log4js.getLogger(name);
```

**用途**: 记录所有消息的完整信息，用于问题排查。

**输出文件**: `{configDir}/logs/msgAllLog.log`

**特殊配置**:
- `maxLogSize`: 8MB（比默认 6MB 更大）
- `backups`: 5（保留更多历史）

**使用场景**:
- 消息完整内容记录
- 消息流转全链路追踪
- 消息问题深度排查
- 消息统计分析

**使用示例**:
```javascript
const msgAllLog = require('@/logs/devMsgAllLog');
msgAllLog.info('完整消息内容', JSON.stringify(message));
```

### msgDevLog.js - 消息开发日志

```javascript
// 简化导出
```

**用途**: 消息模块开发调试专用日志。

**使用场景**: 消息功能开发时的临时调试。

---

## 会议日志

### meetingLog.js - 会议 SDK 日志

```javascript
const {log4js} = require('./index');
const name = 'cst-meeting-sdk';
module.exports = log4js.getLogger(name);
```

**用途**: 记录会议 SDK 的调用和状态。

**输出文件**: `{configDir}/logs/cst-meeting-sdk.log`

**使用场景**:
- 会议 SDK 初始化
- 音视频通话状态
- 会议房间管理
- 媒体流处理

**使用示例**:
```javascript
const meetingLog = require('@/logs/meetingLog');
meetingLog.info('加入会议', { roomId, userId });
meetingLog.error('音频设备获取失败', error);
```

### meetingAgentLog.js - 会议 Agent 日志

```javascript
const {log4js} = require('./index');
const name = 'cst-meeting-agent';
module.exports = log4js.getLogger(name);
```

**用途**: 记录会议代理服务的运行状态。

**输出文件**: `{configDir}/logs/CST_Meeting/agent/cst-meeting-agent.log`

**特殊格式**: `(%d{yyyy-MM-dd hh:mm:ss.SSS})=> %m`

**使用场景**:
- Agent 服务状态监控
- 会议信令处理
- 媒体转发控制
- Agent 异常诊断

### meetLog.js / meetingInviteLog.js - 会议别名日志

```javascript
const {meetingLog} = require('./index');
module.exports = meetingLog;
```

**用途**: 会议日志的便捷别名，用于会议邀请等功能。

**输出**: 与 meetingLog 相同

### hmeetLog.js - H 会议 SDK 日志

```javascript
const {log4js} = require('./index');
const name = 'h-sdk';
module.exports = log4js.getLogger(name);
```

**用途**: 记录华为会议 SDK 的调用日志。

**输出文件**: `{configDir}/logs/h-sdk.log`

**使用场景**:
- 华为会议集成
- 第三方会议 SDK 调用
- 会议互通功能

---

## SDK 日志

### sdkLog.js - 通用 SDK 日志

```javascript
const {log4js} = require('./index');
const name = 'cst-sdk';
module.exports = log4js.getLogger(name);
```

**用途**: 记录核心 SDK 的调用和响应。

**输出文件**: `{configDir}/logs/main.log`（通过 sdkLog category）

**使用场景**:
- IM SDK 调用记录
- SDK 配置变更
- SDK 状态变化
- 网络请求追踪

### renderSdkLog.js - 渲染进程 SDK 日志

```javascript
const {renderLog} = require('./index');
module.exports = renderLog;
```

**用途**: 记录渲染进程中 SDK 相关操作。

**输出文件**: `{configDir}/logs/main.log`

**使用场景**:
- 前端 SDK 调用
- 数据绑定处理
- UI 与 SDK 交互

---

## 加密日志

### e2eeLog.js - 端到端加密日志

```javascript
const {log4js} = require('./index');
const name = 'e2ee';
module.exports = log4js.getLogger(name);
```

**用途**: 记录端到端加密功能的运行状态。

**输出文件**: `{configDir}/logs/e2ee.log`

**使用场景**:
- 密钥交换流程
- 加密/解密操作
- E2EE 会话建立
- 加密错误诊断

**使用示例**:
```javascript
const e2eeLog = require('@/logs/e2eeLog');
e2eeLog.info('E2EE 会话建立', { sessionId });
e2eeLog.debug('密钥派生完成');
```

### cryptolog.js - 加密模块通用日志

```javascript
const {default: log} = require('./index');
module.exports = log;
```

**用途**: 记录加密模块的通用操作。

**输出文件**: `{configDir}/logs/main.log`

**使用场景**:
- 加密初始化
- 加密配置加载
- 加密工具使用记录

---

## 同步日志

### ackLog.js - 消息确认日志

```javascript
const {log4js} = require('./index');
const name = 'ack';
module.exports = log4js.getLogger(name);
```

**用途**: 记录消息已读/送达确认（ACK）状态。

**输出文件**: `{configDir}/logs/ack.log`

**使用场景**:
- 消息送达确认
- 消息已读回执
- ACK 重试机制
- 确认状态同步

**使用示例**:
```javascript
const ackLog = require('@/logs/ackLog');
ackLog.info('发送 ACK', { msgId, ackType });
ackLog.debug('ACK 确认成功', msgId);
```

### offlineMsgLog.js - 离线消息日志

```javascript
const {log4js} = require('./index');
const name = 'offlineMsg';
module.exports = log4js.getLogger(name);
```

**用途**: 记录离线消息的拉取和处理。

**输出文件**: `{configDir}/logs/offlineMsg.log`

**使用场景**:
- 离线消息拉取
- 消息补全流程
- 离线消息入库
- 同步状态追踪

**使用示例**:
```javascript
const offlineMsgLog = require('@/logs/offlineMsgLog');
offlineMsgLog.info('开始拉取离线消息', { lastMsgId });
offlineMsgLog.info('离线消息同步完成', { count: messages.length });
```

### msgTaskLog.js - 消息任务日志

```javascript
const {log4js} = require('./index');
const name = 'msgTask';
module.exports = log4js.getLogger(name);
```

**用途**: 记录消息相关异步任务的执行。

**输出文件**: `{configDir}/logs/msgTask.log`

**使用场景**:
- 消息重发任务
- 批量消息处理
- 定时任务执行
- 任务队列监控

---

## 功能日志

### screenshotLog.js - 截图日志

```javascript
const {log4js} = require('./index');
const name = 'screenshot';
module.exports = log4js.getLogger(name);
```

**用途**: 记录截图功能的使用。

**输出文件**: `{configDir}/logs/screenshot.log`

**使用场景**:
- 截图操作触发
- 截图保存/发送
- 截图编辑操作
- 截图功能异常

### screenshotLogMain.js - 主进程截图日志

主进程中的截图日志，通过 category 关联到 screenshot appender。

### fileViewerLog.js - 文件查看器日志

```javascript
const {log4js} = require('./index');
const name = 'fileViewer';
module.exports = log4js.getLogger(name);
```

**用途**: 记录文件预览功能的使用。

**输出文件**: `{configDir}/logs/fileViewer.log`

**使用场景**:
- 文件打开记录
- 文件下载状态
- 预览渲染过程
- 文件类型处理

### fileViewerMainLog.js - 主进程文件查看器日志

主进程中的文件查看器日志，关联到 fileViewer appender。

### pictureViewerLog.js - 图片查看器日志

```javascript
const {log4js} = require('./index');
const name = 'pictureViewer';
module.exports = log4js.getLogger(name);
```

**用途**: 记录图片预览功能。

**输出文件**: `{configDir}/logs/pictureViewer.log`

**使用场景**:
- 图片加载追踪
- 图片缩放操作
- 图片导航记录
- 大图加载优化

---

## 其他日志

### infoLog.js - 信息开发日志

```javascript
const {log4js} = require('./index');
const name = 'info-dev';
module.exports = log4js.getLogger(name);
```

**输出文件**: `{configDir}/logs/info-dev.log`

**用途**: 开发阶段的信息记录。

### storageDataLog.js - 存储数据日志

```javascript
const {log4js} = require('./index');
const name = 'storage-data';
module.exports = log4js.getLogger(name);
```

**输出文件**: `{configDir}/logs/storage-data.log`

**用途**: 记录本地存储操作。

**使用场景**:
- 数据库操作追踪
- 缓存读写记录
- 存储空间管理
- 数据迁移日志

### sessionDevLog.js - 会话开发日志

```javascript
const {log4js} = require('./index');
const name = 'session-dev';
module.exports = log4js.getLogger(name);
```

**输出文件**: `{configDir}/logs/session-dev.log`

**用途**: 记录会话（对话）相关的开发信息。

### devFileLog.js - 文件开发日志

```javascript
const {log4js} = require('./index');
const name = 'file-dev';
module.exports = log4js.getLogger(name);
```

**输出文件**: `{configDir}/logs/file-dev.log`

**用途**: 记录文件处理相关的开发信息。

### deleteAccountLog.js - 账号删除日志

```javascript
const {log4js} = require('./index');
const name = 'delete-account';
module.exports = log4js.getLogger(name);
```

**输出文件**: `{configDir}/logs/delete-account.log`

**用途**: 记录账号注销流程。

### deleteAccountFeedbackLog.js - 删除反馈日志

**输出文件**: `{configDir}/logs/deleteAccountFeedback.log`

**用途**: 记录账号删除的用户反馈。

### callfeedbackLog.js - 通话反馈日志

```javascript
const {log4js} = require('./index');
const name = 'callfeedbackLog';
module.exports = log4js.getLogger(name);
```

**输出文件**: `{configDir}/logs/callfeedbackLog.log`

**用途**: 记录通话质量反馈。

### setEmojiLog.js - 表情设置日志

```javascript
const {log4js} = require('./index');
const name = 'setEmoji';
module.exports = log4js.getLogger(name);
```

**输出文件**: `{configDir}/logs/setEmoji.log`

**用途**: 记录表情包设置操作。

### avrRiskLog.js - AVR 风险日志

```javascript
const {log4js} = require('./index');
const name = 'avr-risk';
module.exports = log4js.getLogger(name);
```

**输出文件**: `{configDir}/logs/avr-risk.log`

**用途**: 记录音视频风险检测。

### memory-usage.js - 内存使用日志

```javascript
const {log4js} = require('./index');
const pkg = require('../../package.json');
const name = pkg.name + '-usage';
module.exports = log4js.getLogger(name);
```

**输出文件**: `{configDir}/logs/{pkg.name}-usage.log`

**用途**: 记录应用内存使用情况，用于性能监控。

---

## 日志选择指南

| 场景 | 推荐日志 |
|------|----------|
| 前端 UI 调试 | devLog |
| 主进程调试 | devBackLog |
| 消息收发问题 | messageLog, msgAllLog |
| 会议功能问题 | meetingLog, meetingAgentLog |
| 加密功能问题 | e2eeLog |
| 消息同步问题 | ackLog, offlineMsgLog |
| 文件预览问题 | fileViewerLog |
| 性能监控 | memory-usage |
| SDK 调用追踪 | sdkLog |
