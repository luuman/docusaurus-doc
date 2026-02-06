# 数据处理工具

本文档介绍项目中用于数据处理、数据转换和数据验证的工具函数，涵盖 `dataUtil`、`dataDao`、`deepCopy`、`safeJson` 等模块。

---

## 目录

- [核心文件结构](#核心文件结构)
- [dataUtil - 综合数据工具](#datautil---综合数据工具)
- [dataDao - 数据存取转换](#datadao---数据存取转换)
- [deepCopy - 深拷贝](#deepcopy---深拷贝)
- [safeJson - 安全 JSON 处理](#safejson---安全-json-处理)

---

## 核心文件结构

```
src/utils/
├── dataUtil.js          # 综合数据工具（时间、验证、格式化、搜索排序等）
├── dataDao.js           # 数据持久化层转换（Peer/Message/Session 编解码）
├── deepCopy.js          # 递归深拷贝实现
└── safeJson.js          # 安全的 JSON 序列化与反序列化
```

---

## dataUtil - 综合数据工具

**文件**: `src/utils/dataUtil.js`

dataUtil 是项目中使用范围最广的数据处理模块，整合了时间格式化、账户验证、密码哈希、URL/Email 解析、搜索排序等多种功能。通过 `dataUtil` 对象统一导出。

### 导入方式

```javascript
import { dataUtil } from '@/utils/dataUtil';
// 或按需导入
import { formatDate, prettyTime, parsePassword } from '@/utils/dataUtil';
```

### 时间格式化函数

#### formatDate(time, format)

通用日期格式化函数，支持自定义格式字符串。

```javascript
import { formatDate } from '@/utils/dataUtil';

formatDate(Date.now(), 'yyyy/MM/dd hh:mm:ss');  // "2025/01/15 14:30:05"
formatDate(1705312200000, 'h:mm');                // "14:30"
formatDate(new Date(), 'd/M/yyyy');               // "15/1/2025"
```

**参数**:
- `time` (number | string | Date): 时间戳、时间戳字符串或 Date 对象
- `format` (string): 格式字符串，支持 `yyyy`/`yy`/`MM`/`M`/`dd`/`d`/`hh`/`h`/`mm`/`m`/`ss`/`s`

**返回**: `string` - 格式化后的时间字符串

#### prettyTime(sendTime, isNeedToday)

将时间戳格式化为友好的展示格式（今天、昨天、完整日期+时间）。

```javascript
import { prettyTime } from '@/utils/dataUtil';

prettyTime(Date.now());           // "Today 14:30"
prettyTime(yesterdayTimestamp);    // "Yesterday 10:20"
prettyTime(oldTimestamp);         // "15/1/2025 14:30"
```

**参数**:
- `sendTime` (number | string | Date): 时间
- `isNeedToday` (boolean): 是否显示 "Today" 前缀，默认 `true`

**返回**: `string` - 格式化后的友好时间

#### prettyShortTime(stime, currentDate)

简短格式的时间展示，用于会话列表等场景。当天显示时间，昨天显示 "Yesterday"，同年显示日/月，跨年显示日/月/年。

```javascript
prettyShortTime(Date.now());         // "14:30"
prettyShortTime(yesterdayTs);        // "Yesterday"
prettyShortTime(oldTs);             // "15/1" 或 "15/1/2024"
```

**参数**:
- `stime` (number): 时间戳
- `currentDate` (Date): 当前日期，默认 `new Date()`

**返回**: `string` - 简短时间字符串

#### formatMAndY(time)

格式化为"月份 年份"形式。

```javascript
formatMAndY(Date.now());  // "January 2025"
```

#### timeGap(startTime, today)

计算时间间距展示，适用于会议等场景。

```javascript
timeGap(meetingStartTimestamp);  // "Today, 15/1" 或 "15/1" 或 "15/1/2025"
```

#### formatDuring(mss)

将毫秒数转换为天、时、分、秒的文字描述。

```javascript
dataUtil.formatDuring(90061000);  // "1 Day 1 Hour 1 Minute 1 Second"
```

### 账户验证与密码处理

#### parsePassword(passStr, emailAddress)

对密码进行 SHA256 哈希处理，加盐值包含邮箱地址和固定 salt。

```javascript
import { parsePassword } from '@/utils/dataUtil';

const hashedPwd = parsePassword('mypassword', 'user@example.com');
// 返回 SHA256 hex 字符串
```

**参数**:
- `passStr` (string): 原始密码
- `emailAddress` (string): 邮箱地址（同时用于验证和加盐）

**返回**: `string` - SHA256 哈希后的 hex 字符串，或 `Error` 对象（邮箱无效时）

#### parsePhonePassword(passStr, phone)

手机号登录场景的密码哈希处理。

```javascript
const hashedPwd = parsePhonePassword('mypassword', '1234567890');
```

#### isEmailAccount(str)

检查字符串是否为合法邮箱地址。

```javascript
dataUtil.isEmailAccount('user@example.com');  // true
dataUtil.isEmailAccount('notanemail');         // false
```

#### isPhoneNumber(str)

检查字符串是否为手机号格式（3-11位纯数字）。

```javascript
dataUtil.isPhoneNumber('1234567890');  // true
```

#### batchAccountValidate(batchAccount)

批量账户格式验证，匹配 `字母前缀 + 数字后缀` 模式。

```javascript
batchAccountValidate('AB123456');  // true
batchAccountValidate('123');       // false
```

### URL 和 Email 解析

#### listUrl(str)

从文本中提取所有 URL 匹配项，返回位置和匹配字符串信息。

```javascript
import { listUrl } from '@/utils/dataUtil';

const urls = listUrl('Visit https://example.com for details');
// [{ start: 6, end: 25, string: 'https://example.com', isURL: true }]
```

**返回**: `Array<{start, end, string, isURL}>` - URL 匹配结果列表

#### listEmail(str)

从文本中提取所有 Email 匹配项。

```javascript
import { listEmail } from '@/utils/dataUtil';

const emails = listEmail('Contact user@example.com');
// [{ start: 8, end: 24, string: 'user@example.com', isEmail: true }]
```

### 文本消息格式化

#### textMessageFormat(plainMsg, translateMsg)

将消息文本解析为结构化片段列表，识别出 @提及、URL、Email 和普通文本，用于消息渲染。

```javascript
import { textMessageFormat } from '@/utils/dataUtil';

const segments = textMessageFormat(messageObj, '你好 @John 看看 https://example.com');
// 返回分段数组，每段含 isPlain / isAt / isURL / isEmail 标记
```

**参数**:
- `plainMsg` (Object): 原始消息对象，包含 `m.meta.ref` 等 @提及信息
- `translateMsg` (string): 需要格式化的文本内容

**返回**: `Array<{start, end, string, isPlain?, isAt?, isURL?, isEmail?, hid?}>` - 分段渲染信息

### 搜索排序

#### searchNameSort(searchValue, prev, next)

搜索结果排序函数，优先匹配完全相同、然后按匹配位置和名称长度排序。支持群成员搜索场景。

```javascript
const sortedList = results.sort((a, b) => searchNameSort('John', a, b));
```

**参数**:
- `searchValue` (string): 搜索关键词
- `prev` (Object): 比较项 A，需含 `name` 或 `firstName` + `lastName`
- `next` (Object): 比较项 B

**返回**: `number` - 排序比较值

### 其他工具函数

| 函数名 | 签名 | 说明 |
|--------|------|------|
| `renderDisplayName` | `(peer, type) => string` | 根据 Peer 对象返回显示名称，优先备注名 |
| `getUserName` | `(peer) => string` | 获取用户名（name 或 firstName + lastName） |
| `getUserInfo` | `() => Object` | 获取当前登录用户信息 |
| `getDialogIndex` | `(spaceId, message, isReceipt) => {oldIndex, newIndex}` | 获取对话在列表中的位置 |
| `renderWitdrawMsg` | `(msg, dialogHid) => Object` | 渲染撤回消息的显示文案 |
| `councilAccountFormate` | `(account) => string` | 邮箱账户格式化为小写 |
| `handleEmailHref` | `(email) => string` | 生成 mailto 链接 |
| `transferQueue` | `(queue, item) => Array` | 维护最近使用的 ID 队列（最大 10 项） |
| `arabicFormate` | `(timeNum) => string` | 阿拉伯语数字格式化 |

---

## dataDao - 数据存取转换

**文件**: `src/utils/dataDao.js`

dataDao 负责在内存对象与数据库存储格式之间进行转换，对 Peer、Message、Session 三种核心数据类型提供编码（encode）和解码（decode）方法。

### 导入方式

```javascript
import {
    encodePeerTransform,
    decodePeerTransform,
    encodeMessageTransform,
    decodeMessageTransform,
    encodeSessionTransform,
    decodeSessionTransform,
    encodeString,
    decodeString
} from '@/utils/dataDao';
```

### 核心函数

#### encodeString(value) / decodeString(value)

安全的 JSON 序列化与反序列化，用于数据库存取。

```javascript
encodeString({ key: 'value' });   // '{"key":"value"}'
encodeString('{"key":"value"}');  // '{"key":"value"}'（已是字符串则原样返回）

decodeString('{"key":"value"}');  // { key: 'value' }
decodeString({ key: 'value' });   // { key: 'value' }（已是对象则原样返回）
```

#### encodePeerTransform(data, spaceId)

将 Peer 对象编码为数据库存储格式。对 `detail`、`dialogInfo`、`groupInfo`、`e2eDeviceMap` 等嵌套对象字段执行 `JSON.stringify`。

**返回**: 编码后的扁平化 Peer 对象

#### decodePeerTransform(data)

将数据库中的 Peer 数据解码为内存对象格式。

#### encodeMessageTransform(data)

将 Message 对象编码为数据库存储格式。对 `m`、`meta`、`fileFragmentMap`、`content` 等字段执行 `JSON.stringify`。

#### decodeMessageTransform(data)

将数据库中的 Message 数据解码为内存对象格式。

#### encodeSessionTransform(data, spaceId)

将 Session 对象编码为数据库存储格式。

#### decodeSessionTransform(data)

将数据库中的 Session 数据解码为内存对象格式。

---

## deepCopy - 深拷贝

**文件**: `src/utils/deepCopy.js`

### deepCopy(obj, cache)

递归深拷贝实现，支持处理循环引用、RegExp、Date、Error 类型。

```javascript
import deepCopy from '@/utils/deepCopy';

const original = { a: 1, b: { c: [1, 2, 3] }, d: new Date() };
const copied = deepCopy(original);

copied.b.c.push(4);
console.log(original.b.c);  // [1, 2, 3]（原对象不受影响）
```

**参数**:
- `obj` (any): 待拷贝的对象
- `cache` (Array): 内部使用的循环引用缓存，默认 `[]`

**返回**: 深拷贝后的新对象

**特殊类型处理**:
- `null` / 原始类型: 直接返回
- `RegExp`: 使用 `new RegExp(obj)` 拷贝
- `Date`: 使用 `new Date(obj)` 拷贝
- `Error`: 使用 `new Error(obj)` 拷贝
- 循环引用: 通过 cache 数组检测并返回已拷贝的对象引用

---

## safeJson - 安全 JSON 处理

**文件**: `src/utils/safeJson.js`

在主进程中使用的安全 JSON 工具，采用 CommonJS 模块规范。

### safeParse(item)

安全的 JSON 解析，不会抛出异常。

```javascript
const { safeParse } = require('@/utils/safeJson');

safeParse('{"key":"value"}');    // { key: 'value' }
safeParse('[1, 2, 3]');          // [1, 2, 3]
safeParse('plain string');        // 'plain string'（非 JSON 直接返回原值）
safeParse(123);                   // 123（非字符串直接返回原值）
safeParse('{invalid json}');      // '[object String]'（解析失败返回类型描述）
```

**参数**:
- `item` (any): 待解析的值

**返回**: 解析后的对象，或原始值

### safeStringify(item)

安全的 JSON 序列化，不会抛出异常。

```javascript
const { safeStringify } = require('@/utils/safeJson');

safeStringify({ key: 'value' });  // '{\n    "key": "value"\n}'（格式化输出）
safeStringify('hello');            // 'hello'
safeStringify(123);                // '123'
safeStringify(null);               // 'null'
```

**参数**:
- `item` (any): 待序列化的值

**返回**: `string` - 序列化后的字符串

---

## 使用建议

1. **深拷贝性能**: `deepCopy` 对大对象的性能不如 `structuredClone`（需 Node.js 17+），但兼容当前 Electron 20 环境。对于简单对象可考虑 `JSON.parse(JSON.stringify(obj))`。
2. **数据转换配对使用**: `encodePeerTransform` / `decodePeerTransform` 等编解码函数应成对使用，数据入库时 encode，读取时 decode。
3. **safeJson 适用场景**: 主要在主进程日志、配置读取等不确定数据格式的场景使用，渲染进程建议使用 `dataDao` 的 `encodeString` / `decodeString`。
