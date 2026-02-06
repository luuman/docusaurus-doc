# 升级系统

> 应用版本更新的完整实现，包含自动检查、手动检查、强制更新、静默更新等策略。

## 升级窗口状态

```mermaid
stateDiagram-v2
    [*] --> UpdateModal: updateVisible || processVisible || downloadedVisible

    state UpdateModal {
        [*] --> updateVisible: 显示版本信息
        state updateVisible {
            [*] --> skipVersion: forceUpdate 非强制
            [*] --> remindLater: forceUpdate 非强制
            [*] --> updateNow: 立即更新
            skipVersion --> skipUpate: 跳过版本
            remindLater --> lasterUpate: 稍后提醒
            updateNow --> toUpate: 立即更新
            skipUpate --> skipUpdater: sysskipUpdater
            skipUpdater --> setStore: storage.skipUpdateVersion
            toUpate --> updateMarketUrl: 应用市场
            toUpate --> updateWebUrl: 网页下载
            toUpate --> sysupdateNow: 系统下载
            updateMarketUrl --> openExternal: 外部浏览器
            updateWebUrl --> openExternal: 外部浏览器
            lasterUpate --> updateLater: 记录时间
        }

        updateVisible --> processVisible: 显示下载进度
        state processVisible {
           [*] --> downloadProcess: 下载进度
        }

        processVisible --> downloadedVisible: 显示安装提示
        state downloadedVisible {
           [*] --> InstallNow: 立即安装
            InstallNow --> nowRestart: 重启
        }
    }
```

## 更新流程

```mermaid
graph TD
  J{用户选择}
  J -->|立即更新| K[触发 sys:updateNow]
  J -->|稍后更新| L[触发 sys:updateLater]
  J -->|跳过版本| M[触发 sys:skipUpdater]

  K --> N[开始下载]
  N --> O[实时发送下载进度]
  O --> P{下载完成?}
  P -->|是| Q[触发 update-downloaded]
  P -->|否| O

  Q --> R{自动更新?}
  R -->|是| S[缓存版本信息]
  R -->|否| T[显示安装提示]

  T --> U[用户点击安装]
  U --> V[校验文件]
  V -->|成功| W[退出并安装]
  V -->|失败| X[显示失败界面]

  L --> Y[启动延迟定时器]
  M --> Z[标记跳过版本]
```

## 触发机制

```mermaid
flowchart TD
  A[启动应用] --> B{更新模式}
  B -->|自动检查| C[定时触发检查]
  B -->|手动检查| D[用户点击检查按钮]
  B -->|自动检查| L[登录检测]
  C & D & L --> E[执行更新检查]
  E --> F{有新版本?}
  F -->|是| G[进入下载流程]
  F -->|否| H[提示已是最新]
```

### 手动触发

```mermaid
flowchart TD
  A[手动触发] --> B{触发方式}
  B -->|检查更新| C[checkUpdates]
  B -->|未知消息| D[UnknowChat]
  B -->|不支持消息| E[UnsupportedChat]
  D -->|emit| G[check-updates]
  E -->|emit| G
  G -->|是| C2[handleCheckUpdate]
  C2 -->|manualCheck=true| F{getUpdateInfo}
  F -->|否| H[showCheckUpdateTip]
  F -->|是| S[handleSendCheck]
  H --> T[提示已是新版本]
  S --> J[监听更新事件]
```

### 自动检测

```mermaid
flowchart TD
  A[启动应用] --> B[initUpdater]
  B -->|创建监听| C[start-checkUpdate]
  C -->|自动检测| manualCheck{manualCheck}
  manualCheck -->|否| startRefreshTimer
  startRefreshTimer -->|5秒轮训| refresh
  refresh -->|是否超过轮训时间| R{refreshInterval}
  R -->|是| E[start-CheckUpdateVersion]
  F{getUpdateInfo}
  F -->|是| C
  E --> F

  C -->|稍后检测| skipVer{skipVer}
   skipVer -->|是| H[startUpdateTimer]
    H -->|每10秒执行| I[getDate]
    I -->|endTime| J2{是否到达 endTime?}
    J2 -->|是| E
```

## 更新类型

```mermaid
flowchart TD
    H{getUpdateInfo}
    H -->|是| I[解析版本信息]
    H -->|否| J[60s重试≤5次]
    J -->|5次失败| K[停止轮询]

    I --> L{升级类型}
    L -->|强制升级| M[强制弹窗]
    L -->|普通升级| N[自动下载]
    L -->|建议升级| O[可跳过弹窗]

    N --> P{自动下载开关?}
    P -->|开启| Q[静默下载]
    P -->|关闭| R[独立窗口]
    Q --> S[自动安装]
    R --> T[手动触发安装]
```

| updateType | 含义 | 行为 |
|------------|------|------|
| 0 | 不需要更新 | 无操作 |
| 1 | 强制更新 | 弹窗不可跳过 |
| 2 | 普通更新 | 弹窗可关闭 |
| 3 | 建议更新 | 可跳过版本 |

## 状态管理 (Vuex)

```javascript
const state = {
  updateVisible: false,      // 更新提示对话框
  downloadedVisible: false,  // 下载完成提示
  processVisible: false,     // 下载进度条
  newVersion: "",            // 新版本号
  newVersionInfo: "",        // 版本更新说明 (Markdown)
  downloadProcess: 0,        // 下载进度 (0-100)
  downloadSize: 0,           // 已下载字节数
  fileSize: "",              // 文件大小
  forceUpdate: false,        // 是否强制更新
  canSkipUpdate: false,      // 是否允许跳过
  updateMarketUrl: "",       // 应用市场下载地址
  updateWebUrl: "",          // 网页版下载地址
  device: {},                // 设备信息
};
```

## 核心 API

### getUpdateInfo

获取设备更新信息并触发更新检查。

```javascript
export async function getUpdateInfo(hid, manualCheck) {
  const info = await deviceInfo(hid);
  if (process.env.NODE_ENV === "development") return Promise.resolve();

  return getVersionInfo(info).then((res) => {
    if (res) {
      ipcRenderer.send("start-checkUpdate", {
        ...res,
        manualCheck,
        autoUpdateDownload: store.state.setting.autoUpdateOpen
          && store.state.userInfo.loginStatus === "LOGINFINISH",
      });
      sessionStorage.checkUpdateStatus = "checked";
    }
  }).catch((err) => {
    // 错误重试: 每60秒重试一次, 最多5次
    let versionNum = 0;
    const versionTimer = setInterval(() => {
      if (versionNum > 5) { clearInterval(versionTimer); return; }
      versionNum++;
      getVersionInfo(info).then((res) => { /* ... */ });
    }, 60 * 1000);
  });
}
```

### getVersionInfo

```javascript
export function getVersionInfo(postParm) {
  postParm.userId = postParm.hid;
  return commonUCRequest({
    baseURL: getBaseSpaceUserURL(),
    url: `/configUpdate/v1/info`,
    method: "POST",
    data: JSON.stringify(postParm),
    headers: { "Content-Type": "application/json", "C-Type": "windows" },
    params: { deviceType: "win", clienttype: "win" },
  }, false);
}
```

### deviceInfo

采集设备信息用于更新检查:

- `platform`: 操作系统 (win/osx)
- `release`: 系统版本
- `arch`: 系统架构
- `cpu`: CPU 型号
- `networkType`: 网络类型
- `osVer`: Windows 版本 (7/8/10)
- `locaSyslLang`: 系统语言
- `version`: 应用版本
- `vendor`: 设备制造商
- `deviceModel`: 设备型号
- `countryCode`: 国家代码

## AppUpdater 类

主进程更新管理器，基于 `electron-updater`。

### 关键配置

```javascript
autoUpdater.autoDownload = false;        // 禁用自动下载
autoUpdater.allowDowngrade = false;      // 禁止降级
autoUpdater.autoInstallOnAppQuit = false; // 退出时不自动安装
autoUpdater.forceDevUpdateConfig = true;  // 强制开发更新配置
```

### IPC 事件

| 事件 | 说明 |
|------|------|
| `sys:updateNow` | 立即更新，开始下载 |
| `sys:updateLater` | 稍后更新，启动延迟定时器 |
| `sys:skipUpdater` | 跳过版本，记录跳过信息 |
| `sys:nowRestart` | 立即重启，校验文件后安装 |
| `sys:cancelUpdate` | 取消下载 |
| `sys:continueUpdate` | 继续更新（网络恢复后） |

### 网络错误处理

检测以下网络错误并支持断点续传:

- `net::ERR_INTERNET_DISCONNECTED`
- `net::ERR_PROXY_CONNECTION_FAILED`
- `net::ERR_CONNECTION_RESET`
- `net::ERR_CONNECTION_CLOSE`
- `net::ERR_NAME_NOT_RESOLVED`
- `net::ERR_CONNECTION_TIMED_OUT`

### 安装流程

1. 下载完成后校验 SHA512 哈希
2. 校验通过 → 关闭主窗口 → 打开安装程序
3. 校验失败 → 显示失败界面
4. 自动更新模式: 通过 `spawnThen` 启动安装并传入 `--updated --force-run` 参数
