#!/bin/bash

# 根目录
BASE_DIR="docs"

# 创建目录函数
create_dir () {
  DIR_PATH=$1
  mkdir -p "$DIR_PATH"
}

# 创建文件并写入内容（带序号标题）
create_file () {
  FILE_PATH=$1
  NUMBER=$2
  TITLE=$3
  echo "# $NUMBER $TITLE" > "$FILE_PATH"
}

# 为目录写 README.md（带序号标题）
create_readme () {
  DIR_PATH=$1
  NUMBER=$2
  TITLE=$3
  echo "# $NUMBER $TITLE" > "$DIR_PATH/README.md"
}

# 根目录
create_dir "$BASE_DIR"
create_file "$BASE_DIR/index.md" "" "文档总览 / 导航 / 快速入口"
create_readme "$BASE_DIR" "" "文档总览"

# 01 introduction
create_dir "$BASE_DIR/01_introduction"
create_readme "$BASE_DIR/01_introduction" "" "项目介绍"
create_file "$BASE_DIR/01_introduction/01_project-overview.md" "" "项目背景 / 目标 / 应用场景"
create_file "$BASE_DIR/01_introduction/02_features.md" "" "功能清单与亮点"
create_file "$BASE_DIR/01_introduction/03_glossary.md" "" "名词解释"
create_file "$BASE_DIR/01_introduction/04_roadmap.md" "" "项目规划与演进路线"
create_file "$BASE_DIR/01_introduction/05_license.md" "" "项目授权协议"
create_file "$BASE_DIR/01_introduction/06_team.md" "" "团队成员与贡献者"
create_file "$BASE_DIR/01_introduction/07_architecture.md" "" "总体架构图与分层说明"

# 02 environment
create_dir "$BASE_DIR/02_environment"
create_readme "$BASE_DIR/02_environment" "" "运行环境"
create_file "$BASE_DIR/02_environment/01_prerequisites.md" "" "依赖环境（操作系统 / Node / Python / 工具等）"
create_file "$BASE_DIR/02_environment/02_node-version.md" "" "Node 版本要求与兼容性"
create_file "$BASE_DIR/02_environment/03_os-support.md" "" "支持的操作系统 / 平台"
create_file "$BASE_DIR/02_environment/04_browser-support.md" "" "浏览器兼容性（如有 Web 端）"

# 03 setup
create_dir "$BASE_DIR/03_setup"
create_readme "$BASE_DIR/03_setup" "" "安装与配置"
create_file "$BASE_DIR/03_setup/01_install.md" "" "安装步骤"
create_file "$BASE_DIR/03_setup/02_init-data.md" "" "初始化数据脚本说明"
create_file "$BASE_DIR/03_setup/03_config-guide.md" "" "配置文件说明"
create_file "$BASE_DIR/03_setup/04_env-vars.md" "" "环境变量详细列表"
create_file "$BASE_DIR/03_setup/05_upgrade-guide.md" "" "升级与数据迁移"
create_file "$BASE_DIR/03_setup/06_uninstall.md" "" "卸载与清理"
create_file "$BASE_DIR/03_setup/07_troubleshooting.md" "" "安装 / 启动故障排查"

# 04 build
create_dir "$BASE_DIR/04_build"
create_readme "$BASE_DIR/04_build" "" "构建与发布"
create_file "$BASE_DIR/04_build/01_build-process.md" "" "构建流程与工具"
create_file "$BASE_DIR/04_build/02_packaging.md" "" "安装包制作（exe / msi / nsis / zip）"
create_file "$BASE_DIR/04_build/03_code-signing.md" "" "代码签名与安全"
create_file "$BASE_DIR/04_build/04_build-resources.md" "" "图标、静态资源说明"
create_file "$BASE_DIR/04_build/05_build-optimization.md" "" "构建优化技巧"
create_file "$BASE_DIR/04_build/06_ci-cd.md" "" "持续集成 / 部署配置"
create_file "$BASE_DIR/04_build/07_release-process.md" "" "发布流程与变更管理"

# 05 modules
create_dir "$BASE_DIR/05_modules"
create_readme "$BASE_DIR/05_modules" "" "功能模块"

## 05.01 im
create_dir "$BASE_DIR/05_modules/01_im"
create_readme "$BASE_DIR/05_modules/01_im" "" "即时通讯模块"
create_file "$BASE_DIR/05_modules/01_im/01_protocol.md" "" "IM 协议 / 数据帧"
create_file "$BASE_DIR/05_modules/01_im/02_socket.md" "" "长连接 / 重连机制"
create_file "$BASE_DIR/05_modules/01_im/03_push.md" "" "消息推送机制"
create_file "$BASE_DIR/05_modules/01_im/04_ack.md" "" "ACK / 回执机制"
create_file "$BASE_DIR/05_modules/01_im/05_offline.md" "" "离线消息处理"
create_file "$BASE_DIR/05_modules/01_im/06_event-flow.md" "" "IM 事件流"
create_file "$BASE_DIR/05_modules/01_im/07_message-types.md" "" "消息类型与格式"
create_file "$BASE_DIR/05_modules/01_im/08_multimedia.md" "" "富媒体消息（文件 / 图片 / 语音）"
create_file "$BASE_DIR/05_modules/01_im/09_group-chat.md" "" "群聊 / 讨论组机制"
create_file "$BASE_DIR/05_modules/01_im/10_search.md" "" "消息全文检索（FTS）"
create_file "$BASE_DIR/05_modules/01_im/11_session.md" "" "会话管理与会话表"
create_file "$BASE_DIR/05_modules/01_im/12_contact.md" "" "联系人 / 群成员管理"
create_file "$BASE_DIR/05_modules/01_im/13_im-ui.md" "" "IM 相关 UI 交互"
create_file "$BASE_DIR/05_modules/01_im/14_notification.md" "" "桌面通知与系统托盘"
create_file "$BASE_DIR/05_modules/01_im/15_shortcut.md" "" "快捷键支持"
create_file "$BASE_DIR/05_modules/01_im/16_error-handling.md" "" "IM 异常与容错"
create_file "$BASE_DIR/05_modules/01_im/17_performance.md" "" "IM 性能优化"

## 05.02 database
create_dir "$BASE_DIR/05_modules/02_database"
create_readme "$BASE_DIR/05_modules/02_database" "" "数据库模块"
create_file "$BASE_DIR/05_modules/02_database/01_db-architecture.md" "" "数据库整体架构"
create_file "$BASE_DIR/05_modules/02_database/02_db-logic.md" "" "logicDB 结构与表"
create_file "$BASE_DIR/05_modules/02_database/03_db-ack.md" "" "ackDB 结构与表"
create_file "$BASE_DIR/05_modules/02_database/04_db-forward.md" "" "ForwardDB 结构与表"
create_file "$BASE_DIR/05_modules/02_database/05_db-encrypt.md" "" "数据库加密机制"
create_file "$BASE_DIR/05_modules/02_database/06_db-backup.md" "" "数据库备份与恢复"
create_file "$BASE_DIR/05_modules/02_database/07_db-init.md" "" "数据库初始化流程"
create_file "$BASE_DIR/05_modules/02_database/08_db-upgrade.md" "" "数据库升级 / 迁移"
create_file "$BASE_DIR/05_modules/02_database/09_db-api.md" "" "数据库接口调用"
create_file "$BASE_DIR/05_modules/02_database/10_db-index.md" "" "索引设计与优化"
create_file "$BASE_DIR/05_modules/02_database/11_db-performance.md" "" "数据库性能优化"
create_file "$BASE_DIR/05_modules/02_database/12_db-troubleshooting.md" "" "数据库故障排查"
create_file "$BASE_DIR/05_modules/02_database/13_db-sql-examples.md" "" "SQL 建表 / 查询示例"
create_file "$BASE_DIR/05_modules/02_database/14_db-schema-diagram.md" "" "表结构 / ER 图"

## 05.03 frontend
create_dir "$BASE_DIR/05_modules/03_frontend"
create_readme "$BASE_DIR/05_modules/03_frontend" "" "前端模块"
create_file "$BASE_DIR/05_modules/03_frontend/01_vue-architecture.md" "" "Vue 架构与入口"
create_file "$BASE_DIR/05_modules/03_frontend/02_components.md" "" "组件列表与功能"
create_file "$BASE_DIR/05_modules/03_frontend/03_component-example.md" "" "典型组件代码说明"
create_file "$BASE_DIR/05_modules/03_frontend/04_store.md" "" "状态管理 (Vuex)"
create_file "$BASE_DIR/05_modules/03_frontend/05_router.md" "" "路由设计"
create_file "$BASE_DIR/05_modules/03_frontend/06_styles.md" "" "样式与主题资源"
create_file "$BASE_DIR/05_modules/03_frontend/07_i18n.md" "" "国际化支持"
create_file "$BASE_DIR/05_modules/03_frontend/08_accessibility.md" "" "无障碍设计"
create_file "$BASE_DIR/05_modules/03_frontend/09_frontend-performance.md" "" "前端性能优化"

## 05.04 electron
create_dir "$BASE_DIR/05_modules/04_electron"
create_readme "$BASE_DIR/05_modules/04_electron" "" "Electron 模块"
create_file "$BASE_DIR/05_modules/04_electron/01_main-process.md" "" "Electron 主进程架构"
create_file "$BASE_DIR/05_modules/04_electron/02_preload.md" "" "预加载与安全隔离"
create_file "$BASE_DIR/05_modules/04_electron/03_window-management.md" "" "多窗口管理"
create_file "$BASE_DIR/05_modules/04_electron/04_desktop-integration.md" "" "原生 API / 系统集成"
create_file "$BASE_DIR/05_modules/04_electron/05_electron-security.md" "" "Electron 安全措施"
create_file "$BASE_DIR/05_modules/04_electron/06_electron-troubleshooting.md" "" "Electron 异常排查"

## 05.05 utils
create_dir "$BASE_DIR/05_modules/05_utils"
create_readme "$BASE_DIR/05_modules/05_utils" "" "工具模块"
create_file "$BASE_DIR/05_modules/05_utils/01_tools.md" "" "工具函数索引"
create_file "$BASE_DIR/05_modules/05_utils/02_error-log.md" "" "日志收集机制"
create_file "$BASE_DIR/05_modules/05_utils/03_sentry-integration.md" "" "Sentry 集成"
create_file "$BASE_DIR/05_modules/05_utils/04_fts.md" "" "FTS 全文检索"
create_file "$BASE_DIR/05_modules/05_utils/05_encryption-utils.md" "" "加密工具 / 算法"
create_file "$BASE_DIR/05_modules/05_utils/06_helper-scripts.md" "" "辅助脚本示例"

## 05.06 integration
create_dir "$BASE_DIR/05_modules/06_integration"
create_readme "$BASE_DIR/05_modules/06_integration" "" "集成模块"
create_file "$BASE_DIR/05_modules/06_integration/01_api-integration.md" "" "后端 API 对接"
create_file "$BASE_DIR/05_modules/06_integration/02_thirdparty.md" "" "第三方依赖说明"
create_file "$BASE_DIR/05_modules/06_integration/03_sdk.md" "" "SDK 集成 / 调用"
create_file "$BASE_DIR/05_modules/06_integration/04_webhooks.md" "" "Webhook 机制"
create_file "$BASE_DIR/05_modules/06_integration/05_ci-cd-integration.md" "" "CI/CD 详细流程"
create_file "$BASE_DIR/05_modules/06_integration/06_external-storage.md" "" "外部存储集成"

# 06 config
create_dir "$BASE_DIR/06_config"
create_readme "$BASE_DIR/06_config" "" "配置相关"
create_file "$BASE_DIR/06_config/01_app-config.md" "" "应用配置项详解"
create_file "$BASE_DIR/06_config/02_config-example.md" "" "配置示例与模板"
create_file "$BASE_DIR/06_config/03_config-troubleshooting.md" "" "配置故障排查"

# 07 developer
create_dir "$BASE_DIR/07_developer"
create_readme "$BASE_DIR/07_developer" "" "开发者指南"
create_file "$BASE_DIR/07_developer/01_code-style.md" "" "代码规范"
create_file "$BASE_DIR/07_developer/02_commit-convention.md" "" "提交规范"
create_file "$BASE_DIR/07_developer/03_debug-guide.md" "" "调试指南"
create_file "$BASE_DIR/07_developer/04_test-guide.md" "" "单元测试 / 集成测试"
create_file "$BASE_DIR/07_developer/05_contribution.md" "" "贡献流程"
create_file "$BASE_DIR/07_developer/06_pr-template.md" "" "PR 模板"
create_file "$BASE_DIR/07_developer/07_issue-template.md" "" "Issue 模板"
create_file "$BASE_DIR/07_developer/08_review-guide.md" "" "代码评审流程"
create_file "$BASE_DIR/07_developer/09_release-checklist.md" "" "发布前检查清单"
create_file "$BASE_DIR/07_developer/10_developer-tips.md" "" "开发技巧 & 经验"

# 08 security
create_dir "$BASE_DIR/08_security"
create_readme "$BASE_DIR/08_security" "" "安全机制"
create_file "$BASE_DIR/08_security/01_encryption.md" "" "数据加密机制"
create_file "$BASE_DIR/08_security/02_permission.md" "" "权限与空间隔离"
create_file "$BASE_DIR/08_security/03_data-privacy.md" "" "用户数据隐私"
create_file "$BASE_DIR/08_security/04_vulnerability.md" "" "漏洞应急处置"
create_file "$BASE_DIR/08_security/05_backup-recovery.md" "" "数据备份与恢复"
create_file "$BASE_DIR/08_security/06_security-best.md" "" "安全最佳实践"

# 09 performance
create_dir "$BASE_DIR/09_performance"
create_readme "$BASE_DIR/09_performance" "" "性能优化"
create_file "$BASE_DIR/09_performance/01_optimization.md" "" "性能优化技巧"
create_file "$BASE_DIR/09_performance/02_stress-test.md" "" "压测方案"
create_file "$BASE_DIR/09_performance/03_performance-monitor.md" "" "性能监控工具"
create_file "$BASE_DIR/09_performance/04_performance-case.md" "" "性能问题案例"

# 10 faq
create_dir "$BASE_DIR/10_faq"
create_readme "$BASE_DIR/10_faq" "" "常见问题"
create_file "$BASE_DIR/10_faq/01_common-issues.md" "" "常见问题"
create_file "$BASE_DIR/10_faq/02_troubleshooting.md" "" "故障排查大全"
create_file "$BASE_DIR/10_faq/03_how-to.md" "" "使用技巧 / How-To"
create_file "$BASE_DIR/10_faq/04_tips.md" "" "常用小技巧"
create_file "$BASE_DIR/10_faq/05_upgrade-faq.md" "" "升级相关 FAQ"

# 11 changelog
create_dir "$BASE_DIR/11_changelog"
create_readme "$BASE_DIR/11_changelog" "" "更新日志"
create_file "$BASE_DIR/11_changelog/01_changelog.md" "" "版本变更日志"
create_file "$BASE_DIR/11_changelog/02_migration-history.md" "" "数据迁移历史"

# 12 reference
create_dir "$BASE_DIR/12_reference"
create_readme "$BASE_DIR/12_reference" "" "参考资料"
create_file "$BASE_DIR/12_reference/01_links.md" "" "参考链接"
create_file "$BASE_DIR/12_reference/02_standards.md" "" "相关标准"
create_file "$BASE_DIR/12_reference/03_glossary.md" "" "术语表"
create_file "$BASE_DIR/12_reference/04_er-diagram.md" "" "数据库 ER 图"
create_file "$BASE_DIR/12_reference/05_protocol-spec.md" "" "协议规范全文"
create_file "$BASE_DIR/12_reference/06_openapi.md" "" "OpenAPI / 接口文档"

echo "✅ 文档目录、README.md 和文件中文标题（带序号）已生成"
