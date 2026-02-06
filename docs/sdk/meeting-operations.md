# 会议操作

本文档描述会议SDK的核心操作接口，包括加入会议、发起通话、参与者管理和权限控制。

## joinMeeting() 加入会议流程

### 流程概述

```
用户触发加入 → joinCstMeeting() → joinMeetingPrepare() → authorizeJoin()
      ↓
CST_SDK_JOIN_MEETING → sendJoinMeeting() → CST_Func_joinMeeting()
      ↓
JoinMeetingResp → 入会成功/失败
```

### joinCstMeeting() 函数

**位置：** `src/utils/sdk/meetingUtils.js`

```javascript
export async function joinCstMeeting(join, type) {
    return new Promise(async (resolve, reject) => {
        try {
            // 1. 准备加入数据
            const joinData = await joinMeetingPrepare(join, type);

            // 2. 处理E2EE信息
            if (!joinData.e2eeInfoJson) {
                joinData.e2eeInfoJson = join.e2eeInfoJson || {};
            }
            joinData.e2eeInfoJson = JSON.stringify(joinData.e2eeInfoJson);

            // 3. 验证授权结果
            if (!joinData.isOk) {
                ipcRenderer.emit('CST_SDK_CURRENT_STATE_CHANGE', statusMap.CONNECTED);
                return;
            }

            // 4. 监听加入响应
            ipcRenderer.once('JoinMeetingResp', (e, info) => {
                if (info.success) {
                    resolve(info);
                    store.dispatch('userInfo/updateUserData', {
                        inTheMeeting: 2
                    });
                } else {
                    reject({...info, reason: i18n.t('meetingCode.failedJoin')});
                }
            });

            // 5. 发送加入请求
            ipcRenderer.send(
                Cst_Meeting_Event_Map.CST_SDK_JOIN_MEETING,
                senddata,
                meetingInfo
            );
        } catch (e) {
            reject(e);
        }
    });
}
```

### joinMeetingPrepare() 数据准备

```javascript
export async function joinMeetingPrepare(join, type) {
    // 1. 检查用户状态
    const check = await checkUserStatus(join.isJoinAuth ? 1 : 0);

    // 2. 授权验证
    const {isOk, user_external, opentoEnable, encryptionType, joinRes} =
        await authorizeJoin(join);

    // 3. 确定用户角色
    let is_leader = !!joinRes?.host || join?.host?.userId === store.state.userInfo.sdkUid;
    let isCreater = joinRes?.uid === store.state.userInfo.uid;

    // 4. 构建加入数据
    let joinData = {
        meetingId: join.meetingId,
        nickName: join.name || getNickName(userInfo),
        video: join.video ? 1 : 0,
        audio: join.audio ? 1 : 0,
        fromInvite: !!join.fromInvite,
        password: join.password,
        audioConnected: Boolean(store.state.setting.openAudioConnected)
    };

    // 5. E2EE处理
    if (joinData.e2eeEnableDefinitely === 2) {
        let preData = await sendSDKPrepareJoin(join);
        if (preData?.key) {
            joinData.e2eeInfoJson = preData;
        }
    }

    return joinData;
}
```

### 加入会议参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `meetingId` | string | 是* | 会议全局唯一ID |
| `mId` | string | 是* | 会议短ID (与meetingId二选一) |
| `password` | string | 否 | 会议密码 |
| `nickName` | string | 是 | 参会者昵称 |
| `video` | int | 否 | 视频状态 (0关闭/1开启) |
| `audio` | int | 否 | 音频状态 (0关闭/1开启) |
| `fromInvite` | bool | 否 | 是否来自会中邀请 |
| `audioConnected` | bool | 否 | 是否连接音频 |
| `user_external` | string | 否 | 用户扩展信息JSON |
| `e2eeInfoJson` | string | 否 | E2EE密钥信息JSON |

### sendJoinMeeting() (主进程)

```javascript
sendJoinMeeting(info) {
    return CST_Func_joinMeeting(
        this.encodeJsonToBase64({
            ...info,
            type: 'JoinMeetingInfo'
        })
    );
}
```

## callMeeting() 发起通话流程

### 流程概述

```
用户触发呼叫 → startCallMeeting() → createCstMeeting()
      ↓
CST_SDK_CALL_MEETING → sendCallMeeting() → CST_Func_callMeeting()
      ↓
CallEventNotify → 呼叫状态变化
```

### startCallMeeting() 函数

```javascript
export function startCallMeeting(info) {
    return new Promise(async (resolve, reject) => {
        // 1. 检查是否已在通话中
        if (store.state.userInfo.meetingStatus === statusMap.PENDING) {
            Message({ message: i18n.t('call_in_process'), type: 'error' });
            sdkBackMeeting();
            resolve('PENDING');
            return;
        }

        // 2. 检查用户状态
        const check = await checkUserStatus(1);
        if (!check) {
            ipcRenderer.emit('CST_SDK_CURRENT_STATE_CHANGE', statusMap.CONNECTED);
            resolve(check);
            return;
        }

        // 3. 创建会议
        const res = await createCstMeeting({
            uid: userInfo.uid,
            sdkUserToken: sdkConfInfo.token,
            meetingType: '1',  // 1v1通话
            encryptionType: encryptionType,
            calledUid: uid,
            external: btoa(JSON.stringify({spaceId: spaceId}))
        });

        // 4. 获取被叫方SDK信息
        const sdkInfo = await getSdkInfo({uid});

        // 5. 发送呼叫请求 (后续见主进程处理)
    });
}
```

### 主进程呼叫处理

```javascript
ipcMain.on(Cst_Meeting_Event_Map.CST_SDK_CALL_MEETING, async (e, data, beCaller) => {
    // 1. 等待配置初始化
    if (!this.initConfig) {
        await this.checkVal();
    }

    // 2. E2EE密钥处理
    let e2eeInfoJson = {};
    if (data.encryptionType === algorithm && beCaller.deviceList) {
        const resData = await this.encryptKeyData({
            deviceList: beCaller.deviceList,
            uid: beCaller.uid,
            roomId: data.meetingId
        });
        data.extraData = { ...data.extraData, ...resData.keyData };
        e2eeInfoJson = resData.e2eeInfoJson;
    }

    // 3. 存储房间信息
    this.setRoomStore({
        roomId: data.meetingId,
        beCaller: beCaller,
        isCaller: true,
        _extraData: data.extraData,
        e2eeInfoJson
    });

    // 4. 发送呼叫
    const res = this.sendCallMeeting(data);
    if (res === 0) {
        this.setSDKStatus(statusMap.PENDING);
    }
});
```

### 呼叫参数

| 参数 | 类型 | 说明 |
|------|------|------|
| `meetingId` | string | 会议ID |
| `callType` | int | 1:1v1, 2:会议 |
| `encryptionType` | int | 0:不加密, 1:E2EE |
| `caller` | object | 主叫方信息 |
| `callee` | object | 被叫方信息 |
| `extraData` | string | Base64编码的扩展数据 |

### sendCallMeeting() (主进程)

```javascript
sendCallMeeting(info) {
    return CST_Func_callMeeting(
        this.encodeJsonToBase64({
            ...info,
            type: 'CallMeetingInfo'
        })
    );
}
```

## 会议信息获取

### 获取当前状态

```javascript
getSdkNowStatus() {
    return new Promise((resovle, reject) => {
        const ret = this.sendGetNowStatus(resovle);
        if (ret !== 0) {
            reject(ret);
        }
    });
}

sendGetNowStatus(cb) {
    this.eventCallback['GetNowStatusInfo'] = cb;
    return CST_Func_getNowStatus(
        this.encodeJsonToBase64({
            type: 'GetNowStatusInfo'
        })
    );
}
```

**返回状态值：**
- `0` - 空闲
- `1` - 会议中
- `3` - 未知状态

### 获取参会者列表

```javascript
ipcRenderer.send('CST_SDK_SEND_FUNCTION', {
    funcName: 'getParticipants',
    data: {
        type: 'GetParticipantsInfo',
        meetingId: meetingId
    }
});

// 响应处理
ipcRenderer.on('GET_CST_GET_PARTICIPANTS', (e, data) => {
    if (data.code === 0 && data.participant_list?.length) {
        // participant_list: [{user_id, role, status}, ...]
    }
});
```

**参会者状态：**
- `0` - 会中
- `1` - 等候室
- `2` - 离线
- `3` - 离开
- `4` - 预约状态
- `6` - 未知状态

### 获取本地参会者信息

```javascript
ipcRenderer.send('CST_SDK_SEND_FUNCTION', {
    funcName: 'getLocalParticipant',
    data: {
        type: 'GetLocalParticipantInfo'
    }
});

// 响应 (sub_type=27)
case 27: {
    if (json_info.code === 0) {
        this.role = json_info.local_participant.role;
    }
    sendMainWinMsg({
        type: 'GET_CST_GET_LOCALPARTICIPANT',
        data: { role: this.role }
    });
    break;
}
```

## 参与者管理

### 邀请参会者

```javascript
ipcRenderer.send('CST_SDK_SEND_FUNCTION', {
    funcName: 'makeInvite',
    data: {
        ...data,
        extra_data: encodeJsonToBase64(extra_data)
    }
});
```

### 允许参会者入会

```javascript
ipcRenderer.send('CST_SDK_SEND_FUNCTION', {
    funcName: 'allowParticipantAdmit',
    data: {
        meetingId: meetingId,
        allow: 0,  // 0:允许, -1:不允许
        type: 'AllowParticipantAdmitInfo'
    }
});
```

### 离开会议

```javascript
ipcRenderer.send('CST_SDK_SEND_FUNCTION', {
    funcName: 'leaveMeeting',
    data: {
        type: 'LeaveMeetingInfo',
        force: true,  // true:强制离会(自动指定主持人)
        meetingId: joinData.meetingId
    }
});
```

## 主持人权限 (host/cohost/member)

### 角色定义

| 角色值 | 角色名 | 说明 |
|--------|--------|------|
| -1 | 初始值 | 未确定角色 |
| 0 | host | 主持人 |
| 1 | cohost | 联合主持人 |
| 2 | member | 普通参会成员 |

### 角色变更通知

```javascript
// main_type=3, sub_type=19
case 19: {
    // LocalRoleChangeNotify
    this.sendToRender({
        type: 'LOCAL_ROLE_CHANGE_NOTIFY',
        data: {
            newRole: json_info.role,
            oldRole: this.role
        }
    });
    break;
}
```

### 主持人变更通知

```javascript
// main_type=3, sub_type=12
case 12: {
    // HostChangeNotify
    // json_info: {user_id, user_dev}
    sendMainWinMsg({
        type: 'HostChangeNotify',
        data: json_info
    });
    break;
}
```

### E2EE会议中的主持人变更处理

```javascript
ipcRenderer.on('HostChangeNotify', async (e, info) => {
    if (appdataStorage.getItem('joinData')?.e2eeEnableDefinitely === 2) {
        // 关闭旧的验证码窗口
        ipcRenderer.send('CLOSE_E2EECODE_WIN');

        // 通知E2EE模块
        const res = await sendSdk(
            'E2EE-Meeting-Help-Method',
            'SDKE2EEMeetingHostChanged',
            info
        );

        // 更新本地状态
        appdataStorage.setItem('joinData', {
            ...appdataStorage.getItem('joinData'),
            is_leader: info.user_id === sdkConfInfo.sdkUid
        });
    }
});
```

## 等待室功能

### 等待室状态

```javascript
// main_type=3, sub_type=8
case 8: {
    // MeetingStateChangeNotify
    // state: 0-在等候室, 1-加入会议
    this.isWaitRoom = json_info.state === 0;

    sendMainWinMsg({
        type: 'CST_SDK_CALL_START',
        data: json_info
    });
    break;
}
```

### 等待室设置获取

```javascript
// 请求等待室状态 (main_type=3, sub_type=17)
case 17: {
    // MeetingByPassWaitingRoomRequest
    this.sendToRender({
        type: 'IPC_SDK_GET_WAITING_ROOM',
        data: ''
    });
    break;
}
```

### 等待室设置更新

```javascript
// 会中修改等待室设置 (main_type=3, sub_type=18)
case 18: {
    // MeetingByPassWaitingRoomUpdateNotify
    this.sendToRender({
        type: 'IPC_SDK_SET_WAITING_ROOM',
        data: { status: json_info.selected }
    });
    break;
}
```

### 响应等待室状态

```javascript
ipcRenderer.send('CST_SDK_SEND_FUNCTION', {
    funcName: 'setMeetingByPassWaitingRoomState',
    data: {
        meetingId: meetingId,
        state: state,  // 等待室状态
        type: 'SetMeetingByPassWaitingRoomStateInfo'
    }
});
```

## 会议状态回调处理

### 离开会议通知

```javascript
// main_type=3, sub_type=0
case 0: {
    // LeaveMeetingNotify
    // code: 0-正常离会, 1-异常离会, 2-会议被结束,
    //       3-主动离开, 4-被踢出, 5-被挤掉,
    //       6-1v1主叫结束, 7-被叫被呼叫
    this.joinData = null;
    this.meetingInfo = null;
    this.meetingInfoWin = false;
    this.winId = null;
    this.role = -1;

    this.setSDKStatus(statusMap.CONNECTED);
    break;
}
```

### 结束会议通知

```javascript
// main_type=3, sub_type=1
case 1: {
    // EndMeetingNotify
    // code: 0-正常, 1-异常
    this.setSDKStatus(statusMap.CONNECTED);
    sendMainWinMsg({
        type: 'END_MEETING_NOTIFY'
    });
    break;
}
```

### 参会者变更通知

```javascript
// main_type=3, sub_type=4
case 4: {
    // ParticipantsChangeNotify
    // status: 0-加入, 1-离开
    sendMainWinMsg({
        type: 'ParticipantsChangeNotify',
        data: json_info
    });
    break;
}
```
