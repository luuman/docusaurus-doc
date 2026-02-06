# E2EE会议

本文档描述端到端加密(E2EE)会议的核心实现，包括会议创建、密钥交换流程和验证码机制。

## 概述

E2EE会议使用 `matrx-e2ee-aes256` 算法进行端到端加密，确保会议内容只有参会者可以解密。

### 相关文件

| 文件 | 位置 | 说明 |
|------|------|------|
| e2eeMeetingUtils.js | `src/utils/sdk/` | E2EE会议核心逻辑 (32KB) |
| e2eeConstants.js | `src/utils/sdk/` | E2EE常量定义 |
| meetingSDK.js | `src/main/` | 主进程E2EE处理 |

## E2EE常量 (e2eeConstants.js)

```javascript
// 加密算法标识
export const algorithm = 'matrx-e2ee-aes256';
export const algorithmNone = 'none';

// 设备ID标识
export const e2eDeviceId = 2;  // 桌面端

// 设备映射 (用于密钥分发)
export const pingMap = {
    1: 'pingToMobile',    // 移动端密钥字段
    2: 'pingToDesktop'    // 桌面端密钥字段
};
```

## E2EE会议创建

### 确定加密类型

```javascript
// 判断是否启用E2EE
const spaceInfo = store.getters['spaceCollection/getSpaceInfo'](spaceId);
const isPersonal = isPrivateSpace(spaceId);

// 个人空间或企业强制E2EE时启用
const encryptionType = isPersonal
    ? 1
    : (spaceInfo?.e2eeEnforcement === 1 && spaceInfo?.e2ee === 1 ? 1 : 0);

const encryptionAlgorithm = isPersonal ? algorithm : algorithmNone;
```

### 创建E2EE会议

```javascript
const res = await createCstMeeting({
    uid: userInfo.uid,
    meetingType: '1',  // 或 '2' 普通会议
    encryptionType: 1,  // 1 表示E2EE
    sdkUserToken: sdkConfInfo.token,
    external: btoa(JSON.stringify({spaceId: spaceId}))
});
```

### E2EE级别判定 (e2eeEnableDefinitely)

| 值 | 说明 |
|----|------|
| 0 | 不支持E2EE |
| 1 | 旧版本E2EE (1v1 AES密钥) |
| 2 | 新版本E2EE (会议级密钥) |

```javascript
if (encryptionType === 1 && (join.e2eeMeeting && join.convert2Meeting || joinRes.meetingType !== '1')) {
    joinData.e2eeEnableDefinitely = 2;  // 新版E2EE
} else if (join.algorithm === algorithm && join.e2eeInfoJson?.key) {
    joinData.e2eeEnableDefinitely = 1;  // 旧版E2EE
} else {
    joinData.e2eeEnableDefinitely = 0;  // 不启用
}
```

## 密钥交换流程

### 1v1通话密钥加密 (主叫方)

```javascript
async encryptKeyData({deviceList, uid, roomId}) {
    let keyData = {};
    let e2eeInfoJson = { decrypt: -1, seq: 0, key: '' };

    if (Array.isArray(deviceList) && deviceList.length) {
        // 生成随机密钥
        const random = this.randomString(48);
        const key = strToBase64(strToBase64(random));

        // 为每个设备加密密钥
        for (let i = 0; i < deviceList.length; i++) {
            const id = deviceList[i];
            const e2eRes = await this.getE2eRes({
                data: Buffer.from(key, 'base64'),
                e2eType: 'encrypt',
                uid: uid,
                deviceId: Number(id)
            });

            if (e2eRes?.code === 0) {
                keyData[pingMap[id]] = e2eRes.encrypted.toString('base64');
            }
        }

        e2eeInfoJson = { decrypt: 0, seq: 0, key: key };
    }

    return { keyData, e2eeInfoJson };
}
```

### 1v1通话密钥解密 (被叫方)

```javascript
async handleKeyData(extraData, e2eType, uid, roomId) {
    const val = extraData[pingMap[e2eDeviceId]];

    if (val) {
        const res = await this.getE2eRes({
            data: Buffer.from(val, 'base64'),
            e2eType: 'decrypt',
            uid: uid,
            deviceId: extraData.deviceId
        });

        if (res?.code === 0) {
            const key = strToBase64(res.decrypted);
            this.setRoomStore({
                roomId: roomId,
                e2eeInfoJson: {
                    meetingId: roomId,
                    key: key,
                    seq: 0,
                    decrypt: 0  // 解密成功
                }
            });
            return 1;
        } else {
            // 解密失败，拒绝通话
            this.sendCstHandleFunction(
                { meetingId: roomId },
                'declineCall'
            );
            return 0;
        }
    }
}
```

### E2EE SDK调用

```javascript
async getE2eRes(params) {
    const {e2eType, data, uid, deviceId} = params;
    let result = null;

    if (e2eType === 'encrypt') {
        result = await mainToSdk({
            type: 'SDKE2EEEncrypt',
            data, uid, deviceId
        });
    } else if (e2eType === 'decrypt') {
        result = await mainToSdk({
            type: 'SDKE2EEDecrypt',
            data, uid, deviceId
        });
    }

    return result;
}
```

## E2EE会议入会流程

### sendSDKPrepareJoin() - 准备入会

```javascript
export async function sendSDKPrepareJoin(join) {
    const sendData = {
        meeting_id: String(join.mId),
        meeting_uuid: join.meetingId,
        uid: store.state.userInfo.sdkUid,
        did: e2eDeviceId,
        is_leader: determineIsLeader(join) ? 1 : 0
    };

    // 调用E2EE SDK准备入会
    const res = await sendSdk(
        'E2EE-Meeting-Help-Method',
        'SDKE2EEMeetingPrepareJoin',
        sendData
    );

    if (res !== 0) {
        throw { reason: i18n.t('meetingCode.failedJoin'), code: res };
    }

    // 非Leader需要申请入会
    if (!sendData.is_leader) {
        const applyJoinInfo = await sendSdk(
            'E2EE-Meeting-Help-Method',
            'SDKE2EEMeetingBuildApplyJoinInfo'
        );
        await sendE2EMeetingSDKData(applyJoinInfo);
    }

    // 等待获取密钥
    const resKey = await waitE2eeSdkKey();
    return resKey;
}
```

### waitE2eeSdkKey() - 等待密钥

```javascript
export function waitE2eeSdkKey() {
    return new Promise((resolve, reject) => {
        let timer = null;
        waitE2eeSdkResolve = data => {
            resolve(data);
            clearTimeout(timer);
        };
        timer = setTimeout(() => {
            reject({
                reason: i18n.t('meetingCode.failedJoin'),
                code: 90001
            });
            waitE2eeSdkResolve = null;
        }, 30 * 1000);
    });
}
```

## E2EE回调处理

### handleE2EMeetingCallBack()

```javascript
export async function handleE2EMeetingCallBack(name, str, code) {
    const data = parseString(str);
    const joindata = appdataStorage.getItem('joinData');

    switch (name) {
        case 'meeting_security_code':
            // 验证码更新
            break;

        case 'meeting_request_ic_map':
            // 请求IC映射
            throttleUpdatePartDetail({
                enterpriseId: joindata.enterpriseId,
                participantUid: store.state.userInfo.sdkUid,
                meetingId: joindata?.meetingId,
                func: data.func,
                did: e2eDeviceId,
                mkSeqNum: data.seq_num
            });
            break;

        case 'meeting_build_apply_join_info':
            // 构建申请入会信息
            sendE2EMeetingSDKData(data);
            break;

        case 'c_meeting_update_key':
            // 密钥更新
            if (waitE2eeSdkResolve) {
                waitE2eeSdkResolve({
                    seq: data.mk_seq_num,
                    decrypt: 0,
                    key: data.key
                });
                waitE2eeSdkResolve = null;
            } else {
                // 会中密钥轮转
                ipcRenderer.send('CST_SDK_SEND_FUNCTION', {
                    funcName: 'setE2EEKey',
                    data: {
                        seq: data.mk_seq_num,
                        key: data.key,
                        meetingId: joindata?.meetingId,
                        type: 'SetE2EEKeyInfo'
                    }
                });
            }
            break;

        case 'c_meeting_quit':
            // E2EE异常退出
            handleLeaveMeeting();
            notifyMeetingError({ code: code, toast: true });
            break;
    }
}
```

### E2EE数据发送

```javascript
export async function sendE2EMeetingSDKData(data) {
    const joindata = appdataStorage.getItem('joinData');

    switch (data.func) {
        case 'meeting_request_ic_map':
            // HTTP请求IC映射
            throttleUpdatePartDetail({...});
            break;

        case 'meeting_apply_join':
            // 申请入会 (通过PUSH或HTTP)
            sendE2eeInfoToServer({...});
            break;

        case 'meeting_upload_lpl':
            // 上传LPL
            e2eeMeetingSaveLplApi({...});
            break;

        case 'meeting_upload_ic_map_rekey':
        case 'meeting_upload_ic_map_leader_changed':
            // 上传IC映射
            e2eeMeetingSaveLeaderApi({...});
            break;

        case 'meeting_confirm_join':
        case 'meeting_lpl_sig':
        case 'meeting_leader_heart_beat':
            // 通过WebSocket发送
            sendE2eeInfoToServer({...});
            break;
    }
}
```

## 验证码机制 (e2eeCode)

### 验证码窗口管理

```javascript
// 主持人变更时关闭旧验证码窗口
ipcRenderer.on('HostChangeNotify', async (e, info) => {
    if (appdataStorage.getItem('joinData')?.e2eeEnableDefinitely === 2) {
        ipcRenderer.send('CLOSE_E2EECODE_WIN');

        const res = await sendSdk(
            'E2EE-Meeting-Help-Method',
            'SDKE2EEMeetingHostChanged',
            info
        );
    }
});
```

### RequireE2EEKeyNotify

当需要E2EE密钥时SDK发送通知：

```javascript
// main_type=3, sub_type=22
case 22: {
    // RequireE2EEKeyNotify
    sendWinMsg('E2E-Meeting-Change', json_info.func, JSON.stringify(json_info), 0);
    break;
}
```

## E2EE错误码

```javascript
export const e2eeMeetingErrorCodes = [
    90001, // 传入的参数错误
    90100, // AES加密失败
    90101, // 解密数据输入的数据为空
    90102, // 解密会议数据时找不到对应的key
    90103, // AES解密失败
    90104, // 解密未知错误
    90105, // Leader处理成员申请入会时秘钥交换出错
    90106, // Leader处理成员申请入会时验签失败
    90108, // Leader处理成员申请入会时未知错误
    90113, // 成员监听leader心跳连续超过4次没有收到数据或验签失败
    90114, // Leader请求ic map，角色状态错误
    90115, // 离会状态下收到处理秘钥的数据
    90116, // 成员处理应答入会时uid不匹配
    90117, // 成员处理应答入会时接收到错误数据
    90118, // 成员处理应答入会时验签失败
    90119, // 成员处理应答入会时未知错误
    90120  // 成员收到leader秘钥轮转数据时验签失败
];
```

## 参会者准入与E2EE

### ParticipantAdmitNotify 处理

```javascript
ipcRenderer.on('ParticipantAdmitNotify', async (e, info) => {
    if (appdataStorage.getItem('joinData')?.e2eeEnableDefinitely === 2) {
        setParticipantsAdmitInfo(info);

        // 设置超时
        info.timer = setTimeout(() => {
            if (store.state.userInfo.meetingStatus === statusMap.PENDING) {
                ipcRenderer.send('CST_SDK_SEND_FUNCTION', {
                    funcName: 'allowParticipantAdmit',
                    data: {
                        type: 'AllowParticipantAdmitInfo',
                        meetingId: info.meetingId,
                        allow: -1
                    }
                });
            }
        }, 30 * 1000);

        // 构建申请入会信息
        const res = await sendSdk(
            'E2EE-Meeting-Help-Method',
            'SDKE2EEMeetingBuildApplyJoinInfo'
        );
        sendE2EMeetingSDKData(res);
    } else {
        // 非E2EE直接允许
        ipcRenderer.send('CST_SDK_SEND_FUNCTION', {
            funcName: 'allowParticipantAdmit',
            data: { ...info, type: 'AllowParticipantAdmitInfo' }
        });
    }
});
```

## E2EE会议生命周期

### 入会

```javascript
if (appdataStorage.getItem('joinData')?.e2eeEnableDefinitely === 2) {
    sendSdk('E2EE-Meeting-Help-Method', 'SDKE2EEMeetingDidJoin');
}
```

### 等候室挂起

```javascript
if (appdataStorage.getItem('joinData')?.e2eeEnableDefinitely === 2) {
    sendSdk('E2EE-Meeting-Help-Method', 'SDKE2EEMeetingDidSuspend');
}
```

### 离会

```javascript
if (appdataStorage.getItem('joinData')?.e2eeEnableDefinitely === 2) {
    sendSdk('E2EE-Meeting-Help-Method', 'SDKE2EEMeetingDidLeave');
}
```

### 成员加入/离开

```javascript
ipcRenderer.on('ParticipantsChangeNotify', async (e, info) => {
    if (appdataStorage.getItem('joinData')?.e2eeEnableDefinitely === 2) {
        await sendSdk(
            'E2EE-Meeting-Help-Method',
            info.status === 0 ? 'SDKE2EEMeetingMemberJoin' : 'SDKE2EEMeetingMemberLeave',
            info
        );
    }
});
```

## 离线消息处理

```javascript
export async function handleOfflineMeeting() {
    const joinData = appdataStorage.getItem('joinData');

    if (joinData?.meetingId && joinData?.e2eeEnableDefinitely === 2) {
        const msg = await e2eeGetPushOfflineData({
            meetingId: joinData.meetingId,
            edp: 'desktop'
        });

        if (msg.offlineList?.length) {
            for (const item of msg.offlineList.reverse()) {
                await handleE2EEMeetingNotify(item);
            }
        }
    }
}
```

## 网络恢复重传

```javascript
ipcRenderer.on('online-notify', async (e, data) => {
    const joinData = appdataStorage.getItem('joinData');

    if (joinData?.encryptionType === 1 && cacheUploadData?.length) {
        // 按类型分组重传
        const arr1 = cacheUploadData.filter(item => item.info.func === 'meeting_lpl_sig');
        const arr2 = cacheUploadData.filter(item => item.info.func === 'meeting_leader_heart_beat');
        const arr3 = cacheUploadData.filter(item => item.info.func === 'meeting_upload_lpl');

        // 分别处理各类消息的重传...
        cacheUploadData = null;
    }
});
```

## 设置E2EE密钥到SDK

```javascript
ipcRenderer.send('CST_SDK_SEND_FUNCTION', {
    funcName: 'setE2EEKey',
    data: {
        seq: data.mk_seq_num,     // 密钥序列号
        key: data.key,            // AES密钥
        meetingId: meetingId,     // 会议ID
        type: 'SetE2EEKeyInfo'
    }
});
```
