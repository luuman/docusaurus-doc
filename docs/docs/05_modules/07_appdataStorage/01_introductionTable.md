# appdataStorage

| 分类           | 键名                      | 主要用途                                        |
| -------------- | ------------------------- | ----------------------------------------------- |
| 用户登录相关   | loginStatus               | 登录状态 (INITIAL/LOGINFINISH/ERROR/DISCONNECT) |
|                | keepLogin                 | 是否保持登录状态                                |
|                | uid                       | 用户 ID                                         |
|                | c_rid                     | 客户端请求 ID                                   |
|                | c_email                   | 用户邮箱                                        |
|                | c_phone                   | 用户电话                                        |
|                | hid                       | 用户 HID                                        |
|                | countrycode               | 国家代码                                        |
|                | user_type                 | 用户类型 (ad/ldap 等)                           |
|                | c_phone_simple            | 简化电话号码                                    |
|                | c_user_name               | 用户名                                          |
|                | langI18n                  | 语言设置                                        |
|                | themeMode                 | 主题模式                                        |
|                | themeColor                | 主题颜色                                        |
|                | loginMessage              | 登录错误消息                                    |
|                | matrx_email               | 矩阵邮箱                                        |
|                | isFirstLogin              | 是否首次登录                                    |
|                | isPayUser                 | 是否为付费用户                                  |
|                | user_platforms            | 用户平台                                        |
| 空间和会话管理 | xx_spaceList              | 空间列表                                        |
|                | xx_currentSpace           | 当前空间 ID                                     |
|                | xx_vuid                   | 虚拟用户 ID                                     |
|                | xx_baseUCPath             | 基础 UC 路径                                    |
|                | xx_preSpace               | 上一个空间 ID                                   |
|                | xx_spaceData              | 空间数据                                        |
|                | xx_baseUserIdcPath        | 基础用户 IDC 路径                               |
|                | xx_imSdkGtwUrl            | IM SDK 网关 URL                                 |
|                | xx_crystalSslPath         | Crystal SSL 路径                                |
|                | xx_lgType                 | 登出类型                                        |
|                | xx_gp                     | 群组 pin 读取时间映射                           |
|                | xx_basePFMPath            | 基础 PFM 路径                                   |
| 会议相关       | meetingInfo               | 会议信息                                        |
|                | joinData                  | 加入会议数据                                    |
|                | meetingRoomListForGuest   | 访客会议房间列表                                |
|                | cstInitResp               | CST 初始化响应                                  |
|                | serverList                | 服务器列表                                      |
|                | hwMeetingJoinTimestamp    | 华为会议加入时间戳                              |
|                | cstLoginNotify            | CST 登录通知                                    |
|                | sdk1V1AnswerId            | SDK 1v1 应答 ID                                 |
|                | interpreterRemoveAskAgain | 翻译移除确认                                    |
| 消息和聊天     | c_socket_state            | socket 状态                                     |
|                | imSdkOpen                 | IM SDK 是否开启                                 |
|                | RECEIPT_START_TIME        | 回执开始时间                                    |
|                | c_scoket                  | 客户端 socket                                   |
|                | CUSTOM_EMOJI              | 自定义表情                                      |
|                | emojis_popular            | 常用表情                                        |
|                | tempSpaceIdcMessages      | 临时空间 IDC 消息                               |
| UI 和设置      | currentSessionWidth       | 当前会话宽度                                    |
|                | menuSortKeys              | 菜单排序键                                      |
|                | whiteList                 | 白名单                                          |
|                | leftMenuBarExpand         | 左侧菜单栏展开状态                              |
|                | spaceMenuSwitcher         | 空间菜单开关                                    |
|                | currentInputHeightPercent | 输入框高度百分比                                |
|                | collaboration_token       | 协作令牌                                        |
| 功能开关       | screen_unlock             | 屏幕解锁状态                                    |
|                | Client_Debug_Sdk          | SDK 调试模式                                    |
|                | imSdkGtwIdc1Url           | IM SDK 网关 IDC1 URL                            |
| 其他           | login_time                | 登录时间                                        |
|                | login_ip                  | 登录 IP                                         |
|                | x_vt                      | 验证时间戳                                      |
|                | localServerList           | 本地服务器列表                                  |
|                | downloadedVersion         | 下载版本                                        |
|                | server503                 | 服务器 503 状态                                 |
|                | vList                     | 验证列表                                        |
