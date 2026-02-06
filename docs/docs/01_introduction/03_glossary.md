# 名词解释

```markdown name=docs/introduction/glossary.md
# 名词解释 Glossary

本表汇总 matrx-windows 项目涉及的常用术语及其定义，便于开发者和用户快速理解技术细节。

| 名词/缩写  | 英文原文                                     | 释义与说明                                   |
| ---------- | -------------------------------------------- | -------------------------------------------- |
| IM         | Instant Messaging                            | 即时通讯，指消息实时收发的系统或功能         |
| ACK        | Acknowledgement                              | 消息送达/回执，确认消息被成功接收            |
| DB         | Database                                     | 数据库，存储结构化/非结构化数据              |
| logicDB    | Logic Database                               | 业务主数据库，存储 IM 消息、联系人等核心数据 |
| ackDB      | ACK Database                                 | 临时消息确认数据库，缓存待回执/重发消息      |
| ForwardDB  | Forward Database                             | 前置数据库，系统全局配置及空间数据缓存       |
| SQLite     | SQLite                                       | 轻量级关系型数据库引擎                       |
| SQLCipher  | SQLCipher                                    | 支持加密的 SQLite 扩展版本                   |
| WAL        | Write-Ahead Logging                          | 数据库写前日志模式，提高并发与安全性         |
| PBKDF2     | Password-Based Key Derivation Function 2     | 密码加密算法，用于强化密钥安全               |
| AES        | Advanced Encryption Standard                 | 对称加密算法，常用于数据库/消息加密          |
| RSA        | Rivest–Shamir–Adleman                        | 非对称加密算法，常用于密钥交换、敏感数据加密 |
| KDF        | Key Derivation Function                      | 密钥派生函数，提升加密安全性                 |
| Space/空间 | Space                                        | 虚拟组织或租户单元，支持多空间隔离与管理     |
| VUID       | Virtual User ID                              | 用户虚拟唯一标识，区分不同终端/空间          |
| Peer       | Peer                                         | 联系人、群成员、会话参与者等统一抽象         |
| Session    | Session                                      | 会话，单聊、群聊或系统对话的抽象             |
| FTS        | Full Text Search                             | 全文检索技术，支持消息快速搜索               |
| Electron   | Electron                                     | 跨平台桌面应用开发框架                       |
| Vue        | Vue.js                                       | 前端 UI 框架，项目主界面技术栈               |
| Sentry     | Sentry                                       | 错误监控与日志收集平台                       |
| SonarQube  | SonarQube                                    | 代码质量检测与持续集成工具                   |
| SDK        | Software Development Kit                     | 软件开发工具包，第三方集成接口               |
| CI/CD      | Continuous Integration/Continuous Deployment | 持续集成/持续部署流程                        |
| API        | Application Programming Interface            | 应用程序接口，用于系统/模块间通信            |
| NSIS       | Nullsoft Scriptable Install System           | 安装包打包工具（Windows）                    |
| Tray/托盘  | System Tray                                  | 系统托盘，桌面客户端常驻区块                 |
| PR         | Pull Request                                 | 代码合并请求，协作开发流程                   |
| Issue      | Issue                                        | 问题追踪，缺陷/需求/建议等                   |
| SSO        | Single Sign-On                               | 单点登录，统一认证管理机制                   |

---

如需补充术语或特殊业务词汇，请在此文档持续扩展。
```
