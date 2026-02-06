# 日历模块

## 概述

日历模块是 Matrx Windows 客户端的会议日程管理功能，支持按月、周、日三种视图查看和管理会议日程。该模块深度集成了会议系统，支持从服务端获取会议历史、展示实时会议信息、创建新会议日程，以及将会议同步至本地日历（系统默认日历、Outlook、Google Calendar）。模块采用组件化架构，由面板入口、日历视图器、头部控制栏、日程弹窗卡片等子组件协作完成完整的日程管理流程。

## 核心文件结构

```
src/
├── components/
│   ├── Calendar/
│   │   ├── CalendarViewer.vue          # 日历视图主组件
│   │   ├── CalendarHeader.vue          # 日历头部控制栏
│   │   ├── CalendarViewerMonth.vue     # 月视图组件
│   │   ├── CalendarViewerWeek.vue      # 周/日视图组件
│   │   ├── PopoverDateCard.vue         # 日程详情弹窗卡片
│   │   └── utils.js                    # 日历工具函数
│   └── Panel/
│       ├── CalendarPanel.vue           # 日历面板入口
│       ├── SyncCalendar.js             # 日历同步逻辑
│       └── SyncCalendarConstants.js    # 同步常量定义
├── main/
│   └── mainWindow/
│       └── settingsCalendar.js         # 主进程日历设置存储
└── utils/
    └── meeting/
        └── scheduleHistory.js          # 会议历史时间处理
```

## 详细代码分析

### 1. CalendarPanel.vue - 面板入口

`CalendarPanel.vue` 是日历模块在主界面侧边栏面板中的挂载入口，负责协调日历视图与外部系统的交互。

```javascript
// src/components/Panel/CalendarPanel.vue
export default {
    name: 'CalendarPanel',
    components: {
        // 异步加载日历视图主组件
        CalendarViewer: () => import('@/components/Calendar/CalendarViewer')
    },
    data() {
        return {
            visibleCalendar: false,  // 是否展示日历视图
            calendarList: [],
            scheduleById: '',
            isUpdateView: false,
            isDeactivated: false
        };
    }
};
```

核心功能：

- **Vuex 状态绑定**：通过 `mapState` 获取 `authorizerList`（授权人列表）和 `hid`（用户 ID），`scheduleBy` 通过 computed 双向绑定到 store
- **事件总线监听**：在 `mounted` 中注册 `refresh-calendar-list`、`clear-calendar-list`、`global-setInterval` 等事件，实现外部触发日历刷新
- **keep-alive 生命周期**：使用 `activated` / `deactivated` 钩子管理面板切换时的数据刷新策略，避免非激活态下的无效请求
- **授权人切换**：`scheduleListForChange` 方法调用 `getCstMeetingList` API 获取指定授权人的会议列表，并清除日历缓存

### 2. CalendarViewer.vue - 日历视图主组件

`CalendarViewer.vue` 是日历模块的核心容器组件，管理日历数据状态、视图切换和历史会议拉取。

```javascript
// src/components/Calendar/CalendarViewer.vue
export default {
    name: 'CalendarViewer',
    props: {
        closeButton: { type: Boolean, default: true },
        scheduleList: { type: Array, default: () => [] },
        scheduleBy: { type: String, default: '' },          // 当前授权人
        authorizerList: { type: Array, default: () => [] },  // 授权人列表
        visible: { type: Boolean, required: true },
        scheduleListForChange: { type: Function, required: true },
        getSchedulerBy: { type: Function, required: true }
    },
    data() {
        return {
            scheduleHistoryList: [],           // 历史会议列表
            scheduleHistoryListCache: {},      // 按 meetingId 的缓存
            scheduleHistoryListObj: {},         // 按月份标记已加载
            calendarValue: new Date(),          // 当前选中日期
            rangeLabelValue: 'Month',           // 视图类型：Month/Week/Day
            dateLast7Days: [],                  // 周视图的7天列表
            visiblePopoverDateCard: false,      // 日程详情弹窗可见性
            eventData: {}                       // 当前选中的事件数据
        };
    }
};
```

#### 历史会议数据加载

组件通过 `getScheduleMeetingsHistory` SDK API 拉取指定时间范围的会议数据，并实现了基于月份的缓存机制：

```javascript
getHistorySchedule(startDay, endDay, toMonth, isInit = false) {
    // 避免重复加载同一月份
    if (this.scheduleHistoryListObj[toMonth]) return;

    getScheduleMeetingsHistory({
        startTime: startDay,
        endTime: endDay,
        enterpriseId: defaultSpaceId(),
        authorizer: this.$store.state.userInfo.scheduleBy
    }).then(({hwMeetingList, meetingList}) => {
        // 合并 CST 会议和华为云会议数据
        const calendarList = formatCstMeetingParams(meetingList)
            .concat(hwMeetingList?.data || []);

        // 增量合并到已有列表
        this.scheduleHistoryList = OldScheduleList.concat(calendarList);

        // 标记月份已加载，缓存会议ID
        this.scheduleHistoryListObj[toMonth] = true;
        calendarList.forEach(item => {
            this.scheduleHistoryListCache[item.meetingId] = item;
        });
    });
}
```

#### 周期会议展平

`flatAllMeetings` 方法将周期性会议（`conferenceType === '2'`）的子会议展平为独立条目：

```javascript
flatAllMeetings(list) {
    let arr = [];
    list.forEach(item => {
        if (item.conferenceType === '2' && item.subConfs?.length) {
            item.subConfs.forEach((sub, i) => {
                arr.push({
                    ...item,
                    startTime: item.isCrystalSdk ? sub.startTime : GmtToLocalTime(sub.startTime),
                    endTime: item.isCrystalSdk ? sub.endTime : GmtToLocalTime(sub.endTime),
                    cycleSubConfID: sub.cycleSubConfID,
                    isSubConf: true,
                    isFirst: i === 0
                });
            });
        } else {
            arr.push(item);
        }
    });
    return arr;
}
```

#### 视图模式持久化

视图模式（月/周/日）通过 electron-store 持久化存储，在组件创建时从主进程读取，切换时写入：

```javascript
// 创建时读取
created() {
    const userid = this.getUsersUid();
    this.onSetlistener = onlistener(this.setCalendarMode);
    onMainWindowSettings(this.onSetlistener);
    getMainWindowSettings(userid);
},
// 切换时保存
watch: {
    rangeLabelValue: {
        handler(value) {
            const userid = this.getUsersUid();
            setMainWindowSettings(userid, value);
        }
    }
}
```

### 3. CalendarHeader.vue - 头部控制栏

`CalendarHeader.vue` 提供日期导航、视图切换、授权人选择和创建会议等交互控件。

```javascript
// src/components/Calendar/CalendarHeader.vue
export default {
    name: 'CalendarHeader',
    data() {
        return {
            rangeLabelOptions: [
                { label: 'Day', className: 'icon_calendar_day' },
                { label: 'Week', className: 'icon_calendar_week' },
                { label: 'Month', className: 'icon_calendar_month' }
            ]
        };
    }
};
```

核心交互功能：

- **日期导航**：前/后翻页按钮（`prev-month`/`next-month`）、回到今天按钮
- **日期选择器**：周/日视图下可通过 `el-date-picker` 跳转到指定日期，picker 的 `cellClassName` 回调为有事件的日期和当前周添加高亮样式
- **授权人选择**：`el-select` 下拉框切换查看其他人的日程（委托/授权查看）
- **视图模式切换**：Day/Week/Month 三种模式的 `el-select` 下拉切换
- **创建会议**：右侧"创建日程"按钮触发 `fireCalendarSchedule` Firebase 统计事件

### 4. SyncCalendar.js - 日历同步

`SyncCalendar.js` 负责将会议信息同步到外部日历平台，支持三种同步目标。

```javascript
// src/components/Panel/SyncCalendar.js

// 支持的同步平台（SyncCalendarConstants.js）
export const CALENDAR_DEFAULT_CALENDAR = 'original';  // 系统默认日历
export const CALENDAR_OUTLOOK = 'outlook';             // Outlook
export const CALENDAR_GOOGLE_CALENDAR = 'google';      // Google Calendar
export const CALENDAR_NONE = 'null';                   // 不同步
```

`handleSyncCalendar` 函数根据用户选择的同步平台执行不同的同步策略：

| 同步平台 | 同步方式 | 删除操作 |
|---------|---------|---------|
| 系统默认日历 | 生成 ICS 文件并用 `shell.openExternal` 打开 | 忽略 |
| Outlook | 调用 `getSyncCalendarUrl` 获取 URL 后打开浏览器 | 忽略 |
| Google Calendar | 调用 `getSyncCalendarUrl` 获取 URL 后打开浏览器 | 支持 |

对于系统默认日历的同步，采用 ICS 标准格式：

```javascript
// ICS 事件参数构造
const newItem = {
    start: startTime,           // [2018, 5, 30, 6, 30]
    end: endTime,
    title: item.subject,
    description: `Join ${item.subject}\n\n${location}\n\nMeeting ID: ${meetingId}`,
    location: item.joinUrl,
    uid: meetingId,
    status: 'CONFIRMED',
    busyStatus: 'BUSY',
    alarms: [{ action: 'display', trigger: { minutes: 15, before: true } }]
};

// 周期会议规则生成
if (conferenceInfo.conferenceType === '2' && conferenceInfo.cycleParams) {
    newItem.recurrenceRule = getRecurrenceRule(conferenceInfo);
    // 输出格式示例: FREQ=WEEKLY;BYDAY=MO,WE,FR;INTERVAL=1;COUNT=10
}
```

### 5. settingsCalendar.js - 主进程设置

```javascript
// src/main/mainWindow/settingsCalendar.js
export function settingsGetCalendarMode({ userid } = {}) {
    const result = getStore('storage.calendarViewTypes');
    if (userid && result && typeof result === 'object') {
        return result[userid];
    }
    return result;
}

export function settingsSetCalendarMode({ userid, value } = {}) {
    let modeData = settingsGetCalendarMode();
    modeData = modeData && typeof modeData === 'object' ? modeData : {};
    modeData[userid] = value;
    setStore('storage.calendarViewTypes', modeData);
}
```

主进程通过 electron-store 以 `storage.calendarViewTypes` 为 key 存储每个用户的日历视图偏好，结构为 `{ [userid]: 'Month' | 'Week' | 'Day' }`。

## 数据流总结

```
CalendarPanel (面板入口)
  └── CalendarViewer (视图容器)
        ├── CalendarHeader (头部控制)
        │     ├── 日期导航 → onClickPick → CalendarViewerMonth/Week
        │     ├── 视图切换 → rangeLabelValue → electron-store 持久化
        │     └── 授权人切换 → scheduleListForChange → 重新拉取会议
        ├── CalendarViewerMonth (月视图) ─┐
        ├── CalendarViewerWeek (周/日视图) ─┤→ PopoverDateCard (日程详情弹窗)
        └── getHistorySchedule → getScheduleMeetingsHistory API
              → 按月缓存 → scheduleAllList → 各视图渲染

SyncCalendar (日历同步)
  ├── 系统默认日历 → ICS 文件生成 → shell.openExternal
  ├── Outlook → getSyncCalendarUrl → 浏览器打开
  └── Google Calendar → getSyncCalendarUrl → 浏览器打开
```
