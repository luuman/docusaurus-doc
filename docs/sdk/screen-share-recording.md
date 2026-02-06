# 屏幕共享与录制

本文档描述会议SDK的屏幕共享、应用窗口共享、白板共享和会议录制功能。

## 屏幕共享API

### 共享状态检测

通过 `getNowStatus` 获取本地共享状态：

```javascript
getSdkNowStatus().then(res => {
    // local_share_status:
    // 0 - 本端未共享
    // 1 - 本端正在共享
    if (!res.local_share_status) {
        // 可以进行其他操作
    }
});
```

### 共享时窗口处理

当本端正在共享时，不返回会议窗口以避免干扰：

```javascript
case 'SET_MEETING_WINDOW_HWND_ACTIVE': {
    this.getSdkNowStatus()
        .then(res => {
            // 共享时不激活会议窗口
            if (!res.local_share_status) {
                ipcMain.emit('SET_WINDOW_HWND_ACTIVE', null, this.winId);
            }
        })
        .catch(err => {
            ipcMain.emit('SET_WINDOW_HWND_ACTIVE', null, this.winId);
        });
    break;
}
```

## 应用窗口共享

应用窗口共享通过SDK内部机制实现，主要通过配置和状态通知进行管理。

### 窗口创建通知

```javascript
// main_type=3, sub_type=16 WindowCreatedNotify
case 16: {
    // win_type 区分窗口类型
    // win_id 为窗口句柄
    if (json_info.win_type === 0) {
        this.settingWinId = json_info.win_id;
    } else {
        this.winId = json_info.win_id;
        ipcMain.emit('SET_WINDOW_HWND_ACTIVE', null, this.winId);
    }
    break;
}
```

## 白板共享 (meetingWhiteboardShare)

### 点击白板图片分享通知

```javascript
// main_type=3, sub_type=20 ClickWhiteBoardPictureShareNotify
case 20: {
    this.sendToRender({
        type: 'CLICK_WHITE_BOARD_SHARE_NOTIFY',
        data: json_info
    });
    break;
}
```

### 渲染进程处理

```javascript
case 'CLICK_WHITE_BOARD_SHARE_NOTIFY': {
    ipcRenderer.send('white-board-share', {
        type: 'open',
        data: {
            sharePictureFilePath: info.data.share_picture_file_path,
            meetingId: getCurrentMeetingId()
        }
    });
    break;
}
```

### 关闭白板分享窗口

```javascript
// main_type=3, sub_type=21 CloseWhiteBoardPictureShareWindowNotify
case 21: {
    ipcMain.emit('white-board-share', null, {type: 'close'});
    break;
}
```

### 更新白板图片分享结果

```javascript
ipcRenderer.send('CST_SDK_SEND_FUNCTION', {
    funcName: 'updateWhiteBoardPictureShareResult',
    data: {
        // 分享结果数据
        type: 'UpdateWhiteBoardPictureShareResultInfo'
    }
});
```

### 白板分享事件流程

```
用户点击白板分享按钮
    ↓
SDK发送 ClickWhiteBoardPictureShareNotify (sub_type=20)
    ↓
主进程转发到渲染进程 CLICK_WHITE_BOARD_SHARE_NOTIFY
    ↓
渲染进程打开白板分享窗口
    ↓
用户完成分享操作
    ↓
调用 updateWhiteBoardPictureShareResult 更新结果
    ↓
SDK发送 CloseWhiteBoardPictureShareWindowNotify (sub_type=21)
    ↓
关闭白板分享窗口
```

## 会议录制

### 录制路径配置

录制路径在SDK初始化时配置：

```javascript
// 配置项 key=0 和 key=18
const data = {
    config_list: [
        {key: 0, value: path.join(store.state.storage.recordPath).split(path.sep).join('/')},
        {key: 18, value: meetingRecordPath || ''}
    ]
};
```

| 配置项 | Key | 说明 |
|--------|-----|------|
| recordPath | 0 | 通用录制文件路径 |
| meetingRecordPath | 18 | 会议录制专用路径 |

### 获取录制路径

```javascript
import {getDownloadPath} from '@/utils/downloadSetting.js';

// 获取配置的录制路径
let {meetingRecordPath} = await getDownloadPath();
```

### 配置更新通知

录制路径变更通过配置更新通知同步：

```javascript
// main_type=3, sub_type=9 ConfigUpdateNotify
case 9: {
    // config_list 包含录制路径配置
    this.sendToRender({
        type: 'SET_SDK_CONFIG',
        data: json_info.config_list
    });
    break;
}
```

### 配置处理

```javascript
function onSetConfig(configList) {
    configList.forEach(element => {
        switch (element.key) {
            case 0:
                // 录制路径更新
                // element.value 为新的录制路径
                break;
            case 18:
                // 会议录制路径更新
                break;
        }
    });
}
```

## 录制路径规范

### 路径格式

- 使用正斜杠 `/` 作为路径分隔符
- 确保路径存在且有写入权限
- asar包路径需要替换为unpacked路径

```javascript
const recordPath = path.join(store.state.storage.recordPath)
    .split(path.sep)
    .join('/');
```

### 路径示例

```
Windows: D:/work/video
macOS: /Users/username/Documents/recordings
```

## SDK导出函数参考

与屏幕共享和录制相关的SDK导出函数（在 `CST_Loader.js` 中定义）：

```javascript
const exportFuncs = {
    // ... 其他函数
    updateWhiteBoardPictureShareResult: ['int', ['string']],
    // ...
};
```

## 会议离开时的清理

当会议结束或离开时，需要关闭所有共享相关窗口：

```javascript
// 离开会议通知 (main_type=3, sub_type=0)
case 0: {
    // LeaveMeetingNotify
    ipcMain.emit('white-board-share', null, {type: 'close'});
    // 其他清理...
    break;
}

// 结束会议通知 (main_type=3, sub_type=1)
case 1: {
    // EndMeetingNotify
    ipcMain.emit('white-board-share', null, {type: 'close'});
    // 其他清理...
    break;
}
```

## 日志配置

共享和录制相关日志路径配置：

```javascript
// 配置项 key=11
{
    key: 11,
    value: path.join(global.userDatapath, 'logs/CST_Meeting/')
        .replace('app.asar', 'app.asar.unpacked')
        .split(path.sep)
        .join('/')
}
```

日志清理（启动时）：

```javascript
clearHistoryLog() {
    try {
        const logpath = path.join(userDatapath, 'logs/CrystalSDK/');
        const logpath1 = path.join(userDatapath, 'logs/CST_Meeting/Matrx_CST_Meeting_Agent');
        const logpath2 = path.join(userDatapath, 'logs/MeetingSdk/');
        fse.remove(logpath);
        fse.remove(logpath1);
        fse.remove(logpath2);
    } catch (e) {
        log.error('clearHistryLog=>', e);
    }
}
```

## 功能开关配置

通过配置控制可用功能：

```javascript
// 配置项 key=15 - 功能列表
{
    key: 15,
    value: store.state.config.currentConfig.module === 'meydan'
        ? ['polls']     // 投票功能
        : ['vitals']    // 生命体征功能
}
```

这些功能配置会影响SDK中共享和录制相关功能的可用性。

## Open To 状态管理

会议中的Open To设置影响共享权限：

### 请求当前状态

```javascript
// main_type=3, sub_type=10 MeetingOpenToRequest
case 10: {
    if (json_info.type === 'MeetingOpenToRequest') {
        this.sendToRender({
            type: 'SET_SDK_OPENTO_REQUEST',
            data: json_info
        });
    }
    break;
}
```

### 状态更新通知

```javascript
// main_type=3, sub_type=11 MeetingOpenToUpdateNotify
case 11: {
    // selected: 新的Open To状态值
    this.sendToRender({
        type: 'SET_SDK_OPENTO_UPDATE',
        data: { status: json_info.selected }
    });
    break;
}
```

### 设置Open To状态

```javascript
ipcRenderer.send('CST_SDK_SEND_FUNCTION', {
    funcName: 'setMeetingOpentoState',
    data: {
        meetingId: meetingId,
        state: state,
        type: 'SetMeetingOpentoStateInfo'
    }
});
```

### 更新Open To结果

```javascript
ipcRenderer.send('CST_SDK_SEND_FUNCTION', {
    funcName: 'updateMeetingOpenToResult',
    data: {
        // 结果数据
        type: 'UpdateMeetingOpenToResultInfo'
    }
});
```
