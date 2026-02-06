# 环境搭建

## 📁 系统要求

| 环境          | 要求版本                                                                          |
| ------------- | --------------------------------------------------------------------------------- |
| 操作系统      | Windows 10 或以上（64 位）                                                        |
| Node.js       | 推荐 16.15.0（建议使用 [nvs](https://github.com/jasongin/nvs) 管理） 避免 Node≥18 |
| Python        | 3.10.11（用于 native 模块编译）                                                   |
| Visual Studio | Visual Studio 2019，勾选 C++ 构建工具                                             |

> 推荐工具

- [Git](https://git-scm.com/download/win)
- Git Bash / PowerShell / Windows Terminal
- [VSCode](https://code.visualstudio.com/) 编辑器

## 📦 安装依赖

> 克隆代码仓库

```bash
git clone https://gitlab.corp.matrx.team/frontend/matrx_windows.git
cd matrx_windows
```

> 安装依赖包

```bash
npm install
```

> 如果网络缓慢，可改为淘宝源：

```bash
npm config set registry https://registry.npmmirror.com
```

## ⚙️ 本地开发调试

```bash
npm run dev
```

- 启动 Electron + Vue 开发服务
- 若前端页面有 Web 渲染部分，可在浏览器调试

## 📦 打包构建

> 构建 release 包

```bash
npm run package-build
```

> 构建 MSI 安装包

```bash
npm run package-msi
```

## 📌 常见问题

### clipboard-files 不兼容

```bash
> Matrx@1.20.4 postinstall
> patch-package && electron-builder install-app-deps && husky install

patch-package 6.5.1
Applying patches...
app-builder-lib@23.6.0 ✔
element-ui@2.15.6 ✔
vue-cli-plugin-electron-builder@2.1.1 ✔

**ERROR** Failed to apply patch for package systeminformation at path

    node_modules/systeminformation

  This error was caused because systeminformation has changed since you
  made the patch file for it. This introduced conflicts with your patch,
  just like a merge conflict in Git when separate incompatible changes are
  made to the same piece of code.

  Maybe this means your patch file is no longer necessary, in which case
  hooray! Just delete it!

  Otherwise, you need to generate a new patch file.

  To generate a new one, just repeat the steps you made to generate the first
  one.

  i.e. manually make the appropriate file changes, then run

    patch-package systeminformation

  Info:
    Patch file: patches/systeminformation+5.12.6.patch
    Patch was made for version: 5.12.6
    Installed version: 5.25.11
patch-package finished with 1 error(s).
  • electron-builder  version=23.6.0
  • rebuilding native dependencies  dependencies=clipboard-files@1.0.4, ffi-napi@2.4.7, ref-napi@1.5.2 platform=win32 arch=x64
  ⨯ cannot execute  cause=exit status 1
                    errorOut=npm ERR! code 1
    npm ERR! path D:\Code\Matrx\matrx_windows\node_modules\clipboard-files
    npm ERR! command failed
    npm ERR! command C:\WINDOWS\system32\cmd.exe /d /s /c node-pre-gyp install --fallback-to-build
    npm ERR! �ڴ˽��������һ������һ����Ŀ����Ҫ���ò������ɣ������ӡ�/m�����ء�
    npm ERR!   main.cc
    npm ERR! c:\users\luuman\.electron-gyp\20.3.12\include\node\v8-callbacks.h(221): error C2062: ��������͡�int�� [D:\Code\Matrx\matrx_windows\node_modules\clipboard-files\build\binding.vcxproj]
    npm ERR! c:\users\luuman\.electron-gyp\20.3.12\include\node\v8-callbacks.h(335): error C2062: ��������͡�int�� [D:\Code\Matrx\matrx_windows\node_modules\clipboard-files\build\binding.vcxproj]
    npm ERR! c:\users\luuman\.electron-gyp\20.3.12\include\node\v8-isolate.h(292): error C3646: ��legacy_oom_error_callback��: δ֪��д˵���� [D:\Code\Matrx\matrx_windows\node_modules\clipboard-files\build\binding.vcxproj]
    npm ERR! c:\users\luuman\.electron-gyp\20.3.12\include\node\v8-isolate.h(292): error C4430: ȱ������˵���� - �ٶ�Ϊ int��ע��: C++ ��֧��Ĭ�� int [D:\Code\Matrx\matrx_windows\node_modules\clipboard-files\build\binding.vcxproj]
    npm ERR! c:\users\luuman\.electron-gyp\20.3.12\include\node\v8-isolate.h(1482): error C2061: �﷨����: ��ʶ����LegacyOOMErrorCallback�� [D:\Code\Matrx\matrx_windows\node_modules\clipboard-files\build\binding.vcxproj]
    npm ERR! c:\users\luuman\.electron-gyp\20.3.12\include\node\v8-isolate.h(1545): error C2061: �﷨����: ��ʶ����WasmDynamicTieringEnabledCallback�� [D:\Code\Matrx\matrx_windows\node_modules\clipboard-files\build\binding.vcxproj]
    npm ERR! c:\users\luuman\.electron-gyp\20.3.12\include\node\v8-initialization.h(290): error C2061: �﷨����: ��ʶ����LegacyOOMErrorCallback�� [D:\Code\Matrx\matrx_windows\node_modules\clipboard-files\build\binding.vcxproj]
    npm ERR! Failed to execute 'C:\Program Files\nodejs\node.exe D:\Programs\nvm\v16.15.0\node_modules\npm\node_modules\node-gyp\bin\node-gyp.js build --fallback-to-build --module=D:\Code\Matrx\matrx_windows\node_modules\clipboard-files\lib\binding\electron-v20.3-win32-x64\binding.node --module_name=binding --module_path=D:\Code\Matrx\matrx_windows\node_modules\clipboard-files\lib\binding\electron-v20.3-win32-x64 --napi_version=8 --node_abi_napi=napi --napi_build_version=0 --node_napi_label=electron-v20.3' (1)
    npm ERR! node-pre-gyp info it worked if it ends with ok
    npm ERR! node-pre-gyp info using node-pre-gyp@1.0.11
    npm ERR! node-pre-gyp info using node@16.15.0 | win32 | x64
    npm ERR! node-pre-gyp http GET https://github.com/alex8088/clipboard-files/releases/download/v1.0.4/electron-v20.3-win32-x64.tar.gz
    npm ERR! node-pre-gyp ERR! install response status 404 Not Found on https://github.com/alex8088/clipboard-files/releases/download/v1.0.4/electron-v20.3-win32-x64.tar.gz
    npm ERR! node-pre-gyp WARN Pre-built binaries not installable for clipboard-files@1.0.4 and electron@20.3.12 (electron-v20.3 ABI, unknown) (falling back to source compile with node-gyp)
    npm ERR! node-pre-gyp WARN Hit error response status 404 Not Found on https://github.com/alex8088/clipboard-files/releases/download/v1.0.4/electron-v20.3-win32-x64.tar.gz
    npm ERR! gyp info it worked if it ends with ok
    npm ERR! gyp info using node-gyp@9.0.0
    npm ERR! gyp info using node@16.15.0 | win32 | x64
    npm ERR! gyp info ok
    npm ERR! gyp info it worked if it ends with ok
    npm ERR! gyp info using node-gyp@9.0.0
    npm ERR! gyp info using node@16.15.0 | win32 | x64
    npm ERR! gyp info find Python using Python version 3.10.11 found at "D:\Programs\Python310\python.exe"
    npm ERR! gyp info find VS using VS2017 (15.9.35324.217) found at:
    npm ERR! gyp info find VS "C:\Program Files (x86)\Microsoft Visual Studio\2017\BuildTools"
    npm ERR! gyp info find VS run with --verbose for detailed information
    npm ERR! gyp info spawn D:\Programs\Python310\python.exe
    npm ERR! gyp info spawn args [
    npm ERR! gyp info spawn args   'D:\\Programs\\nvm\\v16.15.0\\node_modules\\npm\\node_modules\\node-gyp\\gyp\\gyp_main.py',
    npm ERR! gyp info spawn args   'binding.gyp',
    npm ERR! gyp info spawn args   '-f',
    npm ERR! gyp info spawn args   'msvs',
    npm ERR! gyp info spawn args   '-I',
    npm ERR! gyp info spawn args   'D:\\Co
```

```bash
npm run changeV8
npm install --force
# --force 可以跳过 patch 错误，但 不会解决 C++ 编译失败的问题，依然会报错。
```

```js
const os = require("os");
const path = require("path");
const fse = require("fs-extra");
const package = require("../package.json");

async function copyTo() {
  let dir = path.join(__dirname, `./build_tools/v8-callbacks.h`);
  let dist = path.join(
    os.homedir(),
    `./.electron-gyp/${package.devDependencies.electron.replace(
      "^",
      ""
    )}/include/node/v8-callbacks.h`
  );
  // 将 build_tools/v8-callbacks.h ，拷贝到 Electron 用于编译 native 模块时使用的 V8 头文件目录中。
  console.log("dir", dir);

  console.log("dist", dist);
  // console.log('dist1', os.homedir());
  // fse.removeSync(dist);
  console.log("copy dll to app path... ", dir);

  await fse.copy(dir, dist);
  console.log("copy dll success!", dist);
}

copyTo();
```

原生模块 `clipboard-files@1.0.4` 与 Electron v20 存在 ABI 不兼容，报如下错误：

✅ 为什么这可以“解决问题”
clipboard-files 是一个使用 C++ 编写的原生模块，它的源码依赖了 V8 的头文件（如 v8-callbacks.h）。如果：

clipboard-files 是为旧版本 Electron 构建的

而当前 Electron 是 v20（或 ABI 与之不兼容）

那么它在编译时会报错。你通过 changeV8 手动覆盖 V8 的头文件，让它 “看起来像是旧版本”，就可以绕过这些错误。

## 快查表

| 命令                              | 用法                                      | 说明                           |
| --------------------------------- | ----------------------------------------- | ------------------------------ |
| `npm run serve`                   | 开发环境启动 Vue Web 页面                 | 等同于 `vue-cli-service serve` |
| `npm run dev`                     | 开发环境启动                              |                                |
| `npm run rd`                      | 启动 `--mode rd` 模式（可能为“日常环境”） | 同上，换环境模式               |
| `npm run debug`                   | 使用 Electron 打开 `config.js`            | 用于调试配置文件或独立测试     |
| `npm run start`                   | 同时运行 `rd` 和 `dev`                    | 并发模式调试                   |
| 打包相关                          |                                           |                                |
| `npm run build`                   | 构建 Web 项目（含 report）                | Vue CLI 默认打包 Web           |
| `npm run electron:build`          | 构建 Electron 应用                        | 最终产物为 `.exe`、`.app` 等   |
| `npm run electron:serve`          | 启动 Electron 应用（开发模式）            | 适合调试 Electron 代码         |
| `npm run electron:release`        | 同上                                      | 通常用于生产构建               |
| `npm run electron:test`           | 构建测试版本                              | 和 `build/release` 行为相同    |
| `npm run electron:msi`            | 构建 MSI 安装包                           |                                |
| `npm run package`                 | 构建测试安装包                            |                                |
| `npm run package-appx`            |                                           |                                |
| `npm run package-build`           | 构建安装包                                |                                |
| `npm run package-msi`             | 构建 MSI 安装包                           |                                |
| `npm run package-all`             | 构建所有平台                              |                                |
| 自动化                            |                                           |                                |
| `npm run replace-exe-icons`       | 替换 exe 文件图标                         |                                |
| `npm run replace-icons`           | 替换应用内图标                            |                                |
| `npm run replace:dll`             | 替换默认 DLL                              |                                |
| `npm run replace:dll:x86`         | 替换 32 位 DLL                            |                                |
| `npm run electron:generate-icons` | 生成 Electron 应用图标                    |                                |
| 子模块管理                        |                                           |                                |
| `npm run pull-sdk`                | 拉取 SDK 子模块（默认）                   |                                |
| `npm run pull-sdk-build`          | 拉取 SDK 子模块并设置 build 模式          |                                |
| `npm run update:cst-sdk`          | 更新 CST SDK 相关内容                     |                                |
| `npm run update:sdk`              | 更新 HWM SDK                              |                                |
| `npm run changeV8`                | 修改 Electron V8 引擎相关配置             |                                |
| 签名                              |                                           |                                |
| `npm run sign-dll`                | 签名 DLL 文件（用于防篡改）               |                                |
| `npm run sign-file`               | 签名单独文件                              |                                |
| `npm run vmp:dll`                 | 可能调用 VMP 工具保护 DLL                 |                                |
| 质量保障相关                      |                                           |                                |
| `npm run lint`                    | 检查项目代码规范                          |                                |
| `npm run lint:fix`                | 自动修复 `.js` `.ts` `.vue` 等格式问题    |                                |
| `npm run lint-staged`             | 配合 `husky` 对提交前文件进行检查         |                                |
| `npm run test-all`                | 执行所有测试脚本                          |                                |
| 测试相关                          |                                           |                                |
| `npm run mock:ws`                 | 启动 mock 的 WebSocket 服务               | 模拟后端推送测试               |
| `npm run electron-rebuild`        | 重建 Electron 原生模块                    | 避免 native 模块报错           |
| `npm run rebuild`                 | 手动 rebuild electron ABI=93（v17.4.4）   |                                |
| 依赖包修改                        |                                           |                                |
| `npm run patch`                   | 执行 `patch-package` 打补丁               |                                |
| `npm run postinstall`             |                                           |                                |
| `npm run postinstall-builder`     | patch `app-builder-lib`                   |                                |
| `npm run postinstall-element`     | patch `element-ui`                        |                                |
| `npm run postuninstall`           | 再次修复 electron-builder 依赖（卸载后）  |                                |
| 其他实用脚本                      |                                           |                                |
| `npm run c`                       | 使用 `git-cz` 提交                        | 语义化提交辅助工具             |
| `npm run init`                    | 强制安装依赖（有风险）                    |                                |
| `npm run change:version`          | 修改项目版本号                            |                                |
| `npm run postchange:version`      | 获取当前版本号                            |                                |
| `npm run icons:base`              | 复制基础图标                              |                                |
| `npm run icons:copy`              | 拷贝生成的图标                            |                                |
