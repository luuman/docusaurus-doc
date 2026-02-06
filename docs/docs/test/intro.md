以下是为你的 Electron 聊天应用定制的「项目总览文档（README.md 首页内容）」，你可以放在项目根目录或 `docs/README.md`，作为所有文档入口与快速介绍。

````markdown
# Windows 聊天桌面客户端

基于 [Electron](https://www.electronjs.org/) 和 [Vue 2](https://v2.vuejs.org/) 构建的跨平台聊天桌面应用，支持消息队列、加密本地数据库、安全加固机制、自动构建与版本发布流程。

## 🚀 快速开始

### 环境准备

- Node.js v16.15.0（建议使用 nvm 安装）
- Python v3.10.11
- Visual Studio 2017 或更新版本（需包含 C++ 构建工具）

全局依赖安装：

```bash
npm install -g node-gyp node-pre-gyp
```
````

### 安装依赖

```bash
git clone git@xxx/windows.git --recurse-submodules
cd windows

# 如未使用 --recurse-submodules，需手动执行
git submodule update --init --recursive
git submodule update --remote

cd public/sdk/cst_lib
git checkout master

npm install --force
```

如遇 `node-gyp` 编译错误：

```bash
npm run changeV8
npm install --force
```

### 启动开发

```bash
npm run dev
```

### 打包构建

```bash
npm run package
```

## 📁 项目结构简述

```bash
├── src/                  # 源码目录
│   ├── renderer/         # 前端页面（Vue）
│   ├── background.js     # Electron 主进程入口
│   ├── preload.js        # 渲染进程预加载脚本
│   └── socket/           # 通信与消息处理
├── dist_electron/        # 打包输出目录
├── public/               # 静态资源（含 SDK 子模块）
├── avr_electron/         # 自定义构建的加固 Electron 可执行文件
├── nsis_build/           # 安装包构建脚本
├── package.json
└── vue.config.js
```

完整结构详见：[项目结构说明](docs/structure.md)

## 🧩 技术特性

- Electron 主进程与 Vue 渲染进程隔离通信（支持 IPC）
- 本地数据库使用 SQLite 加密（支持 sqlcipher）
- 实现消息 Promise 队列（确保顺序执行）
- 使用 patch-package 实现源码加密与 asar 加固
- 支持自动版本管理与构建安装包（NSIS/MSI）

## 📚 开发文档目录

| 类型          | 文档                                          |
| ------------- | --------------------------------------------- |
| 🧰 安装指南   | [installation.md](docs/installation.md)       |
| 🚀 启动与构建 | [usage.md](docs/usage.md)                     |
| 🧱 项目结构   | [structure.md](docs/structure.md)             |
| 🔒 安全加固   | [security.md](docs/security.md)               |
| 🐞 调试指南   | [debugging.md](docs/debugging.md)             |
| 🗃 数据库设计  | [database.md](docs/database.md)               |
| 🔁 开发流程   | [workflow.md](docs/workflow.md)               |
| 📦 发布发版   | [release.md](docs/release.md)                 |
| ❗ 常见问题   | [troubleshooting.md](docs/troubleshooting.md) |

## 📌 环境变量说明

| 变量               | 描述                               |
| ------------------ | ---------------------------------- |
| `NODE_ENV`         | 运行环境（development/production） |
| `IS_ELECTRON`      | 是否在 Electron 环境中运行         |
| `process.platform` | 当前平台（win32/darwin/linux）     |

## 🛡 安全强化（可选）

- 加密主进程 JS 源码，防止反编译
- 自定义构建 Electron（存放于 `avr_electron/`）
- 禁用 remote，优先使用 IPC 通信
- 开启 app.asar 反解包保护

详情参见：[安全加固说明](docs/security.md)

## 🧪 调试建议

- 安装 VSCode 插件：Debugger for Chrome、Prettier、GitLens、Vetur
- 使用 `electron-all` 启动方式进行断点调试
- 推荐开启 source map 方便开发调试

## 📦 版本发布流程

```bash
npm run change:version 1.20.0  # 更新版本
npm run package-build          # 构建安装包
```

安装包产出路径：`dist_electron/`

构建后上传生成安装包链接及对应版本 YAML

## 🤝 贡献须知

- 提交前请执行代码格式化：

```bash
npm run lint:fix
```

- Git 提交需符合规范（基于 commitlint）

  如需帮助或问题反馈，请联系项目维护者。

```

## ✅ 下一步

你可以根据这个结构，在 `docs/` 文件夹中逐步补充文档内容。如果需要我批量生成子文档模板或转换为 VitePress / Docusaurus 站点结构，也可以继续帮你做。

是否需要我帮你生成所有文档文件骨架？
```

## title: What is Wechaty

<!-- import ShortestChatbots from './polyglot/transclusions/shortest-chatbots.mdx'
import ProviderBadges from './puppet-providers/transclusions/badges.mdx'
import PolyglotBadges from './polyglot/transclusions/badges.mdx' -->

{/* import DiscordQrCode from '../../src/components/discord-qrcode' */}

> A chatbot is a software application used to conduct an online chat conversation instead of direct contact with a live human agent. It is a type of software that can automate conversations and interact with people through messaging platforms. &mdash; [Wikipedia](https://en.wikipedia.org/wiki/Chatbot)

Wechaty is an [Open Source](https://opensource.com/resources/what-open-source) software application for building chatbots. It is a modern [Conversational](explanations/conversational.md) [RPA](explanations/rpa.md) SDK which Chatbot makers can use to create a bot in a few lines of code.

You can use Wechaty to build a chatbot which automates conversations and interact with people through instant messaging platforms such as [WhatsApp](https://www.whatsApp.com/?lang=en), [WeChat](https://www.wechat.com/), [WeCom](https://work.weixin.qq.com/), [Gitter](https://gitter.im/) and [Lark](https://www.larksuite.com/) among others.

## Features {#features}

Wechaty offers out-of-the-box support for the common features you would need for turning your **Instant Messaging** account into a chatbot. You can easily customize and extend Wechaty to create a chatbot that is tailored to your needs. Some common features of Wechaty that you can take advantage of include:

- **Message processing**: You can use Wechaty to receive and send messages. It supports messages in the form of text, image, audio, video, and attachments.
- **Room management**: You can use it to create rooms, add and remove room members, manage topics, etc.
- **Contact management**: Search by name, alias, tags, get profile data and avatar.
- **Friendship management**: Search and add new friends and accept friendship requests.
- **Intelligent dialogue management**: Just several configuration can get a task-oriented bot.
- **Multi-platform support**: With Wechaty, you write code which runs on all IM platforms.

:::note API References

<!-- Learn more functions from [API Reference](./api/overview.mdx) and [How-to Guides](./howto/overview.mdx). -->

:::

## Supported Instant Messaging services

Wechaty supports a number of Instant Messaging platforms. You can build a chatbot using Wechaty for any of the following Instant Messaging platforms:

<!-- <ProviderBadges /> -->

## Supported programming languages

The Wechaty community have developed **Software Development Kits** for most of the popular programming languages. You can build a Wechaty Chatbot in any of the programming languages listed below:

<!-- <PolyglotBadges /> -->

All these SDKs have been developed by and for the community.

## Releases

Since its creation in 2016, a number of Wechaty versions have been released. For more information about the release history and the current stable version, you can read the [Wechaty release notes](https://github.com/Wechaty/wechaty/releases) on Github.

- [Latest Release](https://github.com/Wechaty/wechaty/releases/latest)
- [Changelog](https://github.com/wechaty/wechaty/blob/main/CHANGELOG.md)

## License

Wechaty is an [Open Source Project](https://opensource.com/resources/what-open-source). It is released under [Apache-2.0 license](https://github.com/wechaty/wechaty/blob/main/LICENSE) and the corresponding documentation is released under the [Creative Commons license](https://creativecommons.org/licenses/).

## Maintainers

Wechaty is maintained by [Huan](https://github.com/huan), [Rui](https://github.com/lijiarui) and a community of [Open Source Contributors](https://wechaty.js.org/contributors/). We are always looking for people to join the Wechaty community to maintain the Wechaty codebase and documentation. You necessarily don't have to be a programmer to contribute to Wechaty. To get started contributing, you can read the [Contributing section](contributing/overview.md) of this documentation.

## Getting help

<!-- Wechaty has a community of very helpful contributors on different platforms you can join to get help from. Before joining any of the communities, we recommend that you read our [Code of conduct](community/code-of-conduct.mdx) so that you adhere to our community guidelines. A full list of the different Wechaty communities can be accessed from the [Wechaty community](community/overview.mdx) section of this documentation. -->

## Voice of developers {#voice-of-developers}

> "Wechaty is a great solution, I believe there would be much more users recognize it." [link](https://github.com/Wechaty/wechaty/pull/310#issuecomment-285574472) > &mdash; <cite>@Gcaufy, Tencent Engineer, Author of [WePY](https://github.com/Tencent/wepy)</cite>
>
> "太好用，好用的想哭"
> &mdash; <cite>@xinbenlv, Google Engineer, Founder of HaoShiYou.org</cite>
>
> "最好的微信开发库" [link](http://weibo.com/3296245513/Ec4iNp9Ld?type=comment) > &mdash; <cite>@Jarvis, Baidu Engineer</cite>
>
> "Wechaty 让运营人员更多的时间思考如何进行活动策划、留存用户，商业变现" [link](http://mp.weixin.qq.com/s/dWHAj8XtiKG-1fIS5Og79g) > &mdash; <cite>@lijiarui, Founder & CEO of Juzi.BOT.</cite>
>
> "If you know js ... try Wechaty, it's easy to use."
> &mdash; <cite>@Urinx Uri Lee, Author of [WeixinBot(Python)](https://github.com/Urinx/WeixinBot)</cite>
>
> "Wechaty is a good project, I hope it can continue! Therefore, I became a contributors in open collective."
> &mdash; <cite>[@Simple](https://github.com/mrwhh)</cite>

## World's shortest chatbot {#shortest-chatbot}

You can build a chatbot with a minimum of 6 lines of code with Wechaty.

<!-- <ShortestChatbots /> -->

:::note Polyglot Wechaty

Read more codes from [Polyglot](./polyglot/overview.mdx).

:::

## Stargazers over time

[![Stargazers over time](https://starchart.cc/wechaty/wechaty.svg)](https://starchart.cc/wechaty/wechaty)

## Contributors

[![GitHub issues](https://img.shields.io/github/issues/wechaty/wechaty.svg)](https://github.com/Wechaty/wechaty/issues)
[![GitHub pull requests](https://img.shields.io/github/issues-pr/wechaty/wechaty.svg)](https://github.com/Wechaty/wechaty/pulls)
[![Open Collective Backers](https://opencollective.com/wechaty/backer/badge.svg?label=open%20collective%20backers&color=blue)](https://opencollective.com/wechaty/)
[![Open Collective Sponsors](https://opencollective.com/wechaty/sponsors/badge.svg?label=open%20collective%20sponsors&color=blue)](https://opencollective.com/wechaty/)

[![contributor](https://sourcerer.io/fame/huan/wechaty/wechaty/images/0)](https://sourcerer.io/fame/huan/wechaty/wechaty/links/0)
[![contributor](https://sourcerer.io/fame/huan/wechaty/wechaty/images/1)](https://sourcerer.io/fame/huan/wechaty/wechaty/links/1)
[![contributor](https://sourcerer.io/fame/huan/wechaty/wechaty/images/2)](https://sourcerer.io/fame/huan/wechaty/wechaty/links/2)
[![contributor](https://sourcerer.io/fame/huan/wechaty/wechaty/images/3)](https://sourcerer.io/fame/huan/wechaty/wechaty/links/3)
[![contributor](https://sourcerer.io/fame/huan/wechaty/wechaty/images/4)](https://sourcerer.io/fame/huan/wechaty/wechaty/links/4)
[![contributor](https://sourcerer.io/fame/huan/wechaty/wechaty/images/5)](https://sourcerer.io/fame/huan/wechaty/wechaty/links/5)
[![contributor](https://sourcerer.io/fame/huan/wechaty/wechaty/images/6)](https://sourcerer.io/fame/huan/wechaty/wechaty/links/6)
[![contributor](https://sourcerer.io/fame/huan/wechaty/wechaty/images/7)](https://sourcerer.io/fame/huan/wechaty/wechaty/links/7)

This project exists thanks to all the people who contribute.

[![Contribute](https://opencollective.com/wechaty/contributors.svg?width=890&button=false)](https://github.com/Wechaty/wechaty/graphs/contributors)

### Backers

[![Backers on Open Collective](https://opencollective.com/wechaty/backers/badge.svg)](#backers)

Thank you to all our backers! 🙏. [[Become a backer](https://opencollective.com/wechaty#backer)]

[![Open Collective Wechaty](https://opencollective.com/wechaty/backers.svg?width=890)](https://opencollective.com/wechaty#backers)

### Sponsors

[![Sponsors on Open Collective](https://opencollective.com/wechaty/sponsors/badge.svg)](#sponsors)

Support this project by becoming a sponsor. Your logo will show up here with a link to your website. [[Become a sponsor](https://opencollective.com/wechaty#sponsor)]

[![Wechaty Sponsor](https://opencollective.com/wechaty/sponsor.svg?width=890)](https://opencollective.com/wechaty/#sponsor)

## Join us

Scan the following QRCode and reply with "wechaty" to join the home of Wechaty Developers.

{/* <DiscordQrCode /> */}
