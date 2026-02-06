# 数据埋点 (Mixpanel)

> 项目使用 Mixpanel 进行用户行为数据上报，本文档记录所有埋点事件和初始化方式。

## 初始化

```javascript
import mixpanel from 'mixpanel-browser';
import store from '@/store/index';
import {env} from '@/config/config';
import {ipcRenderer} from 'electron';
import envConfig from '@/config/config';
import {deviceInfo as getDeviceInfo} from '@/utils/deviceInfo';

let commonParms;

async function initCommand() {
    const initCode = 'a749e8a354c27a0245e6bd40cbc9e253'; // 主实例 API Key
    mixpanel.init(initCode, {debug: true, api_host: env.reportMeetingApiBase}, 'main');

    const behaviorInitCode = '56200c5566b6612666a8f945f9c35ca6'; // 行为数据 API Key
    mixpanel.init(behaviorInitCode, {debug: true}, 'behavior');

    let vendor = store.state.storage.win32SystemInfo;
    let deviceInfo = await getDeviceInfo();
    commonParms = {
        os: 'windows',
        network: 'wifi',
        osver: deviceInfo?.release || deviceInfo?.osVer,
        appver: deviceInfo?.appVer,
        model: vendor?.Model,
        countryCodes: deviceInfo?.countryCode,
        logTime: new Date().valueOf(),
        uid: appdataStorage.getItem('uid') || '',
        cid: appdataStorage.getItem('xx_currentSpace') || ''
    };
    return commonParms;
}
```

:::info
私有化部署环境下（`envConfig.isPrivated === true`）不上报任何数据。
:::

## 上报接口

- **`meetingReport(params)`** — 会议事件上报（发送到 `mixpanel.main`）
- **`logEventApi(eventName, config)`** — 用户行为上报（发送到 `mixpanel.behavior`）
- **`setUserIdApis(userId)`** — 用户身份识别

## 会议事件枚举

```javascript
export const MeetingTypeEnum = {
    Create_meeting: 'Create_meeting',
    Query_meeting_details: 'Query_meeting_details',
    Join_meeting: 'Join_meeting'
};

export const joinMeetingEnum = {
    Link_join: 'Link_join',
    Login_main_join: 'Login_main_join',
    NLogin_main_join: 'NLogin_main_join',
    Schedule_list_join: 'Schedule_list_join',
    Schedule_Details_join: 'Schedule_Details_join',
    Card_join: 'Card_join',
    Call_join: 'Call_join',
    Calendar_join: 'Calendar_join',
    Assistant_Details_join: 'Assistant_Details_join',
    Clipboard_join: 'Clipboard_join'
};

export const createMeetingEnum = {
    New_meeting: 'New_meeting',
    Schedule_meeting: 'Schedule_meeting',
    Group_meeting: 'Group_meeting'
};
```

## 埋点事件清单

### 频道

| 事件名称 | 埋点标识 | 描述 |
|----------|---------|------|
| `fireChannelUnread` | `channel_Unread` | 未读频道点击 |
| `fireReadReceipts` | `read_receipts` | 已读回执关闭 |
| `fireReceiptsListChat` | `receipts list_chat` | 聊天回执列表 |

### 下载

| 事件名称 | 埋点标识 | 描述 |
|----------|---------|------|
| `fireDownloadChoose` | `Download_choose` | 选择下载 |
| `fireDownloadEdit` | `Download_edit` | 编辑下载 |

### 消息操作

| 事件名称 | 埋点标识 | 描述 |
|----------|---------|------|
| `fireMessageSelect` | `message select` | 消息选择 |
| `fireMessageSelectLimit` | `message select limit` | 消息选择超限 |
| `fireMemberSelectLimit` | `member select limit` | 成员选择超限 |

### 截图

| 事件名称 | 埋点标识 | 描述 |
|----------|---------|------|
| `fireShortcutScreencapture` | `shortcut_screencapture` | 快捷键截图 |
| `fireChangeShortcutScreencapture` | `change_shortcut_screencapture` | 修改截图快捷键 |
| `fireScreenshotClick` | `screenshot` | 截图点击 |
| `fireScreenshotHide` | `screenshot` | 截图隐藏 |
| `fireScreenshotLabel` | `screenshot` | 截图标注 |
| `fireScreenshotLabelChoice` | `screenshot` | 截图标注选择 |

### 名片

| 事件名称 | 埋点标识 | 描述 |
|----------|---------|------|
| `fireNameCardOpen` | `NameCard_open` | 打开名片 |
| `fireNameCardSend` | `NameCard_send` | 发送名片 |

### 图片查看

| 事件名称 | 埋点标识 | 描述 |
|----------|---------|------|
| `fireImageviewZoomin` | `imageview_zoomin` | 图片放大 |
| `fireImageviewZoomout` | `imageview_zoomout` | 图片缩小 |
| `fireImageviewActualsize` | `imageview_actualsize` | 查看实际大小 |
| `fireImageviewRotate` | `imageview_rotate` | 旋转图片 |
| `fireImageviewDownload` | `imageview_download` | 下载图片 |

### 置顶

| 事件名称 | 埋点标识 | 描述 |
|----------|---------|------|
| `firePin` | `messagelist_pintotop` | 消息列表置顶 |
| `fireSetpin` | `messagesetting_pintotop` | 消息设置置顶 |
| `fireMsgPined` | `message_pin` | 消息置顶 |
| `fireMsgUnpined` | `message_unpin` | 取消置顶 |

### 日历

| 事件名称 | 埋点标识 | 描述 |
|----------|---------|------|
| `fireClickOnViewCalendar` | `Click on View calendar` | 点击查看日历 |
| `fireClickOnCalendarEvent` | `Click on calendar event` | 点击日历事件 |
| `fireClickOnMoreEvent` | `Click on more event` | 点击更多事件 |
| `fireClickEnterMeetingInCalendar` | `Click enter meeting in calendar` | 进入会议 |
| `fireClickEditMeetingInCalendar` | `Click edit meeting in calendar` | 编辑会议 |
| `fireClickSaveEditMeetingInCalendar` | `Click save edit meeting in calendar` | 保存会议编辑 |
| `fireClickDeleteMeetingInCalendar` | `Click delete meeting in calendar` | 删除会议 |
| `fireClickConfirmDeleteMeetingInCalendar` | `Click confirm delete meeting in calendar` | 确认删除会议 |

### 账户

| 事件名称 | 埋点标识 | 描述 |
|----------|---------|------|
| `fireDeleteMyAccount` | `Delete my account` | 删除账户 |
| `fireDeleteMyAccountButton` | `Delete my account button` | 点击删除账户按钮 |
| `fireDeleteButton` | `Delete_button` | 删除按钮 |

### 搜索

| 事件名称 | 埋点标识 | 描述 |
|----------|---------|------|
| `fireSearchClick` | `Search` | 搜索点击 |
| `fireSearchClickResult` | `Search` | 搜索结果点击 |

### 2FA 验证

| 事件名称 | 埋点标识 | 描述 |
|----------|---------|------|
| `fireVerify` | `2FA_verify` | 2FA 验证 |
| `fireVerifyDone` | `2FA_verify_done` | 2FA 验证完成 |
| `fireVerifyFailed` | `2FA_verify_failed` | 2FA 验证失败 |

### 设置

| 事件名称 | 埋点标识 | 描述 |
|----------|---------|------|
| `fireSettingsProfileClick` | `Settings_profile_click` | 个人资料设置 |
| `fireSettingsPreferencesClick` | `Settings_preferences_click` | 偏好设置 |
| `firePreferencesSecurityClick` | `Preferences_Security_click` | 安全偏好点击 |

### 更新与崩溃

| 事件名称 | 埋点标识 | 描述 |
|----------|---------|------|
| `fireCheckCrash` | `crash report` | 崩溃检查 |
| `fireCheckUpdate` | `check update` | 检查更新 |
| `fireUpdate` | `update` | 更新 |

### 举报

| 事件名称 | 埋点标识 | 描述 |
|----------|---------|------|
| `fireReportContactReport(uuid)` | `Report_contact` | 举报联系人 |
| `fireReportContactSubmit(uuid)` | `Report_contact` | 提交举报 |
| `fireReportContactBlock(uuid)` | `Report_contact` | 拉黑联系人 |

### 会议

| 事件名称 | 埋点标识 | 描述 |
|----------|---------|------|
| `fireMeetingSwitchSpace` | `Meeting_Switch_ workspace` | 会议空间切换 |
| `fireSelfdestructTimerClick` | `Self destruct Timer` | 自毁计时器 |
| `fireSelfdestructTimerClickResult` | `Self destruct Timer choice` | 自毁计时器选择 |
| `fireMeetingCardMessage` | `Meeting_Card_Message` | 会议消息卡片 |
| `fireMeetingCardRSVP` | `Meeting_Card_RSVP` | 会议 RSVP |

### 其他

| 事件名称 | 埋点标识 | 描述 |
|----------|---------|------|
| `fireView` | `view_in_chat` | 聊天中查看 |
| `firePseronLimitSignUp` | `anonymous_meeting` | 匿名会议注册 |
| `firePseronLimitSignIn` | `anonymous_meeting` | 匿名会议登录 |
