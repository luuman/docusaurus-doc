# SDK架构概述

本文档描述会议SDK模块的整体架构设计，包括核心文件结构、SDK加载机制、版本管理以及事件回调体系。

## 核心文件结构

### meetingSDK.js (主进程)

`src/main/meetingSDK.js` 是SDK的核心模块，定义了 `Cst_Meeting` 类，负责管理整个会议生命周期。

**类属性说明：**

```javascript
class Cst_Meeting {
    constructor() {
        this.result_type = 0;       // 结果类型
        this.isInital = false;      // SDK是否已初始化
        this.initalCode = 1;        // 初始化返回码
        this.initConfig = false;    // 配置是否已初始化
        this.isRestart = false;     // 是否为重启状态
        this.initData = null;       // 初始化数据
        this.userData = null;       // 用户数据
        this.roomStore = {};        // 房间存储（按roomId索引）
        this.callData = null;       // 通话数据
        this.beCaller = null;       // 被叫方信息
        this.roomId = '';           // 当前房间ID
        this.userId = '';           // 用户ID
        this.isCaller = false;      // 是否为主叫方
        this.joinData = null;       // 加入会议数据
        this.meetingInfo = null;    // 会议信息
        this.currentState = statusMap.DISCONNECTED;  // 当前状态
        this._extraData = null;     // 额外数据（含E2EE信息）
        this.role = -1;             // 会中角色: -1初始值, 0:host, 1:cohost, 2:普通成员
        this.winId = null;          // 会议窗口句柄
        this.settingWinId = null;   // 设置窗口句柄
        this.hasCrashed = false;    // SDK是否崩溃
    }
}
```

**状态机定义 (SDKConstants.js)：**

```javascript
export const statusMap = {
    INITIAL: 'initial',         // 初始状态
    DISCONNECTED: 'disconnected', // 已断开
    CONNECTED: 'connected',     // 已连接（SDK已登录）
    PENDING: 'pending'          // 待定（会议进行中）
};
```

## CST SDK加载机制

### 加载顺序

SDK通过 `CST_Loader.js` 和 `CST_Func.js` 实现原生DLL的加载。

**加载步骤：**

1. **加载Qt依赖库** (`CST_Loader.js`)

```javascript
function load_qt_modules(agentPath) {
    // 按顺序加载依赖
    load_module('Qt5Core', path.join(agentPath, 'Qt5Core.dll'));
    load_module('Qt5Gui', path.join(agentPath, 'Qt5Gui.dll'));
    load_module('Qt5Sql', path.join(agentPath, 'Qt5Sql.dll'));
    load_module('Qt5Widgets', path.join(agentPath, 'Qt5Widgets.dll'));
    load_module('CSTRPCMgr', path.join(agentPath, 'CSTRPCMgr.dll'));
}
```

2. **加载Agent主模块** (`CST_Func.js`)

```javascript
function CST_Func_Loader(agentPath, agentName) {
    load_qt_modules(agentPath);
    const module_real_path = path.join(agentPath, `${agentName}.dll`);
    CST_Loader = ffi.Library(module_real_path, exportFuncs);
}
```

### 导出函数列表

`exportFuncs` 定义了所有可调用的SDK函数：

| 函数名 | 参数 | 说明 |
|--------|------|------|
| `initialize` | [string, string, string, pointer, bool, bool, bool] | 初始化SDK |
| `uninitialize` | [] | 反初始化SDK |
| `initConfiguration` | [string] | 配置初始化 |
| `login` | [string] | 用户登录 |
| `logout` | [string] | 用户登出 |
| `joinMeeting` | [string] | 加入会议 |
| `callMeeting` | [string] | 发起通话 |
| `getNowStatus` | [string] | 获取当前状态 |
| `releaseSdk` | [string] | 释放SDK |
| `setE2EEKey` | [string] | 设置E2EE密钥 |
| `allowParticipantAdmit` | [string] | 允许参会者准入 |
| `leaveMeeting` | [string] | 离开会议 |

## SDK版本管理

### sdkVersion.js

`src/main/sdk/cst/sdkVersion.js` 记录SDK版本信息：

```javascript
module.exports = {
    "version": "commit 7cf2d14c3f1cf8003c02a5cb108f901b02ffedb2...",
    "branch": "dev_x64_share_opt"
}
```

版本信息在初始化时记录到日志：

```javascript
log.log('sdkversion:', '2023 x64 ar e2ee sdk');
log.log('getSdkversion:', getSdkversion);
```

## SDK与主进程交互

### IPC事件通道

主要IPC事件定义在 `SDKConstants.js`：

```javascript
export const Cst_Meeting_Event_Map = {
    CST_SDK_INIT: 'CST_SDK_INIT',
    CST_SDK_INIT_CONFIG: 'CST_SDK_INIT_CONFIG',
    CST_SDK_JOIN_MEETING: 'CST_SDK_JOIN_MEETING',
    CST_SDK_CREATE_MEETING: 'CST_SDK_CREATE_MEETING',
    CST_SDK_CALL_MEETING: 'CST_SDK_CALL_MEETING',
    CST_SDK_CALL_STATUS_NOTIFY: 'CST_SDK_CALL_STATUS_NOTIFY',
    CST_SDK_SIGNIN: 'CST_SDK_SIGNIN',
    CST_SDK_SIGNUP: 'CST_SDK_SIGNUP',
    CST_SDK_LEAVE_MEETING: 'CST_SDK_LEAVE_MEETING',
    CST_SDK_END_MEETING: 'CST_SDK_END_MEETING',
    CST_SDK_ADVANCED_EVENT: 'CST_SDK_ADVANCED_EVENT'
};
```

### 通用函数调用接口

通过 `CST_SDK_SEND_FUNCTION` 通道实现统一的函数调用：

```javascript
ipcRenderer.send('CST_SDK_SEND_FUNCTION', {
    funcName: 'login',
    data: {
        token: token,
        user_id: sdkUid,
        nickname: nickName,
        type: 'LoginInfo'
    }
});
```

## SDK事件回调体系

### 回调注册机制

```javascript
function SDKAddCallback(callbackType, callback) {
    eventCallback[callbackType] = callback;
    return 0;
}

// 注册主回调
SDKAddCallback('CST_SDK_MAIN_CALLBACK', (...args) => {
    this.handleCstCallBack(...args);
});
```

### 回调类型 (main_type)

| main_type | 说明 | 处理函数 |
|-----------|------|----------|
| 0 | 基础回调 | - |
| 1 | 函数调用接口回调 | `handleFunctionResp()` |
| 2 | 通用功能回调 | `handleCommonNotify()` |
| 3 | 会议功能回调 | `handleMeetingNotify()` |
| 4 | 1v1业务回调 | `callStatusNotify()` |
| 5 | RPC功能回调 | `handleRpcRequest()` |
| 7 | 直播功能回调 | `handleLiveInit()` |
| 30 | SDK进程终止 | 自动重启逻辑 |
| 31 | SDK进程启动 | 初始化完成通知 |

### 函数响应回调 (sub_type in main_type=1)

| sub_type | 类型名 | 说明 |
|----------|--------|------|
| 0 | InitConfigResp | 配置初始化响应 |
| 4 | LogoutResp | 登出响应 |
| 7 | JoinMeetingResp | 加入会议响应 |
| 8 | CallMeetingResp | 发起通话响应 |
| 14 | MakeInviteResp | 邀请响应 |
| 15 | GetParticipantsResp | 获取参会者响应 |
| 16 | GetNowStatusResp | 获取当前状态响应 |
| 27 | GetLocalParticipantResp | 获取本地参会者响应 |

### 会议通知回调 (sub_type in main_type=3)

| sub_type | 类型名 | 说明 |
|----------|--------|------|
| 0 | LeaveMeetingNotify | 离开会议通知 |
| 1 | EndMeetingNotify | 结束会议通知 |
| 2 | ClickInviteNotify | 点击邀请通知 |
| 4 | ParticipantsChangeNotify | 参会者变更通知 |
| 6 | MeetingInfoUpdateNotify | 会议信息更新通知 |
| 8 | MeetingStateChangeNotify | 会议状态变更（等候室/会中）|
| 12 | HostChangeNotify | 主持人变更通知 |
| 15 | ParticipantAdmitNotify | 参会者准入通知 |
| 16 | WindowCreatedNotify | 窗口创建通知 |
| 19 | LocalRoleChangeNotify | 本地角色变更通知 |
| 20 | ClickWhiteBoardPictureShareNotify | 白板图片分享通知 |
| 22 | RequireE2EEKeyNotify | E2EE密钥请求通知 |

## 数据编码

所有与SDK交互的数据使用Base64编码：

```javascript
encodeJsonToBase64(json) {
    return strToBase64(JSON.stringify(json));
}

decodeBase64ToJson(base64) {
    let str = base64ToStr(base64);
    return JSON.parse(str);
}
```

## 房间数据管理

```javascript
setRoomStore(data) {
    this.roomStore[data.roomId] = {
        ...this.roomStore[data.roomId],
        ...data
    };
}

getRoomStore(roomId) {
    return this.roomStore[roomId] || {};
}

delRoomStore(roomId) {
    delete this.roomStore[roomId];
}
```

房间数据包含：
- `roomId` - 房间ID
- `beCaller` - 被叫方信息
- `isCaller` - 是否主叫
- `callData` - 通话数据
- `_extraData` - 额外数据（E2EE相关）
- `e2eeInfoJson` - E2EE密钥信息
