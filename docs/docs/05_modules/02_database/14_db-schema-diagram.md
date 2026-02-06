# 可视化 ER 图

## 表结构

### 🧠 系统与全文索引表（FTS）

> 索引表，存储全文搜索内容

```mermaid
erDiagram
    %% 索引表，存储全文搜索内容
    Index_Table {
        string body "消息或文档内容"
        string type "内容类型，如 message/doc"
        string subType "子类型"
        string busItemId "业务关联 ID"
        string timeStamp "更新时间"
    }
```

> 索引配置表

```mermaid
erDiagram
    %% 索引配置表
    IndexTable_config {
        string k "配置键"
        string v "配置值"
    }
```

> 索引内容表

```mermaid
erDiagram
    %% 索引内容表
    IndexTable_content {
        string id "内容 ID"
        string c0 "内容片段"
    }
```

> 索引数据块表

```mermaid
erDiagram
    %% 索引数据块表
    IndexTable_data {
        string id "数据块 ID"
        string block "数据块内容"
    }
```

> 索引文档大小表

```mermaid
erDiagram
    %% 索引文档大小表
    IndexTable_docsize {
        string id "文档 ID"
        int sz "文档大小"
    }
```

> 索引倒排表

```mermaid
erDiagram
    %% 索引倒排表
    IndexTable_idx {
        string segid "段 ID"
        string term "索引词"
        string pgno "页号"
    }
```

### 💬 消息与会话模块

> 消息表

```mermaid
erDiagram
    message {
        int id "自增主键"
        string filelisttype "文件类型"
        string hostId "所属主机 ID"
        string c "发送者"
        string t "接收者"
        string m "消息类型"
        string dialogId "会话 ID"
        string peerId "对端 ID"
        string expire "消息过期时间"
        string isMine "是否自己发送"
        string messageType "消息类型标识"
        string MIMETYPE "MIME 类型"
        string ctime "创建时间"
        string stime "服务器时间"
        string uuid "唯一消息 ID"
        string body "消息正文"
        string meta "元数据"
        string messageStatus "状态"
        string filename "文件名"
        bool isStar "是否收藏"
        string docId "关联文档 ID"
        string isNeedUpdateFTS "是否需要更新全文索引"
        string isDeleted "是否删除"
        string assertType "附件类型"
        string finishTime "完成时间"
        string assertPath "附件路径"
        string fileFragmentMap "文件分片映射"
        string content "内容"
        string mcFrom "群发来源"
        string mcTo "群发目标"
        string uuidRepliedRoot "回复根消息 UUID"
        string f "自定义字段 f"
        string s "自定义字段 s"
        string stickerRepliedList "表情回复列表"
        string pinnedInfo "置顶信息"
        string binaryPart "二进制部分"
        string unreadReceipt "未读回执"
        string receiptShow "回执显示"
        string sessionHide "会话隐藏标志"
        string extraData "额外数据"
        string tenantId "租户 ID"
        string burned "阅后即焚标识"
        string msgSeq "消息序号"
        string lastSeq "上次序号"
    }
```

> 会话表

```mermaid
erDiagram
    session {
        int id "会话自增主键"
        string hostId "所属主机"
        string hid "会话 ID"
        string enterpriseId "企业 ID"
        string myBlock "我的块信息"
        string remindlist "提醒列表"
        string isTop "是否置顶"
        string isMute "是否静音"
        string memberLimit "成员限制"
        string isStar "是否收藏"
        string lastMessageUUID "最后消息 UUID"
        int unreadCount "未读消息数量"
        string lastReactTime "最后互动时间"
        string isDeleted "是否删除"
        string draftObj "草稿对象"
        string isGroupDismiss "群组是否解散"
        string extraData "额外数据"
        string maxSeq "最大序号"
        string historyMsgMaxSeq "历史消息最大序号"
        string readtime "最后阅读时间"
        string clearHistoryTime "清空历史时间"
        string maxSeqForStime "stime 最大序号"
        string insertState "插入状态"
        string maxSeqForUUID "UUID 最大序号"
        string updateDeleteTime "删除更新时间"
        string updateMuteTime "静音更新时间"
        string updateTopTime "置顶更新时间"
    }
```

> 临时待发送消息表：记录未成功发送的临时消息

```mermaid
erDiagram
    temp_wait_message {
        int id "主键 ID"
        string key "消息缓存键"
        string targetuuid "目标消息 UUID"
        string tempMessage "待发送消息内容"
        string dialogId "所属会话 ID"
    }
```

> 语音消息表：记录语音消息播放状态

```mermaid
erDiagram
    voice {
        int id "主键 ID"
        string uuid "消息 UUID"
        bool isListened "是否已收听"
    }
```

> 会议表：记录消息关联会议信息

```mermaid
erDiagram
    meeting {
        int id "主键 ID"
        string conferenceId "会议 ID"
        string cycleSubConfID "循环会议子 ID"
        string messageUuid "关联消息 UUID"
        string authorizer "授权人"
    }
```

> 文件表：记录消息中附带的文件信息

```mermaid
erDiagram
    file {
        int id "主键 ID"
        string docId "文档 ID"
        string uuid "消息 UUID"
        string content "文件内容或路径"
        int fileSize "文件大小（字节）"
        string fileName "文件名"
        string metaType "文件类型（image、video 等）"
        string createTime "创建时间"
        string finishTime "上传完成时间"
        string url "文件下载地址"
        string hostId "所属主机 ID"
    }
```

> 元数据表：记录消息关联的业务元信息

```mermaid
erDiagram
    metaTable {
        int id "主键 ID"
        string docId "文档 ID"
        string type "主类型（如 message/file）"
        string subType "子类型（如 text/image）"
        string busItemId "业务关联项 ID"
        string timeStamp "更新时间戳"
    }
```

> 联系人/群组表：存储用户、群组、会议室等信息

```mermaid
erDiagram
    peer {
        int id "主键 ID"
        string hostId "主机 ID"
        string enterpriseId "企业 ID"
        string myBlock "自身分区标识"
        string hid "会话 ID"
        string h_account "账户名"
        string h_id "用户唯一 ID"
        string remindlist "提醒列表"
        string h_sip_number "SIP 号"
        string portraitPath "头像路径"
        string ctime "创建时间"
        string mtime "修改时间"
        string protraitMtime "头像修改时间"
        string survivalTime "生存时间"
        string type "类型（user/group/meeting）"
        string firstName "名"
        string lastName "姓"
        string name "显示名称"
        string owner "所有者"
        string verifyType "验证类型"
        string bannedSwitch "禁言状态"
        string isTop "是否置顶"
        string isMute "是否静音"
        string memberLimit "成员上限"
        string notice "群公告"
        string isStar "是否收藏"
        string isDeleted "是否删除"
        string isBeBlock "是否被拉黑"
        string isDialog "是否是单聊"
        string lastMessageUUID "最后一条消息 UUID"
        string dialogInfo "会话信息 JSON"
        string lastReactTime "最后互动时间"
        string docId "文档 ID"
        string isNeedUpdateFTS "是否需要更新全文索引"
        string detail "详细信息"
        string content "内容描述"
        string request "请求信息"
        string email "邮箱"
        string phoneNumber "电话号码"
        string sig "个性签名"
        string description "描述"
        string meetingroomlist "会议室列表"
        string groupInfo "群信息 JSON"
        string e2eDeviceMap "E2E 设备映射"
        string destoryInterval "阅后即焚间隔"
        string alias "别名"
        string accountPublic "是否公开账户"
        string subscribeType "订阅类型"
        string updateDestructTime "阅后即焚更新时间"
    }
```

> 组织表：记录企业/部门层级结构

```mermaid
erDiagram
    organization {
        int id "主键 ID"
        string organId "组织 ID"
        string spaceName "空间名称"
        string spaceType "空间类型（部门/项目）"
        string pid "父级 ID"
        string level "层级"
        string size "成员数量"
        string rootId "根节点 ID"
        string uidList "用户 ID 列表"
        string mapList "映射列表 JSON"
    }

    receiptInfo {
        int id "主键"
        string hostId "主机 ID"
        string uuid "消息 UUID"
        string payload "回执数据"
    }
```

### 🧾 任务与审批流程

```mermaid
erDiagram
    approval {
        int id "自增主键"
        string businessId "业务 ID"
        string messageUuid "关联消息 UUID"
        string taskId "任务 ID"
        string extraData "额外数据"
    }
```

### 🚻 表关系

```mermaid
erDiagram
    peer ||--o{ session : "会话"
    session ||--o{ message : "包含消息"
    message ||--o{ file : "可附带文件"
    message ||--o{ metaTable : "引用元数据"
    message ||--o{ approval : "可能触发审批"
    peer ||--o{ organization : "隶属于组织"
    message ||--o{ voice : "语音消息"
    message ||--o{ receiptInfo : "已读回执"
    message ||--o{ meeting : "会议关联"
```

### 👥 联系人与组织架构

```mermaid
erDiagram
    emailPeer {
        int id "自增主键"
        string uid "用户 ID"
        string email "邮箱"
        string firstName "名"
        string lastName "姓"
        string mobile "手机号"
        string company "公司"
        string notes "备注"
    }
```

### 🧠 系统配置与状态表

```mermaid
erDiagram
    setting {
        int id "主键"
        string hid "会话 ID"
        string hostId "主机 ID"
        string privateChats "私聊设置"
        string channels "频道设置"
        string autoconnectedAudio "自动连接音频"
        string showingPreview "显示预览"
        string content "内容设置"
        string videoCheck "视频校验"
        string usePersonalRoom "是否使用个人房间"
    }
    kv {
        int id "主键"
        string pairName "键"
        string pairValue "值"
    }
    keypairs {
        int id "主键"
        string hostId "主机 ID"
        string pairName "键"
        string pairValue "值"
    }

    setting ||--o{ kv : "键值扩展"
    keypairs ||--o{ kv : "派生配置"
```

```mermaid
erDiagram
    peddingUnread {
        int id "主键"
        string f "发送方"
        string t "接收方"
        string stime "时间"
        string payload "数据"
    }
```
