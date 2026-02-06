# 构建与打包

Matrx Windows 应用程序采用了一套精密的构建系统，支持多种打包格式，包括 EXE、MSI 和 APPX。该构建系统旨在为不同部署场景创建可分发包，同时通过数字签名确保代码安全。

## [](#)

构建系统通过中央`build.js`脚本进行协调，该脚本作为所有打包操作的入口点。此脚本处理配置管理、资源复制，并根据指定的目标格式协调实际构建过程。

构建过程支持多种打包格式：

- **EXE**：使用 NSIS（Nullsoft Scriptable Install System）的标准安装程序
- **MSI**：用于企业部署的 Windows 安装程序包
- **APPX**：用于 Microsoft Store 分发的 Windows Store 包

每种格式都有其自己的配置文件（`exeConfig.js`、`msiConfig.js`、`appxConfig.js`），用于定义该打包类型的特定设置。

来源：[build.js#L1-L291](https://github.com/luuman/matrx-windows/tree/main/build.js#L1-L291), [package.json#L24-L31](https://github.com/luuman/matrx-windows/tree/main/package.json#L24-L31)

## 构建配置[](#构建配置)

构建系统采用模块化配置方法，每种打包格式都有其自己的配置文件。这些配置定义了：

1.  **目标特定设置**：每种格式（EXE、MSI、APPX）都有自定义设置
2.  **代码签名配置**：用于安全验证的数字签名设置
3.  **资源管理**：处理 DLL、图标和其他资源
4.  **输出格式**：命名约定和工件路径

例如，`exeConfig.js`中的 EXE 配置定义了 NSIS 特定设置，如安装目录、快捷方式和卸载行为：

JAVASCRIPT

```js
nsis: {
    perMachine: false,
    oneClick: false,
    allowToChangeInstallationDirectory: false,
    createDesktopShortcut: 'always',
    include: 'nsis_build/installer.nsi',
    allowElevation: true,
    displayLanguageSelector: true,
    installerIcon: `resources/${name.toLowerCase()}/installer.ico`,
    deleteAppDataOnUninstall: true,
    installerLanguages: ['en_US'],
    shortcutName: description
}
```

来源：[exeConfig.js#L58-L73](https://github.com/luuman/matrx-windows/tree/main/exeConfig.js#L58-L73), [msiConfig.js#L45-L52](https://github.com/luuman/matrx-windows/tree/main/msiConfig.js#L45-L52), [appxConfig.js#L39-L48](https://github.com/luuman/matrx-windows/tree/main/appxConfig.js#L39-L48)

## 构建流程[](#构建流程)

构建过程遵循明确定义的序列，确保所有打包格式的一致性：

Syntax error in textmermaid version 11.6.0

构建过程首先加载当前配置并使用构建特定值更新`package.json`文件。然后根据目标产品名称复制必要资源并替换图标。根据构建类型，选择适当的配置并运行相应的构建过程。最后，在清理工作目录之前对所有工件进行数字签名。

来源：[build.js#L70-L247](https://github.com/luuman/matrx-windows/tree/main/build.js#L70-L247)

## NSIS 安装程序配置[](#nsis安装程序配置)

NSIS（Nullsoft Scriptable Install System）用于创建 Windows EXE 安装程序。安装程序脚本（`build_setup.nsi`）定义了：

- 安装目录和注册表项
- 用户界面元素（欢迎页面、开始菜单等）
- 安装/卸载期间的进程管理
- 桌面和开始菜单快捷方式
- 清理程序

安装程序配置为处理安装期间可能运行的多个子进程：

NSIS

```nsis
Function .onInit
    StrCpy $1 "${PRODUCT_NAME}.exe"
    nsProcess::_FindProcess "$1"
    Pop $R0
    ${If} $R0 = 0
      nsProcess::_KillProcess "$1"
      Pop $R0
      Sleep 100
    ${EndIf}
    ; 其他进程的类似检查...
FunctionEnd
```

这通过在继续安装之前终止任何正在运行的应用程序实例来确保干净安装。

来源：[nsis_build/build_setup.nsi#L91-L128](https://github.com/luuman/matrx-windows/tree/main/nsis_build/build_setup.nsi#L91-L128)

## 代码签名实现[](#代码签名实现)

代码签名是验证应用程序真实性的关键安全功能。构建系统实现了全面的签名过程：

1.  **自动检测**：系统自动检测需要签名的文件（.dll、.exe、.msi、.appx）
2.  **多算法支持**：支持 SHA1 和 SHA256 签名算法
3.  **证书管理**：使用证书主题名称而非硬编码证书文件
4.  **时间戳**：包含时间戳服务器集成以进行长期验证

签名过程在`sign_file.js`中实现：

JAVASCRIPT

```js
if (signAlgorithm === "sha256") {
  args = [
    "sign",
    "/tr",
    "http://timestamp.sectigo.com",
    "/fd",
    "sha256",
    "/td",
    "sha256",
    "/sha1",
    "4402F0E3AFF554E962A19AD597C086AE2C03AAB6",
    "/d",
    name,
    "/as",
    "/debug",
    file,
  ];
}
```

系统在应用新签名之前首先验证文件是否已由 Microsoft 或组织签名，从而优化构建过程。

来源：[nsis_build/sign.js#L27-L35](https://github.com/luuman/matrx-windows/tree/main/nsis_build/sign.js#L27-L35), [nsis_build/sign_file.js#L5-L86](https://github.com/luuman/matrx-windows/tree/main/nsis_build/sign_file.js#L5-L86)

## 构建命令[](#构建命令)

构建系统为不同的构建场景提供了几个 npm 脚本：

| 命令                    | 描述                   | 输出格式       |
| ----------------------- | ---------------------- | -------------- |
| `npm run package`       | 使用测试配置的标准构建 | EXE            |
| `npm run package-appx`  | Windows Store 包       | APPX           |
| `npm run package-msi`   | 企业安装程序包         | MSI            |
| `npm run package-build` | 生产构建               | EXE            |
| `npm run package-all`   | 构建所有格式           | EXE, MSI, APPX |

每个命令使用不同参数调用中央`build.js`脚本，然后根据目标格式协调适当的构建过程。

来源：[package.json#L24-L33](https://github.com/luuman/matrx-windows/tree/main/package.json#L24-L33)

进行生产构建时，请确保已在系统证书存储中安装了适当的代码签名证书。如果找不到具有指定主题名称的所需证书，构建系统将失败。

## 定制和品牌化[](#定制和品牌化)

构建系统通过模块化方法支持多种品牌配置：

1.  **产品变体**：系统可以构建不同的品牌版本（Matrx、MatrxO、MatrxO2 等）
2.  **动态配置**：基于目标产品的构建时配置更改
3.  **资源管理**：每个产品变体的不同图标、主题和资源
4.  **命名约定**：所有构建工件的一致命名

系统在构建过程中动态更新配置文件：

JAVASCRIPT

```js
if (buildName && buildName.toLowerCase() === "matrx") {
  ref.current = "public";
  fs.writeFileSync(
    "./src/buildConfig/current.js",
    "module.exports = " + JSON.stringify(ref, " ", "\t")
  );
} else if (buildName && buildName.toLowerCase() === "matrxo") {
  ref.current = "private";
  fs.writeFileSync(
    "./src/buildConfig/current.js",
    "module.exports =" + JSON.stringify(ref, " ", "\t")
  );
}
```

这种灵活性允许同一代码库生成具有不同功能和外观的多个品牌产品。
