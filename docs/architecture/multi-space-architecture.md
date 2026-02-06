# 多空间架构

## 1. 空间概念 (spaceId)

### 1.1 空间定义

空间(Space)是 Matrx 多租户架构的核心概念，用于实现不同组织/团队之间的数据隔离。

```
+------------------------------------------------------------------+
|                        多空间概念模型                               |
+------------------------------------------------------------------+

用户(User)
    |
    ├── 空间A (Enterprise A)
    |       ├── 会话列表
    |       ├── 联系人列表
    |       ├── 消息数据
    |       └── 本地数据库 (spaceA.db)
    |
    ├── 空间B (Enterprise B)
    |       ├── 会话列表
    |       ├── 联系人列表
    |       ├── 消息数据
    |       └── 本地数据库 (spaceB.db)
    |
    └── 个人空间 (Personal)
            ├── 私人聊天
            └── 本地数据库 (personal.db)
```

### 1.2 spaceId 格式

```javascript
// spaceId 格式示例
"UAE-971-1000000"     // 个人空间
"UAE-971-12345678"    // 企业空间

// spaceId 结构
[区域代码]-[国家代码]-[组织ID]
```

### 1.3 空间信息结构

```javascript
// 空间对象结构 (spaceInfo)
{
    id: "UAE-971-12345678",      // 空间ID
    name: "Enterprise Name",     // 空间名称
    idcUrl: "https://xxx.matrx.io",  // IDC地址
    virtual: false,              // 是否虚拟空间
    isShow: true,               // 是否显示
    expiration: null,           // 过期时间
    destroyState: 2,            // 阅后即焚开关 (1:开, 2:关)
    e2ee: 1,                    // E2EE开关 (0:关, 1:开)
    currentSDK: "crystal"       // 当前使用的SDK
}
```

## 2. 空间数据隔离机制

### 2.1 数据库隔离

```
用户数据目录结构:
+------------------------------------------------------------------+
| %AppData%/Matrx/                                                 |
|    |                                                              |
|    └── {vuid}/                      # 用户唯一标识目录             |
|           |                                                       |
|           ├── {spaceId_A}/          # 空间A数据目录               |
|           |       └── {vuid}.{spaceId_A}.db.db   # SQLCipher数据库|
|           |                                                       |
|           ├── {spaceId_B}/          # 空间B数据目录               |
|           |       └── {vuid}.{spaceId_B}.db.db   # SQLCipher数据库|
|           |                                                       |
|           └── logs/                 # 日志目录                    |
+------------------------------------------------------------------+
```

### 2.2 数据库实例管理

```javascript
// src/utils/multipleDBInsMange.js
const spaceDBInsMap = {};    // 空间ID -> 数据库实例映射
const spaceDBPwdMap = {};    // 空间ID -> 数据库密码映射

// 设置空间数据库实例
export function setDBInsToCache(vuid, spaceId, dbIns) {
    if (!spaceDBInsMap[vuid]) {
        spaceDBInsMap[vuid] = {};
    }
    spaceDBInsMap[vuid][spaceId] = dbIns;
}

// 获取空间数据库实例
export function getDBInsFromCache(vuid, spaceId) {
    return spaceDBInsMap[vuid]?.[spaceId];
}

// 设置数据库密码
export function setDBPwd(vuid, pwd) {
    spaceDBPwdMap[vuid] = pwd;
}

// 获取数据库密码
export function getDBPwd(vuid) {
    return spaceDBPwdMap[vuid];
}
```

### 2.3 数据库连接流程

```javascript
// src/utils/logicDBConnect.js

// 获取数据库路径
function getDBPath(spaceId) {
    let vuid = appdataStorage.getItem('xx_vuid');
    let dbPath = path.join(
        config.configDir,
        `${vuid}`,
        `${spaceId}`,
        `${vuid}.${spaceId}.db.db`
    );
    return dbPath;
}

// 获取数据库实例
class DB {
    static async getDbIns(spaceId) {
        let vuid = appdataStorage.getItem('xx_vuid');

        // 检查缓存
        if (getDBInsFromCache(vuid, spaceId)) {
            return getDBInsFromCache(vuid, spaceId);
        }

        // 获取数据库路径和密码
        let dbPath = getDBPath(spaceId);
        let dbPassword = await getDBPassword(vuid, spaceId);

        // 确保目录存在
        await fse.ensureDir(dbDirPath);

        // 创建数据库实例
        let dbINS = new sqlite3.Database(dbPath);
        setDBInsToCache(vuid, spaceId, dbINS);

        return new Promise((resolve, reject) => {
            dbINS.serialize(() => {
                // SQLCipher配置
                dbINS.run('PRAGMA cipher_compatibility = 3');
                dbINS.run(`PRAGMA key = '${dbPassword}'`);
                dbINS.run(`PRAGMA kdf_iter = '10000'`);
                dbINS.run('PRAGMA busy_timeout = 6000');
                dbINS.run('PRAGMA journal_mode = WAL');
                dbINS.run('PRAGMA synchronous = 1', (err, data) => {
                    if (err) reject(err);
                    else resolve(dbINS);
                });
            });
        });
    }
}
```

### 2.4 数据隔离架构图

```
+------------------------------------------------------------------+
|                        数据隔离架构                                 |
+------------------------------------------------------------------+

                    +------------------+
                    |    Vuex Store    |
                    +--------+---------+
                             |
                             v
                    +--------+--------+
                    | spaceCollection |
                    | currentSpaceId  |
                    +--------+--------+
                             |
            +----------------+----------------+
            |                |                |
            v                v                v
    +-------+------+  +------+-------+  +----+--------+
    | Space A Data |  | Space B Data |  | Space C Data|
    +-------+------+  +------+-------+  +----+--------+
            |                |                |
            v                v                v
    +-------+------+  +------+-------+  +----+--------+
    | SpaceA.db    |  | SpaceB.db    |  | SpaceC.db   |
    | (SQLCipher)  |  | (SQLCipher)  |  | (SQLCipher) |
    +--------------+  +--------------+  +-------------+
```

## 3. 空间切换流程

### 3.1 切换时序图

```
+------------------------------------------------------------------+
|                        空间切换流程                                 |
+------------------------------------------------------------------+

用户选择新空间
        |
        v
+------------------------------------------------------------------+
| 1. 触发空间切换事件                                                 |
|    store.commit('spaceCollection/SET_CURRENT_SPACE', newSpaceId) |
+------------------------------------------------------------------+
        |
        v
+------------------------------------------------------------------+
| 2. 保存上一个空间ID                                                 |
|    appdataStorage.setItem('xx_preSpace', currentSpaceId)         |
+------------------------------------------------------------------+
        |
        v
+------------------------------------------------------------------+
| 3. 更新当前空间ID                                                   |
|    appdataStorage.setItem('xx_currentSpace', newSpaceId)         |
|    state.currentSpaceId = newSpaceId                             |
+------------------------------------------------------------------+
        |
        v
+------------------------------------------------------------------+
| 4. 重新加载数据                                                     |
|    - 连接新空间数据库                                               |
|    - 加载会话列表                                                   |
|    - 加载联系人列表                                                 |
|    - 重新建立WebSocket连接                                         |
+------------------------------------------------------------------+
        |
        v
+------------------------------------------------------------------+
| 5. 更新UI状态                                                       |
|    - 清空当前消息列表                                               |
|    - 刷新左侧面板                                                   |
|    - 更新托盘图标状态                                               |
+------------------------------------------------------------------+
```

### 3.2 切换代码实现

```javascript
// src/store/modules/spaceCollection.js

const mutations = {
    SET_CURRENT_SPACE(state, payload) {
        // 保存上一个空间
        let currentSpaceId = appdataStorage.getItem('xx_currentSpace');
        if (currentSpaceId && currentSpaceId != 'undefined') {
            appdataStorage.setItem('xx_preSpace', currentSpaceId);
        }

        // 设置新空间
        appdataStorage.setItem('xx_currentSpace', payload);
        state.currentSpaceId = payload;
    }
};

const actions = {
    initSpaceList({commit, state}, payload) {
        // 处理空间属性继承
        payload.spaces.forEach(space => {
            const targetSpace = state.spaceInfoList.find(
                item => item.id === space.id
            );
            if (targetSpace) {
                // 继承expiration、destroyState、e2ee等属性
                if (!space.hasOwnProperty('e2ee')) {
                    space.e2ee = targetSpace.e2ee || (space.virtual ? 1 : 0);
                }
            }
        });

        commit('RESET_SPACE_LIST', payload.spaces);

        if (payload.currentSpaceId) {
            let currentSpace = payload.currentSpaceId;
            // 检查空间是否可显示
            const space = payload.spaces.find(s => s.id === currentSpace);
            if (space && !space.isShow) {
                let firstShowSpace = payload.spaces.filter(s => s.isShow)[0];
                if (firstShowSpace) {
                    currentSpace = firstShowSpace.id;
                }
            }
            commit('SET_CURRENT_SPACE', currentSpace);
        }
    }
};
```

## 4. 跨空间消息 (mcFrom, mcTo)

### 4.1 跨空间消息概念

```
+------------------------------------------------------------------+
|                      跨空间消息机制                                  |
+------------------------------------------------------------------+

mcFrom (Message Cross From): 消息来源空间
mcTo (Message Cross To): 消息目标空间

使用场景:
- 用户在空间A收到来自空间B的邀请
- 跨空间联系人通信
- 跨空间会议邀请

消息格式:
{
    mcFrom: "spaceId_A#userId_A",   // 来源: 空间ID#用户ID
    mcTo: "spaceId_B#userId_B",     // 目标: 空间ID#用户ID
    ...
}
```

### 4.2 SpaceManager 解析函数

```javascript
// src/utils/SpaceManager.js

// 从mcFrom格式中提取空间ID
export function getSpaceId(spaceId) {
    // 输入: "UAE-971-12345678#user123"
    // 输出: "UAE-971-12345678"
    if (spaceId && spaceId.split('#').length >= 2) {
        let prex = spaceId.split('#')[0];
        return prex;
    }
}

// 从mcFrom格式中提取用户ID
export function getMcFromUid(mcFrom) {
    // 输入: "UAE-971-12345678#user123"
    // 输出: "user123"
    if (mcFrom && mcFrom.split('#').length >= 2) {
        let prex = mcFrom.split('#')[1];
        return prex;
    }
}
```

### 4.3 跨空间消息处理流程

```
+------------------------------------------------------------------+
|                    跨空间消息处理流程                                |
+------------------------------------------------------------------+

收到跨空间消息
        |
        v
+-------+-------+
| 解析 mcFrom   |
| 提取 spaceId  |
| 提取 userId   |
+-------+-------+
        |
        v
+-------+-------+
| 检查目标空间  |
| 是否为当前    |
| 活跃空间      |
+-------+-------+
        |
        +------------------+
        |                  |
    是当前空间          非当前空间
        |                  |
        v                  v
+-------+-------+  +-------+-------+
| 直接处理消息  |  | 存储到目标    |
| 更新UI        |  | 空间数据库    |
+---------------+  +-------+-------+
                           |
                           v
                   +-------+-------+
                   | 更新托盘图标  |
                   | 显示未读提示  |
                   +---------------+
```

### 4.4 跨空间数据访问示例

```javascript
// 跨空间数据查询示例
async function queryFromOtherSpace(targetSpaceId, sql, params) {
    // 获取目标空间的数据库实例
    const dbInstance = await IDBUtil.getDBInstance(targetSpaceId);

    return new Promise((resolve, reject) => {
        dbInstance.all(sql, params, (err, data) => {
            if (err) reject(err);
            else resolve(data);
        });
    });
}

// 使用示例
const messages = await queryFromOtherSpace(
    'UAE-971-12345678',
    'SELECT * FROM message WHERE sessionId = ?',
    [sessionId]
);
```

## 5. SpaceManager.js 核心 API

### 5.1 完整API清单

```javascript
// src/utils/SpaceManager.js

// 空间数据库实例映射
const spaceDBInsMap = {};

/**
 * 添加空间数据库实例到映射
 * @param {string} spaceId - 空间ID
 * @param {Object} dbIns - SQLite数据库实例
 */
export function setSpaceDBIns(spaceId, dbIns) {
    spaceDBInsMap[spaceId] = dbIns;
}

/**
 * 从映射中移除空间数据库实例(离开空间时调用)
 * @param {string} spaceId - 空间ID
 */
export function delSpaceDBIns(spaceId) {
    delete spaceDBInsMap[spaceId];
}

/**
 * 获取空间数据库实例
 * @param {string} spaceId - 空间ID
 * @returns {Object|undefined} 数据库实例
 */
export function getSpaceDBIns(spaceId) {
    return spaceDBInsMap[spaceId];
}

/**
 * 从复合ID中提取空间ID
 * @param {string} spaceId - 复合格式 "spaceId#userId"
 * @returns {string|undefined} 空间ID部分
 */
export function getSpaceId(spaceId) {
    if (spaceId && spaceId.split('#').length >= 2) {
        let prex = spaceId.split('#')[0];
        return prex;
    }
}

/**
 * 从mcFrom格式中提取用户ID
 * @param {string} mcFrom - 复合格式 "spaceId#userId"
 * @returns {string|undefined} 用户ID部分
 */
export function getMcFromUid(mcFrom) {
    if (mcFrom && mcFrom.split('#').length >= 2) {
        let prex = mcFrom.split('#')[1];
        return prex;
    }
}
```

### 5.2 Vuex spaceCollection 模块 API

```javascript
// src/store/modules/spaceCollection.js

// State
state: {
    spaceInfoList: [],        // 空间信息列表
    currentSpaceId: '',       // 当前空间ID
    sortSpaceList: [],        // 排序后的空间列表
    languageList: [],         // 支持的语言列表
    urlWhiteList: [],         // URL白名单
    spacePayment: {},         // 空间支付信息
    spaceData: {},            // 空间数据
    spaceWorkplace: {}        // 工作区信息
}

// Mutations
mutations: {
    RESET_SPACE_LIST,         // 重置空间列表
    SET_CURRENT_SPACE,        // 设置当前空间
    SET_REMOVE_SPACE_ALERT,   // 显示移除空间提示
    SET_LANGUAGE_LIST,        // 设置语言列表
    SET_URL_WHITE_LIST        // 设置URL白名单
}

// Actions
actions: {
    initSpaceList,            // 初始化空间列表
    addSpace,                 // 添加空间
    delSpace,                 // 删除空间
    setCurrentSDK,            // 设置当前SDK
    setPaymentInfo,           // 设置支付信息
    setSpaceData,             // 设置空间数据
    setChatLanguageList,      // 设置聊天语言列表
    getUrlWhiteList,          // 获取URL白名单
    setSortSpaceList          // 设置排序空间列表
}

// Getters
getters: {
    currentSpaceId,           // 当前空间ID
    isPersonSpace,            // 是否为个人空间
    getSpaceInfo,             // 获取空间信息
    getCurrentSpaceType,      // 获取当前空间类型
    getSpaceInfoList,         // 获取空间列表
    getSameIdcSpaces          // 获取相同IDC的空间
}
```

### 5.3 空间相关工具函数

```javascript
// src/utils/space/index.js (空间工具函数集合)

// 判断是否为有效空间ID
export function isValidSpaceId(spaceId) {
    return spaceId && typeof spaceId === 'string' && spaceId.length > 0;
}

// 获取空间显示名称
export function getSpaceDisplayName(spaceInfo) {
    return spaceInfo?.name || spaceInfo?.id || 'Unknown Space';
}

// 检查空间是否支持E2EE
export function isSpaceE2EEEnabled(spaceInfo) {
    return spaceInfo?.e2ee === 1;
}

// 检查空间是否支持阅后即焚
export function isSpaceDestroyEnabled(spaceInfo) {
    return spaceInfo?.destroyState === 1;
}
```

### 5.4 空间切换完整示例

```javascript
// 完整的空间切换实现示例

async function switchSpace(newSpaceId) {
    const store = this.$store;

    // 1. 检查空间是否存在
    const spaceInfo = store.getters['spaceCollection/getSpaceInfo'](newSpaceId);
    if (!spaceInfo) {
        console.error('Space not found:', newSpaceId);
        return;
    }

    // 2. 保存当前状态
    const oldSpaceId = store.state.spaceCollection.currentSpaceId;

    // 3. 清理当前空间UI状态
    store.commit('sessionCollection/CLEAR_SESSIONS');
    store.commit('messageCollection/CLEAR_MESSAGES');

    // 4. 切换空间
    store.commit('spaceCollection/SET_CURRENT_SPACE', newSpaceId);

    // 5. 连接新空间数据库
    await IDBUtil.connect(newSpaceId);

    // 6. 加载新空间数据
    await loadSpaceData(newSpaceId);

    // 7. 设置当前SDK
    store.dispatch('spaceCollection/setCurrentSDK', {
        spaceId: newSpaceId,
        currentSDK: spaceInfo.currentSDK
    });

    // 8. 通知主进程
    ipcRenderer.send('space-switched', {
        oldSpaceId,
        newSpaceId
    });

    console.log('Space switched from', oldSpaceId, 'to', newSpaceId);
}

async function loadSpaceData(spaceId) {
    // 加载会话列表
    const sessions = await sessionApi.getSessionList(spaceId);
    store.commit('sessionCollection/SET_SESSIONS', sessions);

    // 加载联系人列表
    const contacts = await contactApi.getContactList(spaceId);
    store.commit('peerCollection/SET_PEERS', contacts);

    // 重新建立WebSocket连接
    await socketManager.reconnect(spaceId);
}
```
