# renderInitAppdata

```js
import { ipcRenderer } from "electron";
import { getTimestamp } from "@/utils/timestampFix";
import devLog from "@/logs/devLog";

// =========================
// 🧩 AppData 渲染进程端模块
// =========================
//
// 用途：
//  - 在 Electron 渲染进程中初始化应用全局数据（appdata）
//  - 从主进程同步存储内容（数据库或本地文件）
//  - 若主进程无法提供数据，则从 localStorage/encryptStorage 中兜底恢复
//  - 并将最终数据写入 Vuex store 与主进程存储保持一致
//

/**
 * 初始化应用数据（在渲染进程调用）
 * @param {Object} store - Vuex store 实例，用于同步全局 appdata
 * @returns {Promise<Object>} 返回加载的全量 appdata 数据对象
 */
export async function renderInitAppdata(store) {
  console.time("renderInitAppdata"); // 性能日志：整个初始化耗时
  let data = {};

  try {
    console.time("getAllAppData");
    devLog.log("main renderInitAppdata");

    // 🚀 从主进程同步请求 appdata 数据
    // 注意：sendSync 是同步调用，会阻塞 UI 线程
    // 建议后续优化为 ipcRenderer.invoke('mainAppdata-init', {...})
    data = ipcRenderer.sendSync("mainAppdata-init", {
      type: "renderInitAppdata",
    });

    console.log("renderInitAppdata data", data);
    console.timeEnd("getAllAppData");

    // 🧱 如果主进程返回了 checkPermittedUrl 字段
    // 通常是访问权限检测结果，直接挂载到全局
    if (data && data.hasOwnProperty("checkPermittedUrl")) {
      devLog.warn(
        "main renderInitAppdata checkPermittedUrl",
        data.checkPermittedUrl
      );
      window.checkPermittedUrl = data.checkPermittedUrl;
      return;
    }

    // ✅ 如果主进程成功返回有效数据
    if (data) {
      devLog.log("main renderInitAppdata00", data);
      console.log("existsSync");
      if (store) {
        // 将数据同步到 Vuex 中
        store.dispatch("appdata/setAppData", data);
      }
    } else {
      // ⚠️ 如果主进程未返回数据（兜底逻辑）
      console.log("entries");
      let entries = Object.entries(localStorage);
      devLog.log("main localStorage", entries);

      // 过滤掉特定 key（xx_spaceData 需单独处理）
      entries = entries.filter((item) => item[0] !== "xx_spaceData");

      // 从加密存储中读取空间数据
      let xx_spaceData = encryptStorage.getItem("xx_spaceData");

      if (xx_spaceData) {
        try {
          // 尝试解析 JSON 或加密内容
          xx_spaceData = parseString(xx_spaceData);
          if (typeof xx_spaceData === "string") {
            xx_spaceData = parseString(encryptStorage.decrypt(xx_spaceData));
          }
        } catch (e) {
          devLog.error("renderInitAppdata catch", e, xx_spaceData);
          xx_spaceData = {};
        }
        // 将 xx_spaceData 封装成统一结构
        data = {
          xx_spaceData: tempData("xx_spaceData", xx_spaceData),
        };
      } else {
        data = {};
      }

      // 遍历 localStorage 其它项并封装
      for (let index = 0; index < entries.length; index++) {
        const [key, value] = entries[index];
        const item = tempData(key, parseString(value));
        data[key] = item;
      }

      console.log("data00", data);
      devLog.log("main renderInitAppdata11", data);

      // 将恢复的数据写入 Vuex
      if (store) {
        store.dispatch("appdata/setAppData", data);
      }

      // 同步写回主进程存储
      setItemList(Object.values(data), true);

      // 设置登录状态为初始化态
      ipcRenderer.send("setStore", "storage.loginStatus", "INITIAL");
      ipcRenderer.send("setStore", "storage.keepLogin", false);
    }
  } catch (e) {
    console.error("renderInitAppdata error:", e);
    devLog.error("renderInitAppdata error:", e);
  }

  console.timeEnd("renderInitAppdata");
  return data;
}

/**
 * 封装数据结构，用于统一管理 appdata
 * @param {string} key 键名
 * @param {any} value 数据值
 * @param {number} [expire=0] 过期时间（时间戳）
 * @param {string} [extra=''] 额外信息
 * @returns {Object} 标准化的临时数据对象
 */
export function tempData(key, value, expire, extra) {
  const res = {
    key: key,
    value: value,
    timestamp: getTimestamp(), // 当前时间戳
    expire: expire || 0,
    extra: extra || "",
  };
  return res;
}

/**
 * 安全解析字符串，如果为 JSON 格式则解析，否则原样返回
 * @param {string} str - 待解析字符串
 * @returns {any} 解析结果
 */
function parseString(str) {
  try {
    if (["[", "{"].includes(str[0])) {
      return JSON.parse(str);
    } else {
      return str;
    }
  } catch (e) {
    console.error("parseString", e);
    return str;
  }
}

/**
 * 设置单个键值
 * @param {string} key
 * @param {any} value
 * @param {number} [expire]
 * @param {string} [extra]
 */
export function setItem(key, value, expire, extra) {
  return ipcRenderer.invoke("mainAppdata", {
    type: "setItem",
    key,
    value: tempData(key, value, expire, extra),
  });
}

/**
 * 批量设置多个键值（常用于初始化）
 * @param {Array<Object>} tempList
 * @param {boolean} init 是否初始化阶段
 */
export function setItemList(tempList, init) {
  return ipcRenderer.invoke("mainAppdata", {
    type: "setItemList",
    value: tempList,
    init: init,
  });
}

/**
 * 删除单个项
 * @param {string} key
 */
export function removeItem(key) {
  return ipcRenderer.invoke("mainAppdata", {
    type: "removeItem",
    key,
  });
}

/**
 * 删除多个项
 * @param {string[]} keys
 */
export function removeItemList(keys) {
  return ipcRenderer.invoke("mainAppdata", {
    type: "removeItemList",
    key: keys,
  });
}

/**
 * 清空所有数据
 */
export function clearAll() {
  return ipcRenderer.invoke("mainAppdata", {
    type: "clearAll",
  });
}

/**
 * 获取单个数据项
 * @param {string} key
 * @returns {Promise<any>}
 */
export function getItem(key) {
  return ipcRenderer.invoke("mainAppdata", {
    type: "getItem",
    key,
  });
}
```

### 💡 补充说明

| 模块                                               | 作用                           |
| -------------------------------------------------- | ------------------------------ |
| `renderInitAppdata()`                              | 应用启动时调用，负责初始化数据 |
| `tempData()`                                       | 标准化每条 appdata 的数据结构  |
| `parseString()`                                    | 安全解析字符串内容             |
| `setItem()` / `setItemList()`                      | 更新数据到主进程               |
| `removeItem()` / `removeItemList()` / `clearAll()` | 删除或清空数据                 |
| `getItem()`                                        | 从主进程获取单个键值           |

是否希望我再帮你把这个文件改造成更现代的 **异步 + 类型安全（TypeScript）版本**？
那样可以避免 `sendSync` 阻塞，并提供更清晰的接口约束。
