# 开发环境搭建

为 Matrx Windows 应用程序搭建开发环境是一个简单直接的过程，需要特定的工具和配置。本指南将逐步引导您完成每个步骤，确保您拥有开始使用这个 Electron-Vue 应用程序进行开发所需的一切。

## [](#)

在开始之前，请确保您的系统满足以下要求：

- **Node.js**: 版本 16.15.0（推荐）
- **Python**: 版本 3.10.11（推荐）
- **Git**: 用于克隆仓库和管理子模块
- **Visual Studio 2017 或更新版本**: 构建原生模块所需

该应用程序基于 Electron-Vue 框架构建，该框架将用于桌面应用程序开发的 Electron 与用于用户界面的 Vue.js 相结合。这种设置使您能够使用 Web 技术构建跨平台桌面应用程序。

来源: [README.md#L5-L8](https://github.com/luuman/matrx-windows/tree/main/README.md#L5-L8), [package.json#L146](https://github.com/luuman/matrx-windows/tree/main/package.json#L146)

## 初始设置[](#初始设置)

### 1\. 安装全局依赖项[](#1-安装全局依赖项)

首先，您需要安装一些全局 Node.js 包，这些包对于构建原生模块至关重要：

BASH

```bash
npm install -g node-gyp
npm install -g node-pre-gyp
```

这些工具是编译原生 Node.js 模块所必需的，本项目使用这些模块来实现各种功能，包括数据库操作和系统集成。

来源: [README.md#L11-L14](https://github.com/luuman/matrx-windows/tree/main/README.md#L11-L14), [dev-init.bat#L12-L16](https://github.com/luuman/matrx-windows/tree/main/dev-init.bat#L12-L16)

### 2\. 克隆仓库[](#2-克隆仓库)

克隆仓库及其所有子模块：

BASH

```bash
git clone git@xxx/windows.git --recurse-submodules
```

如果您希望先不克隆子模块，可以使用：

BASH

```bash
git clone git@xxx/windows.git
cd windows
git submodule init
git submodule update
git submodule update --init --recursive
git submodule update --remote
cd public/sdk/cst_lib
git checkout master
```

项目包含多个需要初始化和更新的子模块，特别是 `public/sdk/cst_lib` 目录中的 SDK 库。

来源: [README.md#L17-L41](https://github.com/luuman/matrx-windows/tree/main/README.md#L17-L41)

## 安装过程[](#安装过程)

### 1\. 安装依赖项[](#1-安装依赖项)

使用 npm 安装项目依赖项：

BASH

```bash
npm install --force
```

`--force` 标志用于确保所有依赖项都正确安装，即使 package-lock.json 文件存在冲突或问题。

如果在安装后遇到 node-gyp 构建错误，请运行以下命令：

BASH

```bash
npm run changeV8
npm install --force
```

此过程会更新 V8 引擎配置并重新安装依赖项以解决兼容性问题。

来源: [README.md#L43-L55](https://github.com/luuman/matrx-windows/tree/main/README.md#L43-L55), [install.bat#L7-L9](https://github.com/luuman/matrx-windows/tree/main/install.bat#L7-L9)

### 2\. 安装后设置[](#2-安装后设置)

项目包含一个在 `npm install` 完成后自动运行的安装后脚本。该脚本执行几个重要任务：

BASH

```bash
patch-package
electron-builder install-app-deps
husky install
```

- `patch-package`: 应用自定义补丁到依赖项
- `electron-builder install-app-deps`: 安装 Electron 特定依赖项
- `husky install`: 设置 Git 钩子用于代码质量检查

如果安装后过程遇到问题，您可以手动运行这些命令或使用提供的批处理文件：

BASH

```bash
npm run postinstall
```

来源: [package.json#L36](https://github.com/luuman/matrx-windows/tree/main/package.json#L36), [install.bat#L9](https://github.com/luuman/matrx-windows/tree/main/install.bat#L9)

## 开发环境配置[](#开发环境配置)

### 1\. 代码编辑器设置[](#1-代码编辑器设置)

为获得最佳开发体验，请使用 Visual Studio Code 并安装以下扩展：

- **Debugger for Chrome**: 用于调试 Electron 应用程序
- **GitLens**: 用于增强 Git 集成
- **Prettier**: 用于代码格式化
- **Prettier ESLint**: 用于代码标准和风格
- **Vetur@0.36.1**: 用于 Vue.js 开发

项目包含这些工具的配置文件：

- `.eslintrc.js`: 用于代码质量的 ESLint 配置
- `prettier.config.js`: 用于代码格式化的 Prettier 配置
- `.editorconfig`: 用于保持编码风格一致的编辑器配置

来源: [README.md#L193-L195](https://github.com/luuman/matrx-windows/tree/main/README.md#L193-L195), [.eslintrc.js](https://github.com/luuman/matrx-windows/tree/main/.eslintrc.js)

### 2\. 构建配置[](#2-构建配置)

项目使用 Vue CLI 和 Electron Builder 进行打包。关键配置文件包括：

- `vue.config.js`: 包含 Electron Builder 设置的 Vue CLI 配置
- `babel.config.js`: Babel 转译配置
- `exeConfig.js`, `msiConfig.js`, `appxConfig.js`: 不同输出格式的构建配置

Vue 配置包括：

- 具有多个入口点的多页面应用程序设置
- 用于 SVG 处理的自定义 webpack 配置
- 主进程和渲染进程的 Electron 特定配置
- 具有端口设置的开发服务器配置

来源: [vue.config.js](https://github.com/luuman/matrx-windows/tree/main/vue.config.js), [babel.config.js](https://github.com/luuman/matrx-windows/tree/main/babel.config.js)

## 运行应用程序[](#运行应用程序)

### 1\. 开发模式[](#1-开发模式)

要在开发模式下启动应用程序：

BASH

```bash
npm run dev
```

此命令运行启用了热重载的 Electron 应用程序，让您在开发时能立即看到更改。开发服务器默认在端口 8080 上运行，但您可以通过设置 `VUE_APP_PORT` 环境变量来配置此端口。

开发模式包括：

- 用于快速 UI 更新的热模块替换
- 开发者工具集成
- 用于简化调试的源映射
- 用于开发调试的控制台日志

来源: [package.json#L13](https://github.com/luuman/matrx-windows/tree/main/package.json#L13), [vue.config.js#L175-L181](https://github.com/luuman/matrx-windows/tree/main/vue.config.js#L175-L181)

### 2\. 替代开发命令[](#2-替代开发命令)

项目为不同场景提供了几个开发命令：

BASH

```bash
npm run rd          # 在 RD 模式下运行
npm run start       # 与开发模式同时运行
npm run mock:ws     # 启动模拟 WebSocket 服务器
npm run electron:serve  # 标准 Electron 服务模式
```

每个命令都针对不同的开发工作流程和测试场景进行了优化。

来源: [package.json#L42-L50](https://github.com/luuman/matrx-windows/tree/main/package.json#L42-L50)

## 常见问题故障排除[](#常见问题故障排除)

### 1\. Node-gyp 构建错误[](#1-node-gyp-构建错误)

如果在安装过程中遇到 node-gyp 构建错误：

1.  确保您已安装 Visual Studio 2017 或更新版本
2.  运行以下命令：

    BASH

    ```bash
    npm config set msvs_version 2017
    npm run changeV8
    npm install --force
    ```

来源: [README.md#L206-L207](https://github.com/luuman/matrx-windows/tree/main/README.md#L206-L207)

### 2\. SQLite 模块问题[](#2-sqlite-模块问题)

如果遇到与 SQLite 模块相关的错误：

BASH

```bash
npm run install
```

这会触发卸载后脚本以重新编译 SQLite 模块。

来源: [README.md#L211](https://github.com/luuman/matrx-windows/tree/main/README.md#L211)

### 3\. 代码质量和代码检查[](#3-代码质量和代码检查)

在提交代码之前，运行代码检查修复：

BASH

```bash
npm run lint:fix
```

此命令会自动修复常见的代码风格问题，确保您的代码符合项目标准。

来源: [README.md#L196-L199](https://github.com/luuman/matrx-windows/tree/main/README.md#L196-L199), [package.json#L22](https://github.com/luuman/matrx-windows/tree/main/package.json#L22)

记得在提交代码之前运行 \`npm run lint:fix\`，以确保代码符合项目的编码标准。项目使用 Husky 进行 Git 钩子设置，它会自动检查您的提交是否符合规范。

## 后续步骤[](#后续步骤)

一旦您的开发环境设置完成，您可以：

1.  在 `src/` 目录中探索项目结构
2.  使用 `npm run dev` 在开发模式下运行应用程序
3.  开始构建新功能或修复问题
4.  使用 `npm run package` 构建应用程序来测试您的更改

## 卸载

```cmd
CMD to uninstall Matrx

# uninstall msi
# 查询本地已安装的Matrx版本及其GUID
wmic product where "name like '%Matrx%'" get Name, IdentifyingNumber, Version
# 使用GUID静默卸载指定版本
# 例如：msiexec /x {9EB258CF-64AC-4CA8-B759-AD035A311E22} /quiet /norestart
msiexec /x {App GUID} /quiet /norestart

# uninstall exe
# 静默卸载
start "" "C:\Users\%USERNAME%\AppData\Local\Matrx\Uninstall Matrx.exe" /S
# 交互式卸载
"C:\Users\%USERNAME%\AppData\Local\Matrx\Uninstall Matrx.exe"
```

```batch
# CMD to install Matrx
# msi install
msiexec.exe /i "matrx-win-1.0.25.msi" /qn

# exe install

start C:\Downloads\software_setup.exe /S

# Silent install Matrx EXE with custom host and port

start matrxo-win-101.11.3-x64-alpha-2023-8-24-12-54-14.exe /S /host=188.116.30.70 /port=8081
./matrxo-win-101.11.3.exe /S --host=matrxmeet.adaa.gov.ae --port=8011

# CMD to uninstall Matrx

# uninstall Msi

# Query the locally installed Matrx version and its GUID

wmic product where "name like '%%Matrx%%'" get Name, IdentifyingNumber, Version

# Use GUID to silently uninstall the specified version

# Example：msiexec /x {9EB258CF-64AC-4CA8-B759-AD035A311E22} /quiet /norestart

msiexec /x {App GUID} /quiet /norestart

msiexec.exe /x "matrx-win-1.0.25.msi" /qn

# uninstall EXE

# Silent uninstall

start "" "C:\Users\%USERNAME%\AppData\Local\Matrx\Uninstall Matrx.exe" /S

# Interactive uninstall

"C:\Users\%USERNAME%\AppData\Local\Matrx\Uninstall Matrx.exe"
```
