# "Autofill.enable" wasn't found

我帮你整理一下这个 GitHub issue 中关于 **Electron DevTools 报错 `"Autofill.enable" wasn't found`** 的关键信息：

---

## 1. 基本信息

- **Issue 标题**: `"Request Autofill.enable failed. {"code":-32601,"message":"'Autofill.enable' wasn't found"}"`
- **仓库**: [electron/electron](https://github.com/electron/electron/issues/41614)
- **操作系统**: macOS 14.1.1 (Apple Silicon arm64)
- **Electron 版本**: 29.x - 36.x（多位用户复现）
- **场景**: 打开 DevTools 或使用 `webContents.openDevTools()` 时控制台报错

---

## 2. 复现现象

- 控制台日志示例：

```text
[25610:0505/145346.664851:ERROR:CONSOLE(1)] "Request Autofill.enable failed. {"code":-32601,"message":"'Autofill.enable' wasn't found"}", source: devtools://devtools/bundled/core/protocol_client/protocol_client.js (1)
[25610:0505/145346.740852:ERROR:CONSOLE(2)] "Electron sandboxed_renderer.bundle.js script failed to run", source: node:electron/js2c/sandbox_bundle (2)
[25610:0505/145346.740893:ERROR:CONSOLE(2)] "TypeError: object null is not iterable (cannot read property Symbol(Symbol.iterator))", source: node:electron/js2c/sandbox_bundle (2)
```

- 错误不会阻止 DevTools 或 Vue DevTools 正常使用
- 在 **Electron 29.x \~ 36.x** 均有人复现

---

## 3. 可能原因

- 与 **Chrome DevTools 协议更新**有关，`Autofill.enable` 在 Chromium DevTools 中注册，但 Electron 内部可能没有完全实现
- 使用 **内联 onclick** 或特定脚本会触发，但并非主要原因
- 调用 `webContents.openDevTools()` 时常出现

---

## 4. 用户提出的解决方案/绕过方式

1. **通过注入脚本屏蔽错误**（仅对第一次打开有效）：

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

2. **完全忽略 Electron 日志**（不可见控制台错误）：

```js
app.commandLine.appendSwitch("log-level", "3"); // FATAL
```

3. **不使用 inline onclick**（某些情况下有效）

---

## 5. 官方态度

- **codebytere**: 已知问题，但不影响功能，标记为 **wontfix / not planned**
- Issue 被关闭，但仍有社区讨论和用户反馈

---

## 6. 社区关注点

- 一些用户指出，这类错误会阻碍 **Steam 或 Microsoft Store 发布流程**
- 用户希望 **官方至少提供方式隐藏或清理** 控制台错误
- 错误并不影响应用运行，但影响用户调试体验

---

总结：

> `"Autofill.enable" wasn't found` 是 Electron 内部 DevTools 协议与 Chromium 不完全匹配导致的已知错误，不影响功能。可通过设置 `log-level` 或在 DevTools 打开时注入脚本屏蔽来避免干扰调试。

---

我可以帮你整理一个 **Electron 常见 DevTools 控制台报错 + 临时绕过方法表格**，包含 Autofill、GPU 等常见问题，方便快速查阅。

你希望我整理吗？
