# 错误码

我可以帮你整理一份 Chromium/Electron/CEF 的常见错误码对照表，并附上中文说明（部分码的中文说明根据系统或信号意义推测）：

| 错误码 | 错误标识                                   | 中文说明                          |
| ------ | ------------------------------------------ | --------------------------------- |
| 1      | RESULT_CODE_KILLED                         | 进程被终止                        |
| 2      | RESULT_CODE_HUNG                           | 进程无响应                        |
| 3      | RESULT_CODE_KILLED_BAD_MESSAGE             | 进程因错误消息被杀死              |
| 4      | RESULT_CODE_GPU_DEAD_ON_ARRIVAL            | GPU 进程启动失败                  |
| 5      | RESULT_CODE_INVALID_CMDLINE_URL            | 命令行 URL 无效                   |
| 6      | RESULT_CODE_BAD_PROCESS_TYPE               | 进程类型错误                      |
| 7      | RESULT_CODE_MISSING_DATA                   | 缺少必要数据                      |
| 8      | RESULT_CODE_SHELL_INTEGRATION_FAILED       | 系统集成失败                      |
| 9      | RESULT_CODE_MACHINE_LEVEL_INSTALL_EXISTS   | 系统级安装已存在                  |
| 10     | RESULT_CODE_UNINSTALL_CHROME_ALIVE         | 卸载时 Chrome 正在运行            |
| 11     | RESULT_CODE_UNINSTALL_USER_CANCEL          | 用户取消卸载                      |
| 12     | RESULT_CODE_UNINSTALL_DELETE_PROFILE       | 卸载删除用户资料                  |
| 13     | RESULT_CODE_UNSUPPORTED_PARAM              | 不支持的参数                      |
| 14     | RESULT_CODE_IMPORTER_HUNG                  | 导入程序无响应                    |
| 15     | RESULT_CODE_RESPAWN_FAILED                 | 重新启动进程失败                  |
| 16-19  | RESULT_CODE_NORMAL_EXIT_EXP1\~4            | 正常退出（实验用途）              |
| 20     | RESULT_CODE_NORMAL_EXIT_CANCEL             | 正常退出（取消操作）              |
| 21     | RESULT_CODE_PROFILE_IN_USE                 | 用户配置文件正在使用中            |
| 22     | RESULT_CODE_PACK_EXTENSION_ERROR           | 扩展打包失败                      |
| 23     | RESULT_CODE_UNINSTALL_EXTENSION_ERROR      | 卸载扩展失败                      |
| 24     | RESULT_CODE_NORMAL_EXIT_PROCESS_NOTIFIED   | 正常退出（进程已通知）            |
| 26     | RESULT_CODE_INSTALL_FROM_WEBSTORE_ERROR_2  | 从 WebStore 安装扩展失败          |
| 28     | RESULT_CODE_EULA_REFUSED                   | 用户拒绝 EULA（最终用户许可协议） |
| 29     | RESULT_CODE_SXS_MIGRATION_FAILED_NOT_USED  | SxS 迁移失败（未使用）            |
| 30     | RESULT_CODE_ACTION_DISALLOWED_BY_POLICY    | 操作被策略禁止                    |
| 31     | RESULT_CODE_INVALID_SANDBOX_STATE          | 沙盒状态无效                      |
| 32     | RESULT_CODE_CLOUD_POLICY_ENROLLMENT_FAILED | 云策略注册失败                    |
| 33     | RESULT_CODE_DOWNGRADE_AND_RELAUNCH         | 降级并重启                        |
| 34     | RESULT_CODE_GPU_EXIT_ON_CONTEXT_LOST       | GPU 上下文丢失导致退出            |
| 35     | RESULT_CODE_NORMAL_EXIT_UPGRADE_RELAUNCHED | 正常退出（升级后重启）            |

**常见 Linux/Unix 信号码：**

| 错误码 | 信号        | 中文说明                           |
| ------ | ----------- | ---------------------------------- |
| 131    | SIGQUIT     | 终端退出信号                       |
| 132    | SIGILL      | 非法指令                           |
| 133    | SIGTRAP     | 跟踪/断点陷阱                      |
| 134    | SIGABRT     | 程序异常终止（abort）              |
| 135    | SIGBUS (7)  | 总线错误（bus error）              |
| 136    | SIGFPE      | 浮点运算异常                       |
| 137    | SIGKILL     | 杀死进程（kill -9）                |
| 138    | SIGBUS (10) | 总线错误（bus error）              |
| 139    | SIGSEGV     | 内存访问违规（segmentation fault） |
| 140    | SIGSYS      | 非法系统调用                       |

**Windows 及 Crashpad / 系统状态码：**

| 错误码    | 错误标识                        | 中文说明              |
| --------- | ------------------------------- | --------------------- |
| 258       | WAIT_TIMEOUT                    | 等待超时              |
| 7006      | SBOX_FATAL_INTEGRITY            | 沙盒完整性检查失败    |
| 7007      | SBOX_FATAL_DROPTOKEN            | 沙盒令牌丢失          |
| 7008      | SBOX_FATAL_FLUSHANDLES          | 沙盒句柄刷新失败      |
| 7009      | SBOX_FATAL_CACHEDISABLE         | 沙盒缓存禁用失败      |
| 7010      | SBOX_FATAL_CLOSEHANDLES         | 沙盒关闭句柄失败      |
| 7011      | SBOX_FATAL_MITIGATION           | 沙盒缓解失败          |
| 7012      | SBOX_FATAL_MEMORY_EXCEEDED      | 沙盒内存超限          |
| 7013      | SBOX_FATAL_WARMUP               | 沙盒初始化失败        |
| 36861     | Crashpad_NotConnectedToHandler  | Crashpad 未连接处理器 |
| 36862     | Crashpad_FailedToCaptureProcess | Crashpad 捕获进程失败 |
| 36863     | Crashpad_HandlerDidNotRespond   | Crashpad 处理器无响应 |
| 85436397  | Crashpad_SimulatedCrash         | Crashpad 模拟崩溃     |
| 529697949 | CPP_EH_EXCEPTION                | C++ 异常              |
| 533692099 | STATUS_GUARD_PAGE_VIOLATION     | 保护页违规            |
| 536870904 | Out of Memory                   | 内存不足              |

**Windows NT/Visual C++ 状态码示例：**

| 错误码     | 中文说明                             |                          |
| ---------- | ------------------------------------ | ------------------------ |
| 1073740768 | STATUS_ASSERTION_FAILURE             | 断言失败                 |
| 1073740771 | STATUS_FATAL_USER_CALLBACK_EXCEPTION | 用户回调异常导致致命错误 |
| 1073740791 | STATUS_STACK_BUFFER_OVERRUN          | 栈缓冲区溢出             |
| 1073740940 | STATUS_HEAP_CORRUPTION               | 堆损坏                   |
| 1073741510 | STATUS_CONTROL_C_EXIT                | 用户按 Ctrl+C 退出       |
| 1073741515 | STATUS_DLL_NOT_FOUND                 | DLL 未找到               |
| 1073741819 | STATUS_ACCESS_VIOLATION              | 访问冲突                 |
| 1073741823 | STATUS_UNSUCCESSFUL                  | 操作失败                 |
| 2147483645 | STATUS_BREAKPOINT                    | 断点触发                 |

这张表只是整理了一部分常用的错误码，对于 Electron/CEF 开发者，可以用来快速排查进程崩溃、沙盒、GPU、信号或系统调用失败的情况。

如果你需要，我可以帮你生成 **完整的按数值排序、带中文说明的 Chromium/Electron 错误码完整表格（Excel/Markdown 版）**，方便查询和引用。

你希望我直接生成吗？
