# 已知问题与错误码

> 本文档汇总 Electron 应用开发中的已知问题和常见错误码。

## Electron 已知问题

### GPU 进程崩溃 (exit code -1073741515)

**Issue**: [electron/electron#37862](https://github.com/electron/electron/issues/37862)

#### 基本信息

- **操作系统**: Windows 11 (多个版本,如 21H2、22H2)
- **Electron 版本**: 18.x ~ 35.x 均有复现
- **CPU/GPU**: AMD Ryzen + Radeon,Intel Iris Xe
- **特殊现象**: Electron 安装在 D 盘会崩溃,放在 C 盘正常

#### 复现现象

- 打开 Electron 应用时,GPU 进程立即退出
- 控制台日志示例:

```text
[25248:0405/224532.699:ERROR:gpu_process_host.cc(980)] GPU process exited unexpectedly: exit_code=-1073741515
[25248:0405/224533.117:FATAL:gpu_data_manager_impl_private.cc(450)] GPU process isn't usable. Goodbye.
```

#### 临时解决方案

1. **禁用沙箱**

```js
app.commandLine.appendSwitch("no-sandbox");
```

- 可避免崩溃,但可能影响 webview 功能

2. **GPU 进程内联运行**

```js
app.commandLine.appendSwitch("in-process-gpu");
```

3. **移动到系统盘 (C 盘)**

- 多数用户反馈有效

#### 问题可能原因

- 显卡驱动问题: AMD Radeon / Intel Iris Xe 均有人遇到
- Windows 文件路径或权限问题: 非系统盘路径可能导致 GPU 进程加载失败
- Electron 版本兼容性: 多版本均可复现,问题并未修复

#### 状态

- Issue 被标记为 **closed as not planned**
- 仍有用户在最新 Electron 版本复现

### DevTools "Autofill.enable" 错误

**Issue**: [electron/electron#41614](https://github.com/electron/electron/issues/41614)

#### 基本信息

- **操作系统**: macOS 14.1.1 (Apple Silicon arm64)
- **Electron 版本**: 29.x - 36.x
- **场景**: 打开 DevTools 或使用 `webContents.openDevTools()` 时控制台报错

#### 复现现象

```text
[25610:0505/145346.664851:ERROR:CONSOLE(1)] "Request Autofill.enable failed. {"code":-32601,"message":"'Autofill.enable' wasn't found"}", source: devtools://devtools/bundled/core/protocol_client/protocol_client.js (1)
```

- 错误不会阻止 DevTools 或 Vue DevTools 正常使用

#### 可能原因

- 与 Chrome DevTools 协议更新有关,`Autofill.enable` 在 Chromium DevTools 中注册,但 Electron 内部可能没有完全实现

#### 解决方案

1. **通过注入脚本屏蔽错误** (仅对第一次打开有效):

```js
app.on("web-contents-created", (event, contents) => {
  contents.on("devtools-opened", () =>
    contents.devToolsWebContents?.executeJavaScript(`
        (() => {
            const origErr = console.error;
            console.error = function (...args) {
                const s = String(args[0] ?? "");
                if (s.includes("Autofill.enable") || s.includes("Autofill.setAddresses")) return;
                return origErr.apply(console, args);
            };
        })()
    `)
  );
});
```

2. **完全忽略 Electron 日志** (不可见控制台错误):

```js
app.commandLine.appendSwitch("log-level", "3"); // FATAL
```

#### 官方态度

- 已知问题,但不影响功能,标记为 **wontfix / not planned**

## Chromium/Electron 错误码对照表

### 进程退出码

| 错误码 | 错误标识 | 中文说明 |
|--------|----------|----------|
| 1 | RESULT_CODE_KILLED | 进程被终止 |
| 2 | RESULT_CODE_HUNG | 进程无响应 |
| 3 | RESULT_CODE_KILLED_BAD_MESSAGE | 进程因错误消息被杀死 |
| 4 | RESULT_CODE_GPU_DEAD_ON_ARRIVAL | GPU 进程启动失败 |
| 5 | RESULT_CODE_INVALID_CMDLINE_URL | 命令行 URL 无效 |
| 6 | RESULT_CODE_BAD_PROCESS_TYPE | 进程类型错误 |
| 7 | RESULT_CODE_MISSING_DATA | 缺少必要数据 |
| 8 | RESULT_CODE_SHELL_INTEGRATION_FAILED | 系统集成失败 |
| 20 | RESULT_CODE_NORMAL_EXIT_CANCEL | 正常退出(取消操作) |
| 21 | RESULT_CODE_PROFILE_IN_USE | 用户配置文件正在使用中 |
| 22 | RESULT_CODE_PACK_EXTENSION_ERROR | 扩展打包失败 |
| 30 | RESULT_CODE_ACTION_DISALLOWED_BY_POLICY | 操作被策略禁止 |
| 31 | RESULT_CODE_INVALID_SANDBOX_STATE | 沙盒状态无效 |
| 34 | RESULT_CODE_GPU_EXIT_ON_CONTEXT_LOST | GPU 上下文丢失导致退出 |

### Linux/Unix 信号码

| 错误码 | 信号 | 中文说明 |
|--------|------|----------|
| 131 | SIGQUIT | 终端退出信号 |
| 132 | SIGILL | 非法指令 |
| 133 | SIGTRAP | 跟踪/断点陷阱 |
| 134 | SIGABRT | 程序异常终止(abort) |
| 135 | SIGBUS (7) | 总线错误(bus error) |
| 136 | SIGFPE | 浮点运算异常 |
| 137 | SIGKILL | 杀死进程(kill -9) |
| 139 | SIGSEGV | 内存访问违规(segmentation fault) |
| 140 | SIGSYS | 非法系统调用 |

### Windows 系统状态码

| 错误码 | 错误标识 | 中文说明 |
|--------|----------|----------|
| 258 | WAIT_TIMEOUT | 等待超时 |
| 7006 | SBOX_FATAL_INTEGRITY | 沙盒完整性检查失败 |
| 7007 | SBOX_FATAL_DROPTOKEN | 沙盒令牌丢失 |
| 7008 | SBOX_FATAL_FLUSHANDLES | 沙盒句柄刷新失败 |
| 7009 | SBOX_FATAL_CACHEDISABLE | 沙盒缓存禁用失败 |
| 7010 | SBOX_FATAL_CLOSEHANDLES | 沙盒关闭句柄失败 |
| 7011 | SBOX_FATAL_MITIGATION | 沙盒缓解失败 |
| 7012 | SBOX_FATAL_MEMORY_EXCEEDED | 沙盒内存超限 |
| 36861 | Crashpad_NotConnectedToHandler | Crashpad 未连接处理器 |
| 36862 | Crashpad_FailedToCaptureProcess | Crashpad 捕获进程失败 |
| 36863 | Crashpad_HandlerDidNotRespond | Crashpad 处理器无响应 |
| 85436397 | Crashpad_SimulatedCrash | Crashpad 模拟崩溃 |
| 529697949 | CPP_EH_EXCEPTION | C++ 异常 |
| 533692099 | STATUS_GUARD_PAGE_VIOLATION | 保护页违规 |
| 536870904 | Out of Memory | 内存不足 |

### Windows NT/Visual C++ 状态码

| 错误码 | 错误标识 | 中文说明 |
|--------|----------|----------|
| 1073740768 | STATUS_ASSERTION_FAILURE | 断言失败 |
| 1073740771 | STATUS_FATAL_USER_CALLBACK_EXCEPTION | 用户回调异常导致致命错误 |
| 1073740791 | STATUS_STACK_BUFFER_OVERRUN | 栈缓冲区溢出 |
| 1073740940 | STATUS_HEAP_CORRUPTION | 堆损坏 |
| 1073741510 | STATUS_CONTROL_C_EXIT | 用户按 Ctrl+C 退出 |
| 1073741515 | STATUS_DLL_NOT_FOUND | DLL 未找到 |
| 1073741819 | STATUS_ACCESS_VIOLATION | 访问冲突 |
| 1073741823 | STATUS_UNSUCCESSFUL | 操作失败 |
| 2147483645 | STATUS_BREAKPOINT | 断点触发 |
