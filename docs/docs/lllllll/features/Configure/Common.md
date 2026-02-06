# 全局配置

## constants.js

#### 🪟 会议信息窗口相关

| 常量名                       | 说明                               |
| ---------------------------- | ---------------------------------- |
| `MEETING_INFO_CREATE_WINDOW` | 创建/展开会议信息窗口              |
| `MEETING_INFO_CLOSE_WINDOW`  | 关闭会议信息窗口（包括隐藏或销毁） |
| `MEETING_INFO_HIDE_WINDOW`   | 隐藏会议信息窗口（非销毁）         |
| `MEETING_INFO_REFRESH_DATA`  | 通知渲染进程刷新会议数据           |
| `MEETING_INFO_SET_SIZE`      | 设置窗口尺寸                       |

这些常量大概率用于 Electron 主进程与渲染进程之间的 IPC 通信标识。

#### 📞 通话质量反馈相关

| 常量名                  | 说明                         |
| ----------------------- | ---------------------------- |
| `SET_CALL_FEEDBACK`     | 设置通话质量反馈状态         |
| `CALL_FEEDBACK_MEETING` | 表示会议场景下的反馈         |
| `CALL_FEEDBACK_1VS1`    | 表示 1 对 1 通话场景下的反馈 |

这些值通常会传给反馈模块或状态管理（如 Vuex）进行标识。

#### 💽 磁盘空间限制配置

| 常量名                | 值（字节）                      | 大约说明                                 |
| --------------------- | ------------------------------- | ---------------------------------------- |
| `defaultDiskSize`     | `1050 * 1024 * 1024` = \~1.05GB | 登录前检测用（如：缓存、日志）           |
| `downloadDiskSize`    | `2090 * 1024 * 1024` = \~2.09GB | 大文件下载（如会议录像）前的磁盘检测阈值 |
| `downloadMinDiskSize` | `50 * 1024 * 1024` = \~50MB     | 允许下载的最小磁盘空间                   |

```js
const MB = 1024 * 1024;
export const defaultDiskSize = 1050 * MB;
export const downloadMinDiskSize = 50 * MB;
```
