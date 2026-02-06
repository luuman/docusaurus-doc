# 构建发布指南

## 构建流程概述

```
源代码 → Vue 编译 → Electron 打包 → 签名 → 安装程序 → 发布
```

## 开发构建

### 启动开发服务

```bash
# 启动 Electron 开发模式（热重载）
npm run dev

# 仅启动 Vue 开发服务器
npm run serve

# 调试模式
npm run debug
```

## 生产构建

### 1. 构建 Vue 应用

```bash
# 构建生产版本
npm run build
```

输出目录: `dist/`

### 2. 打包 Electron 应用

```bash
# 标准打包（NSIS 安装程序）
npm run package

# MSI 安装程序
npm run package-msi

# APPX 应用包 (Microsoft Store)
npm run package-appx
```

### 3. 打包配置

**exeConfig.js** - NSIS 配置:

```javascript
module.exports = {
  appId: 'com.matrx.app',
  productName: 'Matrx',

  win: {
    target: ['nsis'],
    icon: 'build/icon.ico',
    signDlls: true
  },

  nsis: {
    oneClick: false,
    perMachine: false,
    allowToChangeInstallationDirectory: false,
    createDesktopShortcut: 'always',
    createStartMenuShortcut: true,
    deleteAppDataOnUninstall: true
  },

  files: [
    'dist/**/*',
    'node_modules/**/*',
    '!**/node_modules/*/{test,__tests__,tests}',
    '!**/node_modules/.bin'
  ]
};
```

**msiConfig.js** - MSI 配置:

```javascript
module.exports = {
  win: {
    target: ['msi']
  },
  msi: {
    perMachine: true
  }
};
```

## 代码签名

### Windows 代码签名

1. **获取证书**: 从 CA 机构购买代码签名证书

2. **配置签名**:

```javascript
// exeConfig.js
module.exports = {
  win: {
    certificateFile: 'path/to/certificate.pfx',
    certificatePassword: process.env.CERT_PASSWORD,
    signDlls: true
  }
};
```

3. **环境变量**:

```bash
set CERT_PASSWORD=your_certificate_password
```

### 验证签名

```powershell
# 检查签名
signtool verify /pa /v "Matrx Setup.exe"
```

## 自动更新配置

### 配置更新服务器

```javascript
// src/main/updater.js
const { autoUpdater } = require('electron-updater');

autoUpdater.setFeedURL({
  provider: 'generic',
  url: 'https://your-update-server.com/releases'
});
```

### 发布文件结构

```
releases/
├── latest.yml
├── Matrx-Setup-1.26.0.exe
├── Matrx-Setup-1.26.0.exe.blockmap
└── Matrx-1.26.0-full.nupkg
```

### latest.yml 示例

```yaml
version: 1.26.0
releaseDate: '2026-02-05T00:00:00.000Z'
path: Matrx-Setup-1.26.0.exe
sha512: <sha512-hash>
size: 157286400
```

## CI/CD 配置

### GitHub Actions 示例

```yaml
# .github/workflows/build.yml
name: Build

on:
  push:
    tags:
      - 'v*'

jobs:
  build:
    runs-on: windows-latest

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '16'

      - name: Install dependencies
        run: npm ci

      - name: Build
        run: npm run package
        env:
          GH_TOKEN: ${{ secrets.GH_TOKEN }}
          CERT_PASSWORD: ${{ secrets.CERT_PASSWORD }}

      - name: Upload artifacts
        uses: actions/upload-artifact@v3
        with:
          name: release
          path: release/*.exe
```

## 版本管理

### 更新版本号

```bash
# 更新补丁版本 (1.26.0 → 1.26.1)
npm version patch

# 更新次版本 (1.26.0 → 1.27.0)
npm version minor

# 更新主版本 (1.26.0 → 2.0.0)
npm version major
```

### 版本命名规范

- **主版本**: 不兼容的 API 变更
- **次版本**: 向后兼容的功能新增
- **补丁版本**: 向后兼容的问题修复

## 发布检查清单

### 发布前检查

- [ ] 所有测试通过
- [ ] 版本号已更新
- [ ] CHANGELOG 已更新
- [ ] 代码已合并到 main 分支
- [ ] 无安全漏洞 (`npm audit`)

### 构建检查

- [ ] 构建成功无错误
- [ ] 安装程序可正常运行
- [ ] 代码签名验证通过
- [ ] 应用启动正常

### 发布后检查

- [ ] 自动更新功能正常
- [ ] 下载链接有效
- [ ] 发布说明已发布
- [ ] 监控无异常

## 回滚策略

### 准备回滚

1. 保留前一版本的安装包
2. 维护版本对应的代码分支

### 执行回滚

```bash
# 1. 切换到稳定版本分支
git checkout v1.25.0

# 2. 重新构建
npm run package

# 3. 发布回滚版本
# 更新 latest.yml 指向旧版本
```

## 常见问题

### 构建失败: node-gyp 错误

```bash
# 清理并重建
rm -rf node_modules
npm cache clean --force
npm install --force
npm run electron-rebuild
```

### 打包体积过大

1. 检查 `files` 配置排除规则
2. 使用 `npm run analyze` 分析依赖
3. 移除未使用的依赖

### 签名失败

1. 检查证书是否过期
2. 验证证书密码正确
3. 确保证书路径正确
