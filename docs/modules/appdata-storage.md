# AppData Storage

> AppData Storage 是渲染进程与主进程之间共享应用数据的核心模块,基于 Vuex 和 IPC 通信实现双向同步。

## 数据字段总览

### 用户登录相关

| 键名 | 主要用途 |
|------|----------|
| loginStatus | 登录状态 (INITIAL/LOGINFINISH/ERROR/DISCONNECT) |
| keepLogin | 是否保持登录状态 |
| uid | 用户 ID |
| c_rid | 客户端请求 ID |
| c_email | 用户邮箱 |
| c_phone | 用户电话 |
| hid | 用户 HID |
| countrycode | 国家代码 |
| user_type | 用户类型 (ad/ldap 等) |
| c_phone_simple | 简化电话号码 |
| c_user_name | 用户名 |
| langI18n | 语言设置 |
| themeMode | 主题模式 |
| themeColor | 主题颜色 |
| loginMessage | 登录错误消息 |
| matrx_email | 矩阵邮箱 |
| isFirstLogin | 是否首次登录 |
| isPayUser | 是否为付费用户 |
| user_platforms | 用户平台 |

### 空间和会话管理

| 键名 | 主要用途 |
|------|----------|
| xx_spaceList | 空间列表 |
| xx_currentSpace | 当前空间 ID |
| xx_vuid | 虚拟用户 ID |
| xx_baseUCPath | 基础 UC 路径 |
| xx_preSpace | 上一个空间 ID |
| xx_spaceData | 空间数据 |
| xx_baseUserIdcPath | 基础用户 IDC 路径 |
| xx_imSdkGtwUrl | IM SDK 网关 URL |
| xx_crystalSslPath | Crystal SSL 路径 |
| xx_lgType | 登出类型 |
| xx_gp | 群组 pin 读取时间映射 |
| xx_basePFMPath | 基础 PFM 路径 |

### 会议相关

| 键名 | 主要用途 |
|------|----------|
| meetingInfo | 会议信息 |
| joinData | 加入会议数据 |
| meetingRoomListForGuest | 访客会议房间列表 |
| cstInitResp | CST 初始化响应 |
| serverList | 服务器列表 |
| hwMeetingJoinTimestamp | 华为会议加入时间戳 |
| cstLoginNotify | CST 登录通知 |
| sdk1V1AnswerId | SDK 1v1 应答 ID |
| interpreterRemoveAskAgain | 翻译移除确认 |

### 消息和聊天

| 键名 | 主要用途 |
|------|----------|
| c_socket_state | socket 状态 |
| imSdkOpen | IM SDK 是否开启 |
| RECEIPT_START_TIME | 回执开始时间 |
| c_scoket | 客户端 socket |
| CUSTOM_EMOJI | 自定义表情 |
| emojis_popular | 常用表情 |
| tempSpaceIdcMessages | 临时空间 IDC 消息 |

### UI 和设置

| 键名 | 主要用途 |
|------|----------|
| currentSessionWidth | 当前会话宽度 |
| menuSortKeys | 菜单排序键 |
| whiteList | 白名单 |
| leftMenuBarExpand | 左侧菜单栏展开状态 |
| spaceMenuSwitcher | 空间菜单开关 |
| currentInputHeightPercent | 输入框高度百分比 |
| collaboration_token | 协作令牌 |

### 功能开关

| 键名 | 主要用途 |
|------|----------|
| screen_unlock | 屏幕解锁状态 |
| Client_Debug_Sdk | SDK 调试模式 |
| imSdkGtwIdc1Url | IM SDK 网关 IDC1 URL |

### 其他

| 键名 | 主要用途 |
|------|----------|
| login_time | 登录时间 |
| login_ip | 登录 IP |
| x_vt | 验证时间戳 |
| localServerList | 本地服务器列表 |
| downloadedVersion | 下载版本 |
| server503 | 服务器 503 状态 |
| vList | 验证列表 |

## 初始化流程

### 渲染进程初始化

```js
const initAppdataStorage = require("@/tools/forwardDB/appdataStorage.js");
window.appdataStorage = initAppdataStorage(store);
```

### 核心实现

```js
module.exports = function (data) {
  store = data;

  const appdataStorage = {
    clear: function () {
      return store.dispatch("appdata/clear");
    },
    removeItem: function (key) {
      return store.dispatch("appdata/removeItem", key);
    },
    removeItemList: function (keys) {
      return store.dispatch("appdata/removeItemList", keys);
    },
    setItem: function (key, val) {
      return store.dispatch("appdata/setItem", {
        [key]: val,
      });
    },
    getKeys: function () {
      return Object.keys(store.state.appdata);
    },
    getItem: function (key, callback) {
      const value = store.state.appdata.getItem(key);
      callback && callback(value);
      return value;
    },
    getAllItem: function (callback) {
      callback && callback(store.state.appdata);
      return store.state.appdata;
    },
  };

  // Proxy 增强访问方式
  return new Proxy(appdataStorage, {
    get: function (target, propKey, receiver) {
      return Reflect.get(target, propKey, receiver) || target.getItem(propKey);
    },
    set: function (target, propKey, value, receiver) {
      target.setItem(propKey, value);
      return true;
    },
  });
};
```

### IPC 事件监听

| 事件名 | 作用 |
|--------|------|
| `get-appdataStorage` | 响应主进程的"获取数据"请求 |
| `set-appdataStorage` | 响应主进程的"设置数据"请求 |
| `syncAppdata` | 接收主进程推送的最新 appdata 数据 |

## renderInitAppdata 模块

### 功能说明

用于在 Electron 渲染进程中初始化应用全局数据(appdata):

- 从主进程同步存储内容(数据库或本地文件)
- 若主进程无法提供数据,则从 localStorage/encryptStorage 中兜底恢复
- 并将最终数据写入 Vuex store 与主进程存储保持一致

### 初始化函数

```js
export async function renderInitAppdata(store) {
  console.time("renderInitAppdata");
  let data = {};

  try {
    // 从主进程同步请求 appdata 数据
    data = ipcRenderer.sendSync("mainAppdata-init", {
      type: "renderInitAppdata",
    });

    if (data && data.hasOwnProperty("checkPermittedUrl")) {
      window.checkPermittedUrl = data.checkPermittedUrl;
      return;
    }

    if (data) {
      // 将数据同步到 Vuex 中
      if (store) {
        store.dispatch("appdata/setAppData", data);
      }
    } else {
      // 兜底逻辑: 从 localStorage 恢复
      let entries = Object.entries(localStorage);
      entries = entries.filter((item) => item[0] !== "xx_spaceData");

      let xx_spaceData = encryptStorage.getItem("xx_spaceData");
      if (xx_spaceData) {
        try {
          xx_spaceData = parseString(xx_spaceData);
          if (typeof xx_spaceData === "string") {
            xx_spaceData = parseString(encryptStorage.decrypt(xx_spaceData));
          }
        } catch (e) {
          xx_spaceData = {};
        }
        data = {
          xx_spaceData: tempData("xx_spaceData", xx_spaceData),
        };
      }

      for (let index = 0; index < entries.length; index++) {
        const [key, value] = entries[index];
        const item = tempData(key, parseString(value));
        data[key] = item;
      }

      if (store) {
        store.dispatch("appdata/setAppData", data);
      }

      // 同步写回主进程存储
      setItemList(Object.values(data), true);
    }
  } catch (e) {
    console.error("renderInitAppdata error:", e);
  }

  console.timeEnd("renderInitAppdata");
  return data;
}
```

### 辅助函数

```js
// 封装数据结构
export function tempData(key, value, expire, extra) {
  return {
    key: key,
    value: value,
    timestamp: getTimestamp(),
    expire: expire || 0,
    extra: extra || "",
  };
}

// 设置单个键值
export function setItem(key, value, expire, extra) {
  return ipcRenderer.invoke("mainAppdata", {
    type: "setItem",
    key,
    value: tempData(key, value, expire, extra),
  });
}

// 批量设置多个键值
export function setItemList(tempList, init) {
  return ipcRenderer.invoke("mainAppdata", {
    type: "setItemList",
    value: tempList,
    init: init,
  });
}

// 删除单个项
export function removeItem(key) {
  return ipcRenderer.invoke("mainAppdata", {
    type: "removeItem",
    key,
  });
}

// 删除多个项
export function removeItemList(keys) {
  return ipcRenderer.invoke("mainAppdata", {
    type: "removeItemList",
    key: keys,
  });
}

// 清空所有数据
export function clearAll() {
  return ipcRenderer.invoke("mainAppdata", {
    type: "clearAll",
  });
}

// 获取单个数据项
export function getItem(key) {
  return ipcRenderer.invoke("mainAppdata", {
    type: "getItem",
    key,
  });
}
```

## 使用示例

### 基本用法

```js
// 设置值
appdataStorage.setItem('uid', '12345');

// 获取值
const uid = appdataStorage.getItem('uid');

// 使用 Proxy 简化访问
appdataStorage.uid = '12345'; // 等价于 setItem
console.log(appdataStorage.uid); // 等价于 getItem

// 删除值
appdataStorage.removeItem('uid');

// 清空所有数据
appdataStorage.clear();
```

### 在组件中使用

```js
export default {
  mounted() {
    // 读取登录状态
    const loginStatus = appdataStorage.getItem('loginStatus');

    // 设置用户信息
    appdataStorage.setItem('c_user_name', 'John Doe');
  }
}
```
