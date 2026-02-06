日志系统

# 日志规范

## 日志等级

| 级别  | 权重   | 说明         |
| ----- | ------ | ------------ |
| ALL   | 最小值 | 记录所有日志 |
| TRACE | 5000   | 追踪信息     |
| DEBUG | 10000  | 调试信息     |
| INFO  | 20000  | 普通信息     |
| WARN  | 30000  | 警告信息     |
| ERROR | 40000  | 错误信息     |
| FATAL | 50000  | 严重错误     |
| MARK  | 特殊值 | 特殊标记     |
| OFF   | 最大值 | 关闭日志     |
| LOG   | 最小值 | 普通日志     |

## 日志分类

日志根据用途和内容分类（如用户行为、用户信息、性能数据、异常数据等），并遵循以下格式记录：

```
2019-12-01 00:00:00.000|pid|log-level|[svc-name,trace-id,span-id,user-id,biz-id]|thread-name|package-name.class-name : log message

[2024-11-09 15:20:45.101] (LOG)=> getAutoServerConf confPath1: C:\Users\Luuman\AppData\Local\Temp\Matrxconfig.txt [main/store.js:246]

[日志时间戳]  (日志级别)=> 发生日志的函数或方法 [代码文件和行号]
```

### 日志类别示例

| 文件                    | 文件路径            | 说明                                                               |
| ----------------------- | ------------------- | ------------------------------------------------------------------ |
| `cst-meeting-agent`     | `CST_Meeting/agent` | 与 CST 会议代理相关的日志，通常与会议的代理服务或组件有关          |
| `avr-risk`              |                     | 可能与风险管理或自动化风险评估相关的日志                           |
| `callfeedbackLog`       |                     | 与电话或通话反馈相关的日志                                         |
| `cst-meeting-sdk`       |                     | 与 CST（会议相关）SDK 的日志，记录 SDK 操作                        |
| `delete-account`        |                     | 与删除账户操作本身相关的日志                                       |
| `deleteAccountFeedback` |                     | 与删除账户操作的反馈日志                                           |
| `file-dev`              |                     | 与文件开发相关的日志，可能用于文件处理或文件操作的开发阶段         |
| `fileViewer`            |                     | 与文件查看器相关的日志                                             |
| `h-sdk`                 |                     | 与某个 SDK 相关的日志，`h-sdk`可能是某个硬件或应用 SDK 的缩写      |
| `info-dev`              |                     | 与开发阶段的信息日志，通常用于记录开发过程中生成的信息             |
| `pkg.name + '-usage'`   |                     | 动态生成的日志名，表示与应用使用情况（性能、资源使用等）相关的日志 |
| `msgAllLog`             |                     | 记录所有消息的日志，可能是全局日志                                 |
| `pictureViewer`         |                     | 与图片查看器相关的日志                                             |
| `screenshot`            |                     | 与截图相关的日志，记录截图操作或截图的相关信息                     |
| `session-dev`           |                     | 与会话开发相关的日志，记录会话管理或处理相关的信息                 |
| `setEmoji`              |                     | 与设置表情符号的操作相关的日志                                     |
| `storage-data`          |                     | 与数据存储相关的日志，涉及数据库操作或文件存储等                   |

<!-- ### 日志类别示例

| 类别名称              | 位置                   | 描述             |
| --------------------- | ---------------------- | ---------------- |
| avr-risk              | logs                   | 风险相关日志     |
| live-dev              | logs                   | 直播日志         |
| cst-sdk               | logs                   | SDK 相关日志     |
| cst-meeting-sdk       | logs                   | 会议 SDK 日志    |
| cst-meeting-agent     | logs/CST_Meeting/agent | 会议代理日志     |
| callfeedbackLog       | logs                   | 通话反馈日志     |
| deleteAccountFeedback | logs                   | 删除账号反馈日志 |
| delete-account        | logs                   | 删除账号日志     |
| file-dev              | logs                   | 文件操作日志     |
| pictureViewer         | logs                   | 图片查看日志     |
| fileViewer            | logs                   | 文件查看日志     |
| screenshot            | logs                   | 截图日志         |
| info-dev              | logs                   | 接口调用日志     |
| msgAllLog             | logs                   | 消息相关日志     |
| session-dev           | logs                   | 会话日志         |
| msgback-dev           | logs                   | 消息回退日志     |
| lost-msg-dev          | logs                   | 消息丢失日志     |
| [pkg.name]-usage      | logs                   | 应用使用日志     |

### 级别分类

| 级别  | 权重             | 描述 |
| ----- | ---------------- | ---- |
| ALL   | Number.MIN_VALUE |      |
| TRACE | 5000             |      |
| DEBUG | 10000            |      |
| INFO  | 20000            |      |
| WARN  | 30000            |      |
| ERROR | 40000            |      |
| FATAL | 50000            |      |
| MARK  | 9007199254740992 |      |
| OFF   | Number.MAX_VALUE |      | -->

## 使用示例

```js
// infoLog.js
const { log4js } = require("./index");
const name = "info-dev";
module.exports = log4js.getLogger(name);
```

```js
// 使用infoLog
const infoLog = require("./logs/infoLog.js");
infoLog.info(val);
```
