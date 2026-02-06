# 数据存储模块

## 概述

本项目采用三层数据存储架构：

1. **SQLCipher** - 加密数据库，存储消息、联系人等核心数据
2. **electron-store** - 应用配置和用户偏好
3. **Vuex Store** - 运行时状态管理

## SQLCipher 数据库

### 目录结构

```
src/sql/
├── init/              # 数据库初始化脚本
├── userInfo/          # 用户信息表
├── ackDB/             # 消息确认数据库
├── ftsInit/           # 全文搜索索引
├── forwardInit/       # 转发数据库
└── messageDao.js      # 消息数据访问对象
```

### 数据库初始化

```javascript
// src/sql/init/index.js
const Database = require('@journeyapps/sqlcipher').verbose();

class DatabaseManager {
  constructor() {
    this.db = null;
    this.dbPath = null;
  }

  // 初始化数据库
  async init(userId) {
    const userDataPath = app.getPath('userData');
    this.dbPath = path.join(userDataPath, `${userId}.db`);

    return new Promise((resolve, reject) => {
      this.db = new Database(this.dbPath, (err) => {
        if (err) {
          reject(err);
          return;
        }

        // 设置加密密钥
        this.db.run(`PRAGMA key = '${this.getEncryptionKey()}'`, (err) => {
          if (err) {
            reject(err);
            return;
          }

          // 创建表
          this.createTables().then(resolve).catch(reject);
        });
      });
    });
  }

  // 获取加密密钥
  getEncryptionKey() {
    // 基于设备 ID 和用户 ID 生成密钥
    const deviceId = store.get('deviceId');
    return crypto.createHash('sha256')
      .update(`${deviceId}-encryption-key`)
      .digest('hex');
  }

  // 创建表结构
  async createTables() {
    const schemas = [
      this.createPeerTable(),
      this.createSessionTable(),
      this.createMessageTable(),
      this.createOrganizationTable(),
      this.createFTSTable()
    ];

    for (const schema of schemas) {
      await this.run(schema);
    }
  }

  // peer 表（联系人）
  createPeerTable() {
    return `
      CREATE TABLE IF NOT EXISTS peer (
        id TEXT PRIMARY KEY,
        name TEXT,
        avatar TEXT,
        email TEXT,
        phone TEXT,
        status TEXT,
        created_at INTEGER,
        updated_at INTEGER
      )
    `;
  }

  // session 表（会话）
  createSessionTable() {
    return `
      CREATE TABLE IF NOT EXISTS session (
        id TEXT PRIMARY KEY,
        type TEXT,
        name TEXT,
        avatar TEXT,
        last_message_id TEXT,
        last_message_time INTEGER,
        unread_count INTEGER DEFAULT 0,
        is_pinned INTEGER DEFAULT 0,
        is_muted INTEGER DEFAULT 0,
        created_at INTEGER,
        updated_at INTEGER
      )
    `;
  }

  // message 表（消息）
  createMessageTable() {
    return `
      CREATE TABLE IF NOT EXISTS message (
        id TEXT PRIMARY KEY,
        session_id TEXT,
        sender_id TEXT,
        type TEXT,
        content TEXT,
        status TEXT,
        timestamp INTEGER,
        is_read INTEGER DEFAULT 0,
        extra TEXT,
        FOREIGN KEY (session_id) REFERENCES session(id)
      )
    `;
  }

  // 全文搜索表
  createFTSTable() {
    return `
      CREATE VIRTUAL TABLE IF NOT EXISTS fts_message USING fts5(
        content,
        content_rowid='id'
      )
    `;
  }

  // 执行 SQL
  run(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.run(sql, params, function(err) {
        if (err) reject(err);
        else resolve({ lastID: this.lastID, changes: this.changes });
      });
    });
  }

  // 查询单条
  get(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.get(sql, params, (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  }

  // 查询多条
  all(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.all(sql, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }

  // 关闭数据库
  close() {
    return new Promise((resolve, reject) => {
      if (this.db) {
        this.db.close((err) => {
          if (err) reject(err);
          else resolve();
        });
      } else {
        resolve();
      }
    });
  }
}

module.exports = new DatabaseManager();
```

### SQL API 封装

```javascript
// src/sqlApi/index.js

const db = require('../sql/init');

// ==================== Peer 操作 ====================

/**
 * 获取联系人
 */
export async function getPeer(peerId) {
  return db.get('SELECT * FROM peer WHERE id = ?', [peerId]);
}

/**
 * 获取所有联系人
 */
export async function getAllPeers() {
  return db.all('SELECT * FROM peer ORDER BY name');
}

/**
 * 保存联系人
 */
export async function savePeer(peer) {
  const { id, name, avatar, email, phone, status } = peer;
  const now = Date.now();

  return db.run(`
    INSERT OR REPLACE INTO peer
    (id, name, avatar, email, phone, status, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `, [id, name, avatar, email, phone, status, now, now]);
}

/**
 * 批量保存联系人
 */
export async function savePeers(peers) {
  const stmt = db.db.prepare(`
    INSERT OR REPLACE INTO peer
    (id, name, avatar, email, phone, status, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const now = Date.now();
  for (const peer of peers) {
    stmt.run([
      peer.id, peer.name, peer.avatar,
      peer.email, peer.phone, peer.status,
      now, now
    ]);
  }

  stmt.finalize();
}

// ==================== Session 操作 ====================

/**
 * 获取会话列表
 */
export async function getSessions(limit = 100, offset = 0) {
  return db.all(`
    SELECT * FROM session
    ORDER BY is_pinned DESC, last_message_time DESC
    LIMIT ? OFFSET ?
  `, [limit, offset]);
}

/**
 * 获取单个会话
 */
export async function getSession(sessionId) {
  return db.get('SELECT * FROM session WHERE id = ?', [sessionId]);
}

/**
 * 保存/更新会话
 */
export async function saveSession(session) {
  const now = Date.now();
  return db.run(`
    INSERT OR REPLACE INTO session
    (id, type, name, avatar, last_message_id, last_message_time,
     unread_count, is_pinned, is_muted, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [
    session.id, session.type, session.name, session.avatar,
    session.lastMessageId, session.lastMessageTime,
    session.unreadCount || 0, session.isPinned ? 1 : 0,
    session.isMuted ? 1 : 0, now, now
  ]);
}

/**
 * 更新未读数
 */
export async function updateUnreadCount(sessionId, count) {
  return db.run(
    'UPDATE session SET unread_count = ?, updated_at = ? WHERE id = ?',
    [count, Date.now(), sessionId]
  );
}

// ==================== Message 操作 ====================

/**
 * 获取会话消息
 */
export async function getMessages(sessionId, limit = 50, offset = 0) {
  return db.all(`
    SELECT * FROM message
    WHERE session_id = ?
    ORDER BY timestamp DESC
    LIMIT ? OFFSET ?
  `, [sessionId, limit, offset]);
}

/**
 * 保存消息
 */
export async function saveMessage(message) {
  return db.run(`
    INSERT OR REPLACE INTO message
    (id, session_id, sender_id, type, content, status, timestamp, is_read, extra)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [
    message.id, message.sessionId, message.senderId,
    message.type, message.content, message.status,
    message.timestamp, message.isRead ? 1 : 0,
    JSON.stringify(message.extra || {})
  ]);
}

/**
 * 批量保存消息
 */
export async function saveMessages(messages) {
  return new Promise((resolve, reject) => {
    db.db.serialize(() => {
      db.db.run('BEGIN TRANSACTION');

      const stmt = db.db.prepare(`
        INSERT OR REPLACE INTO message
        (id, session_id, sender_id, type, content, status, timestamp, is_read, extra)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      for (const msg of messages) {
        stmt.run([
          msg.id, msg.sessionId, msg.senderId,
          msg.type, msg.content, msg.status,
          msg.timestamp, msg.isRead ? 1 : 0,
          JSON.stringify(msg.extra || {})
        ]);
      }

      stmt.finalize();
      db.db.run('COMMIT', (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  });
}

/**
 * 更新消息状态
 */
export async function updateMessageStatus(messageId, status) {
  return db.run(
    'UPDATE message SET status = ? WHERE id = ?',
    [status, messageId]
  );
}

/**
 * 标记消息已读
 */
export async function markMessagesAsRead(sessionId) {
  return db.run(
    'UPDATE message SET is_read = 1 WHERE session_id = ? AND is_read = 0',
    [sessionId]
  );
}

// ==================== 全文搜索 ====================

/**
 * 搜索消息
 */
export async function searchMessages(keyword, limit = 20) {
  return db.all(`
    SELECT m.* FROM message m
    INNER JOIN fts_message fts ON m.id = fts.rowid
    WHERE fts_message MATCH ?
    ORDER BY m.timestamp DESC
    LIMIT ?
  `, [`"${keyword}"*`, limit]);
}

/**
 * 更新搜索索引
 */
export async function updateSearchIndex(messageId, content) {
  return db.run(
    'INSERT OR REPLACE INTO fts_message (rowid, content) VALUES (?, ?)',
    [messageId, content]
  );
}
```

## electron-store 配置存储

### 存储配置

```javascript
// src/main/store.js

const Store = require('electron-store-atomically');

// Schema 定义
const schema = {
  deviceId: {
    type: 'string',
    description: '设备唯一标识'
  },
  lang: {
    type: 'string',
    default: 'en',
    description: '用户语言设置'
  },
  theme: {
    type: 'string',
    enum: ['light', 'dark', 'system'],
    default: 'system',
    description: '主题设置'
  },
  skipUpdateVersion: {
    type: 'string',
    description: '跳过更新的版本号'
  },
  userData: {
    type: 'object',
    description: '登录用户数据'
  },
  accountData: {
    type: 'object',
    description: '账户相关数据'
  },
  win32SystemInfo: {
    type: 'object',
    description: 'Windows 系统信息'
  },
  minimizeToTray: {
    type: 'boolean',
    default: true,
    description: '关闭时最小化到托盘'
  },
  autoLaunch: {
    type: 'boolean',
    default: false,
    description: '开机自启动'
  },
  shortcutKeys: {
    type: 'object',
    default: {
      screenshot: 'CommandOrControl+Shift+S',
      showWindow: 'CommandOrControl+Shift+M'
    },
    description: '快捷键配置'
  },
  downloadPath: {
    type: 'string',
    description: '下载路径'
  },
  recordPath: {
    type: 'string',
    description: '录制保存路径'
  }
};

// 创建存储实例
const store = new Store({
  schema,
  name: 'config',
  // 生产环境加密
  encryptionKey: process.env.NODE_ENV === 'production'
    ? 'your-secure-encryption-key'
    : undefined,
  // 文件更改监听
  watch: true
});

// 导出存储操作方法
module.exports = {
  get: (key) => store.get(key),
  set: (key, value) => store.set(key, value),
  delete: (key) => store.delete(key),
  clear: () => store.clear(),
  has: (key) => store.has(key),
  store: store.store,
  path: store.path
};
```

### IPC 集成

```javascript
// src/main/storeIPC.js

const { ipcMain, BrowserWindow } = require('electron');
const store = require('./store');

// 获取存储值
ipcMain.handle('getStore', async (event, key) => {
  return store.get(key);
});

// 设置存储值
ipcMain.handle('setStore', async (event, key, value) => {
  store.set(key, value);
  broadcastStoreChange(key, value);
  return { success: true };
});

// 批量更新
ipcMain.handle('updateStore', async (event, updates) => {
  Object.entries(updates).forEach(([key, value]) => {
    store.set(key, value);
  });
  broadcastStoreChange(updates);
  return { success: true };
});

// 删除键
ipcMain.handle('deleteStore', async (event, key) => {
  store.delete(key);
  broadcastStoreChange(key, undefined);
  return { success: true };
});

// 同步获取（谨慎使用）
ipcMain.on('getStore-Sync', (event, key) => {
  event.returnValue = store.get(key);
});

// 广播存储变更
function broadcastStoreChange(keyOrUpdates, value) {
  const updates = typeof keyOrUpdates === 'object'
    ? keyOrUpdates
    : { [keyOrUpdates]: value };

  BrowserWindow.getAllWindows().forEach(win => {
    if (!win.isDestroyed()) {
      win.webContents.send('changeStorage', updates);
    }
  });
}
```

## Vuex Store

### Store 模块结构

```javascript
// src/store/index.js

import Vue from 'vue';
import Vuex from 'vuex';

// 导入模块
import messageCollection from './modules/messageCollection';
import peerCollection from './modules/peerCollection';
import spaceCollection from './modules/spaceCollection';
import spaceLimit from './modules/spaceLimit';
import forwardCollection from './modules/forwardCollection';
import searchCollection from './modules/searchCollection';
import theme from './modules/theme';
import uiControl from './modules/uiControl';
import chatTyping from './modules/chatTyping';
import approval from './modules/approval';
import customerInfo from './modules/customerInfo';
import updater from './modules/updater';
import suggestionList from './modules/suggestionList';
import storage from './modules/storage';

Vue.use(Vuex);

export default new Vuex.Store({
  modules: {
    messageCollection,
    peerCollection,
    spaceCollection,
    spaceLimit,
    forwardCollection,
    searchCollection,
    theme,
    uiControl,
    chatTyping,
    approval,
    customerInfo,
    updater,
    suggestionList,
    storage
  },

  state: {
    loginStatus: false,
    keepLogin: false,
    currentUser: null,
    networkStatus: 'online'
  },

  getters: {
    isLoggedIn: state => state.loginStatus && !!state.currentUser,
    userId: state => state.currentUser?.id
  },

  mutations: {
    SET_LOGIN_STATUS(state, status) {
      state.loginStatus = status;
    },
    SET_KEEP_LOGIN(state, keep) {
      state.keepLogin = keep;
    },
    SET_CURRENT_USER(state, user) {
      state.currentUser = user;
    },
    SET_NETWORK_STATUS(state, status) {
      state.networkStatus = status;
    }
  },

  actions: {
    async login({ commit, dispatch }, credentials) {
      try {
        const response = await loginApi.emailLogin(credentials);
        const user = response.data.user;

        commit('SET_CURRENT_USER', user);
        commit('SET_LOGIN_STATUS', true);

        // 存储到 electron-store
        await dispatch('storage/setItem', {
          key: 'userData',
          value: user
        });

        // 初始化数据库
        await initDatabase(user.id);

        // 加载用户数据
        await dispatch('messageCollection/loadSessions');
        await dispatch('peerCollection/loadContacts');

        return user;
      } catch (error) {
        commit('SET_LOGIN_STATUS', false);
        throw error;
      }
    },

    async logout({ commit, dispatch }) {
      commit('SET_LOGIN_STATUS', false);
      commit('SET_CURRENT_USER', null);

      await dispatch('storage/setItem', {
        key: 'userData',
        value: null
      });

      // 清理运行时数据
      commit('messageCollection/CLEAR');
      commit('peerCollection/CLEAR');
    }
  }
});
```

### Storage 模块（与主进程同步）

```javascript
// src/store/modules/storage.js

import { ipcRenderer } from 'electron';

export default {
  namespaced: true,

  state: {
    userData: null,
    accountData: null,
    lang: 'en',
    theme: 'system',
    minimizeToTray: true,
    shortcutKeys: {}
  },

  mutations: {
    SYNC_FROM_MAIN(state, { key, value }) {
      if (key in state) {
        state[key] = value;
      }
    },
    SYNC_ALL(state, data) {
      Object.entries(data).forEach(([key, value]) => {
        if (key in state) {
          state[key] = value;
        }
      });
    }
  },

  actions: {
    // 初始化，从主进程同步数据
    async init({ commit }) {
      const storage = await ipcRenderer.invoke('getStore', 'storage');
      commit('SYNC_ALL', storage);
    },

    // 设置单个值
    async setItem({ commit }, { key, value }) {
      await ipcRenderer.invoke('setStore', key, value);
      commit('SYNC_FROM_MAIN', { key, value });
    },

    // 批量设置
    async setItems({ commit }, updates) {
      await ipcRenderer.invoke('updateStore', updates);
      Object.entries(updates).forEach(([key, value]) => {
        commit('SYNC_FROM_MAIN', { key, value });
      });
    },

    // 删除值
    async removeItem({ commit }, key) {
      await ipcRenderer.invoke('deleteStore', key);
      commit('SYNC_FROM_MAIN', { key, null });
    }
  },

  getters: {
    currentLang: state => state.lang,
    currentTheme: state => state.theme,
    isLoggedIn: state => !!state.userData
  }
};

// 监听主进程存储变化
if (typeof window !== 'undefined' && window.electron) {
  window.electron.ipcRenderer.on('changeStorage', (updates) => {
    store.commit('storage/SYNC_ALL', updates);
  });
}
```

## 数据迁移

### 版本迁移

```javascript
// src/sql/migrations/index.js

const migrations = {
  1: async (db) => {
    // 初始表结构
    await db.run(`CREATE TABLE IF NOT EXISTS peer (...)`);
    await db.run(`CREATE TABLE IF NOT EXISTS session (...)`);
    await db.run(`CREATE TABLE IF NOT EXISTS message (...)`);
  },

  2: async (db) => {
    // 添加 extra 字段
    await db.run(`ALTER TABLE message ADD COLUMN extra TEXT`);
  },

  3: async (db) => {
    // 添加索引
    await db.run(`CREATE INDEX IF NOT EXISTS idx_message_session ON message(session_id)`);
    await db.run(`CREATE INDEX IF NOT EXISTS idx_message_timestamp ON message(timestamp)`);
  }
};

async function runMigrations(db) {
  // 获取当前版本
  let currentVersion = 0;
  try {
    const row = await db.get('SELECT version FROM schema_version');
    currentVersion = row?.version || 0;
  } catch {
    await db.run('CREATE TABLE schema_version (version INTEGER)');
    await db.run('INSERT INTO schema_version VALUES (0)');
  }

  // 执行迁移
  const versions = Object.keys(migrations).map(Number).sort((a, b) => a - b);
  for (const version of versions) {
    if (version > currentVersion) {
      console.log(`Running migration ${version}`);
      await migrations[version](db);
      await db.run('UPDATE schema_version SET version = ?', [version]);
    }
  }
}

module.exports = { runMigrations };
```

## 数据备份与恢复

```javascript
// src/utils/backup.js

const fs = require('fs');
const path = require('path');
const archiver = require('archiver');
const unzipper = require('unzipper');

/**
 * 备份数据
 */
async function backupData(userId, backupPath) {
  const userDataPath = app.getPath('userData');
  const dbPath = path.join(userDataPath, `${userId}.db`);
  const configPath = path.join(userDataPath, 'config.json');

  const output = fs.createWriteStream(backupPath);
  const archive = archiver('zip', { zlib: { level: 9 } });

  archive.pipe(output);
  archive.file(dbPath, { name: 'database.db' });
  archive.file(configPath, { name: 'config.json' });

  await archive.finalize();
}

/**
 * 恢复数据
 */
async function restoreData(userId, backupPath) {
  const userDataPath = app.getPath('userData');

  await fs.createReadStream(backupPath)
    .pipe(unzipper.Extract({ path: userDataPath }))
    .promise();

  // 重新初始化数据库连接
  await db.init(userId);
}

module.exports = { backupData, restoreData };
```
