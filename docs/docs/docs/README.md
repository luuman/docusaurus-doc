# 文档总览

```markdown name=docs/README.md
# 项目文档目录结构（极细粒度/知识点独立）

> 本目录适合大中型项目，确保每个知识点、模块、功能点都能单独成文、便于索引与维护。建议配合全局导航和自动化索引工具。

docs/
├── index.md # 文档总览/导航/快速入口
├── introduction/
│ ├── project-overview.md # 项目背景/目标/应用场景
│ ├── features.md # 功能清单与亮点
│ ├── glossary.md # 名词解释
│ ├── roadmap.md # 项目规划与演进路线
│ ├── license.md # 项目授权协议
│ ├── team.md # 团队成员与贡献者
│ ├── architecture.md # 总体架构图与分层说明
├── environment/
│ ├── prerequisites.md # 依赖环境（操作系统/Node/Python/工具等）
│ ├── node-version.md # Node 版本要求与兼容性
│ ├── os-support.md # 支持的操作系统/平台
│ ├── browser-support.md # 浏览器兼容性（如有 Web 端）
├── setup/
│ ├── install.md # 安装步骤
│ ├── init-data.md # 初始化数据脚本说明
│ ├── config-guide.md # 配置文件说明
│ ├── env-vars.md # 环境变量详细列表
│ ├── upgrade-guide.md # 升级与数据迁移
│ ├── uninstall.md # 卸载与清理
│ ├── troubleshooting.md # 安装/启动故障排查
├── build/
│ ├── build-process.md # 构建流程与工具
│ ├── packaging.md # 安装包制作（exe/msi/nsis/zip）
│ ├── code-signing.md # 代码签名与安全
│ ├── build-resources.md # 图标、静态资源说明
│ ├── build-optimization.md # 构建优化技巧
│ ├── ci-cd.md # 持续集成/部署配置
│ ├── release-process.md # 发布流程与变更管理
├── modules/
│ ├── im/
│ │ ├── protocol.md # IM 协议/数据帧
│ │ ├── socket.md # 长连接/重连机制
│ │ ├── push.md # 消息推送机制
│ │ ├── ack.md # ACK/回执机制
│ │ ├── offline.md # 离线消息处理
│ │ ├── event-flow.md # IM 事件流
│ │ ├── message-types.md # 消息类型与格式
│ │ ├── multimedia.md # 富媒体消息（文件/图片/语音）
│ │ ├── group-chat.md # 群聊/讨论组机制
│ │ ├── search.md # 消息全文检索（FTS）
│ │ ├── session.md # 会话管理与会话表
│ │ ├── contact.md # 联系人/群成员管理
│ │ ├── im-ui.md # IM 相关 UI 交互
│ │ ├── notification.md # 桌面通知与系统托盘
│ │ ├── shortcut.md # 快捷键支持
│ │ ├── error-handling.md # IM 异常与容错
│ │ ├── performance.md # IM 性能优化
│ ├── database/
│ │ ├── db-architecture.md # 数据库整体架构
│ │ ├── db-logic.md # logicDB 结构与表
│ │ ├── db-ack.md # ackDB 结构与表
│ │ ├── db-forward.md # ForwardDB 结构与表
│ │ ├── db-encrypt.md # 数据库加密机制
│ │ ├── db-backup.md # 备份与恢复
│ │ ├── db-init.md # 数据库初始化流程
│ │ ├── db-upgrade.md # 数据库升级/迁移
│ │ ├── db-api.md # 数据库接口调用
│ │ ├── db-index.md # 索引设计与优化
│ │ ├── db-performance.md # 数据库性能
│ │ ├── db-troubleshooting.md # 数据库故障排查
│ │ ├── db-sql-examples.md # SQL 建表/查询示例
│ │ ├── db-schema-diagram.md # 表结构/ER 图
│ ├── frontend/
│ │ ├── vue-architecture.md # Vue 架构与入口
│ │ ├── components.md # 组件列表与功能
│ │ ├── component-example.md # 典型组件代码说明
│ │ ├── store.md # 状态管理(Vuex)
│ │ ├── router.md # 路由设计
│ │ ├── styles.md # 样式与主题资源
│ │ ├── i18n.md # 国际化支持
│ │ ├── accessibility.md # 无障碍设计
│ │ ├── frontend-performance.md # 前端性能优化
│ ├── electron/
│ │ ├── main-process.md # 主进程架构
│ │ ├── preload.md # 预加载与安全隔离
│ │ ├── window-management.md # 多窗口管理
│ │ ├── desktop-integration.md # 原生 API/系统集成
│ │ ├── electron-security.md # Electron 安全措施
│ │ ├── electron-troubleshooting.md # Electron 异常排查
│ ├── utils/
│ │ ├── tools.md # 工具函数索引
│ │ ├── error-log.md # 日志收集机制
│ │ ├── sentry-integration.md # Sentry 集成
│ │ ├── fts.md # FTS 全文检索
│ │ ├── encryption-utils.md # 加密工具/算法
│ │ ├── helper-scripts.md # 辅助脚本示例
│ ├── integration/
│ │ ├── api-integration.md # 后端 API 对接
│ │ ├── thirdparty.md # 第三方依赖说明
│ │ ├── sdk.md # SDK 集成/调用
│ │ ├── webhooks.md # Webhook 机制
│ │ ├── ci-cd-integration.md # CI/CD 详细流程
│ │ ├── external-storage.md # 外部存储集成
├── config/
│ ├── app-config.md # 应用配置项详解
│ ├── config-example.md # 配置示例与模板
│ ├── config-troubleshooting.md # 配置故障排查
├── developer/
│ ├── code-style.md # 代码规范
│ ├── commit-convention.md # 提交规范
│ ├── debug-guide.md # 调试指南
│ ├── test-guide.md # 单元测试/集成测试
│ ├── contribution.md # 贡献流程
│ ├── pr-template.md # PR 模板
│ ├── issue-template.md # Issue 模板
│ ├── review-guide.md # 代码评审流程
│ ├── release-checklist.md # 发布前检查
│ ├── developer-tips.md # 开发技巧&经验
├── security/
│ ├── encryption.md # 数据加密机制
│ ├── permission.md # 权限与空间隔离
│ ├── data-privacy.md # 用户数据隐私
│ ├── vulnerability.md # 漏洞应急处置
│ ├── backup-recovery.md # 数据备份/恢复
│ ├── security-best.md # 安全最佳实践
├── performance/
│ ├── optimization.md # 性能优化技巧
│ ├── stress-test.md # 压测方案
│ ├── performance-monitor.md # 性能监控工具
│ ├── performance-case.md # 性能问题案例
├── faq/
│ ├── common-issues.md # 常见问题
│ ├── troubleshooting.md # 故障排查大全
│ ├── how-to.md # 使用技巧/How-To
│ ├── tips.md # 常用小技巧
│ ├── upgrade-faq.md # 升级相关 FAQ
├── changelog/
│ ├── changelog.md # 版本变更日志
│ ├── migration-history.md # 数据迁移历史
├── reference/
│ ├── links.md # 参考链接
│ ├── standards.md # 相关标准
│ ├── glossary.md # 术语表
│ ├── er-diagram.md # 数据库 ER 图
│ ├── protocol-spec.md # 协议规范全文
│ ├── openapi.md # OpenAPI/接口文档

---

> 说明：
>
> - 每个知识点/模块/功能点都可以单独成文，便于后续细化和跨团队协作。
> - 建议配合自动化生成导航/索引（如 docsify、docusaurus、VuePress 等）。
> - 可根据实际需求继续细分/补充，保持文档结构灵活、可扩展。
```
