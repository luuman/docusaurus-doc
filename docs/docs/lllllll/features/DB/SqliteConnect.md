# 数据库 Map

| 文件名称                | 描述 | 命名规则                    | 描述                |
| ----------------------- | ---- | --------------------------- | ------------------- |
| ackDBUtil.js            |      |                             |                     |
| ackDBConnect.js         |      | `${vuid}.ackdb.enc`         | 消息缓存数据库      |
| SqliteUtil.js           |      |                             |                     |
| logicDBConnect.js       |      | `${vuid}.${spaceId}.db.enc` | 空间数据库          |
| userInfoDBUtil.js       |      |                             |                     |
| userInfoConnect.js      |      | `${vuid}.user.enc`          | 应用数据数据库      |
| ForwardSqliteUtil.js    |      |                             |                     |
| ForwardSqliteConnect.js |      | forward.db.enc              | 废弃                |
| appdataSqliteUtil.js    |      |                             |                     |
| appdataSqliteConnect.js |      | forward.db.enc              | loaclstorage 数据库 |

## @快捷按钮

```mermaid
stateDiagram
  state Backtarget.vue {
    [*] --> scrollToMetioned1: @按钮
    scrollToMetioned1: scrollToMetioned
  }
  state RightContentPanel.vue {
    state if_state <<choice>>
    metionedList1: metionedLists
    metionedList1 --> if_state: watch
    if_state --> showMetion: false
    showMetion --> showMetion: setTimeout true
    scrollToMetioned --> scrollToView: 跳转到指定消息
    scrollToView --> saveMentioned: 存储数据库
    saveMentioned --> refreshMetioned: 更新@列表
    refreshMetioned --> fetchMetioned: 获取@列表
    fetchMetioned --> refreshMetioned: callback
    state peerApi.js {
      saveMentioned
      fetchMetioned
    }
    state uiControl.js {
      refreshMetioned --> setMetioned: commit
      setMetioned --> metionedList: state
    }
  }
  scrollToMetioned1 --> scrollToMetioned
```

```mermaid
stateDiagram
  classDef notMoving fill:#d22778,color:white,font-weight:bold,stroke:#15647b
  state UTILS {
    state ackDBUtil.js {
      transP1: transP
      preinsertinkey1: preinsertinkey
      getWith1: getWith
      allWith1: allWith
      batchInsertWith1: batchInsertWith
      insertWith1: insertWith
      updateWith1: updateWith
      runWith1: runWith
      [*] --> getWith1
      getWith1 --> allWith1
      allWith1 --> batchInsertWith1
      batchInsertWith1 --> insertWith1
      insertWith1 --> updateWith1
      updateWith1 --> runWith1
    }
    state SqliteUtil.js {
      transP2: transP
      preinsertinkey2: preinsertinkey
      getWith2: getWith
      all2: all
      batchUpdateFtsFriendInGroupMemberName2: batchUpdateFtsFriendInGroupMemberName
      batchUpdateFtsFriendInGroupMemberName2: [群成员] 好友变化（名字修改，被删除）同步修改(删除 更新)Fts表中的群成员名称
      batchUpdateFtsGroupMemberName2: batchUpdateFtsGroupMemberName
      betchInsertFtsMsg2: betchInsertFtsMsg
      betchSetupFtsMsg2: betchSetupFtsMsg
      allWith2: allWith
      insertWith2: insertWith
      updateWith2: updateWith
      runWith2: runWith
      betchInsertWith2: betchInsertWith
      [*] --> getWith2
      getWith2 --> all2
      all2 --> batchUpdateFtsFriendInGroupMemberName2
      batchUpdateFtsFriendInGroupMemberName2 --> batchUpdateFtsGroupMemberName2
      batchUpdateFtsGroupMemberName2 --> betchInsertFtsMsg2
      betchInsertFtsMsg2 --> betchSetupFtsMsg2
      betchSetupFtsMsg2 --> allWith2
      allWith2 --> insertWith2
      insertWith2 --> updateWith2
      updateWith2 --> runWith2
      runWith2 --> betchInsertWith2
    }
    state userInfoDBUtil.js {
      transP3: transP
      preinsertinkey3: preinsertinkey
      getWith3: getWith
      allWith3: allWith
      insertWith3: insertWith
      updateWith3: updateWith
      runWith3: runWith
      [*] --> getWith3
      getWith3 --> allWith3
      allWith3 --> insertWith3
      insertWith3 --> updateWith3
      updateWith3 --> runWith3
    }
    state ForwardSqliteUtil.js {
      transP4: transP
      preinsertinkey4: preinsertinkey
      [*] --> forwardDBGetWith
      forwardDBGetWith --> forwardDBAll
      forwardDBAll --> forwardDBAllWith
      forwardDBAllWith --> forwardDBInsertWith
      forwardDBInsertWith --> forwardDBUpdateWith
      forwardDBUpdateWith --> forwardDBRunWith
    }
  }
  getWith1 --> getWith3
  getWith3 --> forwardDBGetWith
  allWith1 --> allWith3
  all2 --> forwardDBAll
  transP1 --> preinsertinkey1
  transP2 --> preinsertinkey2
  transP3 --> preinsertinkey3
  transP4 --> preinsertinkey4
  transP1: Promise封装
  preinsertinkey1: preinsertinkey
  getWith1:::notMoving
  allWith1:::notMoving
  insertWith1:::notMoving
  updateWith1:::notMoving
  runWith1:::notMoving
  getWith2:::notMoving
  all2:::notMoving
  allWith2:::notMoving
  insertWith2:::notMoving
  updateWith2:::notMoving
  runWith2:::notMoving
  forwardDBGetWith:::notMoving
  forwardDBAll:::notMoving
  forwardDBAllWith:::notMoving
  forwardDBInsertWith:::notMoving
  forwardDBUpdateWith:::notMoving
  forwardDBRunWith:::notMoving
```

```mermaid
stateDiagram
  state UTILS {
    state ackDBUtil.js {
      ackDBConnect: ackDBConnect.js
      connectUtil: connectUtil
      getDBInstance: getDBInstance
      connectUtil --> ackDBConnect
      ackDBConnect --> connectUtil
      connectUtil --> getDBInstance: connectUtil.IDBUtil.getDBInstance
    }
  }
```

```mermaid
stateDiagram
  state UTILS {
    state SqliteUtil.js {
      logicDBConnect: logicDBConnect.js
      connectUtil2: connectUtil
      getDBInstance2: getDBInstance
      connectUtil2 --> logicDBConnect
      logicDBConnect --> connectUtil2
      connectUtil2 --> getDBInstance2: connectUtil.IDBUtil.getDBInstance
    }
  }
```

```mermaid
stateDiagram
  state UTILS {
    state userInfoDBUtil.js {
      userInfoConnect: userInfoConnect.js
      connectUtil3: connectUtil
      getDBInstance3: getDBInstance
      connectUtil3 --> userInfoConnect
      userInfoConnect --> connectUtil3
      connectUtil3 --> getDBInstance3: connectUtil.IDBUtil.getDBInstance
      transP
      preinsertinkey
    }
    userInfoDBUtil.js --> getWith
    userInfoDBUtil.js --> allWith
    userInfoDBUtil.js --> insertWith
    userInfoDBUtil.js --> updateWith
    userInfoDBUtil.js --> runWith
  }
```

```mermaid
stateDiagram
  state UTILS {
    state ForwardSqliteUtil.js {
      ForwardSqliteConnect: ForwardSqliteConnect.js
      connectUtil4: connectUtil
      getDBInstance4: getDBInstance
      connectUtil4 --> ForwardSqliteConnect
      ForwardSqliteConnect --> connectUtil4
      connectUtil4 --> getDBInstance4: connectUtil.IDBUtil.getDBInstance
    }
  }
```

```mermaid
stateDiagram
  state UTILS {
    state *DBUtil.js {
      state Y1 <<choice>>
      ackDBConnect: ackDBConnect.js
      logicDBConnect: logicDBConnect.js
      userInfoConnect: userInfoConnect.js
      ForwardSqliteConnect: ForwardSqliteConnect.js
      ackDBConnect --> Y1
      logicDBConnect --> Y1
      userInfoConnect --> Y1
      ForwardSqliteConnect --> Y1
      connectUtil: connectUtil
      getDBInstance: getDBInstance
      connectUtil --> Y1: require
      Y1 --> connectUtil: callback
      connectUtil --> getDBInstance: connectUtil.IDBUtil.getDBInstance
    }
  }
```

## 数据库实例化

```mermaid
graph TD
  subgraph enterprise[enterprise.js]
    initSpaceDBInsList --> ackDBConnect[ackDBConnect.js]
    initSpaceDBInsList --> logicDBConnect[logicDBConnect.js]
    initSpaceDBInsList --> userInfoConnect[userInfoConnect.js]
    enterpriseAddFromMsg --> |被邀请加入空间|logicDBConnect
  end
  subgraph DBUtil
    ackDBUtil[ackDBUtil.js] --> |并列关系|SqliteUtil[SqliteUtil.js] --> |并列关系|userInfoDBUtil[userInfoDBUtil.js] --> |并列关系|ForwardSqliteUtil[ForwardSqliteUtil.js] --> |并列关系|sessionMigration[sessionMigration.js] --> |并列关系|loadSdk[loadSdk.js]
  end
  subgraph DBConnects
    ackDBConnect1[ackDBConnect.js] --> |并列关系|logicDBConnect1[logicDBConnect.js] --> |并列关系|userInfoConnect1[userInfoConnect.js] --> |并列关系|ForwardSqliteConnect1[ForwardSqliteConnect.js]
  end
  ackDBUtil --> |引用|ackDBConnect1
  SqliteUtil --> |引用|logicDBConnect1
  userInfoDBUtil --> |引用|userInfoConnect1
  ForwardSqliteUtil --> |引用|ForwardSqliteConnect1
  DBUtil --> getDBInstance
  ackDBConnect --> connect
  logicDBConnect --> connect
  userInfoConnect --> connect
  subgraph DBConnect[_DBConnect.js]
    subgraph DB
      getDbIns
      connectDB
      initDB
      exec
      closeDB
      getDB
    end
    subgraph IDBUtil
      connect
      getDBInstance
      disConnect
    end
    IDBUtil --> DB
    disConnect --> closeDB
    connect --> connectDB
    connect --> initDB
    getDBInstance --> getDbIns
    initDB --> InitialFile
    getDBPath
    getDBPassword
    InitialFile[Initial_createTableFromInitialFileFile] --> _doUpgrade --> _getDBInitFiles
  end
```

| name                  | L             | A    | U    | F   | 描述               |
| --------------------- | ------------- | ---- | ---- | --- | ------------------ |
| getDBPath             | spaceId、vuid | vuid | vuid | :x: | 计算数据库文件路径 |
| getDBPassword         | vuid          | vuid | vuid | :x: | 获取密码           |
| TableFromInitialFile  |               |      |      |     |                    |
| \_doUpgrade           |               |      |      |     |                    |
| \_getDBInitFiles      |               |      |      |     |                    |
| DB                    |               |      |      |     | 数据库实例         |
| DB.getDbIns           |               |      |      |     | 数据库创建与连接   |
| DB.connectDB          |               |      |      |     | 数据库连接         |
| DB.initDB             |               |      |      |     | 数据库初始化       |
| DB.exec               |               |      |      |     | SQL 查询           |
| DB.closeDB            |               |      |      |     | 关闭数据库         |
| DB.getDB              |               |      |      |     |                    |
| IDBUtil               |               |      |      |     |                    |
| IDBUtil.connect       |               |      |      |     |                    |
| IDBUtil.getDBInstance |               |      |      |     |                    |
| IDBUtil.disConnect    | :x:           |      |      |     |                    |

initDB

- [x] .
- [ ] 功能冗余，可以封装实例化
