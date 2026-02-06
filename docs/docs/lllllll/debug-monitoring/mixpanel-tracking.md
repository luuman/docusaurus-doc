埋点（Mixpanel）

| 分类     | 事件名称                                  | 埋点标识                                   | 描述             |
| -------- | ----------------------------------------- | ------------------------------------------ | ---------------- |
| 频道     | `fireChannelUnread`                       | `channel_Unread`                           | 未读频道点击     |
|          | `fireReadReceipts`                        | `read_receipts`                            | 已读回执关闭     |
|          | `fireReceiptsListChat`                    | `receipts list_chat`                       | 聊天回执列表     |
| 下载     | `fireDownloadChoose`                      | `Download_choose`                          | 选择下载         |
|          | `fireDownloadEdit`                        | `Download_edit`                            | 编辑下载         |
| 消息操作 | `fireMessageSelect`                       | `message select`                           | 消息选择         |
|          | `fireMessageSelectLimit`                  | `message select limit`                     | 消息选择超限     |
|          | `fireMemberSelectLimit`                   | `member select limit`                      | 成员选择超限     |
| 截图     | `fireShortcutScreencapture`               | `shortcut_screencapture`                   | 快捷键截图       |
|          | `fireChangeShortcutScreencapture`         | `change_shortcut_screencapture`            | 修改快捷键截图   |
|          | `fireScreenshotClick`                     | `screenshot`                               | 截图点击         |
|          | `fireScreenshotHide`                      | `screenshot`                               | 截图隐藏         |
|          | `fireScreenshotLabel`                     | `screenshot`                               | 截图标注         |
|          | `fireScreenshotLabelChoice`               | `screenshot`                               | 截图标注选择     |
| 名片     | `fireNameCardOpen`                        | `NameCard_open`                            | 打开名片         |
|          | `fireNameCardSend`                        | `NameCard_send`                            | 发送名片         |
| 图片查看 | `fireImageviewZoomin`                     | `imageview_zoomin`                         | 图片放大         |
|          | `fireImageviewZoomout`                    | `imageview_zoomout`                        | 图片缩小         |
|          | `fireImageviewActualsize`                 | `imageview_actualsize`                     | 查看实际大小     |
|          | `fireImageviewRotate`                     | `imageview_rotate`                         | 旋转图片         |
|          | `fireImageviewDownload`                   | `imageview_download`                       | 下载图片         |
| 置顶     | `firePin`                                 | `messagelist_pintotop`                     | 消息列表置顶     |
|          | `fireSetpin`                              | `messagesetting_pintotop`                  | 消息设置置顶     |
|          | `fireMsgPined`                            | `message_pin`                              | 消息置顶         |
|          | `fireMsgUnpined`                          | `message_unpin`                            | 取消置顶         |
| 日历     | `fireClickOnViewCalendar`                 | `Click on View calendar`                   | 点击查看日历     |
|          | `fireClickOnCalendarEvent`                | `Click on calendar event`                  | 点击日历事件     |
|          | `fireClickOnMoreEvent`                    | `Click on more event`                      | 点击更多事件     |
|          | `fireClickEnterMeetingInCalendar`         | `Click enter meeting in calendar`          | 进入会议         |
|          | `fireClickEditMeetingInCalendar`          | `Click edit meeting in calendar`           | 编辑会议         |
|          | `fireClickSaveEditMeetingInCalendar`      | `Click save edit meeting in calendar`      | 保存会议编辑     |
|          | `fireClickDeleteMeetingInCalendar`        | `Click delete meeting in calendar`         | 删除会议         |
|          | `fireClickConfirmDeleteMeetingInCalendar` | `Click confirm delete meeting in calendar` | 确认删除会议     |
| 账户     | `fireDeleteMyAccount`                     | `Delete my account`                        | 删除账户         |
|          | `fireDeleteMyAccountButton`               | `Delete my account button`                 | 点击删除账户按钮 |
|          | `fireDeleteButton`                        | `Delete_button`                            | 删除按钮         |
| 搜索     | `fireSearchClick`                         | `Search`                                   | 搜索点击         |
|          | `fireSearchClickResult`                   | `Search`                                   | 搜索结果点击     |
| 2FA 验证 | `fireVerify`                              | `2FA_verify`                               | 2FA 验证         |
|          | `fireVerifyDone`                          | `2FA_verify_done`                          | 2FA 验证完成     |
|          | `fireVerifyFailed`                        | `2FA_verify_failed`                        | 2FA 验证失败     |
| 设置     | `fireSettingsProfileClick`                | `Settings_profile_click`                   | 个人资料设置     |
|          | `fireSettingsPreferencesClick`            | `Settings_preferences_click`               | 偏好设置         |
|          | `firePreferencesSecurityClick`            | `Preferences_Security_click`               | 安全偏好点击     |
| 更新     | `fireCheckCrash`                          | `crash report`                             | 崩溃检查         |
|          | `fireCheckUpdate`                         | `check update`                             | 检查更新         |
|          | `fireUpdate`                              | `update`                                   | 更新             |
| 举报     | `fireReportContactReport(uuid)`           | `Report_contact`                           | 举报联系人       |
|          | `fireReportContactSubmit(uuid)`           | `Report_contact`                           | 提交举报         |
|          | `fireReportContactBlock(uuid)`            | `Report_contact`                           | 拉黑联系人       |
| 会议     | `fireMeetingSwitchSpace`                  | `Meeting_Switch_ workspace`                | 会议空间切换     |
|          | `fireSelfdestructTimerClick`              | `Self destruct Timer`                      | 自毁计时器       |
|          | `fireSelfdestructTimerClickResult`        | `Self destruct Timer choice`               | 自毁计时器选择   |
|          | `fireMeetingCardMessage`                  | `Meeting_Card_Message`                     | 会议消息卡片     |
|          | `fireMeetingCardRSVP`                     | `Meeting_Card_RSVP`                        | 会议 RSVP        |
| 其他     | `fireView`                                | `view_in_chat`                             | 聊天中查看       |
|          | `firePseronLimitSignUp`                   | `anonymous_meeting`                        | 匿名会议注册     |
|          | `firePseronLimitSignIn`                   | `anonymous_meeting`                        | 匿名会议登录     |

注：

- `value`、`uuid` 表示这些埋点事件可能包含动态参数值。
- 未启用（被注释掉）的埋点未列入表格。
- 可根据实际需求添加 描述 细节或进行分类调整。

```js
import mixpanel from "mixpanel-browser"; // 引入 Mixpanel，用于行为数据上报
import store from "@/store/index"; // Vuex 状态管理，存储设备信息
import { env } from "@/config/config"; // 读取配置信息
import { ipcRenderer } from "electron"; // Electron 进程间通信模块
import envConfig from "@/config/config"; // 读取环境变量
import { deviceInfo as getDeviceInfo } from "@/utils/deviceInfo"; // 获取设备信息工具函数

// 存储通用参数
let commonParms;

/**
 * 初始化 Mixpanel 并获取设备信息
 */
async function initCommand() {
  const initCode = "a749e8a354c27a0245e6bd40cbc9e253"; // Mixpanel 主实例 API Key
  mixpanel.init(
    initCode,
    { debug: true, api_host: env.reportMeetingApiBase },
    "main"
  );

  const behaviorInitCode = "56200c5566b6612666a8f945f9c35ca6"; // Mixpanel 行为数据 API Key
  mixpanel.init(behaviorInitCode, { debug: true }, "behavior");

  try {
    let vendor = store.state.storage.win32SystemInfo; // 获取存储的 Windows 设备信息
    let deviceInfo = await getDeviceInfo(); // 获取设备信息
    commonParms = {
      os: "windows",
      network: "wifi",
      osver: deviceInfo?.release || deviceInfo?.osVer, // 操作系统版本
      appver: deviceInfo?.appVer, // 应用版本
      model: vendor?.Model, // 设备型号
      countryCodes: deviceInfo?.countryCode, // 国家代码
      logTime: new Date().valueOf(), // 记录日志时间戳
      uid: appdataStorage.getItem("uid") || "", // 用户 ID
      cid: appdataStorage.getItem("xx_currentSpace") || "", // 当前空间 ID
    };
  } catch (error) {
    console.error("[error]: ", "initCommand report", error);
  }
  return commonParms;
}

// 会议事件类型枚举
export const MeetingTypeEnum = {
  Create_meeting: "Create_meeting",
  Query_meeting_details: "Query_meeting_details",
  Join_meeting: "Join_meeting",
};

// 查询会议详情的类型
export const queryMeetingDetailsEnum = {
  Schedule_list_query: "Schedule_list_query",
  Assistant_query: "Assistant_query",
  Calendar_query: "Calendar_query",
};

// 加入会议的方式
export const joinMeetingEnum = {
  Link_join: "Link_join",
  Login_main_join: "Login_main_join",
  NLogin_main_join: "NLogin_main_join",
  Schedule_list_join: "Schedule_list_join",
  Schedule_Details_join: "Schedule_Details_join",
  Card_join: "Card_join",
  Call_join: "Call_join",
  Calendar_join: "Calendar_join",
  Assistant_Details_join: "Assistant_Details_join",
  Clipboard_join: "Clipboard_join",
  Invite_Card_join: "Card_join",
  Link_Login_main_join: "Link_Login_main_join",
  Link_NLogin_main_join: "Link_NLogin_main_join",
};

// 创建会议的方式
export const createMeetingEnum = {
  New_meeting: "New_meeting",
  Schedule_meeting: "Schedule_meeting",
  Group_meeting: "Group_meeting",
};

/**
 * 会议数据上报
 * @param {Object} param - 会议数据
 */
export async function meetingReport({
  type,
  Error_type,
  Error_code,
  Error_message,
  Error_port,
  MeetingID,
}) {
  commonParms = commonParms || (await initCommand()); // 确保 commonParms 已初始化

  console.log("commonParms00", commonParms);
  let parms = {
    Error_type: Error_type,
    event_type: Error_type,
    Error_code: Error_code,
    Error_message: Error_message,
    Error_port: Error_port,
    MeetingID: MeetingID,
    ...commonParms,
  };
  mixpanel.main.track(type, parms); // 发送数据到 Mixpanel 主实例
}

/**
 * 记录用户行为日志
 * @param {string} eventName - 事件名称
 * @param {Object} config - 事件参数
 */
export async function logEventApi(eventName, config) {
  if (envConfig.isPrivated) return; // 如果是私有化部署，则不上报数据
  commonParms = commonParms || (await initCommand()); // 确保 commonParms 已初始化

  console.log("behavior logEventApi", eventName, config);
  mixpanel.behavior.track(eventName, config); // 发送行为数据到 Mixpanel
}

/**
 * 设置用户 ID
 * @param {string} userId - 用户 ID
 */
export async function setUserIdApis(userId) {
  if (envConfig.isPrivated) return; // 如果是私有化部署，则不上报数据
  commonParms = commonParms || (await initCommand()); // 确保 commonParms 已初始化

  mixpanel.behavior.identify(userId); // 识别用户 ID
}

/**
 * Electron 监听会议退出事件，并上报数据
 */
ipcRenderer.on("MEETING_LEAVE_REASON", (e, data) => {
  meetingReport({
    type: MeetingTypeEnum.Join_meeting, // 事件类型：加入会议
    Error_type: joinMeetingEnum.Link_join, // 具体加入方式：链接加入
    Error_code: data.code, // 错误码
    Error_message: data.message, // 错误信息
    Error_port: "HWM-Link-Join", // 端口信息
    MeetingID: data.confId, // 会议 ID
  });
});
```
