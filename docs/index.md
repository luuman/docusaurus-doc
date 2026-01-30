---
summary: "Moltbot、功能和目的的顶层概述"
read_when:
  - 向新手介绍 Moltbot
---
# Moltbot 🦞

> *"蜕壳！蜕壳！"* — 一只太空龙虾，大概是

<p align="center">
  <img src="whatsapp-clawd.jpg" alt="Moltbot" width="420" />
</p>

<p align="center">
  <strong>跨平台 + WhatsApp/Telegram/Discord/iMessage 网关，用于 AI 代理（Pi）。</strong><br />
  插件增加 Mattermost 等更多功能。
  发送一条消息，从你的口袋中获得代理回复。
</p>

<p align="center">
  <a href="https://github.com/moltbot/moltbot">GitHub</a> ·
  <a href="https://github.com/moltbot/moltbot/releases">发布版本</a> ·
  <a href="/">文档</a> ·
  <a href="/start/clawd">Moltbot 助手设置</a>
</p>

Moltbot 连接了 WhatsApp（通过 WhatsApp Web / Baileys）、Telegram（Bot API / grammY）、Discord（Bot API / channels.discord.js）和 iMessage（imsg CLI）到像 [Pi](https://github.com/badlogic/pi-mono) 这样的编码代理。插件增加 Mattermost（Bot API + WebSocket）等更多功能。
Moltbot 还为 [Clawd](https://clawd.me) 提供支持，这是一个太空龙虾助手。

## 从此开始

- **从零开始的新安装：** [入门指南](/start/getting-started)
- **引导式设置（推荐）：** [向导](/start/wizard) (`moltbot onboard`)
- **打开仪表板（本地网关）：** http://127.0.0.1:18789/ (或 http://localhost:18789/)

如果网关在同一台计算机上运行，该链接会立即打开浏览器控制界面
。如果失败，请先启动网关：`moltbot gateway`。

## 仪表板（浏览器控制界面）

仪表板是用于聊天、配置、节点、会话等的浏览器控制界面。
本地默认：http://127.0.0.1:18789/
远程访问：[Web 界面](/web) 和 [Tailscale](/gateway/tailscale)

## 工作原理

```
WhatsApp / Telegram / Discord / iMessage (+ 插件)
        │
        ▼
  ┌───────────────────────────┐
  │          网关          │  ws://127.0.0.1:18789 (仅回环)
  │     (单一来源)       │
  │                           │  http://<网关主机>:18793
  │                           │    /__moltbot__/canvas/ (Canvas 主机)
  └───────────┬───────────────┘
              │
              ├─ Pi 代理 (RPC)
              ├─ CLI (moltbot …)
              ├─ 聊天界面 (SwiftUI)
              ├─ macOS 应用 (Moltbot.app)
              ├─ iOS 节点通过网关 WS + 配对
              └─ Android 节点通过网关 WS + 配对
```

大多数操作通过 **网关** (`moltbot gateway`) 流转，这是一个长期运行的单一进程，拥有通道连接和 WebSocket 控制平面。

## 网络模型

- **每台主机一个网关（推荐）**：这是唯一被允许拥有 WhatsApp Web 会话的进程。如果你需要救援机器人或严格的隔离，请使用隔离的配置文件和端口运行多个网关；请参见 [多个网关](/gateway/multiple-gateways)。
- **回环优先**：网关 WS 默认为 `ws://127.0.0.1:18789`。
  - 向导现在默认生成网关令牌（即使是回环）。
  - 要访问 Tailnet，请运行 `moltbot gateway --bind tailnet --token ...`（非回环绑定需要令牌）。
- **节点**：连接到网关 WebSocket（根据需要使用 LAN/tailnet/SSH）；旧版 TCP 桥已弃用/移除。
- **Canvas 主机**：HTTP 文件服务器在 `canvasHost.port` 上（默认 `18793`），为节点 WebViews 提供 `/__moltbot__/canvas/`；请参见 [网关配置](/gateway/configuration) (`canvasHost`)。
- **远程使用**：SSH 隧道或 tailnet/VPN；请参见 [远程访问](/gateway/remote) 和 [发现](/gateway/discovery)。

## 功能（高级别）

- 📱 **WhatsApp 集成** — 使用 Baileys 进行 WhatsApp Web 协议
- ✈️ **Telegram 机器人** — 通过 grammY 进行私信 + 群组
- 🎮 **Discord 机器人** — 通过 channels.discord.js 进行私信 + 服务器频道
- 🧩 **Mattermost 机器人（插件）** — 机器人令牌 + WebSocket 事件
- 💬 **iMessage** — 本地 imsg CLI 集成（macOS）
- 🤖 **代理桥** — Pi（RPC 模式）带有工具流
- ⏱️ **流式传输 + 分块** — 块流 + Telegram 草稿流细节 ([/concepts/streaming](/concepts/streaming))
- 🧠 **多代理路由** — 将提供者账户/对等方路由到隔离的代理（工作空间 + 每代理会话）
- 🔐 **订阅认证** — 通过 OAuth 进行 Anthropic（Claude Pro/Max）+ OpenAI（ChatGPT/Codex）
- 💬 **会话** — 直接聊天折叠成共享的 `main`（默认）；群组是隔离的
- 👥 **群聊支持** — 默认基于提及；所有者可以切换 `/activation always|mention`
- 📎 **媒体支持** — 发送和接收图像、音频、文档
- 🎤 **语音笔记** — 可选的转录钩子
- 🖥️ **WebChat + macOS 应用** — 本地 UI + 菜单栏配套用于操作和语音唤醒
- 📱 **iOS 节点** — 作为节点配对并暴露 Canvas 界面
- 📱 **Android 节点** — 作为节点配对并暴露 Canvas + 聊天 + 相机

注意：旧的 Claude/Codex/Gemini/Opencode 路径已被移除；Pi 是唯一的编码代理路径。

## 快速开始

运行时要求：**Node ≥ 22**。

```bash
# 推荐：全局安装（npm/pnpm）
npm install -g moltbot@latest
# 或：pnpm add -g moltbot@latest

# 入门 + 安装服务（launchd/systemd 用户服务）
moltbot onboard --install-daemon

# 配对 WhatsApp Web（显示 QR 码）
moltbot channels login

# 网关在入门后通过服务运行；手动运行仍然是可能的：
moltbot gateway --port 18789
```

稍后在 npm 和 git 安装之间切换很容易：安装另一种风格并运行 `moltbot doctor` 以更新网关服务入口点。

从源码（开发）：

```bash
git clone https://github.com/moltbot/moltbot.git
cd moltbot
pnpm install
pnpm ui:build # 首次运行时自动安装 UI 依赖
pnpm build
moltbot onboard --install-daemon
```

如果你还没有全局安装，请通过 `pnpm moltbot ...` 从仓库运行入门步骤。

多实例快速开始（可选）：

```bash
CLAWDBOT_CONFIG_PATH=~/.clawdbot/a.json \
CLAWDBOT_STATE_DIR=~/.clawdbot-a \
moltbot gateway --port 19001
```

发送测试消息（需要运行中的网关）：

```bash
moltbot message send --target +15555550123 --message "Hello from Moltbot"
```

## 配置（可选）

配置位于 `~/.clawdbot/moltbot.json`。

- 如果你 **什么都不做**，Moltbot 会在 RPC 模式下使用捆绑的 Pi 二进制文件，每个发送者都有独立会话。
- 如果你想锁定它，请从 `channels.whatsapp.allowFrom` 开始，（对于群组）提及规则。

示例：

```json5
{
  channels: {
    whatsapp: {
      allowFrom: ["+15555550123"],
      groups: { "*": { requireMention: true } }
    }
  },
  messages: { groupChat: { mentionPatterns: ["@clawd"] } }
}
```

## 文档

- 从此开始：
  - [文档中心（所有页面链接）](/start/hubs)
  - [帮助](/help) ← *常见修复 + 故障排除*
  - [配置](/gateway/configuration)
  - [配置示例](/gateway/configuration-examples)
  - [斜杠命令](/tools/slash-commands)
  - [多代理路由](/concepts/multi-agent)
  - [更新 / 回滚](/install/updating)
  - [配对（DM + 节点）](/start/pairing)
  - [Nix 模式](/install/nix)
  - [Moltbot 助手设置（Clawd）](/start/clawd)
  - [技能](/tools/skills)
  - [技能配置](/tools/skills-config)
  - [工作空间模板](/reference/templates/AGENTS)
  - [RPC 适配器](/reference/rpc)
  - [网关运行手册](/gateway)
  - [节点（iOS/Android）](/nodes)
  - [Web 界面（控制 UI）](/web)
  - [发现 + 传输](/gateway/discovery)
  - [远程访问](/gateway/remote)
- 提供者和用户体验：
  - [WebChat](/web/webchat)
  - [控制 UI（浏览器）](/web/control-ui)
  - [Telegram](/channels/telegram)
  - [Discord](/channels/discord)
  - [Mattermost（插件）](/channels/mattermost)
  - [iMessage](/channels/imessage)
  - [群组](/concepts/groups)
  - [WhatsApp 群消息](/concepts/group-messages)
  - [媒体：图像](/nodes/images)
  - [媒体：音频](/nodes/audio)
- 伴侣应用：
  - [macOS 应用](/platforms/macos)
  - [iOS 应用](/platforms/ios)
  - [Android 应用](/platforms/android)
  - [Windows（WSL2）](/platforms/windows)
  - [Linux 应用](/platforms/linux)
- 运维和安全：
  - [会话](/concepts/session)
  - [Cron 作业](/automation/cron-jobs)
  - [Webhooks](/automation/webhook)
  - [Gmail 钩子（Pub/Sub）](/automation/gmail-pubsub)
  - [安全](/gateway/security)
  - [故障排除](/gateway/troubleshooting)

## 名称

**Moltbot = CLAW + TARDIS** — 因为每只太空龙虾都需要一台时空机器。

---

*"我们都在玩自己的提示词。"* — 一个人工智能，大概对 token 很兴奋

## 致谢

- **Peter Steinberger** ([@steipete](https://twitter.com/steipete)) — 创造者，龙虾密语者
- **Mario Zechner** ([@badlogicc](https://twitter.com/badlogicgames)) — Pi 创造者，安全渗透测试员
- **Clawd** — 那只要求更好名字的太空龙虾

## 核心贡献者

- **Maxim Vovshin** (@Hyaxia, 36747317+Hyaxia@users.noreply.github.com) — Blogwatcher 技能
- **Nacho Iacovino** (@nachoiacovino, nacho.iacovino@gmail.com) — 位置解析（Telegram + WhatsApp）

## 许可证

MIT — 像海洋中的龙虾一样自由 🦞

---

*"我们都在玩自己的提示词。"* — 一个人工智能，大概对 token 很兴奋