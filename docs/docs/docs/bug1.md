# [Bug]: GPU process crashes with exit code -1073741515 #37862

我帮你整理一下这个 GitHub issue 中关于 **Electron GPU 进程崩溃（exit code -1073741515）** 的关键信息：

---

## 1. 基本信息

- **Issue 标题**: GPU process crashes with exit code -1073741515
- **仓库**: [electron/electron](https://github.com/electron/electron/issues/37862)
- **操作系统**: Windows 11（多个版本，如 21H2、22H2）
- **Electron 版本**: 从 18.x 到最新的 35.x 均有人复现
- **CPU/GPU**: 有些机器使用 AMD Ryzen + Radeon，部分 Intel Iris Xe
- **安装路径**: 若 Electron 目录放在 **D 盘** 会崩溃，放在 **C 盘** 正常

---

## 2. 复现现象

- 打开 Electron 应用时，**GPU 进程立即退出**
- 控制台日志示例：

```text
[25248:0405/224532.699:ERROR:gpu_process_host.cc(980)] GPU process exited unexpectedly: exit_code=-1073741515
[25248:0405/224533.117:FATAL:gpu_data_manager_impl_private.cc(450)] GPU process isn't usable. Goodbye.
```

- **特点**:

  - 仅在部分磁盘（D 盘）出现
  - 与显卡驱动相关（有独立/集成显卡）
  - 使用 `app.commandLine.appendSwitch('no-sandbox');` 可以绕过，但会有副作用（如 webview 不能用）
  - 也有人尝试 `app.commandLine.appendSwitch('in-process-gpu');` 解决，但影响有限

---

## 3. 复现案例/评论

- **as1006**: Win11 Home，D 盘运行崩溃，C 盘正常
- **rtugeek**: AMD Ryzen + Radeon，Electron 19.1.0/22.3.10，提示 GPU driver 版本 27.20.11028.10001
- **lilitttaa / zhengwei-coding**: Electron 25.x/30.x 仍复现，Intel Iris Xe GPU
- **ibertli**: 移动项目到桌面（C 盘）可解决
- **tanhh326**: Electron 35.x，GPU 子进程崩溃，exitCode=-1073741515

---

## 4. 临时解决方案

1. **禁用沙箱**

```js
app.commandLine.appendSwitch("no-sandbox");
```

- 可避免崩溃，但可能影响 webview 功能

2. **GPU 进程内联运行**

```js
app.commandLine.appendSwitch("in-process-gpu");
```

- 可以解决部分问题，但有副作用

3. **移动 Electron 到系统盘（C 盘）**

- 多数用户反馈有效

---

## 5. 问题可能原因

- **显卡驱动问题**：AMD Radeon / Intel Iris Xe 均有人遇到
- **Windows 文件路径或权限问题**：非系统盘路径可能导致 GPU 进程加载失败
- **Electron 版本兼容性**：多版本均可复现，问题并未修复

---

## 6. 状态

- Issue 被标记为 **stale**
- 2023-10-01 标记为 **closed as not planned**
- 仍有用户在最新 Electron 版本复现

---

总结：

> GPU 进程 exit code=-1073741515 在 Windows 上偶发，尤其在非系统盘，和显卡驱动相关。临时可用 no-sandbox 或移动到 C 盘规避，官方未计划修复。

---

如果你需要，我可以帮你整理一份 **所有 exit code -1073741515 的 GPU 崩溃日志示例 + 临时解决方案表格**，方便直接查阅。

你希望我整理吗？

https://github.com/electron/electron/issues/37862
