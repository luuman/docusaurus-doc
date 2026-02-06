# SDK初始化

本文档详细描述会议SDK的初始化流程，包括配置项、参数说明及错误处理机制。

## 初始化流程概述

SDK初始化分为以下几个阶段：

```
cstSdkInit() → CST_SDK_INIT → cstInitialize() → CST_Func_initialize()
     ↓
InitConfigResp → CST_SDK_INIT_CONFIG → sendConfig() → CST_Func_initConfiguration()
     ↓
LoginNotify → CST_SDK_SIGNIN → login()
```

## cstInitialize() 流程

### 函数定义 (meetingSDK.js)

```javascript
cstInitialize(data) {
    // 1. 构建SDK路径
    const baseSdkPath = path.join(__static, './sdk/cst_lib')
        .replace('app.asar', 'app.asar.unpacked')
        .split(path.sep).join('/');

    // 2. 确定可执行文件名
    let exeName = process.env.NODE_ENV === 'production'
        ? `${currentConfig.name}Meeting.exe`
        : 'MatrxMeeting.exe';

    // 3. 构建完整路径
    const sdkpath = path.join(baseSdkPath, 'sdk', exeName);
    const agentPath = path.join(baseSdkPath, 'sdk');

    // 4. 加载Agent库
    CST_Func_Loader(agentPath, agentName);

    // 5. 调用初始化
    const initRes = CST_Func_initialize(
        strToBase64(exepath),      // 主进程可执行文件路径
        strToBase64(sdkpath),      // SDK路径
        this.encodeJsonToBase64(data), // 配置数据
        true,                       // init_qapp
        false,                      // is_demo
        true                        // multi_process
    );

    return initRes;
}
```

### 路径说明

| 变量 | 说明 | 示例值 |
|------|------|--------|
| `baseSdkPath` | SDK基础路径 | `<app>/resources/sdk/cst_lib` |
| `exepath` | Electron主进程路径 | `<app>/Matrx.exe` |
| `sdkpath` | 会议SDK可执行文件 | `<app>/resources/sdk/cst_lib/sdk/MatrxMeeting.exe` |
| `agentPath` | Agent库目录 | `<app>/resources/sdk/cst_lib/sdk/` |

## CST_Func_initialize() 参数详解

### 函数签名

```javascript
function CST_Func_initialize(exepath, path1, data, init_qapp, is_demo, multi_process)
```

### 参数说明

| 参数 | 类型 | 说明 |
|------|------|------|
| `exepath` | string (Base64) | Electron可执行文件路径 |
| `path1` | string (Base64) | SDK可执行文件路径 |
| `data` | string (Base64 JSON) | 初始化配置数据 |
| `init_qapp` | bool | 是否初始化Qt应用 (通常为true) |
| `is_demo` | bool | 是否为演示模式 (通常为false) |
| `multi_process` | bool | 是否多进程模式 (通常为true) |

### 返回值

| 返回码 | 说明 |
|--------|------|
| 0 | 初始化成功 |
| >1 | 初始化失败，具体错误码见错误处理 |

## cstInitConfiguration() 配置项

### 配置初始化入口 (meetingUtils.js)

```javascript
export function cstSdkInit() {
    return new Promise(async (resolve, reject) => {
        const sdk_path = path.join(__static, './sdk/cst_lib/sdk/')
            .replace('app.asar', 'app.asar.unpacked');

        const data = {
            config_list: [
                {key: 0, value: recordPath},           // 录制路径
                {key: 1, value: String(~~autoconnectedAudio)}, // 自动连接音频
                {key: 2, value: String(~~videoCheck)}, // 视频检查
                {key: 3, value: String(1)},            // 私有模式
                {key: 4, value: String(1)},            // 私有模式2
                {key: 5, value: meeting_window_icon},  // 会议窗口图标
                {key: 6, value: window_icon},          // 普通窗口图标
                {key: 7, value: String(Debug_Sdk ? 1 : 0)}, // 调试模式
                {key: 8, value: String(isPrivated ? 0 : 1)}, // 私有部署
                {key: 9, value: String(~~openAudioConnected)}, // 入会连接音频
                {key: 10, value: sdkdatapath},         // SDK数据路径
                {key: 11, value: logpath},             // 日志路径
                {key: 12, value: i18n.locale},         // 语言
                {key: 13, value: theme},               // 主题
                {key: 14, value: String(~~openNoiseCancellation)}, // 噪声消除
                {key: 15, value: features},            // 功能列表
                {key: 16, value: String(~~mirrorVideo)}, // 镜像视频
                {key: 18, value: meetingRecordPath}    // 会议录制路径
            ]
        };

        ipcRenderer.send('CST_SDK_SEND_FUNCTION', {
            funcName: Cst_Meeting_Event_Map.CST_SDK_INIT,
            data: data
        });
    });
}
```

### 配置项详解

| Key | 名称 | 值类型 | 说明 |
|-----|------|--------|------|
| 0 | recordPath | string | 录制文件存储路径 |
| 1 | autoconnectedAudio | "0"/"1" | 入会时自动连接音频 |
| 2 | videoCheck | "0"/"1" | 入会时检查视频设备 |
| 3 | privateMode1 | "0"/"1" | 私有模式设置1 |
| 4 | privateMode2 | "0"/"1" | 私有模式设置2 |
| 5 | meetingWindowIcon | string | 会议窗口图标路径 |
| 6 | windowIcon | string | 普通窗口图标路径 |
| 7 | debugMode | "0"/"1" | 调试模式开关 |
| 8 | privateDeployment | "0"/"1" | 是否私有部署 |
| 9 | openAudioConnected | "0"/"1" | 入会默认连接音频 |
| 10 | sdkDataPath | string | SDK数据存储路径 |
| 11 | logPath | string | 日志存储路径 |
| 12 | locale | string | 语言设置 (如 "en", "zh") |
| 13 | theme | string | 主题设置 ("blue", "golden") |
| 14 | noiseCancellation | "0"/"1" | 噪声消除开关 |
| 15 | features | array | 启用的功能列表 |
| 16 | mirrorVideo | "0"/"1" | 视频镜像开关 |
| 18 | meetingRecordPath | string | 会议录制专用路径 |

### 服务器配置 (initSdkServerList)

```javascript
initData = {
    serverList: serverList,  // 服务器列表
    cert: getonlineCa()      // SSL证书
};

ipcRenderer.send(Cst_Meeting_Event_Map.CST_SDK_INIT_CONFIG, initData);
```

服务器列表包含：
- `media_sdk` - 媒体服务器
- `meeting_sdk` - 会议服务器
- `signal_sdk` - 信令服务器

## SDK环境检测 (checkSdk.js)

### checkSdkProgressInit()

检测SDK进程是否已初始化：

```javascript
export function checkSdkProgressInit() {
    return new Promise((resolve, reject) => {
        let check;
        let waitTime = 0;
        const waitTimeout = 60 * 1000;

        ipcRenderer.once('sdk-process-ok', () => {
            clearInterval(check);
            resolve(store.state.storage.sdkProcessInit);
        });

        function run() {
            if (store.state.storage.sdkProcessInit) {
                clearInterval(check);
                resolve(store.state.storage.sdkProcessInit);
                return;
            }
            if (waitTime >= waitTimeout) {
                clearInterval(check);
                reject(false);
            }
            waitTime += 300;
            if (!sendInit) {
                sendInit = true;
                sendToSdk('SDK_PROCESS_INIT');
            }
        }
        check = setInterval(run, 300);
        run();
    });
}
```

### checkSocketConnected()

检测Socket是否已连接（用于匿名入会场景）：

```javascript
export function checkSocketConnected() {
    return new Promise((resolve, reject) => {
        let check;
        let waitTime = 0;

        const run = () => {
            if (appdataStorage.getItem('c_socket_state') === 'WPushRes') {
                clearInterval(check);
                resolve(true);
                return;
            }
            if (waitTime >= 30 * 1000) {
                clearInterval(check);
                resolve(false);
            }
            waitTime += 300;
        };
        check = setInterval(run, 300);
        run();
    });
}
```

## 初始化错误处理

### 错误码定义

| 错误码 | 说明 | 处理方式 |
|--------|------|----------|
| 0 | 成功 | 继续后续流程 |
| 1 | 一般错误 | 重试初始化 |
| 10001 | SDK未初始化 | 检查SDK加载 |
| 10002 | 初始化超时 | 重试或提示用户 |
| 10003 | 配置错误 | 检查配置参数 |
| 10004 | 网络错误 | 检查网络连接 |

### 超时处理

```javascript
// 配置初始化超时 (15秒)
this.initConfigTimer = setTimeout(() => {
    this.initConfigTimer = null;
    sendMainWinMsg({
        type: 'InitConfigResp',
        data: {
            code: 10002,
            reson: 'my timeout initconfig'
        }
    });
}, 15 * 1000);

// SDK初始化超时 (60秒)
initTimeout = setTimeout(() => {
    reject('Meeting sdk init timeout.');
    ipcRenderer.removeAllListeners('cstInitResp');
}, 60 * 1000);
```

### 崩溃恢复

SDK崩溃时通过 `main_type=30` 回调触发重启：

```javascript
case 30: {
    // SDK进程终止
    log.error('handleCstCallBack30 process kill');
    clearTimeout(this.initConfigTimer);
    this.hasCrashed = true;

    await this.unInitialize('restart');
    this.isInital = false;
    this.initConfig = false;

    // 通知渲染进程重新初始化
    sendMainWinMsg({
        type: 'SEND_SDK_INIT_LOGIN',
        data: false
    });
    break;
}
```

### 重试机制

```javascript
let reloginTimer = 0;
let maxReTimes = 3;

// 登录失败时自动重试
if (navigator.onLine && !loginData.temp && !cancelLogin && reloginTimer < maxReTimes) {
    reloginTimer++;
    await new Promise(resolve => setTimeout(resolve, 1000));
    cstConnected(true);
} else {
    reloginTimer = 0;
}
```

## 完整初始化序列

```
1. 渲染进程调用 cstSdkInit()
   ├─ 准备配置数据 (config_list)
   └─ 发送 CST_SDK_INIT 事件

2. 主进程接收 CST_SDK_INIT
   ├─ 调用 cstInitialize(data)
   ├─ CST_Func_Loader() 加载DLL
   └─ CST_Func_initialize() 初始化SDK

3. SDK进程启动 (main_type=31)
   └─ 发送 cstInitResp 到渲染进程

4. 渲染进程调用 initSdkServerList()
   ├─ 获取服务器列表
   └─ 发送 CST_SDK_INIT_CONFIG 事件

5. 主进程接收 CST_SDK_INIT_CONFIG
   ├─ 调用 sendConfig(data)
   └─ CST_Func_initConfiguration()

6. SDK返回 InitConfigResp (main_type=1, sub_type=0)
   └─ 配置完成，可以登录

7. 渲染进程发送 CST_SDK_SIGNIN
   └─ 调用 login() 函数

8. SDK返回 LoginNotify (main_type=2, sub_type=4)
   └─ 登录成功，状态变为 CONNECTED
```
