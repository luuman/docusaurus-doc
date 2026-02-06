# appdataStorage

```js
const initAppdataStorage = require("@/tools/forwardDB/appdataStorage.js");
window.appdataStorage = initAppdataStorage(store);
```

```js
// import store from '@/store/index';
import { ipcRenderer } from "electron";
// console.log('store', store);
let store;

/**
 * 模块导出函数
 * @param {Object} data - Vuex 的 store 实例
 * @returns {Proxy} appdataStorage 的代理对象
 */
module.exports = function (data) {
  // 接收外部传入的 Vuex store
  store = data;

  /**
   * appdataStorage：封装对 Vuex 模块 appdata 的操作接口
   * 提供统一的 set/get/remove 等方法，
   * 并用于与主进程进行 IPC 数据同步。
   */
  const appdataStorage = {
    /** 清空所有 appdata 数据 */
    clear: function () {
      return store.dispatch("appdata/clear");
    },

    /** 删除单个 key */
    removeItem: function (key) {
      return store.dispatch("appdata/removeItem", key);
    },

    /** 批量删除多个 key */
    removeItemList: function (keys) {
      return store.dispatch("appdata/removeItemList", keys);
    },

    /** 设置指定 key 的值 */
    setItem: function (key, val) {
      return store.dispatch("appdata/setItem", {
        [key]: val,
      });
    },

    /** 获取所有存储的 key 列表 */
    getKeys: function () {
      return Object.keys(store.state.appdata);
    },

    /**
     * 获取单个 key 的值
     * @param {String} key
     * @param {Function} callback (可选) 回调函数
     */
    getItem: function (key, callback) {
      // store.state.appdata.getItem() 假设是一个 getter 函数
      const value = store.state.appdata.getItem(key);
      callback && callback(value);
      return value;
    },

    /**
     * 获取全部存储内容
     * @param {Function} callback (可选)
     */
    getAllItem: function (callback) {
      callback && callback(store.state.appdata);
      return store.state.appdata;
    },
  };

  /**
   * 监听主进程请求：获取 appdataStorage 数据
   * @event get-appdataStorage
   * @param {Object} data - 请求参数，可能包含 key 或 key 数组
   */
  ipcRenderer.on("get-appdataStorage", (e, data) => {
    console.log("appdataStorage", data);
    if (data.key) {
      if (Array.isArray(data.key)) {
        // 批量获取多个 key
        let arr = [];
        data.key.forEach((ele) => {
          arr.push(appdataStorage.getItem(ele));
        });
        e.sender.send("get-appdataStorage-res", arr);
      } else {
        // 获取单个 key
        e.sender.send(
          "get-appdataStorage-res",
          appdataStorage.getItem(data.key)
        );
      }
    } else {
      // 获取所有数据
      e.sender.send("get-appdataStorage-res", appdataStorage.getAllItem());
    }
  });

  /**
   * 监听主进程设置 appdataStorage 数据事件
   * @event set-appdataStorage
   * @param {Object} data - 包含 key 与 value
   * @param {Boolean} sync - 是否需要同步回主进程
   */
  ipcRenderer.on("set-appdataStorage", async (e, data, sync) => {
    console.log("set appdataStorage", data);
    if (data.key) {
      await appdataStorage.setItem(data.key, data.value);
      // 如果需要同步，则通知主进程更新缓存
      if (sync) {
        ipcRenderer.send("syncAppdata");
      }
    }
  });

  /**
   * 从主进程接收同步的 appdata 数据
   * @event syncAppdata
   */
  ipcRenderer.on("syncAppdata", (e, data) => {
    console.log("syncAppdata", data);
    if (data) {
      // 分发 Vuex action 更新前端 store
      store.dispatch("appdata/setAppData", data);
    }
  });

  /**
   * Proxy 用于增强 appdataStorage：
   * - 直接访问属性时可隐式 getItem()
   * - 直接赋值时可隐式 setItem()
   * 例如：
   *   appdataStorage.username = 'Tom' → 等价于 setItem('username', 'Tom')
   *   console.log(appdataStorage.username) → 等价于 getItem('username')
   */
  return new Proxy(appdataStorage, {
    get: function (target, propKey, receiver) {
      // 优先返回对象原有方法，否则尝试从 state 中读取
      return Reflect.get(target, propKey, receiver) || target.getItem(propKey);
    },
    set: function (target, propKey, value, receiver) {
      // 直接赋值时自动调用 setItem
      target.setItem(propKey, value);
      return true;
    },
  });
};
```

### 📘 代码逻辑说明概览

| 模块                                   | 功能说明                                                       |
| -------------------------------------- | -------------------------------------------------------------- |
| `store.dispatch('appdata/...')`        | 调用 Vuex 的 appdata 模块，实现存取删除                        |
| `ipcRenderer.on('get-appdataStorage')` | 响应主进程的“获取数据”请求                                     |
| `ipcRenderer.on('set-appdataStorage')` | 响应主进程的“设置数据”请求                                     |
| `ipcRenderer.on('syncAppdata')`        | 接收主进程推送的最新 appdata 数据                              |
| `Proxy`                                | 提供简化访问方式，使得 `storage.key` 类似于 `localStorage.key` |
