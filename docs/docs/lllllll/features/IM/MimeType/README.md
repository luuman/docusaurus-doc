# push 消息体

定义并统一面向多空间，多端设备的 push 消息协议结构体。加密协议说明参考：Push 通道加密升级，

| 协议名称                                             | NODE_ENV | VUE_APP_MODE | 描述           |
| ---------------------------------------------------- | -------- | ------------ | -------------- |
| [HyperText](/note/newDate/ImDate?id=HyperText)       |          |              | 消息           |
| [Notification](/note/newDate/ImDate?id=Notification) |          |              | 通知           |
| [Event](/note/newDate/ImDate?id=Event)               |          |              | 群事件         |
| [PushReg](/note/newDate/ImDate?id=PushReg)           |          |              | 注册连接       |
| [PullDetail](/note/newDate/ImDate?id=PullDetail)     |          |              | 拉取历史消息   |
| [ForceClose](/note/newDate/ImDate?id=ForceClose)     |          |              | 强制关闭连接   |
| [StateReport](/note/newDate/ImDate?id=StateReport)   |          |              | 客户端上报信息 |

| name       | H   | N   | E   | PushReg | PullDetail | F   | S   | 描述         |
| ---------- | --- | --- | --- | ------- | ---------- | --- | --- | ------------ |
| c          |     |     |     |         |            |     |     | 消息类型     |
| f          |     |     |     |         |            | :x: |     | 发送方 id    |
| t          |     |     |     | :x:     | :x:        |     |     | 接收方 id    |
| s          |     | :x: | :x: | :x:     | :x:        | :x: |     | 用户 uuid    |
| a          |     | :x: | :x: | :x:     | :x:        | :x: | :x: | 通话类型     |
| l          |     |     |     | :x:     |            | :x: |     | 生存时间整数 |
| expire     |     |     |     | :x:     |            | :x: |     | 生存时间值   |
| needAck    |     |     |     | :x:     | :x:        | :x: |     | ack          |
| dio        |     | :x: |     | :x:     | :x:        | :x: |     | 消息是否丢弃 |
| noDisturb  |     | :x: |     | :x:     | :x:        | :x: |     | 第三方推送   |
| binaryPart |     | :x: |     | :x:     | :x:        | :x: |     | 二进制流     |
| meFrom     |     | :x: |     |         |            |     | :x: | 端+发送方    |
| meTo       |     |     |     | :x:     | :x:        |     |     | 空间+接收方  |
| mcFrom     |     |     |     | :x:     |            |     | :x: | 端+发送方    |
| mcTo       |     |     |     | :x:     | :x:        | :x: |     | 空间+接收方  |
| m          | :x: |     |     |         |            |     |     | 内容         |

## 各类型消息结构说明


| 类型         | 名称 | 文本 | 卡片 | 会议 | 图片 | 文件 | Pin | 语音 | 呼叫 | 撤回 | 表情 | 回执 | 描述                 |
| ------------ | ---- | ---- | ---- | ---- | ---- | ---- | --- | ---- | ---- | ---- | ---- | ---- | -------------------- |
| a            | `N`  |      |      |      |      |      |     |      |      |      |      |      | [注释][a]            |
| binaryPart   | `S`  | :x:  | :x:  | :x:  |      | :x:  | :x: |      | :x:  | :x:  | :x:  | :x:  | [注释][binarypart]   |
| c            | `S`  |      |      |      |      |      |     |      |      |      |      |      | [注释][c]            |
| expire       | `N`  |      |      |      |      |      |     |      |      |      |      |      | [注释][expire]       |
| f            | `S`  |      |      |      |      |      |     |      |      |      |      |      | [注释][f]            |
| knownIfToOff | `B`  |      |      | :x:  |      |      |     |      |      | :x:  |      | :x:  | [注释][knowniftooff] |
| isSyncFrom   | `B`  | :x:  | :x:  |      | :x:  | :x:  | :x: | :x:  | :x:  | :x:  | :x:  | :x:  | [注释][issyncfrom]   |
| l            | `N`  |      |      |      |      |      |     |      |      |      |      |      | [注释][l]            |
| m            | `O`  |      |      |      |      |      |     |      |      |      |      |      | [注释][m]            |
| MIMETYPE     | `S`  |      |      |      |      |      |     |      |      |      |      |      | [注释][mimetype]     |
| body         | `S`  |      | :x:  | :x:  | :x:  | :x:  | :x: | :x:  | :x:  |      | :x:  | :x:  | [注释][body]         |
| ctime        | `N`  |      |      |      |      |      |     |      |      |      |      |      | [注释][ctime]        |
| deviceId     | `N`  | :x:  | :x:  |      | :x:  | :x:  | :x: |      |      | :x:  | :x:  | :x:  | [注释][deviceid]     |
| flags        | `N`  |      |      |      |      |      | :x: |      |      |      |      |      | [注释][flags]        |
| isE2EE       | `B`  | :x:  | :x:  |      | :x:  | :x:  | :x: | :x:  | :x:  | :x:  | :x:  | :x:  | [注释][ise2ee]       |
| meta         | `O`  | :x:  |      | `S`  |      |      |     |      |      |      | :x:  |      | [注释][meta]         |
| contactUid   | `S`  | :x:  |      | :x:  | :x:  | :x:  | :x: | :x:  | :x:  | :x:  | :x:  | :x:  | [注释][contactuid]   |
| codec        | `S`  | :x:  | :x:  | :x:  | :x:  | :x:  | :x: |      | :x:  | :x:  | :x:  | :x:  | [注释][codec]        |
| duration     | `N`  | :x:  | :x:  | :x:  | :x:  | :x:  | :x: |      | :x:  | :x:  | :x:  | :x:  | [注释][duration]     |
| maxframe     | `N`  | :x:  | :x:  | :x:  | :x:  | :x:  | :x: |      | :x:  | :x:  | :x:  | :x:  | [注释][maxframe]     |
| nickName     | `S`  | :x:  |      | :x:  | :x:  | :x:  | :x: | :x:  | :x:  | :x:  | :x:  | :x:  | [注释][nickname]     |
| download     | `O`  | :x:  | :x:  | :x:  |      |      | :x: | :x:  | :x:  | :x:  | :x:  | :x:  | [注释][download]     |
| -fid         | `S`  | :x:  | :x:  | :x:  |      |      | :x: | :x:  | :x:  | :x:  | :x:  | :x:  | [注释][fid]          |
| -sha256      | `S`  | :x:  | :x:  | :x:  |      | :x:  | :x: | :x:  | :x:  | :x:  | :x:  | :x:  | [注释][sha256]       |
| -size        | `N`  | :x:  | :x:  | :x:  |      |      | :x: | :x:  | :x:  | :x:  | :x:  | :x:  | [注释][size]         |
| -url         | `S`  | :x:  | :x:  | :x:  |      | :x:  | :x: | :x:  | :x:  | :x:  | :x:  | :x:  | [注释][url]          |
| filename     | `S`  | :x:  | :x:  | :x:  |      | :x:  | :x: | :x:  | :x:  | :x:  | :x:  | :x:  | [注释][url]          |

### Notification

| Notification type                                                            | 说明                 |                                                                                                   |
| ---------------------------------------------------------------------------- | -------------------- | ------------------------------------------------------------------------------------------------- |
| [Contact_Request](/note/newDate/ImDate?id=Contact_Request)                   | 好友请求             |                                                                                                   |
| [Contact_New](/note/newDate/ImDate?id=Contact_New)                           | 新增好友             |                                                                                                   |
| [Contact_New_E2EE_FRIEND](/note/newDate/ImDate?id=Contact_New_E2EE_FRIEND)   | 新增 e2e 好友        |                                                                                                   |
| [Contact_Del](/note/newDate/ImDate?id=Contact_Del)                           | 删除好友             |                                                                                                   |
| [Contact_Black](/note/newDate/ImDate?id=Contact_Black)                       | black 好友           |                                                                                                   |
| [Contact_Unblack](/note/newDate/ImDate?id=Contact_Unblack)                   | unblack 好友         |                                                                                                   |
| [Contact_Meeting_Invite](/note/newDate/ImDate?id=Contact_Meeting_Invite)     | 会议邀请好友         |                                                                                                   |
| [ProfileChanged](/note/newDate/ImDate?id=ProfileChanged)                     | profile 变更         |                                                                                                   |
| [ProfileNameChanged](/note/newDate/ImDate?id=ProfileNameChanged)             | profile 名称变更     |                                                                                                   |
| [ProfileSignChanged](/note/newDate/ImDate?id=ProfileSignChanged)             | profile 签名变更     |                                                                                                   |
| [ProfilePortraitChanged](/note/newDate/ImDate?id=ProfilePortraitChanged)     | profile 图像变更     |                                                                                                   |
| [StatusChanged](/note/newDate/ImDate?id=StatusChanged)                       | 用户状态变更         |                                                                                                   |
| [ReqListChanged](/note/newDate/ImDate?id=ReqListChanged)                     | 好友请求列表变更     |                                                                                                   |
| [MuteChanged](/note/newDate/ImDate?id=MuteChanged)                           | mute 变更            |                                                                                                   |
| [SilenceChanged](/note/newDate/ImDate?id=SilenceChanged)                     | 静音变更             |                                                                                                   |
| [TopChanged](/note/newDate/ImDate?id=TopChanged)                             | 置顶变更             |                                                                                                   |
| ~ReadChanged~                                                                | 已读变更             |                                                                                                   |
| [HistoryMsg_Removed](/note/newDate/ImDate?id=HistoryMsg_Removed)             | 会话消息同步         |                                                                                                   |
| [Contact_Enterprise_Add](/note/newDate/ImDate?id=Contact_Enterprise_Add)     | 企业添加成员         |                                                                                                   |
| [Contact_Enterprise_Kick](/note/newDate/ImDate?id=Contact_Enterprise_Kick)   | 企业移除成员         |
| [PlatformNotice](/note/newDate/ImDate?id=PlatformNotice)                     | 平台消息通知         |                                                                                                   |
| [ReadChanged](/note/newDate/ImDate?id=ReadChanged)                           | 会话已读             |                                                                                                   |
| [Meeting_List_Changed](/note/newDate/ImDate?id=Meeting_List_Changed)         | 会议列表信息变更     |                                                                                                   |
| [Account_Del](/note/newDate/ImDate?id=Account_Del)                           | 删除账号             | 同删除好友 Contact_Del 结构一致 type 不同                                                         |
| Enterprise_Member_Changed                                                    | 企业会员变更         | 修改前[Contact_New_E2EE_FRIEND](/note/newDate/ImDate?id=Contact_New_E2EE_FRIEND1)                 |
|                                                                              |                      | 修改后会员新增变动详情[Contact_New_E2EE_FRIEND](/note/newDate/ImDate?id=Contact_New_E2EE_FRIEND2) |
| [Idc_Offline_Notification](/note/newDate/ImDate?id=Idc_Offline_Notification) | 跨机房离线推送通知   |                                                                                                   |
| [Offline_Msg_End](/note/newDate/ImDate?id=Offline_Msg_End)                   | 离线消息最后一条标识 |                                                                                                   |
| [E2EE_Metting](/note/newDate/ImDate?id=E2EE_Metting)                         | E2EE 会议相关通知    |                                                                                                   |

### Event

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

## 相关文档

[Push 消息协议](https://wiki.corp.matrx.team/pages/viewpage.action?pageId=20647142)
[Push 通道加密升级](https://wiki.corp.matrx.team/pages/viewpage.action?pageId=3966163)
[win 端 push 协议升级](https://wiki.corp.matrx.team/pages/viewpage.action?pageId=20647446)

[[HyperText]]

[[Event]]

[[Other]]



[a]: /note/newDate/variableName?id=a "通话类型1. 普通通话，2. 多媒体通话（预留）3. 地图通话，4. 涂鸦通话，5. 消息 6. 联系人 7.视频通话"
[binarypart]: /note/newDate/variableName?id=binaryPart "数据流"
[c]: /note/newDate/variableName?id=c "消息类型 HyperText、Notification、Event、PushReg、PullDetail、ForceClose、StateReport"
[expire]: /note/newDate/variableName?id=expire "生存时间值"
[f]: /note/newDate/variableName?id=f "发送方Id"
[knowniftooff]: /note/newDate/variableName?id=knownIfToOff "123"
[issyncfrom]: /note/newDate/variableName?id=isSyncFrom "123"
[l]: /note/newDate/variableName?id=l "生存时间整数"
[m]: /note/newDate/variableName?id=m "消息体主体"
[mimetype]: /note/newDate/variableName?id=MIMETYPE "协议类别"
[body]: /note/newDate/variableName?id=body "文本主体 vcard文本/文件内容。UTF8编码"
[ctime]: /note/newDate/variableName?id=ctime "端时间戳"
[deviceid]: /note/newDate/variableName?id=deviceId "设备ID 2 win 0 ios"
[flags]: /note/newDate/variableName?id=flags "端设备类型 22 win 11 ios"
[ise2ee]: /note/newDate/variableName?id=isE2EE "是否E2E"
[meta]: /note/newDate/variableName?id=meta "媒体信息"
[contactuid]: /note/newDate/variableName?id=contactUid "联系人卡片用户ID"
[codec]: /note/newDate/variableName?id=codec "语言编码"
[duration]: /note/newDate/variableName?id=duration "语音时长"
[maxframe]: /note/newDate/variableName?id=maxframe "语音最大值"
[nickname]: /note/newDate/variableName?id=nickName "联系人卡片用户名"
[download]: /note/newDate/variableName?id=download "文件信息详情"
[fid]: /note/newDate/variableName?id=fid "<url失效后向PFM取下载地址时带的参数>"
[sha256]: /note/newDate/variableName?id=sha256 "MD5"
[size]: /note/newDate/variableName?id=size "文件大小"
[url]: /note/newDate/variableName?id=url "缓存链接"
[filename]: /note/newDate/variableName?id=filename "文件名称"
[h]: /note/newDate/variableName?id=h "图片高度"
[hmackey]: /note/newDate/variableName?id=hmacKey "HMAC-SHA256 的Key"
[ikey]: /note/newDate/variableName?id=iKey "文件加密的Key"
[pinnedinfo]: /note/newDate/variableName?id=pinnedInfo "Pin 信息详情"
[operation]: /note/newDate/variableName?id=operation "123"
[pname]: /note/newDate/variableName?id=pname "发送Pin用户名"
[ptime]: /note/newDate/variableName?id=ptime "发送Pin服务端时间戳"
[stime]: /note/newDate/variableName?id=stime "发送Pin端时间戳"
[uuid]: /note/newDate/variableName?id=uuid "标记Pin消息ID"
[isorigin]: /note/newDate/variableName?id=isOrigin "<0/1>"
[originsha256]: /note/newDate/variableName?id=originSha256 "123"
[origuuid]: /note/newDate/variableName?id=origUUID "已读回执-消息ID"
[origmimetype]: /note/newDate/variableName?id=origMimeType "已读消息类型"
[receiptinfo]: /note/newDate/variableName?id=receiptInfo "已读回执信息块"
[rstime]: /note/newDate/variableName?id=rstime "已读时间戳"
[ruuid]: /note/newDate/variableName?id=ruuid "已读的消息ID"
[type]: /note/newDate/variableName?id=type "123"
[w]: /note/newDate/variableName?id=w "图片宽度"
[stickerrepliedinfo]: /note/newDate/variableName?id=stickerRepliedInfo "<类型>/[<系列ID>/<系列内排序位置>/]<唯一ID>, 必须，否则丢弃消息"
[operation]: /note/newDate/variableName?id=operation "123"
[rname]: /note/newDate/variableName?id=rname "发送表情用户名"
[rtime]: /note/newDate/variableName?id=rtime "发送表情时间戳"
[sticker]: /note/newDate/variableName?id=sticker "表情内容"
[uuid]: /note/newDate/variableName?id=uuid "发送表情-消息ID"
[nf]: /note/newDate/variableName?id=nf "若是收费图片，此处为1，表示不可转发"
[receipt]: /note/newDate/variableName?id=receipt "是否已读 禁用"
[si]: /note/newDate/variableName?id=si "123"
[stime]: /note/newDate/variableName?id=stime "服务端时间戳"
[uuid]: /note/newDate/variableName?id=uuid "消息ID"
[mcfrom]: /note/newDate/variableName?id=mcFrom "空间ID#发送方"
[mcto]: /note/newDate/variableName?id=mcTo "空间ID#接收方"
[mefrom]: /note/newDate/variableName?id=meFrom "发送方#端"
[meto]: /note/newDate/variableName?id=meTo "接收方#端"
[needack]: /note/newDate/variableName?id=needAck "ack"
[nodisturb]: /note/newDate/variableName?id=noDisturb "第三方推送"
[s]: /note/newDate/variableName?id=s "用户id"
[t]: /note/newDate/variableName?id=t "接收方id"
