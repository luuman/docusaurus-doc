# 调试与监控

| 类型     | 类别                  | 文件                  | 用途           |
| -------- | --------------------- | --------------------- | -------------- |
| 消息     | ackLog                | ack                   | 消息确认       |
|          | msgAllLog             | msgAllLog             | 全量消息       |
|          | messageLog            | messageLog            | 消息发送       |
|          | msgTaskLog            | msgTask               | 消息任务调度   |
|          | offlineMsgLog         | offlineMsg            | 离线消息       |
|          | e2eeLog               | e2ee                  | 端到端加密     |
|          | fileLog               | file-dev              | 文件操作       |
| 渲染进程 | renderLog             | renderLog             | 渲染进程       |
|          | setEmoji              | setEmoji              | 表情设置       |
|          | session-dev           | session-dev           | 会话模块       |
| 账户     | delete-account        | delete-account        | 删除账户操作   |
|          | deleteAccountFeedback | deleteAccountFeedback | 删除账户反馈   |
| 主进程   | ipcMainLog            | ipcMainLog            | IPC 通信       |
|          | updaterLog            | updaterLog            | 自动更新过程   |
|          | storageDataLog        | storage-data          | 数据存储与读取 |
|          | appLog                | appLog                | 应用运行       |
|          | info-dev              | info-dev              | 开发模式       |
| 会议     | cst-meeting-sdk       | cst-meeting-sdk       | 会议 SDK       |
|          | cst-meeting-agent     | cst-meeting-agent     | 会议代理       |
|          | callfeedbackLogMain   | callfeedbackLog       | 通话反馈       |
|          | meetingLog            | meetingLog            | 会议功能       |
|          | sdkLog                | sdkLog                | SDK 调用       |
|          | h-sdk                 | h-sdk                 | 华为 SDK       |
| 通用     | apiLog                | apiLog                | API            |
|          | bridgeLog             | bridgeLog             | bridge         |
|          | pictureViewer         | pictureViewer         | 图片查看器     |
|          | screenshotLogMain     | screenshot            | 截图           |
|          | fileViewerMainLog     | fileViewer            | 文件查看器     |
| 安全     | avr-risk              | avr-risk              | AVR 风险评估   |
|          | `${pkg.name}-usage`   | `${pkg.name}-usage`   | 应用           |

| 数据流层次 | 模块类别 | 日志名称              | 对应文件              | 主要功能        |
| ---------- | -------- | --------------------- | --------------------- | --------------- |
| 数据输入层 | 消息接收 | ackLog                | ack                   | 消息确认        |
|            |          | offlineMsgLog         | offlineMsg            | 离线消息        |
|            |          | messageLog            | messageLog            | 消息输入        |
|            | 会议输入 | cst-meeting-sdk       | cst-meeting-sdk       | 会议 SDK        |
|            |          | h-sdk                 | h-sdk                 | 华为 SDK        |
|            | 文件输入 | fileLog               | file-dev              | 文件数据输入    |
|            |          | pictureViewer         | pictureViewer         | 图片数据输入    |
| 数据层     | 消息     | msgTaskLog            | msgTask               | 消息任务调度    |
|            |          | msgAllLog             | msgAllLog             | 全量消息        |
|            | 会议处理 | meetingLog            | meetingLog            | 会议数据        |
|            |          | cst-meeting-agent     | cst-meeting-agent     | 会议代理        |
| 数据存储   |          | storageDataLog        | storage-data          | 数据存储        |
|            |          | session-dev           | session-dev           | 会话数据        |
| 业务逻辑   |          | apiLog                | apiLog                | API 业务逻辑    |
|            |          | bridgeLog             | bridgeLog             | 主渲染桥接      |
| 数据输出层 | 消息输出 | messageLog            | messageLog            | 消息发送输出    |
|            | 会议输出 | callfeedbackLogMain   | callfeedbackLog       | 通话反馈输出    |
|            |          | deleteAccountFeedback | deleteAccountFeedback | 账户操作反馈    |
|            | 文件输出 | fileViewerMainLog     | fileViewer            | 文件查看输出    |
|            |          | screenshotLogMain     | screenshot            | 截图输出        |
| 系统管理层 | 进程管理 | ipcMainLog            | ipcMainLog            | 主进程 IPC 通信 |
|            |          | renderLog             | renderLog             | 渲染进程管理    |
|            |          | updaterLog            | updaterLog            | 系统更新管理    |
| 应用管理   |          | appLog                | appLog                | 应用运行管理    |
|            |          | info-dev              | info-dev              | 应用信息管理    |
|            |          | `${pkg.name}`         | `${pkg.name}`         | 使用统计管理    |
| 账户       |          | delete-account        | delete-account        | 账户操作管理    |
|            |          | setEmoji              | setEmoji              | 表情操作管理    |
| 安全层     | 安全监控 | avr-risk              | avr-risk              | AVR 风险监控    |
|            | 加密安全 | e2eeLog               | e2ee                  | 端到端加密安全  |
|            | SDK 安全 | sdkLog                | sdkLog                | SDK 调用安全    |
