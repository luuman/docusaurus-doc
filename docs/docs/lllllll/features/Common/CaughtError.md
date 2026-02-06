# 错误机制

> getErrorFromCode

错误码映射国际化信息

| 错误码 | 类型    | 国际化 Key / 说明              | 展示内容（含 `[sXXX]` 后缀） |
| ------ | ------- | ------------------------------ | ---------------------------- |
| 801    | 普通    | `no_owner_error`               | 无群主 \[s801]               |
| 802    | 普通    | `no_contact_error`             | 无联系人 \[s802]             |
| 803    | 普通    | `no_member_error`              | 无成员 \[s803]               |
| 804    | 普通    | `number_limit_error`           | 成员数量限制 \[s804]         |
| 406    | warning | `local_time_error`             | 本地时间错误 \[s406]         |
| 500    | warning | `code500`                      | 服务器内部错误 \[s500]       |
| 601    | warning | `code_pure_error`              | 验证码非法 \[s601]           |
| 603    | warning | `startTime_time_error`         | 开始时间无效 \[s603]         |
| 604    | warning | `meeting_repeat_error`         | 会议重复创建 \[s604]         |
| 605    | warning | `startTime_limit_error`        | 开始时间超限 \[s605]         |
| 606    | warning | `code_times_error`             | 验证码次数超限 \[s606]       |
| 608    | warning | `Panel.invitedMaximum`         | 邀请人数已达上限 \[s608]     |
| 611    | warning | `meeting_edit_error`           | 会议不可编辑 \[s611]         |
| 612    | warning | `meeting_end_error`            | 会议已结束 \[s612]           |
| 613    | warning | `meeting_edit_error`（同 611） | 会议不可编辑 \[s613]         |
| 614    | warning | `meeting_not_started`          | 会议尚未开始 \[s614]         |
| 615    | warning | `editAfterMeeting`             | 会议结束后不可编辑 \[s615]   |
| 620    | warning | `phone_addr_error`             | 手机号格式错误 \[s620]       |
| 630    | warning | `meeting_net_error`            | 网络异常 \[s630]             |
| 632    | warning | `code632`                      | 系统提示信息 \[s632]         |
| 640    | warning | `code640`                      | 系统提示信息 \[s640]         |
| 645    | warning | `code645`                      | 系统提示信息 \[s645]         |
| 647    | warning | `code647`                      | 系统提示信息 \[s647]         |
| 649    | warning | `code649`                      | 系统提示信息 \[s649]         |
| 1004   | warning | `MeetingCanceled`              | 会议被取消                   |
| 1005   | warning | `MeetingEnd`                   | 会议已结束                   |
| 40007  | warning | `createMeetingLimit`           | 创建会议达到上限             |
| 100001 | warning | `Server.100001`                | 服务端错误                   |
| 41117  | warning | `Server.41117`                 | 服务端错误                   |

> ignoreErrorCodeList

忽略提示的错误码列表

| 忽略错误码           |
| -------------------- |
| 50014                |
| 50015                |
| 50060                |
| 50064                |
| 50065                |
| 50097                |
| 50098                |
| 50099                |
| 700                  |
| 641\~644             |
| 102000612\~102000617 |
| 102000619\~102000622 |
| 102000626\~102000627 |
| -10003               |
| -20002               |
| -20004               |

## 引入依赖

```ts
// 引入 element-ui 的自定义 Loading 组件（做过 fix）
import { ElLoading as Loading } from "@/config/element.fix";
// 国际化实例
import i18n from "@/lang";
// 日志打印工具（dev 环境日志）
import devLog from "@/logs/devLog";
// SDK 错误码字典
import sdkcode from "@/utils/sdk/sdkcode";

// Electron 渲染进程通信模块
const { ipcRenderer } = require("electron");

// 全局 Message 弹窗（可能是 ElementUI 或定制版）
const Message = window.$message;
```

## 函数

### 忽略提示的错误码列表

```ts
const ignoreErrorCodeList = [50014, 50015, 50099, ...-20004];
```

### 错误码映射国际化信息

```ts
export function getErrorFromCode(code) {
    let codeErrMap = {
        802: i18n.t('no_contact_error') + ` [s802]`,
        ...
        41117: {
            message: i18n.t('Server.41117'),
            type: 'warning'
        }
    };
    return codeErrMap[code];
}
```

### 自定义异常类定义

```ts
export class IgnoreException extends Error {
  originData = null;
  constructor(data) {
    super();
    this.originData = data;
  }
}
```

`IgnoreException` 用于捕获但不弹窗提示的异常类型

```ts
export class PlainException extends Error {
  msg = "";
  code = "";
  constructor(msg, code = "") {
    super();
    this.msg = msg;
    this.code = code;
  }
}
```

`PlainException` 用于普通错误提示（业务抛出）。

### 异步操作包装器

包装异步函数统一处理错误与 Loading

```ts
export async function errorWith(
  fn,
  options = { loading: "full", duration: 0 }
) {
  let loadingHold = null;
  let loading = options.loading;
  let duration = options.duration;
  let customTimer = null;

  try {
    if (loading == "custom") {
      // 可实现延时 loading（未启用）
    } else if (loading == "full") {
      loadingHold = showLockLoading("", duration);
    }

    await fn(); // 执行目标函数
  } catch (e) {
    console.error("[error]: ", "++errorwith", e);
    devLog.error("errorwith catch:", e); // 开发调试日志
    showError(e); // 弹窗错误提示
  } finally {
    // 收尾关闭 Loading
    if (loading == "custom") {
      clearTimeout(customTimer);
    } else if (loading == "full") {
      closeLoading(loadingHold);
    }
  }
}
```

包装异步函数 `fn`，在执行期间显示 Loading，错误统一处理。

参数说明：

- `loading`: `'full'` | `'custom'` | `'none'`
- `duration`: Loading 延迟时间

### 显示各种 Loading

```ts
// 立即显示全屏遮罩
export function showLockLoadingImmediately() {
  return Loading.service({
    lock: true,
    text: "",
    spinner: "el-icon-loading-custom",
    background: "rgba(0, 0, 0, 0.7)",
  });
}
```

```ts
// 显示带遮罩的 Loading（可自定义背景色、是否锁定）
export function showCloseAbleLoading(bg, isLock = false, timer = 0) {
  return Loading.service({
    lock: isLock,
    text: "",
    spinner: "el-icon-loading-custom",
    background: bg || "rgba(0, 0, 0, 0.3)",
  });
}
```

```ts
// 默认封装：全屏锁定型 Loading
export function showLockLoading(bg, duration) {
  return showCloseAbleLoading(bg, true, duration);
}
```

---

### 关闭 Loading（单个）

```ts
export function closeLoading(loading) {
  if (loading) {
    loading?.close();
  }
}
```

### Electron 窗口加载提示（BrowserView）

```ts
// 显示 electron 子窗口遮罩 loading（暂未启用）
export function showBrowserViewLoading(text) {
  console.log("showBrowserViewLoading", text);
  return 1;
}
```

```ts
// 关闭 BrowserView loading，通知主进程移除窗口
export function closeBrowserViewLoading(location) {
  console.log("closeBrowserViewLoading", location);
  setTimeout(() => {
    ipcRenderer.send("Remove-Loading-App");
  }, 300);
}
```

### 错误展示封装

```ts
export function showError(e, bizErrorHandle) {
  return showCaughtError(bizErrorHandle)(e);
}
```

```ts
export function showCaughtError(bizErrorHandle) {
  return (e) => {
    if (e instanceof PlainException) {
      Message(e.msg); // 自定义业务异常
    } else if (e instanceof IgnoreException) {
      // 忽略处理
    } else if (e.responseHeader) {
      if (bizErrorHandle) {
        bizErrorHandle(e); // 业务自定义处理
      } else {
        if (ignoreErrorCodeList.includes(e.responseHeader?.status)) {
          Message(e.responseHeader.msg); // 提示 msg
        } else {
          // 错误码 + 文案映射
          const msg =
            (e.responseHeader.msg || "") +
            (String(e.responseHeader.status)
              ? ` [s${e.responseHeader.status}]`
              : "");
          Message(getErrorFromCode(e.responseHeader.status) || msg);
        }
      }
    } else {
      // response 结构异常，降级处理
      let statusA = ((e || {}).response || {}).status || "";
      const msg = sdkcode[e?.responseHeader?.status || e?.code];

      if (msg) {
        Message({ type: "warning", message: `${msg}` });
      } else if (statusA === 0) {
        Message(i18n.t("network_connect_check")); // 网络断开
      } else if (statusA == "") {
        Message({
          dangerouslyUseHTMLString: true,
          message: i18n.t("meeting_net_error"),
        });
      } else if (statusA === 500) {
        Message({
          dangerouslyUseHTMLString: true,
          message: i18n.t("code500") + ` [s500]`,
        });
      } else {
        Message("Connection " + statusA + " error : " + e.message); // Fallback
      }
    }
  };
}
```

### 单个区域 Loading

```ts
let curLoading = null;

// 局部加载遮罩（非全屏）
export function showOneLoading(bg) {
  curLoading = Loading.service({
    fullscreen: false,
    lock: true,
    target: document.body,
    spinner: "el-icon-loading-custom",
    background: bg || "rgba(0,0,0,0.4)",
  });
  return curLoading;
}
```

```ts
// 关闭当前 Loading（若传入则关闭指定）
export function closeOneLoading(loading) {
  if (loading) {
    loading.close();
  } else if (curLoading) {
    curLoading.close();
  } else {
    closeAllLoading();
  }
}
```

---

### 强制移除所有 Loading 遮罩（清理异常遗留）

```ts
export function closeAllLoading() {
  const loadings = document.getElementsByClassName("el-loading-mask");
  if (loadings && loadings.length) {
    for (let i = 0; i < loadings.length; i++) {
      loadings[i].remove();
    }
  }
}
```

兼容 ElementUI 可能残留的 Loading 遮罩，直接 DOM 清理。

## 总结

本模块的作用是统一处理：

- 异常抛出（标准化封装）
- 异步函数 try/catch 包装
- 全局 Loading 管理（支持多种模式）
- 错误提示展示（国际化、按需展示）

如需继续扩展：

- 可增加错误码分组管理
- 与 `logMonitor` 等监控模块打通
- 加入错误上报功能（如 Sentry）

如需我进一步帮你重构模块结构或提取公共逻辑，也可以继续说明。
