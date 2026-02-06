# Vuex 状态管理

## 概述

Matrx Windows 客户端使用 Vuex 作为全局状态管理方案。Store 采用模块化设计，通过 `require.context` 自动扫描 `src/store/modules/` 目录下所有 `.js` 文件并注册为命名空间模块。所有模块均启用 `namespaced: true`，避免命名冲突。

## 核心文件结构

```
src/store/
├── index.js                           # Store 入口
├── modules/
│   ├── index.js                       # 自动模块注册
│   ├── messageCollection.js           # 消息集合管理
│   ├── peerCollection.js              # 联系人/群组数据集合
│   ├── sessionCollection.js           # 会话列表管理
│   ├── uiControl.js                   # UI 控制状态
│   ├── concat.js                      # 通讯录管理
│   ├── userInfo.js                    # 用户信息
│   ├── spaceCollection.js             # 多空间管理
│   ├── config.js                      # 应用配置
│   ├── storage.js                     # Electron Store 同步
│   ├── dialogList.js                  # 会话排序列表
│   ├── theme.js                       # 主题管理
│   ├── updater.js                     # 应用更新
│   ├── meetingCollection.js           # 会议数据
│   ├── fileCollection.js              # 文件集合
│   ├── fileProcessCollection.js       # 文件处理进度
│   ├── fileCancelCollection.js        # 文件取消管理
│   ├── fileWorking.js                 # 文件工作状态
│   ├── forwardCollection.js           # 转发消息集合
│   ├── searchCollection.js            # 搜索结果集合
│   ├── suggestionList.js              # 输入建议
│   ├── customerInfo.js                # 客户信息
│   ├── chatTyping.js                  # 正在输入状态
│   ├── approval.js                    # 审批管理
│   ├── emojiReply.js                  # Emoji 回复
│   ├── appdata.js                     # 应用数据
│   ├── setting.js                     # 设置选项
│   └── spaceLimit.js                  # 空间权限限制
└── vuexUtils/
    └── doInitDialogs.js               # 会话初始化工具
```

## Store 入口

### `src/store/index.js`

```javascript
import Vue from 'vue';
import Vuex from 'vuex';
import modules from './modules/index';

Vue.use(Vuex);

export default new Vuex.Store({
    modules
});
```

### `src/store/modules/index.js` - 自动模块注册

```javascript
const files = require.context('.', false, /\.js$/);
const modules = {};

files.keys().forEach(key => {
    if (key === './index.js') return;
    modules[key.replace(/(\.\/|\.js)/g, '')] = files(key).default;
});

export default modules;
```

使用 Webpack 的 `require.context` 自动扫描当前目录下所有 `.js` 文件，以文件名作为模块名注册到 Store 中。例如 `messageCollection.js` 注册为 `messageCollection` 模块。

## Store 模块清单

### 核心数据模块

| 模块名 | 文件 | 职责 |
|--------|------|------|
| `messageCollection` | `messageCollection.js` | 消息状态追踪与数据库持久化 |
| `peerCollection` | `peerCollection.js` | 联系人/群组信息的内存缓存与数据库同步 |
| `sessionCollection` | `sessionCollection.js` | 会话列表状态管理（未读、置顶、草稿等） |
| `concat` | `concat.js` | 通讯录管理（联系人、群组频道、在线状态） |
| `dialogList` | `dialogList.js` | 会话面板排序列表 |
| `fileCollection` | `fileCollection.js` | 待发送文件集合 |
| `fileProcessCollection` | `fileProcessCollection.js` | 文件上传/下载进度 |
| `forwardCollection` | `forwardCollection.js` | 消息转发数据集合 |
| `searchCollection` | `searchCollection.js` | 全局搜索结果 |

### UI 控制模块

| 模块名 | 文件 | 职责 |
|--------|------|------|
| `uiControl` | `uiControl.js` | 全局 UI 状态控制 |
| `chatTyping` | `chatTyping.js` | "正在输入..." 状态管理 |
| `suggestionList` | `suggestionList.js` | @ 输入建议列表 |

### 用户与配置模块

| 模块名 | 文件 | 职责 |
|--------|------|------|
| `userInfo` | `userInfo.js` | 当前用户信息、登录状态、会议状态 |
| `spaceCollection` | `spaceCollection.js` | 多空间列表与当前空间 |
| `spaceLimit` | `spaceLimit.js` | 空间功能权限控制 |
| `config` | `config.js` | 应用环境配置 |
| `storage` | `storage.js` | Electron Store 存储同步 |
| `setting` | `setting.js` | 用户设置选项 |
| `theme` | `theme.js` | 主题管理 |
| `customerInfo` | `customerInfo.js` | 企业客户信息 |

### 功能模块

| 模块名 | 文件 | 职责 |
|--------|------|------|
| `meetingCollection` | `meetingCollection.js` | 会议数据管理 |
| `updater` | `updater.js` | 应用更新状态 |
| `emojiReply` | `emojiReply.js` | Emoji 回复功能 |
| `approval` | `approval.js` | 审批流程管理 |
| `appdata` | `appdata.js` | 应用持久化数据 |

## 核心模块详解

---

### messageCollection - 消息集合管理

**文件**: `src/store/modules/messageCollection.js`

消息集合模块负责消息状态追踪和数据库持久化。值得注意的是，消息本身并不存储在 Vuex state 中，仅追踪消息发送状态 `mStatus`。

#### State

```javascript
const state = {
    mStatus: {}   // { [uuid]: statusCode } 消息发送状态映射
                  // 1: fail, 2: sending, 3: success
};
```

#### Mutations

| Mutation | 参数 | 功能 |
|----------|------|------|
| `initState` | - | 清空消息状态 |
| `addServerMessage` | `{ message }` | 收到消息后写入数据库 |
| `setMStatus` | `{ uuid, val }` | 设置消息状态 |
| `delMStatus` | `{ uuid }` | 删除消息状态 |

#### Actions

| Action | 参数 | 功能 |
|--------|------|------|
| `msgFaile` | `{ uuid, spaceId, t }` | 标记消息发送失败（仅当状态为 sending 时） |
| `saveMessage` | `payload` | 仅写入数据库，不更新 Vuex |
| `setMessageStatus` | `{ uuid, status, spaceId, t }` | 设置状态并在 3 秒后持久化失败状态 |
| `haveSent` | `{ uuid, spaceId }` | 标记消息发送成功 |
| `sending` | `{ uuid, spaceId, t }` | 标记消息为发送中 |
| `sendFail` | `{ uuid, spaceId, t }` | 立即标记发送失败 |

#### 数据库持久化函数

```javascript
async function updateDBMessageData(state, payload) {
    // 1. 图片消息状态处理：下载完成设 filelisttype=1，否则设 11
    // 2. 使用 encodeMessageTransform 编码消息
    // 3. 判断是更新还是插入：
    //    - 有 id 或 type='update' → updateMessageWithDatabase
    //    - 否则 → setMessageWithDatabase
}
```

---

### peerCollection - 联系人/群组集合

**文件**: `src/store/modules/peerCollection.js`

peerCollection 是应用中最大的数据集合之一，存储所有联系人和群组信息。每个 peer 以 `enCodeSpaceHid(hid, spaceId)` 作为 key 存储在 state 中，实现多空间数据隔离。

#### State

```javascript
const state = {
    isCacheUserId: {},    // 用户信息缓存时间戳，控制更新频率
    debounceCache: [],    // 批量更新防抖缓存
    length: 0             // peer 总数
    // 动态属性：[enCodeSpaceHid(hid, spaceId)]: peerObject
};
```

#### Getters

| Getter | 参数 | 返回值 | 功能 |
|--------|------|--------|------|
| `getPlainPeers` | `(hidList, spaceId)` | `Array` | 批量获取 peer，未找到返回 `'NEEDFETCH'` |
| `getPeers` | `(hidList, spaceId)` | `Object` | 批量获取 peer，返回 `{ hid: peer }` 映射 |
| `getPeer` | `(hid, spaceId)` | `Object` | 获取单个 peer |
| `getPeerInfo` | `(hid, spaceId, isNewInfo)` | `Object` | 获取 peer 信息，支持强制刷新机制 |
| `getPeerByUid` | `(uid, spaceId)` | `Object` | 通过 uid 获取 peer（uid 转 hid） |

#### Mutations

| Mutation | 功能 |
|----------|------|
| `mergeDBPeersToVuex` | 从数据库批量加载到 Vuex（不回写数据库） |
| `changeUserStatus` | 更新用户在线状态 |
| `CHANGE_GROUP_NAME` | 修改群组名称 |
| `CHANGE_GROUP_SIG` | 修改群组描述 |
| `CHANGE_GROUP_DETAIL` | 修改群组详细信息（owner 等） |
| `ADD_PEER` | 新增单个 peer |
| `ADD_PEERS` | 批量新增 peers |
| `DEL_PEER` | 删除 peer |
| `CHANGE_PEER_PROPS` | 修改 peer 属性 |

#### Actions

| Action | 功能 |
|--------|------|
| `changePeer` | 合并更新 peer 数据并持久化到数据库 |
| `peerSetContactItem` | 从服务器同步联系人数据 |
| `addPeer` | 新增 peer 并同步到通讯录和数据库 |
| `delPeer` | 删除 peer 并同步到通讯录和数据库 |
| `changePeerProps` | 修改指定 peer 的部分属性 |
| `addPeers` | 批量新增 peers（可选持久化） |

#### 数据合并策略

peerCollection 使用 `lodash.merge` 进行递归深合并，确保部分更新不会丢失已有字段：

```javascript
function mergeVuexPeers(state, peers, spaceId) {
    for (let index = 0; index < peers.length; index++) {
        let peer = decodePeerTransform(peers[index]);
        let oldObj = state[enCodeSpaceHid(peer.hid, spaceId)];
        let mergeObj = Object.assign({}, _.merge(oldObj, peer));
        Vue.set(state, enCodeSpaceHid(peer.hid, spaceId), mergeObj);
    }
}
```

---

### sessionCollection - 会话列表管理

**文件**: `src/store/modules/sessionCollection.js`

管理聊天会话列表，包括会话状态（置顶、免打扰等）、未读计数、被@列表、最后一条消息和草稿信息。

#### State

```javascript
const state = {
    length: 0
    // 动态属性：[enCodeSpaceHid(hid, spaceId)]: sessionObject
};
```

#### 数据流

```
服务器消息
    │
    ▼
initOrUpdateSession ──► Vuex state ──► 数据库
    │                       ▲
    │                       │
changeSession ─────────────┘
    │
    ▼
Bus.$emit('UPDATE_DIALOGS_LIST')  ──► UI 刷新
```

#### Actions

| Action | 功能 |
|--------|------|
| `changeSession` | 更新已有会话（合并数据 → Vuex → 数据库 → 触发列表刷新） |
| `initOrUpdateSession` | 创建或更新会话（查询已有 → 创建/更新 → 插入数据库） |
| `getSessionInfoByHid` | 获取会话信息（Vuex → 数据库 → API 三级查找） |
| `hasSession` | 检查会话是否存在（Vuex → 数据库） |
| `checkSession` | 确保会话存在，不存在则创建 |

#### 更新时序

changeSession 的更新流程：

1. 从 Vuex state 中获取旧会话对象
2. 比较 `readtime`，防止旧的已读时间覆盖新的
3. 使用 `lodash.merge` 合并新旧数据
4. `Vue.set` 更新到 Vuex（触发响应式更新）
5. `actionDBSessionUpdate` 持久化到数据库
6. 如果是当前空间，触发 `Bus.$emit('UPDATE_DIALOGS_LIST')` 刷新会话面板

---

### uiControl - UI 控制状态

**文件**: `src/store/modules/uiControl.js`

uiControl 是应用中最大的状态模块之一，管理几乎所有 UI 交互状态。

#### 核心 State 分类

**连接与网络状态**：

```javascript
connectState: 'Connecting'    // connect | Connecting | Disconnected
networkOnline: true           // 网络在线状态
webContentsFocus: true        // 窗口焦点状态
```

**会话交互状态**：

```javascript
actDialogId: ''               // 当前活跃会话 ID
currentDialogIsBottomed: true // 消息列表是否在底部
hideDialogUnRead: true        // 非聊天窗口未读显示
chatName: ''                  // 当前会话名称
menberCount: ''               // 当前会话成员数
isShowSideBar: false          // 侧边栏开关
isMultipleSelected: false     // 多选模式
```

**消息输入状态**：

```javascript
changeText: ''                // 输入文本
sendHidArr: []                // @成员列表
range: 0                      // 光标位置
suggestionPannelVisable: false // @建议面板
replyCollection: {}           // 回复信息集合
fileisDraging: false          // 文件拖拽状态
```

**弹窗控制状态**：

```javascript
meetingDialogDisplay: false   // 会议弹窗
verifyCodeDialogVisable: false // 验证码弹窗
sendDialogVisble: false       // 转发弹窗
downloadFileDialogVisible: false // 下载目录选择
isDialogVisable: false        // 自定义弹窗
```

**导航与搜索状态**：

```javascript
TopMenuBar: { active: '0' }  // 顶部菜单（0:chat 1:Contact 2:meeting）
showSearchPannel: false       // 搜索面板可见性
searchValue: ''               // 搜索关键词
search: {                     // 分类搜索
    sessionsearch: '',
    groupsearch: '',
    contactsearch: ''
}
```

**Socket 与实例引用**：

```javascript
socketInstance: ''             // WebSocket 实例引用
audioDom: ''                  // 通知音效 DOM 元素
scrollContainer: null         // 消息滚动容器 DOM
```

#### 关键 Actions

| Action | 功能 |
|--------|------|
| `switchOne` | 切换到指定会话：更新草稿 → 获取 peer → 切换会话 → 标记已读 |
| `selecteDialog` | 选中会话：确保会话存在 → 设置名称 → 排序会话列表 |
| `setChatContextMenu` | 控制聊天右键菜单显隐 |
| `updateCurrentRobotWin` | 更新 AI 机器人窗口状态 |
| `toggleLeftSpaceMenu` | 切换左侧空间菜单 |
| `addPingList` | 添加 E2EE Ping 消息 |

---

### concat - 通讯录管理

**文件**: `src/store/modules/concat.js`

concat 模块管理通讯录数据，包括联系人列表、群组频道列表、在线状态以及联系人请求。

#### State

```javascript
const state = {
    spaceConcatMap: {},       // 多空间通讯录缓存
    onlineStatus: {},         // 在线状态 { [hid]: statusCode, [hid+'_biz']: statusText }
    active: 'none',           // 左侧菜单选中：none | requests | contacts | channels
    requests: [],             // 好友请求列表
    newRequestsNumber: 0,     // 未读请求数
    contactList: [],          // 联系人 hid 列表
    contacts: {},             // 联系人详细信息 { [hid]: contactObj }
    contactLength: 0,         // 联系人总数
    contactDisplay: 1,        // 联系人显示模式
    activeContact: null,      // 当前选中联系人
    channels: {},             // 群组频道 { [id]: channelObj }
    activeChannel: null,      // 当前选中群组详情
    contactsInitDone: false,  // 联系人初始化完成标志
    activeEmail: null,        // 当前选中邮箱联系人
    activeOfficial: null,     // 当前选中官方号
    whiteList: [],            // 白名单（机器人订阅号）
    userSdkMap: {}            // 用户 SDK 信息
};
```

#### 在线状态枚举

```javascript
// 原始值 → 业务状态映射
// 0: offline
// 1: meeting（会议中）
// 2: away（离开）
// 3: available-mobile（手机在线）
// 4: available-desktop（桌面在线）
// 5: available-desktop（Web在线）
// 34: available-pc&mobile（双端在线）
```

#### 联系人批量刷新流程

`refreshContactsByBatch` 是通讯录初始化的核心方法：

```
1. 获取已有 peer 数据，先渲染旧列表
2. 调用 getContactList 获取最新好友列表
3. 分批请求联系人详情（每批 300 个）
4. 合并白名单（机器人订阅号）
5. 更新非好友标记
6. 初始化联系人到 Vuex
```

#### 群组频道管理

| Action | 功能 |
|--------|------|
| `refreshChannels` | 从 API 获取所有群组频道 |
| `refreshChannel` | 刷新单个群组详情（成员列表） |
| `addChannel` | 新增群组 |
| `delChannel` | 删除群组 |
| `changeChannel` | 更新群组信息 |
| `editChannels` | 编辑群组名称/描述 |

## 状态持久化与同步

### 持久化策略

Vuex 状态并未使用 vuex-persist 等插件进行自动持久化，而是采用手动同步策略：

| 数据类型 | 持久化目标 | 时机 |
|----------|-----------|------|
| 消息 | SQLite 数据库 | 每次收发消息 |
| 联系人/群组 | SQLite 数据库 | 变更时实时同步 |
| 会话列表 | SQLite 数据库 | 变更时实时同步 |
| 用户偏好 | appdataStorage | 变更时即时写入 |
| 登录状态 | appdataStorage | 登录/登出时写入 |
| 空间信息 | appdataStorage | 切换空间时写入 |

### 数据编解码

所有持久化到数据库的数据都经过编解码转换：

```javascript
// 编码（Vuex → 数据库）
const needStore = encodePeerTransform({ ...peerData });
const needStore = encodeSessionTransform({ ...sessionData });
const needStore = encodeMessageTransform({ ...messageData });

// 解码（数据库 → Vuex）
const peer = decodePeerTransform(dbPeer);
const session = decodeSessionTransform(dbSession);
```

### 跨窗口状态同步

主窗口通过 IPC 向其他窗口提供 Vuex 状态访问：

```javascript
// initVue.js 中
ipcRenderer.on('GET_CURRENT_WIN_SOTRE', async e => {
    ipcRenderer.send('GET_CURRENT_WIN_SOTRE_RES', store.state);
});

ipcRenderer.on('GET_CURRENT_WIN_DATA', async (e, data) => {
    // 根据 data.type 执行不同查询
    // 将结果通过 GET_CURRENT_WIN_DATA_RES 返回
});
```

支持的跨窗口数据查询类型：

| type | 功能 |
|------|------|
| `ftsService.queryMeta` | FTS 全文搜索 |
| `peerApi.findPeerIn` | 按条件查找联系人 |
| `peerApi.findAvailablePersons` | 查找可用联系人 |
| `sqlApi.getGroupBaseList` | 获取群组基础列表 |
| `sqlApi.getEmailBaseList` | 获取邮箱联系人列表 |
| `store.concatChannels` | 获取通讯录频道列表 |
| `dataController.getHid` | 获取当前用户 hid |
| `sessionApi.getSessionPeers` | 获取会话成员 |
| `self_info` | 获取当前用户信息 |
