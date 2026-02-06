# 群组事件

### 📌 事件类型列表

| Event name                | 说明                             |
| ------------------------- | -------------------------------- |
| `GroupCreate`             | 新建群                           |
| `GroupAdd`                | 群添加成员                       |
| `GroupKick`               | 群移除成员                       |
| `GroupLeave`              | 成员离开群                       |
| `GroupDismiss`            | 群解散（仅成员离开，群记录保留） |
| `GroupOwnerChange`        | 群 owner 变更                    |
| `GroupNameChange`         | 群名称变更                       |
| `GroupDescribeChange`     | 群详情变更                       |
| `GroupMemberDetailChange` | 群成员属性变更（如免打扰）       |
| `GroupUnLink`             | 用户离开企业后自动退出群         |

> ⚠️ 以下事件已废弃：
>
> - `GroupLimitChange`
> - `GroupOneCreate`
> - `GroupInnerReloadMember`

---

### 📦 通用事件数据结构

```json
{
  "c": "Event",
  "f": "<String: from-user>",
  "t": "<String: to-user>",
  "l": <Integer: TTL>,
  "expire": <Long: 过期时间戳>,
  "needAck": <Boolean>,
  "meTo": "<String: 多端目标标识>",
  "mcFrom": "<String: 多企业来源标识>",
  "mcTo": "<String: 多企业目标标识>",
  "m": {
    "etime": <Long: 事件时间戳>,
    "stime": <Long: 服务器时间戳>,
    "uuid": "<String: 唯一事件 ID>",
    "name": "<String: 事件名称>",
    "users": ["<String: 用户 ID 列表>"],
    "info": { <对象: 事件扩展数据> },
    "trigger": <Long: 触发者 ID>
  }
}
```

---

### 🎯 事件详情

#### `GroupCreate` 新建群

```json
"name": "GroupCreate",
"users": ["user1", "user2"],
"info": {
  "user1": {"name": "User One"},
  "user2": {"name": "User Two"},
  "e2e": false
}
```

#### `GroupAdd` 添加群成员

```json
"name": "GroupAdd",
"users": ["userX"]
```

#### `GroupKick` 移除群成员

```json
"name": "GroupKick",
"users": ["被移除用户 ID"]
```

#### `GroupLeave` 成员主动离群

```json
"name": "GroupLeave",
"users": ["离群用户 ID"]
```

#### `GroupDismiss` 群解散

```json
"name": "GroupDismiss",
"users": ["群主 ID"]
```

> ⚠️ 群记录不会删除，仅用户关系解除

#### `GroupOwnerChange` 群主变更

```json
"name": "GroupOwnerChange",
"users": ["新群主 ID"]
```

#### `GroupNameChange` 群名变更

```json
"name": "GroupNameChange",
"info": {"name": "新的群名称"}
```

#### `GroupDescribeChange` 群简介变更

```json
"name": "GroupDescribeChange",
"info": {"sig": "新的群签名/描述"}
```

#### `GroupMemberDetailChange` 成员属性变更

```json
"name": "GroupMemberDetailChange",
"users": ["目标成员 ID"],
"info": {
  "noDisturb": 0 // 0=关闭勿扰，1=开启勿扰
}
```

#### `GroupUnLink` 用户离开企业后退出群

```json
"name": "GroupUnLink",
"users": ["退出群的用户 ID"]
```

---

如需补充更多字段约束或增加字段说明表，请告知。
