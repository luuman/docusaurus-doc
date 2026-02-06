# 格式化工具

本文档介绍项目中用于时间格式化、字符串格式化、时区处理、时间戳修复和文件大小格式化的工具函数。

---

## 目录

- [核心文件结构](#核心文件结构)
- [timeFormat - 时间格式化](#timeformat---时间格式化)
- [stringFormat - 字符串格式化](#stringformat---字符串格式化)
- [prettyBytes - 文件大小格式化](#prettybytes---文件大小格式化)
- [TimeZone - 时区处理](#timezone---时区处理)
- [timestampFix - 时间戳修复](#timestampfix---时间戳修复)

---

## 核心文件结构

```
src/utils/
├── format/
│   ├── timeFormat.js      # 通话/语音时长格式化
│   ├── stringFormat.js    # 字符串截断与长度计算
│   └── prettyBytes.js     # 文件大小国际化格式化
├── TimeZone.js            # 时区偏移量计算与时区日期转换
└── timestampFix.js        # 基于系统 Tick 的时间戳纠偏机制
```

---

## timeFormat - 时间格式化

**文件**: `src/utils/format/timeFormat.js`

### durationTimeFormat(duration, isMs)

将秒数（或毫秒数）格式化为 `HH:MM:SS` 或 `MM:SS` 格式的时长字符串。常用于通话时长、语音消息时长等场景的展示。

```javascript
import { durationTimeFormat } from '@/utils/format/timeFormat';

// 秒数输入
durationTimeFormat(65);             // "01:05"
durationTimeFormat(3661);           // "01:01:01"
durationTimeFormat(30);             // "00:30"

// 毫秒数输入
durationTimeFormat(65000, true);    // "01:05"
durationTimeFormat(3661000, true);  // "01:01:01"

// 异常输入
durationTimeFormat(null);           // ""
durationTimeFormat(undefined);      // ""
durationTimeFormat(NaN);            // ""
```

**参数**:
- `duration` (number): 时长数值
- `isMs` (boolean): 是否为毫秒单位。为 `true` 时会先除以 1000 转换为秒

**返回**: `string` - 格式化后的时长字符串
- 小于 1 小时: `MM:SS` 格式（如 `05:30`）
- 大于等于 1 小时: `HH:MM:SS` 格式（如 `01:05:30`）
- 无效输入: 返回空字符串 `""`

**使用场景**:
- 通话记录中的通话时长展示
- 语音消息的播放时长
- 会议持续时间
- 视频消息时长

---

## stringFormat - 字符串格式化

**文件**: `src/utils/format/stringFormat.js`

### notifyStringSub(str, len)

将字符串截断到指定显示宽度，考虑中文等双字节字符占两个显示位。超过长度时添加省略号。

```javascript
import { notifyStringSub } from '@/utils/format/stringFormat';

notifyStringSub('Hello World', 20);          // "Hello World"（未超过长度）
notifyStringSub('Hello World Long Text', 10); // "Hello W..."
notifyStringSub('你好世界测试字符串', 8);       // "你好世..."（中文占2位）
notifyStringSub('Hello你好', 8);              // "Hello..."
```

**参数**:
- `str` (string): 原始字符串
- `len` (number): 最大显示宽度（英文字符算 1 位，中文字符算 2 位）

**返回**: `string` - 截断后的字符串，超长时末尾带 `...`

**使用场景**:
- 系统通知消息的标题截断
- 消息列表中的预览文本
- 标签页标题文本限制

### getStringLength(str)

计算字符串的显示宽度，英文和数字占 1 位，中文和其他宽字符占 2 位。

```javascript
import { getStringLength } from '@/utils/format/stringFormat';

getStringLength('Hello');       // 5
getStringLength('你好');         // 4
getStringLength('Hello你好');    // 9
getStringLength('');            // 0
getStringLength(null);          // 0
getStringLength(undefined);     // 0
```

**参数**:
- `str` (string): 待计算的字符串

**返回**: `number` - 字符串的显示宽度

**判断逻辑**: 字符编码 > 255 的字符（中文、日文、韩文等）按 2 位计算，其余按 1 位计算。

---

## prettyBytes - 文件大小格式化

**文件**: `src/utils/format/prettyBytes.js`

### fileBytes(fileSize, options)

将文件字节大小转换为人类可读的格式化字符串，支持国际化翻译。

```javascript
import { fileBytes } from '@/utils/format/prettyBytes';

fileBytes(1024);                    // "1 KB"
fileBytes(1048576);                 // "1 MB"
fileBytes(1073741824);              // "1 GB"
fileBytes(500);                     // "500 B"

// 自定义选项
fileBytes(1536, { maximumFractionDigits: 2, binary: true });  // "1.50 KB"
fileBytes(1536, { maximumFractionDigits: 0, binary: false }); // "2 kB"

// 异常输入
fileBytes(null);                    // null（原样返回）
fileBytes('abc');                   // 'abc'（原样返回）
```

**参数**:
- `fileSize` (number): 文件字节数
- `options` (Object): 格式化选项
  - `maximumFractionDigits` (number): 小数位数，默认 `1`
  - `binary` (boolean): 是否使用二进制单位（KiB/MiB 简写为 KB/MB），默认 `true`

**返回**: `string | any` - 格式化后的文件大小字符串（带国际化单位），非数字输入原样返回

**国际化处理**: 单位文本通过 `i18n.t('formatSize.KB')` 等键值进行翻译，支持多语言。使用 `binary: true` 时，会将 `pretty-bytes` 库输出中的 `i` 后缀移除（如 `KiB` -> `KB`）。

---

## TimeZone - 时区处理

**文件**: `src/utils/TimeZone.js`

用于处理华为会议等场景中的时区转换，将服务端返回的时区 ID 转换为标准时区偏移量。

### getOffsetZoneByTimeZoneID(hwTimezone, timeZoneID)

根据华为时区 ID 获取 UTC 偏移量字符串。

```javascript
import { getOffsetZoneByTimeZoneID } from '@/utils/TimeZone';

// hwTimezone 对象示例
const hwTimezone = {
    '(GMT + 08: 00) Beijing': '56',
    '(GMT + 00: 00) London': '1',
    '(GMT - 05: 00) New York': '12'
};

getOffsetZoneByTimeZoneID(hwTimezone, '56');   // "+0800"
getOffsetZoneByTimeZoneID(hwTimezone, '1');    // "+0000"
getOffsetZoneByTimeZoneID(hwTimezone, '12');   // "-0500"
getOffsetZoneByTimeZoneID(hwTimezone, '999');  // null（未找到）
```

**参数**:
- `hwTimezone` (Object): 华为时区映射表，key 为时区标签（如 `"(GMT + 08: 00) Beijing"`），value 为时区 ID
- `timeZoneID` (string): 需要查询的时区 ID

**返回**: `string | null` - UTC 偏移量字符串（如 `"+0800"`、`"-0500"`），未找到返回 `null`

### getDateByTimeZoneIdAndDateString(hwTimezone, timeZoneID, dateTimeString)

将指定时区的日期时间字符串转换为当前时区的 Date 对象。

```javascript
import { getDateByTimeZoneIdAndDateString } from '@/utils/TimeZone';

const hwTimezone = {
    '(GMT + 08: 00) Beijing': '56'
};

// 将北京时间 "2025-01-15 14:30:00" 转换为本地 Date 对象
const date = getDateByTimeZoneIdAndDateString(
    hwTimezone,
    '56',
    '2025-01-15 14:30:00'
);
// 返回的 Date 对象表示当前时区对应的时间
```

**参数**:
- `hwTimezone` (Object): 华为时区映射表
- `timeZoneID` (string): 时区 ID
- `dateTimeString` (string): 日期时间字符串，格式 `YYYY-MM-DD HH:mm:ss`

**返回**: `Date` - 转换后的 Date 对象

**注意**: 如果时区 ID 未找到，会打印警告日志并使用空字符串作为偏移量，这可能导致时间不准确。

---

## timestampFix - 时间戳修复

**文件**: `src/utils/timestampFix.js`

解决用户在应用运行期间手动修改系统时间导致 `Date.now()` 不准确的问题。通过记录服务器时间基准和 Windows 内核 TickCount（系统启动后经过的毫秒数）来推算真实时间。

### timestampFix(stime)

初始化时间修复基准。在登录成功后调用，传入服务器时间戳。

```javascript
import { timestampFix } from '@/utils/timestampFix';

// 登录成功后，用服务器返回的时间初始化
timestampFix(serverTimestamp);
```

**参数**:
- `stime` (number): 服务器时间戳（毫秒），默认使用 `Date.now()`

**副作用**:
- 记录服务器时间基准 `getStime`
- 记录当前 TickCount `t1`
- 启用时间修复模式
- 同步时间到 SDK 层

### getTimestamp()

获取修正后的当前时间戳。如果时间修复已启用，通过 TickCount 差值推算真实时间。

```javascript
import { getTimestamp } from '@/utils/timestampFix';

const now = getTimestamp();
// 返回修正后的毫秒时间戳
```

**返回**: `number` - 当前时间戳（毫秒）

**工作原理**:
```
如果修复模式启用:
    serverTime = getStime + (当前TickCount - 初始TickCount)
如果修复模式未启用:
    serverTime = Date.now()
```

### 内部函数: getTickTime()

通过 FFI 调用 Windows `kernel32.dll` 的 `GetTickCount64` 函数获取系统运行时间。

**依赖**: `ffi-napi` 模块用于调用 Windows 原生 API

**容错**: 如果 DLL 加载失败，会返回上一次的有效值，并在日志中记录错误。

### 典型使用场景

```
1. 用户登录 -> 服务器返回当前时间
2. timestampFix(serverTime) 初始化基准
3. 用户手动将系统时间改为 2 小时前
4. Date.now() 返回错误的时间
5. getTimestamp() 仍然返回正确的时间（基于 TickCount 推算）
6. 消息发送/接收时间戳保持准确
```

### 在项目中的使用

```javascript
import { getTimestamp } from '@/utils/timestampFix';

// 发送消息时使用修正时间
msg.m.stime = getTimestamp();

// 判断时间间隔
if (getTimestamp() - lastActionTime > 5 * 60 * 1000) {
    // 超过 5 分钟
}

// 检查空间过期
if (currentSpace.expiration <= getTimestamp()) {
    throw new PlainException('空间已过期');
}
```

---

## dataUtil 中的格式化函数

`dataUtil.js` 中也包含大量时间格式化函数，详见 [数据处理工具](./data-utils.md#时间格式化函数)。主要包括:

| 函数名 | 签名 | 说明 |
|--------|------|------|
| `formatDate` | `(time, format) => string` | 通用日期格式化 |
| `prettyTime` | `(sendTime, isNeedToday) => string` | 友好时间（今天/昨天/完整日期） |
| `prettyShortTime` | `(stime, currentDate) => string` | 简短时间（会话列表用） |
| `prettyDialogTime` | `(sendTime, isNeedToday) => string` | 对话时间格式化 |
| `prettySearchTime` | `(sendTime, isNeedToday) => string` | 搜索结果时间格式化 |
| `formatMAndY` | `(time) => string` | 月份+年份格式 |
| `timeGap` | `(startTime, today) => string` | 时间间距展示 |
| `formatDuring` | `(mss) => string` | 毫秒转天时分秒 |
| `arabicFormate` | `(timeNum) => string` | 阿拉伯语数字转换 |

---

## 格式化工具选择指南

| 场景 | 推荐工具 | 文件 |
|------|----------|------|
| 通话/语音时长展示 | `durationTimeFormat` | `format/timeFormat.js` |
| 消息时间展示 | `prettyTime` / `prettyShortTime` | `dataUtil.js` |
| 通知文本截断 | `notifyStringSub` | `format/stringFormat.js` |
| 文件大小展示 | `fileBytes` | `format/prettyBytes.js` |
| 会议时区转换 | `getDateByTimeZoneIdAndDateString` | `TimeZone.js` |
| 防篡改时间戳 | `getTimestamp` | `timestampFix.js` |
| 自定义日期格式 | `formatDate` | `dataUtil.js` |
