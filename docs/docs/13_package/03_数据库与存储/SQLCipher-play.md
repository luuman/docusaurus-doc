## 数据库架构概述

该项目使用了基于 SQLCipher 的加密数据库系统，主要用于存储会议和消息相关数据。

### 核心技术栈

**数据库引擎**: [@journeyapps/sqlcipher](package.json#L28) - SQLite 的加密版本，提供数据安全性

**数据库连接**: [logicDBConnect.js](src/utils/logicDBConnect.js#L8) - 管理数据库连接、密码获取和实例缓存

### 数据库架构

#### 1. 多租户架构

- 使用 `spaceId` 作为租户标识，每个租户拥有独立的数据库文件
- 数据库文件路径: `${vuid}.${spaceId}.db.db` ([logicDBConnect.js#L15](src/utils/logicDBConnect.js#L15))
- 支持数据库实例缓存管理 ([multipleDBInsMange.js](src/utils/logicDBConnect.js#L3))

#### 2. 安全特性

- **加密存储**: 使用 SQLCipher 进行数据库级加密
- **密码管理**: 通过 IPC 通道从主进程获取数据库密码 ([logicDBConnect.js#L26](src/utils/logicDBConnect.js#L26))
- **兼容性设置**: 支持与 SQLCipher 3.x 兼容 ([logicDBConnect.js#L62](src/utils/logicDBConnect.js#L62))

#### 3. 性能优化

- **WAL 模式**: 使用 `PRAGMA journal_mode = WAL` 支持并发读写 ([logicDBConnect.js#L68](src/utils/logicDBConnect.js#L68))
- **同步设置**: `PRAGMA synchronous = 1` 平衡性能与安全性
- **连接缓存**: 数据库实例缓存避免重复连接开销

### 数据库版本管理

#### 版本升级系统

- **当前版本**: 通过 `PRAGMA user_version` 跟踪数据库版本
- **增量升级**: 支持从任意版本升级到目标版本 ([\_doUpgrade](src/utils/logicDBConnect.js#L200))
- **版本脚本**: 存储在 [src/sql/init/](src/sql/init/) 目录，包含 v1-v29 版本升级脚本

#### 版本文件结构

```
src/sql/init/
├── v1.js    - 初始数据库结构
├── v2.js    - 版本2升级脚本
├── ...      - 中间版本
└── v29.js   - 最新版本升级脚本
```

### 数据库抽象层

#### 1. SQL 工具层 ([SqliteUtil.js](src/utils/SqliteUtil.js))

- **基础操作**: `getWith`, `allWith`, `insertWith`, `updateWith`, `runWith`
- **批量操作**: `betchInsertWith`, `betchSetupFtsMsg`
- **事务支持**: 自动管理事务的批量操作

#### 2. API 层 ([sqlApi/](src/sqlApi/))

- **封装方法**: 提供 `selectAll`, `addInsertAll`, `updateAll` 等便捷接口
- **业务查询**: 针对特定业务场景的 SQL 查询封装
- **错误处理**: 统一的错误处理和日志记录

### 全文搜索 (FTS)

#### 索引系统

- **索引表**: `IndexTable` 存储可搜索内容
- **支持类型**: 消息、文件、联系人、群成员
- **批量索引**: `betchInsertFtsMsg` 批量建立消息索引 ([SqliteUtil.js#L197](src/utils/SqliteUtil.js#L197))

#### 搜索类型定义

```javascript
SearchEnum.ftsType = {
  BUS_TYPE_MESSAGE: "message",
  BUS_TYPE_CONTACT: "contact",
  BUS_SUBTYPE_MESSAGE: "text",
  BUS_SUBTYPE_FILE: "file",
  BUS_SUBTYPE_CONTACT_GROUP_MEMBER: "group_member",
};
```

### 主要数据表结构

#### 核心业务表

- **message**: 消息表，存储聊天消息和文件信息
- **peer**: 联系人表，存储好友和群组信息
- **organization**: 组织架构表
- **emailPeer**: 邮件联系人表
- **session**: 会话表，管理对话会话

#### 特殊功能表

- **IndexTable**: 全文搜索索引表
- **voice**: 语音消息播放状态表

### 使用建议

1. **数据安全**: 所有数据库操作都通过 spaceId 进行隔离，确保数据安全
2. **性能考虑**: 大量数据操作时使用批量方法，如 `betchInsertWith`
3. **版本兼容**: 数据库升级时考虑向后兼容性，避免数据丢失
4. **错误处理**: 数据库操作都包含错误处理机制，建议在业务层进行适当处理

要了解更多关于数据库配置和使用的详细信息，建议查看 [数据库管理](9-database-management-with-sqlcipher) 章节。
