# 环境搭建指南

## 系统要求

### 操作系统
- Windows 10/11 (64-bit)
- 用于开发的 macOS 或 Linux 也可以，但打包仅支持 Windows

### 软件依赖

| 软件 | 版本要求 | 说明 |
|------|---------|------|
| Node.js | v16.x | 推荐使用 nvm 管理 |
| Python | 3.10.11 | node-gyp 构建需要 |
| Visual Studio Build Tools | 2019+ | Windows 原生模块编译 |
| Git | 最新版 | 版本控制 |

## 安装步骤

### 1. 安装 Node.js

推荐使用 nvm (Node Version Manager) 管理 Node.js 版本：

**Windows:**
```powershell
# 下载并安装 nvm-windows
# https://github.com/coreybutler/nvm-windows/releases

# 安装 Node.js 16
nvm install 16
nvm use 16

# 验证安装
node -v  # 应显示 v16.x.x
npm -v   # 应显示 8.x.x
```

**macOS/Linux:**
```bash
# 安装 nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# 重新加载 shell 配置
source ~/.bashrc  # 或 ~/.zshrc

# 安装 Node.js 16
nvm install 16
nvm use 16
```

### 2. 安装 Python

**Windows:**
```powershell
# 下载 Python 3.10.11
# https://www.python.org/downloads/release/python-31011/

# 安装时勾选 "Add Python to PATH"

# 验证安装
python --version  # 应显示 Python 3.10.11
```

### 3. 安装 Visual Studio Build Tools (仅 Windows)

```powershell
# 方式1: 使用 npm 安装
npm install --global windows-build-tools

# 方式2: 手动下载安装
# https://visualstudio.microsoft.com/visual-cpp-build-tools/
# 安装时选择 "C++ build tools" 工作负载
```

### 4. 克隆项目

```bash
# 克隆仓库（包含子模块）
git clone --recurse-submodules git@github.com:luuman/matrx-windows.git

# 进入项目目录
cd matrx-windows

# 如果子模块未克隆
git submodule update --init --recursive
```

### 5. 安装项目依赖

```bash
# 安装依赖（可能需要 --force）
npm install --force

# 如果遇到 node-gyp 构建错误
npm run changeV8
npm install --force

# 重建原生模块
npm run electron-rebuild
```

## 常见问题排解

### 问题1: node-gyp 构建失败

**症状:**
```
gyp ERR! build error
gyp ERR! stack Error: `msbuild` failed with exit code: 1
```

**解决方案:**
```bash
# 1. 确保安装了 Visual Studio Build Tools
# 2. 设置 Python 路径
npm config set python "C:\Python310\python.exe"

# 3. 设置 VS 版本
npm config set msvs_version 2019

# 4. 重新安装
npm install --force
```

### 问题2: Electron 下载失败

**症状:**
```
Error: Electron failed to install correctly
```

**解决方案:**
```bash
# 设置 Electron 镜像
npm config set electron_mirror "https://npmmirror.com/mirrors/electron/"

# 或设置环境变量
# Windows
set ELECTRON_MIRROR=https://npmmirror.com/mirrors/electron/

# macOS/Linux
export ELECTRON_MIRROR=https://npmmirror.com/mirrors/electron/

# 重新安装
npm install
```

### 问题3: SQLCipher 编译失败

**症状:**
```
Error: Cannot find module '@journeyapps/sqlcipher'
```

**解决方案:**
```bash
# 1. 确保安装了 OpenSSL
# Windows: 下载 Win64 OpenSSL
# https://slproweb.com/products/Win32OpenSSL.html

# 2. 设置 OpenSSL 路径
set OPENSSL_ROOT_DIR=C:\OpenSSL-Win64

# 3. 重建 SQLCipher
npm run electron-rebuild
```

### 问题4: 依赖冲突

**症状:**
```
npm ERR! ERESOLVE unable to resolve dependency tree
```

**解决方案:**
```bash
# 使用 --force 或 --legacy-peer-deps
npm install --force
# 或
npm install --legacy-peer-deps
```

## 开发环境启动

### 启动开发服务器

```bash
# 启动 Electron 开发模式（推荐）
npm run dev

# 仅启动 Vue 开发服务器
npm run serve

# 调试模式
npm run debug
```

### 开发工具

**VS Code 推荐插件:**

```json
{
  "recommendations": [
    "Vue.volar",
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",
    "octref.vetur",
    "bradlc.vscode-tailwindcss"
  ]
}
```

**项目 VS Code 配置:**

```json
// .vscode/settings.json
{
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "eslint.validate": [
    "javascript",
    "javascriptreact",
    "vue"
  ]
}
```

## 项目脚本说明

| 脚本 | 说明 |
|------|------|
| `npm run dev` | 启动 Electron 开发模式 |
| `npm run serve` | 启动 Vue 开发服务器 |
| `npm run build` | 构建 Vue 生产版本 |
| `npm run electron:build` | 构建 Electron 应用 |
| `npm run electron:serve` | Electron 开发服务 |
| `npm run lint:fix` | ESLint 自动修复 |
| `npm run electron-rebuild` | 重建原生模块 |
| `npm run package` | 完整打包流程 |
| `npm run package-msi` | 打包 MSI 安装程序 |
| `npm run package-appx` | 打包 APPX 应用 |

## 目录结构说明

```
matrx-windows/
├── src/                    # 源代码
│   ├── background.js       # 主进程入口
│   ├── main.js             # 渲染进程入口
│   ├── main/               # 主进程模块
│   ├── renderer/           # 多窗口渲染进程
│   ├── components/         # Vue 组件
│   ├── views/              # 页面视图
│   ├── store/              # Vuex 状态
│   ├── api/                # API 请求
│   ├── utils/              # 工具函数
│   ├── sql/                # 数据库模块
│   ├── logs/               # 日志系统
│   └── lang/               # 国际化
├── public/                 # 静态资源
├── build/                  # 构建资源
├── dist/                   # 构建输出
├── node_modules/           # 依赖包
├── vue.config.js           # Vue CLI 配置
├── package.json            # 项目配置
└── docs/                   # 开发文档
```

## 下一步

- 阅读 [项目整体架构](../architecture/overview.md) 了解项目设计
- 阅读 [新功能开发指南](./new-feature.md) 开始开发
