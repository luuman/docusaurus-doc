# 错误码参考

> 项目中所有 API 和 SDK 返回的错误码汇总，包括语言包 key 对照和中英文描述。

## 公共错误码

| 错误码 | 语言包 key | 描述 (EN) | 描述 (ZH) |
|--------|-----------|-----------|-----------|
| m100001 | `systemFailure` | There is a system failure, please try again. [m100001] | 系统出现故障，请重试 |
| 429 | `Server.code429` | Too frequent operations, please try again | 操作太频繁，请重试 |
| 500 | `code500` | Network error, please try again later. | 网络错误，请稍后重试 |
| 503 | `Server.code503` | Something went wrong. Please try again later. | 出了些问题，请稍后再试 |
| 100001 | `Server['100001']` | There is a system failure, please try again. [s100001] | 系统出现故障，请重试 |
| 41117 | `Server['41117']` | System error, please try again later. Error code: [s41117] | 系统错误，请稍后重试 |

## 权限与业务错误

| 错误码 | 语言包 key | 描述 (EN) | 描述 (ZH) |
|--------|-----------|-----------|-----------|
| 801 | `no_owner_error` | Failed to proceed because you are not the owner | 无法继续，因为您不是所有者 |
| 802 | `no_contact_error` | Failed to proceed because they are not your contacts | 无法继续，因为他们不是您的联系人 |
| 803 | `no_member_error` | Failed to proceed because you are not a member of this group | 无法继续，因为您不是该组的成员 |
| 804 | `number_limit_error` | Failed to proceed because the member limit is reached | 无法继续，因为已达到成员限制 |
| 406 | `local_time_error` | Time on your device seems incorrect. Please check and update. | 您设备上的时间似乎不正确 |
| 640 | `code640` | This workspace has been discontinued | 此工作区已停产 |
| 641 | `code641` | User does not exist. Please check. | 用户不存在 |
| 642 | `code642` | You can select up to 5 users | 您最多可以选择 5 个用户 |
| 643 | `code643` | \{name\} can't be selected because the person has been authorized by multiple people. | 无法选择 \{name\}，因为此人已获得多人授权 |
| 644 | `code644` | Authorized user added | 已添加授权用户 |
| 632 | `code632` | You no longer have the authorization | 你不再有权限 |

## 登录错误码

| 错误码 | 语言包 key | 描述 (EN) | 描述 (ZH) |
|--------|-----------|-----------|-----------|
| 670 | `user_login.incorrect_email_password` | Incorrect email address or password, please try again | 电子邮件地址或密码不正确 |
| 621 | `user_login.incorrect_account_password` | Invalid account or password | 帐号或密码无效 |
| 622 | `user_login.accountLocked` | Your account is temporarily locked to prevent unauthorized use. | 您的帐户被临时锁定 |
| 501 | `user_login.email_invalid` | Email address is invalid | 电子邮件地址无效 |
| 633 | `user_login.CLIENT_VERSION_TOO_OLD` | Please update to the latest version and try again | 请更新到最新版本 |
| 702 | `user_login.RID_MISMATCH` | Network error, please try again | 网络错误，请重试 |
| 703 | `user_login.NO_USER` | No Users | 无用户 |
| 30008 | `user_login.SigninwithMicrosoftTips` | Your current enterprise is not subscribed to this feature. | 您当前的企业未订阅此功能 |
| 80001003 | `user_login.adNoEmail` | Invalid account or password. Please contact your Administrator to bind your email. | 帐户或密码无效，请联系管理员绑定邮箱 |
| NoValidSpace | `user_login.NoValidSpace` | Not joined the enterprise yet. Please contact the enterprise administrator. | 尚未加入企业 |

## 验证码错误

| 错误码 | 语言包 key | 描述 (EN) | 描述 (ZH) |
|--------|-----------|-----------|-----------|
| 601 | `code_pure_error` | Verification code error, please enter again | 验证码错误，请重新输入 |
| 606 | `code_times_error` | The verification code has been wrongly entered 3 times in a row. | 连续 3 次输入错误验证码 |
| 620 | `phone_addr_error` | Invalid phone number, please check and try again | 电话号码无效 |

## 密码修改

| 错误码 | 语言包 key | 描述 (EN) | 描述 (ZH) |
|--------|-----------|-----------|-----------|
| 621 | `top_menu_bar.password_incorrect` | Your old password is incorrect. | 您的旧密码不正确 |
| 622 | `top_menu_bar.many_times_modify_password` | Too many attempts | 尝试次数太多 |
| 630 | `top_menu_bar.same_password` | Your new password must be different from your previous password | 新密码必须与以前的密码不同 |

## 会议 API 错误码

| 错误码 | 语言包 key | 描述 (EN) | 描述 (ZH) |
|--------|-----------|-----------|-----------|
| 604 | `meeting_repeat_error` | You have a duplicate meeting | 你有一个重复的会议 |
| 611 | `meeting_edit_error` | This meeting cannot be edited because it has started | 无法编辑此会议，因为它已经开始 |
| 612 | `meeting_end_error` | The meeting does not exist or has ended | 会议不存在或已结束 |
| 614 | `meeting_not_started` | Meeting has not started. | 会议尚未开始 |
| 615 | `editAfterMeeting` | Please edit it after the current meeting ends | 请在本次会议结束后再编辑 |
| 605 | `startTime_limit_error` | The start time is out of the limit. | 开始时间超出限制 |
| 603 | `startTime_time_error` | Please set start time 15 minutes later. | 请将开始时间设置为 15 分钟后 |
| 608 | `Panel.invitedMaximum` | You've invited the maximum number of participants your current plan allows. | 已邀请最大参与者人数 |
| 630 | `meeting_net_error` | Network error, please try again | 网络错误，请重试 |
| 645 | `code645` | The meeting has ended or cancelled | 会议已结束或取消 |
| 649 | `code649` | The meeting can't be edited but can only be deleted because the host has left the workspace | 会议无法编辑，只能删除 |
| 40007 | `createMeetingLimit` | Too many requests, please try again later. | 请求过多，请稍后重试 |
| 1004 | `MeetingCanceled` | Meeting cancelled | 会议取消 |
| 1005 | `MeetingEnd` | Meeting ended | 会议结束 |

## 会议 SDK 错误码 (CST/HW)

### 服务端错误码

| 错误码 | 语言包 key | 描述 (EN) | 描述 (ZH) |
|--------|-----------|-----------|-----------|
| 33304008 | `meetingCode.33304008` | This meeting doesn't exist or you have no access permission | 此会议不存在或无访问权限 |
| 33304009 | `meetingCode.33304009` | Incorrect meeting ID or password | 会议 ID 或密码不正确 |
| 33304011 | `meetingCode.33304011` | You cannot join the meeting before the host | 不能在主持人之前加入会议 |
| 33304012 | `meetingCode.33304012` | Meeting ended | 会议结束 |
| 33304013 | `meetingCode.33304013` | The meeting host doesn't exist | 会议主持人不存在 |
| 33304015 | `meetingCode.33304015` | You're removed from this meeting by the host | 您已被主持人从会议中移除 |
| 33304016 | `meetingCode.33304016` | This meeting is locked | 此会议已锁定 |
| 33304017 | `meetingCode.33304017` | This meeting doesn't exist or you have no access permission | 此会议不存在或无访问权限 |
| 33304018 | `meetingCode.33304018` | Somebody is sharing | 有人正在分享 |
| 33304026 | `meetingCode.33304026` | Maximum participants limit reached | 已达到最大参与者限制 |

### HW SDK 错误码

| 错误码 | 语言包 key | 描述 (ZH) |
|--------|-----------|-----------|
| 20001 | `enum.hwerrorcode.20001` | 会议 ID 或密码错误 |
| 20002 | `enum.hwerrorcode.20002` | 此会议已锁定 |
| 20004 | `enum.hwerrorcode.20004` | 不能在主持人之前加入会议 |
| 20005 | `enum.hwerrorcode.20005` | 共享已锁定 |
| 20006 | `enum.hwerrorcode.20006` | 找不到会议 |
| 20007 | `enum.hwerrorcode.20007` | 只有主持人工作区中的参与者可以加入 |
| 20008 | `enum.hwerrorcode.20008` | 只有被邀请的参与者才能加入 |
| 20009 | `enum.hwerrorcode.20009` | 会议主持人不存在 |
| 20010 | `enum.hwerrorcode.20010` | 正在呼叫与会者 |
| 20011 | `enum.hwerrorcode.20011` | 在会议中或被呼叫 |
| 20012 | `enum.hwerrorcode.20012` | 密码尝试失败次数过多，会议暂时锁定 |
| 20013 | `enum.hwerrorcode.20013` | 会议结束 |
| 20014 | `enum.hwerrorcode.20014` | 访客密码不能与主机密码相同 |
| 20015 | `enum.hwerrorcode.20015` | 已达到最大参与者限制 |
| 111071065 | `enum.hwerrorcode.111071065` | 您无法编辑正在进行的会议 |
| 111071067 | `enum.hwerrorcode.111071067` | 您无法删除正在进行的会议 |
| 111071013 | `enum.hwerrorcode.111071013` | 开始时间不能早于当前时间 |
| 111071014 | `enum.hwerrorcode.111071014` | 会议持续时间不得超过 24 小时 |
| 115022001 | `enum.hwerrorcode.115022001` | 已达到最大参与者限制 |

### 自有 SDK 错误码

| 错误码 | 描述 (EN) | 描述 (ZH) |
|--------|-----------|-----------|
| 50014 | Incorrect meeting ID or password | 会议 ID 或密码错误 |
| 50015 | Incorrect meeting ID or password | 会议 ID 或密码错误 |
| 50060 | Meeting not found | 找不到会议 |
| 50097 | Meeting ended | 会议结束 |
| 50098 | Request fail | 请求失败 |
| 50099 | Token is expired | 令牌已过期 |
| 102000612 | Meeting has ended or does not exist | 会议已结束或不存在 |
| 102000615 | Only authorized users can join this meeting | 只有授权用户才能加入 |
| 102000616 | This meeting cannot be edited because it has started | 无法编辑此会议 |
| 102000617 | No permission | 没有权限 |
| 102000619 | Meeting cancelled | 会议取消 |
| 102000622 | Maximum participants limit reached | 已达到最大参与者限制 |

## 阅后即焚

| 错误码 | 语言包 key | 描述 (ZH) |
|--------|-----------|-----------|
| 80001010 | `destroyMessage.settingFailed` | 设置失败，联系人版本不支持此功能 |
| 80001011 | `destroyMessage.settingNoPermission` | 设置失败，联系人无权使用 |

## 网络错误

| 错误码 | 语言包 key | 描述 (ZH) |
|--------|-----------|-----------|
| 500 | `code500` | 网络错误，请稍后重试 |
| 0 | `network_connect_check` | 请检查您的连接并重试 |

## 系统错误

| 语言包 key | 描述 (ZH) |
|-----------|-----------|
| `errorCode.error_qrcode_retry` | QR 码已过期，请再试一遍 |
| `errorCode.error_qrcode_nologin` | 请先登录 |
| `errorCode.start_app_nospace` | 磁盘已满，请释放磁盘空间 |
| `errorCode.error_space_noleft` | 磁盘已满，无法下载文件 |
| `errorCode.error_save_as` | 下载文件已被移动或删除 |

## 会议卡片回复

| 错误码 | 语言包 key | 描述 (ZH) |
|--------|-----------|-----------|
| 1 | `meetCard.tentativeReplied` | 已回复并添加到会议列表（暂定） |
| 2 | `meetCard.acceptReplied` | 已回复并添加到会议列表（接受） |
| 3 | `meetCard.declineReplied` | 已回复会议组织者（拒绝） |
