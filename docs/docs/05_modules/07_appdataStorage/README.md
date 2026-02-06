# appdataStorage

> 模块位置：`src/tools/forwardDB/appdataStorage.js`
> 依赖环境：**Electron Renderer 进程 + Vuex Store**

## 📘 一、模块简介

`appdataStorage` 是一个基于 **Vuex + Electron IPC** 的轻量级数据存储封装，用于在渲染进程中访问和管理应用数据，同时支持与主进程同步。

它的设计灵感来源于 `localStorage`，但增强了：

- ✅ Vuex 状态管理（可响应式更新）
- ✅ Electron IPC 数据同步机制
- ✅ 批量操作与 Proxy 自动访问

## ⚙️ 二、模块初始化

### 导入与挂载

在应用启动（如 `main.js` 或 `App.vue`）中初始化：

```js
import initAppdataStorage from "@/tools/forwardDB/appdataStorage.js";
import store from "@/store";

window.appdataStorage = initAppdataStorage(store);
```

> ⚠️ 注意：必须在 Vuex `store` 初始化后调用。
> 初始化后，`appdataStorage` 会被挂载到 `window` 全局对象中。

## 📦 三、核心功能列表

| 方法名                    | 参数                  | 返回            | 说明             |
| ------------------------- | --------------------- | --------------- | ---------------- |
| `setItem(key, value)`     | `String`, `Any`       | `Promise`       | 设置单个键值     |
| `getItem(key, callback?)` | `String`, `Function?` | `Any`           | 获取单个键值     |
| `getAllItem(callback?)`   | `Function?`           | `Object`        | 获取所有存储内容 |
| `getKeys()`               | 无                    | `Array<String>` | 获取所有键名     |
| `removeItem(key)`         | `String`              | `Promise`       | 删除指定键       |
| `removeItemList(keys)`    | `Array<String>`       | `Promise`       | 批量删除键       |
| `clear()`                 | 无                    | `Promise`       | 清空所有数据     |

## 🧠 四、代理访问（Proxy 特性）

模块返回的是一个 Proxy 对象，因此你可以像操作普通对象一样使用：

```js
// ✅ 设置值
appdataStorage.username = "Tom";

// ✅ 获取值
console.log(appdataStorage.username);

// ✅ 删除键
appdataStorage.removeItem("username");

// ✅ 批量操作
appdataStorage.removeItemList(["token", "session"]);
```

等价于：

```js
appdataStorage.setItem("username", "Tom");
appdataStorage.getItem("username");
```

## 🔄 五、主进程通信说明

`appdataStorage` 与主进程通过 `ipcRenderer` 进行数据同步。

### 事件列表

| 渲染进程监听事件     | 来源   | 功能说明                                  |
| -------------------- | ------ | ----------------------------------------- |
| `get-appdataStorage` | 主进程 | 主进程请求渲染进程获取数据                |
| `set-appdataStorage` | 主进程 | 主进程要求渲染进程更新指定 key            |
| `syncAppdata`        | 主进程 | 主进程推送最新 appdata 数据，用于状态同步 |

| 渲染进程发送事件         | 目标   | 功能说明                     |
| ------------------------ | ------ | ---------------------------- |
| `get-appdataStorage-res` | 主进程 | 返回主进程请求的数据结果     |
| `syncAppdata`            | 主进程 | 数据更新后主动通知主进程同步 |

## 📡 六、主进程通信示例

### 主进程获取数据

```js
// main.js
ipcMain.on("get-appdataStorage", (event, args) => {
  // 请求渲染进程数据
  mainWindow.webContents.send("get-appdataStorage", args);

  // 监听返回
  ipcMain.once("get-appdataStorage-res", (e, result) => {
    console.log("appdataStorage data:", result);
  });
});
```

### 主进程设置数据

```js
ipcMain.on("update-appdata", (event, data) => {
  mainWindow.webContents.send(
    "set-appdataStorage",
    {
      key: "theme",
      value: "dark",
    },
    true
  ); // true 表示更新后同步回主进程
});
```

## 🧩 七、Vuex 模块依赖说明

`appdataStorage` 依赖于 Vuex 模块：`appdata`
该模块需实现以下 action / state：

```js
// store/modules/appdata.js
export default {
  namespaced: true,
  state: {},

  mutations: {
    SET_ITEM(state, payload) {
      Object.assign(state, payload);
    },
    CLEAR(state) {
      Object.keys(state).forEach((k) => delete state[k]);
    },
  },

  actions: {
    setItem({ commit }, data) {
      commit("SET_ITEM", data);
    },
    removeItem({ state }, key) {
      delete state[key];
    },
    removeItemList({ state }, keys) {
      keys.forEach((k) => delete state[k]);
    },
    clear({ commit }) {
      commit("CLEAR");
    },
    setAppData({ commit }, data) {
      commit("SET_ITEM", data);
    },
  },
};
```

## 💡 八、典型使用场景

### 1. 缓存登录信息

```js
appdataStorage.setItem("userInfo", { name: "Alice", token: "xxxxxx" });
```

### 2. 读取全局配置

```js
const config = appdataStorage.getItem("globalConfig");
```

### 3. 主进程同步更新设置

```js
ipcRenderer.send("set-appdataStorage", { key: "theme", value: "dark" }, true);
```

## 🧰 九、错误与调试

- 所有内部操作都通过 `store.dispatch()` 实现，调试时可通过 Vue Devtools 查看数据变化。
- `ipcRenderer` 事件均带 `console.log` 输出，可追踪主/渲染通信。
- 若访问不到 `store.state.appdata.getItem`，请确认模块中是否实现该函数或改用 `state[key]`。

## 📁 十、完整初始化示例

```js
// src/main.js
import Vue from "vue";
import App from "./App.vue";
import store from "./store";
import initAppdataStorage from "@/tools/forwardDB/appdataStorage.js";

window.appdataStorage = initAppdataStorage(store);

new Vue({
  store,
  render: (h) => h(App),
}).$mount("#app");
```
