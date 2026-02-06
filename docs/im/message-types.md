# 消息类型详解

## 概述

Matrx IM系统支持丰富的消息类型，从基础的文本消息到复杂的多媒体嵌入消息。所有消息都通过 `MIMETYPE` 字段进行类型标识，并在 `messageTemplate.js` 中定义标准模板。

## 消息基础结构

### 通用消息格式

```javascript
{
    c: 'HyperText',           // 消息分类 (Category)
    f: 'sender_hid',          // 发送者 (From)
    t: 'receiver_hid',        // 接收者 (To)
    s: 'group_hid',           // 群组标识 (Source，群消息时存在)
    a: 5,                     // 应用标识 (Application ID)
    mcFrom: 'spaceId#uid',    // 多空间发送方标识
    mcTo: 'spaceId#uid',      // 多空间接收方标识
    meFrom: 'uid#deviceType', // 设备标识
    m: {
        uuid: 'unique_id',    // 消息唯一标识
        ctime: 1234567890,    // 创建时间
        stime: 1234567891,    // 服务器时间
        MIMETYPE: 'text/plain', // 消息类型
        body: 'message content', // 消息内容
        flags: 22,            // 消息标志位
        nf: 0,                // 通知标志
        meta: {}              // 扩展元数据
    }
}
```

## 文本消息

### 普通文本消息

**MIMETYPE:** `text/plain`

```javascript
// messageTemplate.js
getMsgTemplate(sendTo, msgTxt = '', refList = [], isE2EE = false, deviceId, meTo) {
    this.HyperTextTemplate.m = {
        ctime: getTimestamp(),
        uuid: uuidv1(),
        MIMETYPE: 'text/plain',
        body: msgTxt,
        nf: 0,
        flags: 22,
        meta: {
            ref: refList  // @提及列表
        }
    };
    return this.HyperTextTemplate;
}
```

### 富文本消息

**MIMETYPE:** `richtext/plain`

富文本消息支持Markdown格式，包含格式化文本、链接等：

```javascript
{
    m: {
        MIMETYPE: 'richtext/plain',
        body: '**加粗文本** [链接](https://example.com)',
        meta: {
            format: 'markdown'
        }
    }
}
```

### 编辑消息

**MIMETYPE:** `edit/text/plain` | `edit/richtext/plain`

```javascript
{
    m: {
        MIMETYPE: 'edit/text/plain',
        body: '编辑后的内容',
        meta: {
            editInfo: {
                uuidEdited: 'original_uuid',  // 被编辑的原消息UUID
                editTime: 1234567890
            }
        }
    }
}
```

## 图片消息

### 支持的图片类型

| MIMETYPE | 说明 |
|----------|------|
| `image/jpeg` | JPEG格式图片 |
| `image/jpg` | JPG格式图片 |
| `image/png` | PNG格式图片 |
| `image/gif` | GIF动图 |
| `image/webp` | WebP格式图片 |
| `image/bmp` | BMP格式图片 |
| `application/sticker` | 贴纸表情 |

### 图片消息结构

```javascript
{
    m: {
        MIMETYPE: 'image/jpeg',
        uuid: 'img_uuid',
        meta: {
            w: 800,                    // 宽度
            h: 600,                    // 高度
            filename: 'photo.jpg',     // 文件名
            isOrigin: 0,               // 是否原图
            iKey: 'aes_key',           // 加密密钥
            hmacKey: 'hmac_key',       // HMAC密钥
            download: {
                fid: 'file_id',        // 文件ID
                size: 102400           // 文件大小
            }
        }
    },
    binaryPart: 'base64_thumbnail'     // 缩略图base64
}
```

## 文件消息

**MIMETYPE:** `x-filetransfer/octet-stream`

### 文件消息模板

```javascript
// messageTemplate.js
async getFileTemplate(sendTo, file, uuid = uuidv1(), mcToSpace = defaultSpaceId()) {
    await equalAndSetSecretKeyMap();
    this.HyperTextTemplate.m = {
        MIMETYPE: 'x-filetransfer/octet-stream',
        receipt: 255,
        ctime: getTimestamp(),
        uuid: uuid,
        nf: 0,
        meta: {
            _: 'messageMediaPending',
            isOrigin: 0,
            iKey: store.state.fileCollection.secretKeyMap.aesKey,
            hmacKey: store.state.fileCollection.secretKeyMap.hmacKey,
            download: {
                fid: 'WAIT_UPLOAD',
                size: file.size
            },
            filename: file.name,
            fileType: 'x-filetransfer/octet-stream',
            progress: {
                loaded: 0,
                total: file.size,
                type: 'upload',
                enabled: true,
                uploadOriginFilePath: file.path
            }
        }
    };
    return this.HyperTextTemplate;
}
```

## 视频消息

**MIMETYPE:** `application/video`

```javascript
{
    m: {
        MIMETYPE: 'application/video',
        meta: {
            duration: 120,             // 时长（秒）
            w: 1920,                   // 宽度
            h: 1080,                   // 高度
            filename: 'video.mp4',
            download: {
                fid: 'file_id',
                size: 10240000
            },
            coverFilePath: '/path/to/cover.jpg'  // 封面路径
        }
    },
    binaryPart: 'cover_base64'         // 封面缩略图
}
```

## 语音消息

**MIMETYPE:** `audio/voice-msg`

```javascript
{
    m: {
        MIMETYPE: 'audio/voice-msg',
        meta: {
            duration: 15,              // 时长（秒）
            download: {
                fid: 'file_id',
                size: 24000
            }
        }
    }
}
```

## 回复消息

### 引用回复

消息可以通过 `meta.repliedInfo` 引用其他消息：

```javascript
{
    m: {
        MIMETYPE: 'text/plain',
        body: '这是回复内容',
        meta: {
            repliedInfo: {
                senderUidReplied: 'sender_uid',  // 被回复消息的发送者
                uuidReplied: 'replied_uuid',     // 被回复消息的UUID
                previewReplied: '被回复的内容预览',
                mimeReplied: 'text/plain'        // 被回复消息的类型
            }
        }
    }
}
```

### 回复模板生成

```javascript
// messageTemplate.js
getPreviewRepliedTemplate(repliedInfo) {
    return {
        token: dataUtil.numberToHid(repliedInfo.senderUidReplied),
        isPreviewReplied: true,
        previewReplied: repliedInfo.previewReplied,
        plainMsg: {
            MIMETYPE: repliedInfo.mimeReplied
        }
    };
}
```

## 表情回复

**MIMETYPE:** `application/sticker-replied`

表情回复允许用户对消息添加表情反应：

```javascript
// messageTemplate.js
getEmojiReplyTemplate(sendTo, newData, isE2EE = false, uuid = uuidv1()) {
    const newItem = {
        t: sendTo,
        mcTo: `${defaultSpaceId()}#${hidToNumber(sendTo)}`,
        meFrom: `${hidToNumber(store.state.userInfo.hid)}#desktop`,
        noDisturb: true,
        m: {
            si: 1,
            flags: 22,
            ctime: getTimestamp(),
            uuid: uuid,
            MIMETYPE: 'application/sticker-replied',
            meta: {
                stickerRepliedInfo: {
                    sticker: '👍',           // 回复表情
                    uuid: 'target_uuid',     // 目标消息UUID
                    rtime: getTimestamp(),   // 回复时间
                    rname: 'user_name',      // 回复者昵称
                    operation: 1             // 1=添加, 0=取消
                }
            }
        }
    };
    return newItem;
}
```

### 表情回复数据结构

消息的 `meta.stickerRepliedList` 存储所有表情回复：

```javascript
stickerRepliedList: [
    {
        sticker: '👍',
        participant: {
            'UAE-971-0000001#86107369891064677': {
                rtime: 1611850461105,
                rname: 'User A'
            },
            'UAE-971-0000001#65135978691849975': {
                rtime: 1611851677268,
                rname: 'User B'
            }
        }
    }
]
```

## 机器人消息

### 普通机器人消息

**MIMETYPE:** `robot/text` | `robot/richtext`

```javascript
{
    m: {
        MIMETYPE: 'robot/text',
        body: '机器人回复内容',
        meta: {
            robotId: 'bot_id',
            robotName: 'Bot Name'
        }
    }
}
```

### 编辑机器人消息

**MIMETYPE:** `edit/robot/text` | `edit/robot/richtext`

```javascript
{
    m: {
        MIMETYPE: 'edit/robot/text',
        body: '更新后的机器人消息',
        meta: {
            editInfo: {
                uuidEdited: 'original_robot_msg_uuid'
            }
        }
    }
}
```

## 通知消息

### 系统通知类型

```javascript
c: 'Notification'
m.type: 'notification_type'
```

| type | 说明 |
|------|------|
| `Contact_Request` | 好友请求 |
| `Contact_New` | 新建好友关系 |
| `Contact_Del` | 删除好友 |
| `Contact_Reject` | 拒绝好友请求 |
| `Contact_Withdraw` | 撤回好友请求 |
| `Contact_Black` | 拉黑用户 |
| `Contact_Unblack` | 取消拉黑 |
| `TopChanged` | 会话置顶变更 |
| `MuteChanged` | 静音状态变更 |
| `ReadChanged` | 已读状态变更 |
| `ProfileChanged` | 个人资料变更 |
| `StatusChanged` | 在线状态变更 |

### 群组通知

```javascript
c: 'Event'
m.name: 'event_name'
```

| name | 说明 |
|------|------|
| `GroupCreate` | 创建群组 |
| `GroupAdd` | 添加群成员 |
| `GroupKick` | 踢出群成员 |
| `GroupLeave` | 退出群组 |
| `GroupDismiss` | 解散群组 |
| `GroupNameChange` | 群名称变更 |
| `GroupDescribeChange` | 群描述变更 |
| `GroupOwnerChange` | 群主变更 |
| `GroupUnLink` | 企业群解绑 |

## 销毁消息

**MIMETYPE:** `application/destroy`

阅后即焚消息，读取后自动销毁：

```javascript
// messageTemplate.js
getDestroyMsgTemplate(uuid, hid) {
    const newItem = {
        t: hid,
        mcTo: `${defaultSpaceId()}#${store.state.userInfo.uid}`,
        mcFrom: `${defaultSpaceId()}#${store.state.userInfo.uid}`,
        noDisturb: false,
        isSyncFrom: true,
        m: {
            si: 1,
            flags: 22,
            deviceId: 2,
            ctime: getTimestamp(),
            uuid: `destroy|${uuid}`,  // destroy|原消息UUID
            MIMETYPE: 'application/destroy'
        }
    };
    return newItem;
}
```

### 销毁时间变更通知

```javascript
getDestroyEventMsgTemplate(sendTo, meta, msg, type, stime, uuid) {
    return {
        a: 5,
        c: 'Notification',
        m: {
            type: 'Destroy_Interval_Changed',
            meta: meta,
            body: msg
        }
    };
}
```

## 多媒体嵌入消息

### 会议邀请

**MIMETYPE:** `meeting/invite`

```javascript
getInviteTemplate(sendTo, meetingInfo, spaceId = defaultSpaceId()) {
    this.HyperTextTemplate.m = {
        ctime: getTimestamp(),
        uuid: uuidv1(),
        MIMETYPE: 'meeting/invite',
        nf: 1,
        receipt: 1,
        flags: 22,
        meta: {
            ...meetingInfo  // 会议详细信息
        }
    };
    return this.HyperTextTemplate;
}
```

### 会议卡片

**MIMETYPE:** `meeting/card`

```javascript
{
    m: {
        MIMETYPE: 'meeting/card',
        meta: {
            conferenceID: 'meeting_id',
            authorizer: 'host_uid',
            cycleSubConfID: '',
            type: 'meeting-assistant-msg-new'  // 或 meeting-assistant-msg-del
        }
    }
}
```

### 通话记录

**MIMETYPE:** `call/record`

```javascript
getCallTemplate(sendTo, meetingInfo, isE2EE = true, spaceId) {
    this.HyperTextTemplate.m = {
        ctime: getTimestamp(),
        uuid: uuidv1(),
        MIMETYPE: 'call/record',
        nf: 0,
        flags: 22,
        meta: {
            callType: 'video',        // 或 'audio'
            duration: 300,            // 通话时长
            status: 'completed'       // 通话状态
        }
    };
    return this.HyperTextTemplate;
}
```

### 名片消息

**MIMETYPE:** `text/vcard`

```javascript
getNameCardTemplate(sendTo, nameInfo, isE2EE = true) {
    this.HyperTextTemplate.m = {
        ctime: getTimestamp(),
        uuid: uuidv1(),
        MIMETYPE: 'text/vcard',
        nf: 0,
        flags: 22,
        meta: {
            contactUid: 'user_uid',
            name: 'User Name',
            avatar: 'avatar_url'
        }
    };
    return this.HyperTextTemplate;
}
```

### 位置消息

**MIMETYPE:** `poi/card` | `location/share`

```javascript
{
    m: {
        MIMETYPE: 'poi/card',
        meta: {
            poiName: '地点名称',
            poiAddress: '详细地址',
            latitude: 39.9042,
            longitude: 116.4074
        }
    }
}
```

## 已读回执

**MIMETYPE:** `application/receipt`

```javascript
// messageTemplate.js
getMsgReadReceiptTemplate(sendTo, uuid = '', MIMETYPE, s) {
    this.HyperTextTemplate.m = {
        ctime: getTimestamp(),
        uuid: 'receipt|readui|' + uuid,
        MIMETYPE: 'application/receipt',
        body: '',
        nf: 0,
        flags: 22,
        meta: {
            ref: [],
            origMimeType: MIMETYPE,
            origUUID: uuid,
            type: 8
        }
    };
    return this.HyperTextTemplate;
}
```

### 批量回执

**MIMETYPE:** `application/receipt/count`

```javascript
{
    m: {
        MIMETYPE: 'application/receipt/count',
        meta: {
            receiptInfo: [
                {
                    ruuid: 'msg_uuid_1',
                    rstime: 1234567890,
                    readcnt: 5,           // 已读人数
                    unreadcnt: 10         // 未读人数
                }
            ]
        }
    }
}
```

## 撤回消息

**MIMETYPE:** `application/withdraw`

```javascript
// 撤回消息模板
renderWithDrawMsg(originParm, origUUID) {
    originParm.m.MIMETYPE = 'application/withdraw';
    originParm.m.uuid = 'withdraw|' + origUUID;
    originParm.m.meta = {
        origUUID: origUUID
    };
    return originParm;
}
```

### 撤回提醒

**MIMETYPE:** `withdraw/remind`

撤回后显示的提示消息。

## 消息类型扩展指南

### 添加新消息类型步骤

1. **定义MIMETYPE常量**

```javascript
// utils/message/MIMETYPE.js
export const MIMETYPE_TYPE = {
    'your/new-type': {
        name: 'NewType',
        getPreviewReplied: (plainMsg) => {
            // 定义回复预览生成逻辑
        }
    }
};
```

2. **创建消息模板**

```javascript
// messageTemplate.js
getNewTypeTemplate(sendTo, data) {
    this.HyperTextTemplate.m = {
        ctime: getTimestamp(),
        uuid: uuidv1(),
        MIMETYPE: 'your/new-type',
        meta: { ...data }
    };
    return this.HyperTextTemplate;
}
```

3. **添加处理逻辑**

```javascript
// messageManger.js - handleHyperText()
case 'your/new-type':
    await handleNewType(message);
    break;
```

4. **UI渲染组件**

```vue
<!-- components/chat/MessageItem/NewTypeMessage.vue -->
<template>
    <div class="new-type-message">
        <!-- 消息渲染逻辑 -->
    </div>
</template>
```

### 消息类型注意事项

1. **si 字段** - 设置为1表示安全忽略，客户端不支持时可跳过显示
2. **nf 字段** - 通知标志，0=普通消息，1=需要特殊处理
3. **flags 字段** - 消息标志位，通常设置为22
4. **receipt 字段** - 回执要求，255=需要已读回执
