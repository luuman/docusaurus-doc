# 音视频控制

本文档描述会议SDK的音视频控制API，包括音频/视频开关、设备管理、媒体状态检测以及虚拟背景和噪声抑制功能。

## 音频控制API

### 入会音频设置

在加入会议时可设置初始音频状态：

```javascript
// 加入会议时的音频参数
const joinData = {
    meetingId: meetingId,
    nickName: nickName,
    audio: join.audio ? 1 : 0,  // 0:静音入会, 1:开启音频入会
    audioConnected: Boolean(store.state.setting.openAudioConnected)
};

ipcRenderer.send(Cst_Meeting_Event_Map.CST_SDK_JOIN_MEETING, joinData);
```

### 音频连接配置

| 配置项 | Key | 说明 |
|--------|-----|------|
| `autoconnectedAudio` | 1 | 入会时自动连接音频设备 |
| `openAudioConnected` | 9 | 入会默认开启音频 |

```javascript
// 配置初始化时设置
{key: 1, value: String(~~store.state.setting.autoconnectedAudio)},
{key: 9, value: String(~~store.state.setting.openAudioConnected)}
```

### 音频状态管理

音频状态通过会议配置更新通知进行同步：

```javascript
// main_type=3, sub_type=9 ConfigUpdateNotify
case 9: {
    // config_list 包含音视频配置
    this.sendToRender({
        type: 'SET_SDK_CONFIG',
        data: json_info.config_list
    });
    break;
}
```

配置项处理：

```javascript
function onSetConfig(configList) {
    configList.forEach(element => {
        switch (element.key) {
            case 1:
                // 开启麦克风: 0-关闭, 1-开启
                setSettingsData({autoconnectedAudio: element.value !== '0'});
                break;
            case 9:
                // 入会连接音频: 0-不连接, 1-连接
                setSettingsData({openAudioConnected: element.value !== '0'});
                break;
        }
    });
}
```

## 视频控制API

### 入会视频设置

```javascript
const joinData = {
    meetingId: meetingId,
    nickName: nickName,
    video: join.video ? 1 : 0,  // 0:关闭视频入会, 1:开启视频入会
};
```

### 视频配置项

| 配置项 | Key | 说明 |
|--------|-----|------|
| `videoCheck` | 2 | 入会时检查视频设备 |
| `mirrorVideo` | 16 | 视频镜像设置 |

```javascript
// 配置初始化
{key: 2, value: String(~~store.state.setting.videoCheck)},
{key: 16, value: String(~~store.state.setting.mirrorVideo)}
```

### 视频状态处理

```javascript
function onSetConfig(configList) {
    configList.forEach(element => {
        switch (element.key) {
            case 2:
                // 开启摄像头: 0-关闭, 1-开启
                setSettingsData({videoCheck: element.value !== '0'});
                break;
            case 16:
                // 镜像视频
                setSettingsData({mirrorVideo: element.value !== '0'});
                break;
        }
    });
}
```

### 通话媒体类型

1v1通话支持不同媒体类型：

```javascript
// callType: 201-视频通话, 200-音频通话
callType: callType ? 201 : 200,

// 或使用 media_type
media_type: join?.video ? 2 : 1  // 2-视频, 1-音频
```

## 设备管理

### 设备标识

系统定义了设备类型标识：

```javascript
// e2eeConstants.js
export const e2eDeviceId = 2;  // 桌面端设备ID

export const pingMap = {
    1: 'pingToMobile',    // 移动端
    2: 'pingToDesktop'    // 桌面端
};
```

### 设备类型 (devType)

在通话事件中标识设备类型：

| devType | 说明 |
|---------|------|
| 0 | 默认/未知 |
| 1 | 移动端 |
| 2 | 电脑端 |
| 3 | 网页端 |

### 多设备处理

处理被叫方多设备场景：

```javascript
// 获取被叫方设备列表
beCaller.deviceList = [1, 2];  // 移动端和桌面端

// E2EE场景下为每个设备加密密钥
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
```

### 窗口句柄管理

SDK通过窗口通知管理会议窗口：

```javascript
// main_type=3, sub_type=16 WindowCreatedNotify
case 16: {
    // win_type: 0-设置窗口, 其他-会议主窗口
    if (json_info.win_type === 0) {
        this.settingWinId = json_info.win_id;
    } else {
        this.winId = json_info.win_id;
        ipcMain.emit('SET_WINDOW_HWND_ACTIVE', null, this.winId);
    }
    break;
}
```

## 媒体状态检测

### 获取当前状态

```javascript
getSdkNowStatus().then(res => {
    // res 包含:
    // - status: 0-空闲, 1-会中, 3-未知
    // - local_share_status: 0-未共享, 1-正在共享
});
```

### 会议管理音视频状态

创建会议时返回的管理配置：

```javascript
// createCstMeeting 返回
const meetingManage = {
    meetingAudioStatus: 0,  // 音频默认状态
    meetingVideoStatus: 0   // 视频默认状态
};

// 使用
const joinData = {
    videoStatus: res.meetingManage.meetingVideoStatus,
    audioStatus: res.meetingManage.meetingAudioStatus,
};
```

### 本地参会者信息更新

```javascript
// main_type=3, sub_type=7 LocalParticipantInfoChangeNotify
case 7: {
    // nickname 变更通知
    this.sendToRender({
        type: 'CST_SDK_NICKNAME_UPDATE',
        data: json_info
    });
    break;
}
```

## 虚拟背景

虚拟背景功能通过SDK内置实现，配置路径在初始化时设定：

```javascript
// SDK数据路径包含虚拟背景资源
const sdkdatapath = path.join(global.userDatapath, 'resourcePath/')
    .replace('app.asar', 'app.asar.unpacked')
    .split(path.sep).join('/');

// 配置项
{key: 10, value: sdkdatapath}  // SDK数据存储路径
```

资源迁移处理：

```javascript
fse.ensureDir(sdkdatapath, err => {
    if (!err) {
        const sdkresourcepath = path.join(userDatapath, 'resources/');
        if (fse.existsSync(sdkresourcepath)) {
            fse.move(sdkresourcepath, path.join(sdkdatapath, 'resources/'), {
                overwrite: true
            });
        }
    }
});
```

## 噪声抑制

### 配置开关

```javascript
// 配置项 key=14
{key: 14, value: String(~~store.state.setting.openNoiseCancellation)}
```

| 值 | 说明 |
|----|------|
| "0" | 关闭噪声抑制 |
| "1" | 开启噪声抑制 |

### 设置更新

```javascript
// 通过 setConfig 更新
ipcRenderer.send('CST_SDK_SEND_FUNCTION', {
    funcName: 'setConfig',
    data: {
        config_list: [
            {key: 14, value: String(enabled ? 1 : 0)}
        ],
        type: 'SetConfigInfo'
    }
});
```

## 音视频配置汇总表

| Key | 配置名 | 值 | 说明 |
|-----|--------|-----|------|
| 0 | recordPath | string | 录制文件路径 |
| 1 | autoconnectedAudio | "0"/"1" | 自动连接音频 |
| 2 | videoCheck | "0"/"1" | 视频设备检查 |
| 9 | openAudioConnected | "0"/"1" | 入会开启音频 |
| 14 | noiseCancellation | "0"/"1" | 噪声抑制 |
| 16 | mirrorVideo | "0"/"1" | 视频镜像 |
| 18 | meetingRecordPath | string | 会议录制路径 |

## 会中音视频状态同步

### RTM连接状态

```javascript
// main_type=3, sub_type=5 RtmConnectionChangeNotify
case 5: {
    // status: true-连接, false-断开
    this.sendToRender({
        type: 'CST_SDK_RTM_CONNECTION',
        data: json_info
    });
    break;
}
```

渲染进程处理：

```javascript
case 'CST_SDK_RTM_CONNECTION': {
    store.dispatch('userInfo/updateUserData', {
        meetingRtmStatus: info.data.status
    });
    break;
}
```

### 设置对话框

```javascript
// 显示SDK设置对话框
ipcRenderer.send('CST_SDK_SEND_FUNCTION', {
    funcName: 'showSettingDialog',
    data: {
        type: 'ShowSettingDialogInfo'
    }
});

// 响应 (sub_type=17)
case 17: {
    // ShowSettingDialogResp
    if (this.settingWinId) {
        ipcMain.emit('SET_WINDOW_HWND_ACTIVE', null, this.settingWinId);
    }
    break;
}
```
