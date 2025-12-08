# 版本抉择

✅ 我查好了权威官方数据（主要是 Electron 的发布时间线 + 栈变化 + 一些 breaking change 摘要），下面用表格给你整理 **从 v27 到 v39 的核心变化**（注意：官方没有把每个版本的完整变化直接按版汇总，我做了重要特性 & API 改动的聚合总结）：

## 📌 Electron 版本与主要变化一览 （v27 → v39）

| Electron 版本 | 发布/支持周期 | 栈/平台变动                      | 重要变化/API 变更摘要                                                                                                                                      |
| ------------- | ------------- | -------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **v27**       | 2023-10-10 起 | Chromium ~118                    | ✅ Dropped Win7/8/8.1 macOS 10.13/10.14；IPC sendTo 移除；移除部分 vibrancy/options；Draggable Region 变化等 ⚠ API 移除 & 安全强化                         |
| **v28**       | 2024          | Chromium ~120                    | ⚠ “traffic light” 按钮 API 移除；WebContents.backgroundThrottling 行为变更；Rosetta 运行检测移除                                                           |
| **v29**       | 2024          | Chromium ~122                    | ⚠ ipcRenderer over contextBridge 行为变；移除 crash/renderer 事件等                                                                                        |
| **v30**       | 2024          | Chromium ~124                    | ⚠ cross-origin iframe Permission Policy；BrowserView setAutoResize 行为变；BrowserView class 弃用；移除 context-menu inputFormType & process.getIOCounters |
| **v31**       | 2024-06       | Chromium ~126                    | ⚠ WebSQL 移除；nativeImage.toDataURL 行为改                                                                                                                |
| **v32**       | 2024-08       | Chromium ~128                    | ⚠ File.path 移除；WebContents.goBack/canGoBack 等历史 API 移除；userData databases dir 清理                                                                |
| **v33**       | 2024-10       | Chromium ~130                    | ⚠ document.execCommand("paste") 弃用；WebFrameMain/ frame event 行为变                                                                                     |
| **v34**       | 2024-11       | Chromium ~132                    | ⚠ 在 Windows 全屏下菜单自动隐藏                                                                                                                            |
| **v35**       | 2025-03       | Chromium ~134, Node v22, V8 13.5 | ✅ ServiceWorker preload；ServiceWorkerMain API；contextBridge.executeInMainWorld；WebContents navigationHistory API 等                                    |
| **v36**       | 2025-04       | Chromium ~136, Node v22          | ⚠ Windows fullscreen 菜单一致性行为；Deprecated & Removed 一些无用 API                                                                                     |
| **v37**       | 2025-06       | Chromium ~138, Node v22          | ⚠ Utility process unhandled rejection 改；process.exit 行为变；WebUSB/WebSerial blocklist 支持；移除 ProtocolResponse Session null 值                      |
| **v38**       | 2025-09       | Chromium ~140, Node v22          | ❌ Removed: ELECTRON_OZONE_PLATFORM_HINT & ORIGINAL_XDG_CURRENT_DESKTOP；Dropped macOS 11 Support；Removed plugin-crashed event                            |
| **v39**       | 2025-10       | Chromium ~142, Node v22          | ⚠ Deprecated: –-host-rules；window.open 弹窗 always resizable；shared texture paint event data change                                                      |

🔎 **备注说明**：

- Chrome/Node/V8 版本来自官方发布表格数据（见时间线）([releases.electronjs.org][1])
- Breaking changes 摘要来自官方 Breaking Changes 页面整理（覆盖 v27–v39 多个版本 API 通告/变更趋势）([electronjs.org][2])
- v35 新增的 **Service Worker preload & ServiceWorkerMain** 是该版本最大的特性之一（官方 release notes）([electronjs.org][3])
- 一些行为变更涉及安全、API 移除、默认行为调整等，对应用迁移有比较明显影响。

---

## 🧠 总结重点

✅ **v27 → v30**

- 最核心是 **API 移除 & 旧平台支持停用**（Win7/8、macOS 10.x 系列）
- 多个 IPC / webview 相关旧 API 陆续移除，尽量使用现代替代 API

✅ **v31 → v34**

- 主要是 **Web 标准变化 + Chromium 版本升级**
- 这些变化会影响渲染层行为、历史 API 行为等

✅ **v35+**

- 除了 Chromium/Node/V8 的更新之外，**Service Worker 支持增强是最大特性**
- 后续版本更偏向行为调整及弃用旧变量/feature

---

## 📌 升级建议视角

如果你关心 **兼容性与生产发布稳定性**：

- 27–30→ 是最稳妥的线（API 变化较少，native 模块兼容性好）
- 31+ → 可能需要解决一些 Web API 和 Node Behavior 的变化

这也解释了为什么生产中很多项目停留在 **27–30 区间**。

---

如果你想，我还可以做一张更细粒度的表，按每个版本列 **具体 Breaking 改动细节（有 API 移除/默认变更）**，这对于升级评估更有价值。要不要更详细版本对比？

[1]: https://releases.electronjs.org/release?utm_source=chatgpt.com "Stable Pre Release Nightly"
[2]: https://electronjs.org/docs/latest/breaking-changes?utm_source=chatgpt.com "Breaking Changes"
[3]: https://electronjs.org/blog/electron-35-0?utm_source=chatgpt.com "Electron 35.0.0"
