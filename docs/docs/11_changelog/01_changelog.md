# 版本变更日志

ackLog
avrRiskLog
callfeedbackLog
callfeedbackLogMain
concat
cryptolog
cryptoLogUtil
deleteAccountFeedbackLog
deleteAccountLog
devBackLog
devFileLog
devLog
devMsgAllLog
e2eeLog
fileViewerLog
fileViewerMainLog
hmeetLog
index
infoLog
log.config
meetingAgentLog
meetingInviteLog
meetingLog
meetLog
memory-usage
messageLog
msgDevLog
msgTaskLog
offlineMsgLog
pictureViewerLog
renderSdkLog
screenshotLog
screenshotLogMain
sdkLog
sessionDevLog
setEmojiLog
storageDataLog0

我帮你把 `categoryNames` 和 `appenderNames` 按**名称字母排序**整理成一个合并表格，并且在一行里标明 CategoryName、AppenderName、主要用途。

---

| CategoryName            | AppenderName        | 主要用途（推测）                       |
| ----------------------- | ------------------- | -------------------------------------- |
| `ackLog`                | `ack`               | 消息确认（acknowledge）相关日志        |
| `apiLog`                | 同名                | API 请求与响应日志                     |
| `appLog`                | 同名                | 应用运行日志，记录核心应用事件         |
| `avr-risk`              | -                   | AVR 风险评估日志                       |
| `bridgeLog`             | 同名                | 主进程与渲染进程之间的 bridge 调用日志 |
| `callfeedbackLogMain`   | `callfeedbackLog`   | 主进程通话反馈日志                     |
| `cst-meeting-agent`     | `CST_Meeting/agent` | 会议代理模块日志                       |
| `cst-meeting-sdk`       | -                   | 自定义会议 SDK 日志                    |
| `delete-account`        | -                   | 删除账户操作日志                       |
| `deleteAccountFeedback` | -                   | 删除账户反馈日志                       |
| `e2eeLog`               | `e2ee`              | 端到端加密功能日志                     |
| `fileLog`               | `file-dev`          | 文件操作相关日志（开发用）             |
| `fileViewerMainLog`     | `fileViewer`        | 主进程文件查看器操作日志               |
| `h-sdk`                 | -                   | H 系列 SDK 日志（可能是 Huawei SDK）   |
| `info-dev`              | -                   | 开发模式下的应用信息日志               |
| `ipcMainLog`            | 同名                | 主进程 IPC 通信日志                    |
| `meetingLog`            | 同名                | 会议功能运行日志                       |
| `messageLog`            | 同名                | 消息发送、接收与处理日志               |
| `msgAllLog`             | -                   | 消息系统完整日志（开发调试）           |
| `msgTaskLog`            | `msgTask`           | 消息任务调度日志                       |
| `offlineMsgLog`         | `offlineMsg`        | 离线消息处理日志                       |
| `pictureViewer`         | -                   | 图片查看器操作日志                     |
| `renderLog`             | 同名                | 渲染进程运行日志                       |
| `screenshotLogMain`     | `screenshot`        | 主进程截图操作日志                     |
| `sdkLog`                | 同名                | SDK 调用与运行状态日志                 |
| `session-dev`           | -                   | 会话模块开发日志                       |
| `setEmoji`              | -                   | 表情设置操作日志                       |
| `storageDataLog`        | `storage-data`      | 数据存储与读取日志                     |
| `updaterLog`            | 同名                | 应用自动更新过程日志                   |
| `${pkg.name}-usage`     | -                   | 应用使用情况统计日志                   |

---

我可以在这个表格上**再加一列“所属模块（主进程/渲染进程/通用/安全）”**，这样你一眼就能知道日志在哪个地方记录的，要帮你加吗？这样查起来会更方便。
