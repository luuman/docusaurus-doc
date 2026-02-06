# 消息协议

本协议定义了 IM 系统中推送消息（Push）的统一结构，适配多空间、多端设备环境，支持端到端加密、多设备同步、ACK 机制、离线控制等功能。

| 大类     | 消息类型      | 描述                                                         |
| -------- | ------------- | ------------------------------------------------------------ |
| 消息类   | HyperText     | 普通文本、图片、语音、文件、表情等 IM 消息本体               |
| 通知类   | Notification  | 好友通知、企业成员变化、会议列表变化、平台公告等             |
| 事件类   | Event         | 群组操作类事件：建群、加人、踢人、退群、群解散、群配置变更等 |
| 连接类   | PushReg       | 客户端上线注册（包含身份、设备、版本等）                     |
| 同步类   | PullDetail    | 消息同步（拉取历史消息）                                     |
| 控制类   | ForceClose    | 被踢下线、账号强制退出、封禁等通知                           |
| 协议异常 | ProtocolError | 协议异常，输出 reason 日志                                   |
| E2EE     | E2EKeyChange  | E2EE 密钥更新                                                |
| 注册响应 | WPushRegRes   |                                                              |

> 每类 Push 消息都遵循以下基础结构：

```json
{
  "c": "<消息类型>",          // 如 HyperText、Notification、Event 等
  "f": "<发送方ID>",          // from
  "t": "<接收方ID>",          // to
  "s": "<源触发者ID>",        // source（群消息中可能不同于 f）
  "a": <App ID>,              // 模块，如 5 表示“消息”
  "l": <TTL秒数>,             // 生存时间
  "expire": <过期时间戳>,     // 系统根据 l 自动计算
  "needAck": <是否需要ACK>,   // true/false
  "dio": <离线是否丢弃>,      // drop if offline
  "noDisturb": <免打扰>,      // true = 不用第三方推送
  "binaryPart": "<Base64二进制内容>",

  "meFrom": "<多端来源ID>",   // 例: 86123#desktop
  "meTo": "<多端目标ID>",     // 例: 86123#mobile
  "mcFrom": "<多企业来源ID>", // 企业ID+用户ID
  "mcTo": "<多企业目标ID>",

  "m": { ... }                // 消息体（结构依赖 c 类型）
}
```

---

## HyperText - 文本类即时消息

用于普通聊天，支持 MIME 类型区分格式。

```json
"m": {
  "ctime": <创建时间>,
  "stime": <服务端时间>,
  "uuid": "<消息UUID>",
  "MIMETYPE": "text/plain",       // 见下表
  "body": "Hello!",
  "nf": 0,                         // 不可转发
  "si": 0,                         // 不展示 & 不保存
  "flags": 22,
  "deviceId": 22,
  "isE2EE": true,                 // 端到端加密
  "meta": { ... }                 // 自定义扩展
}
```

**常用 MIME 类型：**

| MIMETYPE                      | 含义     |
| ----------------------------- | -------- |
| `text/plain`                  | 文本消息 |
| `image/`                      | 图片消息 |
| `application/eliminate`       | 表情     |
| `application/withdraw`        | 消息撤回 |
| `application/receipt`         | 已读回执 |
| `application/sticker-replied` | 表情回复 |

---

## Notification - 通知类消息

用于联系人变化、配置变更、平台通知等。

```json
"m": {
  "ctime": <创建时间>,
  "stime": <服务器时间>,
  "uuid": "<通知UUID>",
  "type": "Contact_New",          // 见下方 type 表
  "body": { ... },                // 原始业务内容（旧）
  "meta": { ... }                 // 新字段建议放入此处
}
```

**常用 `type` 枚举：**

| 类型名                          | 含义             |
| ------------------------------- | ---------------- |
| Contact_Request                 | 好友请求         |
| Contact_New                     | 新增好友         |
| Contact_New_E2EE_FRIEND         | 新增 E2E 好友    |
| Contact_Del                     | 删除好友         |
| Contact_Black / Unblack         | 拉黑 / 取消拉黑  |
| Contact_Meeting_Invite          | 邀请开会         |
| ProfileChanged / NameChanged... | 个人信息变化     |
| MuteChanged / SilenceChanged    | 消音、静音变化   |
| Meeting_List_Changed            | 会议信息刷新     |
| PlatformNotice                  | 系统公告通知     |
| ReadChanged                     | 消息已读回执     |
| Account_Del                     | 注销账号         |
| Enterprise_Member_Changed       | 企业成员变化     |
| Idc_Offline_Notification        | IDC 跨机房推送   |
| Offline_Msg_End                 | 离线消息结束标识 |
| E2EE_Metting                    | E2EE 会议相关    |

---

## Event - 群事件信令

用于群组成员变化、群名、权限调整等事件。

```json
"m": {
  "etime": <事件时间>,
  "stime": <服务器时间>,
  "uuid": "<事件UUID>",
  "name": "<事件名称>",       // 如 GroupAdd
  "users": ["uid1", "uid2"],  // 受影响用户列表
  "trigger": "<触发者ID>",
  "info": { ... }             // 事件附带数据
}
```

**常用 `name` 枚举：**

| 事件名                  | 描述            |
| ----------------------- | --------------- |
| GroupCreate             | 群创建          |
| GroupAdd / GroupKick    | 群成员增减      |
| GroupLeave / Dismiss    | 成员离群 / 解散 |
| GroupOwnerChange        | 群主更换        |
| GroupNameChange         | 群名变更        |
| GroupDescribeChange     | 群描述变更      |
| GroupMemberDetailChange | 群成员信息调整  |
| GroupUnLink             | 离职自动退出群  |
| GroupConfigChange       | 群配置项调整    |

---

## PushReg - 连接注册

```json
"m": {
  "rid": "<连接id>",
  "ck": "<校验串>",
  "key": "<公钥加密密钥>",
  "pub": "<sha1(pubkey)>",
  "ts": <时间戳>,
  "ver": <客户端版本>,
  "loc": "<语言&地区>",
  "info": {
    "model": "...",
    "os": "android",
    "clientver": "...",
    "reason": "LastDisconnectReason"
  },
  "padding": "xxx"
}
```

---

## PullDetail - 拉取离线消息

```json
"m": {
  "count": 20,
  "direction": 0,
  "sTS": 1603719281752,
  "eTS": 0,
  "ignoreReciept": 0,
  "reqId": "",
  "tid": ""
}
```

---

## ForceClose - 强制关闭连接

```json
"m": {
  "type": "KICK_USER",   // RID_CHANGE / FORCE_LOGOUT / DELETE
  "rid": "...",
  "by": "Login",
  "model": "...",
  "ip": "...",
  "time": 1618039133833,
  "until": 0             // 若为封禁时间（Eject）
}
```

---

## 建议补充文档内容

如需更系统地支持开发/测试/调试，建议补充以下内容：

- **字段说明矩阵**（每类消息有哪些字段必须、有何约定）
- **消息处理流程图**（服务端生成 → 网关转发 → 客户端处理）
- **版本兼容性提示**
- **错误码或 ACK 机制说明**
- **E2EE 加密流程参考**

---

如你有需要，我可以继续帮你：

- 提取字段说明生成表格；
- 编写 markdown 文档或 Swagger；
- 补充协议升级版本说明；
- 按服务端/客户端角度拆分职责文档。

是否要我帮你生成最终 Markdown 文档或结构化文档？
