## Event

| Event name                                                                 | 说明                                                        |
| -------------------------------------------------------------------------- | ----------------------------------------------------------- |
| [GroupCreate](/note/newDate/ImDate?id=GroupCreate)                         | 新建群                                                      |
| [GroupAdd](/note/newDate/ImDate?id=GroupAdd)                               | 群添加成员                                                  |
| [GroupKick](/note/newDate/ImDate?id=GroupKick)                             | 群移除成员                                                  |
| [GroupLeave](/note/newDate/ImDate?id=GroupLeave)                           | 成员离开群                                                  |
| [GroupDismiss](/note/newDate/ImDate?id=GroupDismiss)                       | 群解散（一人一群离开群, 群 UserFriend 不会删除 Group 记录） |
| [GroupOwnerChange](/note/newDate/ImDate?id=GroupOwnerChange)               | 群 owner 变更                                               |
| [GroupNameChange](/note/newDate/ImDate?id=GroupNameChange)                 | 群 name 变更                                                |
| [GroupDescribeChange](/note/newDate/ImDate?id=GroupDescribeChange)         | 群详情变更                                                  |
| [GroupMemberDetailChange](/note/newDate/ImDate?id=GroupMemberDetailChange) | 群成员变更                                                  |
| [GroupUnLink](/note/newDate/ImDate?id=GroupUnLink)                         | 离开企业离开群                                              |
| ~GroupLimitChange~                                                         | 群上限变更 废弃                                             |
| ~GroupOneCreate~                                                           | 一对一建群 废弃                                             |
| ~GroupInnerReloadMember~                                                   | 废弃                                                        |

```json
// 群事件
{
  "c": "Event",
  "f": <String value of from-user>, // +86001
  "t": <String value of to-user>, // +8668096709735160
  "l": <Integer value of ttl>, // 999999
  "expire": <Long value of calculated by ttl>, // 1603116332409
  "needAck": <Boolean value of ack>, // true
  "meTo": <String value of multi-endpoint-to-user>, // 8668096709735160#desktop
  "mcFrom": <String value of multi-corporation-from-user>, // 86-CN-0000001#86001
  "mcTo": <String value of multi-corporation-to-user>, // 86-CN-0000001#8668096709735160
  "m": {
    "etime": <Long value of event-time>, // 1603116332409
    "stime": <Long value of server-time>, // 1603116332409
    "uuid": <String value of uuid>, // 585CE8FF-F2FC-4726-ACD3-D9B8D8D04501
    "name": <String value of action name>, // GroupCreate
    "users": [<hid list>],
    //根据指令不同，可以不出现
    "info": {实际内容json， 可以反序列化到对应对象, 由业务方定义},
    //根据指令不同，内容不同
    "trigger": <same as s (if s ne f )，otherwise is same as f>
  }
}
```

#### **GroupCreate**

```json
{
  "a": 5,
  "c": "Event",
  "f": "+8029711735418657100",
  "l": 5184000,
  "m": {
    "etime": 1635513744298,
    "name": "GroupCreate",
    "stime": 1635513744362,
    "trigger": 971225653297998441,
    "uuid": "b3db9932-6041-4789-9cbd-d48f6022b7a5|GDXpwt_0R8gk",
    "users": ["DXp8lf2S6mk", "DXpwt_0R8gk"],
    "info": {
      "DXpwt_0R8gk": {
        "name": "Jianhua Meng 主账号"
      },
      "e2e": false,
      "DXp8lf2S6mk": {
        "name": "zhixiong li1"
      }
    }
  },
  "mcFrom": "UAE-971-0000001#8029711735418657100",
  "mcTo": "UAE-971-0000001#971212605178901001",
  "meTo": "971212605178901001#desktop",
  "needAck": true,
  "s": "+971225653297998441",
  "t": "+971212605178901001"
}
```

#### **GroupAdd**

```json
// 群添加成员
{
  "c": "Event",
  "f": "+8029711735418657100",
  "t": "+971212605178901001",
  "meTo": "971212605178901001#mobile",
  "mcFrom": "UAE-971-0000001#8029711735418657100",
  "mcTo": "UAE-971-0000001#971212605178901001",
  "l": 5184000,
  "knownIfToOff": false,
  "expire": 1640697744431,
  "needAck": true,
  "s": "+8029711735418657100",
  "m": {
    "uuid": "963a5723-fc74-4646-b34d-55439651d990|GDXpwt_0R8gk",
    "name": "GroupAdd",
    "users": ["DXpwt_0R8gk"],
    "etime": 1635513744412,
    "trigger": 971225653297998441,
    "stime": 1635513744412
  }
}
```

#### **GroupKick**

```json
// 群移除成员
{
  "a": 5,
  "c": "Event",
  "expire": 1640697753019,
  "f": "+8029711735418657100",
  "knownIfToOff": false,
  "l": 5184000,
  "m": {
    "etime": 1635513753018,
    "name": "GroupKick",
    "stime": 1635513753018,
    "trigger": 971225653297998441,
    "uuid": "23045eea-f330-4f9b-96c6-b9b9bfd0f6c6|GDXp8lf2S6mk",
    "users": ["DXpwt_0R8gk"]
  },
  "mcFrom": "UAE-971-0000001#8029711735418657100",
  "mcTo": "UAE-971-0000001#971225653297998441",
  "meTo": "971225653297998441#desktop",
  "needAck": true,
  "s": "+8029711735418657100",
  "t": "+971225653297998441"
}
```

#### **GroupLeave**

```json
// 成员离开群
{
  "c": "Event",
  "f": "+8029713621872669100",
  "t": "+971222891625947791",
  "meTo": "971222891625947791#desktop",
  "mcFrom": "UAE-971-0000001#8029713621872669100",
  "mcTo": "UAE-971-0000001#971222891625947791",
  "l": 4999073,
  "a": 5,
  "expire": 1640659559046,
  "needAck": true,
  "s": "+8029713621872669100",
  "m": {
    "uuid": "62fda37d-bb9e-48e2-8b50-3ee248b4e5a2|GDXp6Ev0Xoo8",
    "name": "GroupLeave",
    "users": ["DXo8lP_pRHk"],
    "etime": 1635475398472,
    "trigger": 971155280298067065,
    "stime": 1635475398472
  }
}
```

#### **GroupDismiss**

```json
// 群解散（一人一群离开群, 群UserFriend不会删除Group记录）
{
  "c": "Event",
  "f": "+802971100074100",
  "t": "+802971100074100",
  "mcFrom": "UAE-971-1000000#802971100074100",
  "l": 5184000,
  "needAck": true,
  "m": {
    "uuid": "0048bfd1-b91a-4145-a6ee-28bbd080acb1",
    "name": "GroupDismiss",
    "users": ["DXpXE_z8f0c"],
    "etime": 1635665407500,
    "trigger": 971184413012164423,
    "stime": 1635665407500
  }
}
```

#### **GroupOwnerChange**

```json
// 群owner变更
{
  "c": "Event",
  "f": "+8029714187927662100",
  "t": "+8029714187927662100",
  "mcFrom": "UAE-971-1000000#8029714187927662100",
  "l": 5184000,
  "needAck": true,
  "m": {
    "uuid": "48efe1eb-5008-4ba5-8f07-c5b1b2565dc1",
    "name": "GroupOwnerChange",
    "users": ["C9NzHmSqsvA"],
    "etime": 1635665192048,
    "trigger": 971184413012164423,
    "stime": 1635665192048
  }
}
```

#### **GroupNameChange**

```json
// 群name变更
{
  "c": "Event",
  "f": "+8029714187927662100",
  "t": "+8029714187927662100",
  "mcFrom": "UAE-971-1000000#8029714187927662100",
  "l": 5184000,
  "needAck": true,
  "m": {
    "uuid": "2e7c8d35-70e8-4c53-b77a-4331a393092e",
    "name": "GroupNameChange",
    "etime": 1635665021017,
    "trigger": 971184413012164423,
    "info": {
      "name": "77778"
    },
    "stime": 1635665021017
  }
}
```

#### **GroupDescribeChange**

```json
// 群详情变更
{
  "c": "Event",
  "f": "+8029714187927662100",
  "t": "+8029714187927662100",
  "mcFrom": "UAE-971-1000000#8029714187927662100",
  "l": 5184000,
  "needAck": true,
  "m": {
    "uuid": "7b57f6a7-09bf-4fc7-9594-df8b50a41f05",
    "name": "GroupDescribeChange",
    "etime": 1635665021017,
    "trigger": 971184413012164423,
    "info": {
      "sig": null
    },
    "stime": 1635665021017
  }
}
```

#### **GroupMemberDetailChange**

```json
// 群成员变更
{
  "c": "Event",
  "f": "+80286982320173100",
  "t": "+80286982320173100",
  "mcFrom": "UAE-971-0000001#80286982320173100",
  "l": 5184000,
  "needAck": true,
  "m": {
    "uuid": "620dc9cd-4484-47fe-864c-f933b3d3dca6",
    "name": "GroupMemberDetailChange",
    "users": ["AVlBaYCR7AM"],
    "etime": 1635661919292,
    "trigger": 97180788349594627,
    "info": {
      "noDisturb": 0
    },
    "stime": 1635661919292
  }
}
```

#### **GroupUnLink**

```json
// 离开企业离开群
{
  "c": "Event",
  "f": "+8029713621872669100",
  "t": "+86185482470085021",
  "meTo": "86185482470085021#mobile",
  "mcFrom": "UAE-971-0000001#8029713621872669100",
  "mcTo": "UAE-971-0000001#86185482470085021",
  "l": 2307456,
  "expire": 1637828449697,
  "needAck": true,
  "s": "+8029713621872669100",
  "m": {
    "uuid": "c14dbba7-b942-4c6c-af1d-c01fe031bbf1|GATIxPVts0Z0",
    "name": "GroupUnLink",
    "users": ["ATJgYl5rdQA"],
    "etime": 1632644420395,
    "trigger": 86237318480622848,
    "stime": 1632644420395
  }
}
```

<!-- tabs:end -->
