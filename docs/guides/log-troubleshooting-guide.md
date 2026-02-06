# 日志排查手册

> 本手册帮助你快速定位和解决 Matrx Windows 应用的问题。

---

## 目录

1. [日志文件位置](#1-日志文件位置)
2. [日志文件清单](#2-日志文件清单)
3. [问题排查流程](#3-问题排查流程)
4. [首先看什么](#4-首先看什么)
5. [按症状定位日志](#5-按症状定位日志)
6. [日志格式解读](#6-日志格式解读)
7. [常见错误分析](#7-常见错误分析)
8. [日志解密方法](#8-日志解密方法)
9. [高级排查技巧](#9-高级排查技巧)
10. [日志收集与上报](#10-日志收集与上报)

---

## 1. 日志文件位置

### Windows 日志目录

```
C:\Users\{用户名}\AppData\Roaming\Matrx\logs\
```

### 快速打开日志目录

**方法一：通过应用**
- 应用内 → 设置 → 关于 → 打开日志目录

**方法二：通过命令**
```cmd
# 在运行(Win+R)中输入
%APPDATA%\Matrx\logs
```

**方法三：通过代码**
```javascript
const { app } = require('electron');
const logPath = app.getPath('userData') + '/logs';
console.log(logPath);
```

### 日志目录结构

```
logs/
├── main.log                    # 📌 主日志（最重要）
├── main.log.1                  # 主日志备份1
├── main.log.2                  # 主日志备份2
├── msgAllLog.log               # 📌 消息总日志
├── cst-meeting-sdk.log         # 📌 会议SDK日志
├── e2ee.log                    # E2EE加密日志
├── ack.log                     # 消息确认日志
├── offlineMsg.log              # 离线消息日志
├── screenshot.log              # 截屏日志
├── fileViewer.log              # 文件查看器日志
├── pictureViewer.log           # 图片查看器日志
├── callfeedbackLog.log         # 通话反馈日志
├── delete-account.log          # 账号删除日志
├── storage-data.log            # 存储数据日志
├── session-dev.log             # 会话开发日志
├── avr-risk.log                # 安全风险日志
├── Matrx-usage.log             # 内存使用日志
└── CST_Meeting/
    └── agent/
        └── cst-meeting-agent.log  # 会议代理日志
```

---

## 2. 日志文件清单

### 🔴 核心日志（必看）

| 日志文件 | 大小限制 | 内容 | 重要性 |
|---------|---------|------|--------|
| `main.log` | 6MB | 主进程所有日志 | ⭐⭐⭐⭐⭐ |
| `msgAllLog.log` | 8MB (5备份) | 所有消息日志汇总 | ⭐⭐⭐⭐⭐ |
| `cst-meeting-sdk.log` | 6MB | 会议SDK日志 | ⭐⭐⭐⭐ |

### 🟡 功能日志

| 日志文件 | 内容 | 何时查看 |
|---------|------|---------|
| `e2ee.log` | 端到端加密 | 加密消息失败 |
| `ack.log` | 消息确认 | 消息发送未送达 |
| `offlineMsg.log` | 离线消息 | 离线消息同步问题 |
| `screenshot.log` | 截屏功能 | 截屏功能异常 |
| `fileViewer.log` | 文件查看 | 文件打开失败 |
| `pictureViewer.log` | 图片查看 | 图片显示异常 |

### 🟢 辅助日志

| 日志文件 | 内容 | 何时查看 |
|---------|------|---------|
| `storage-data.log` | 本地存储 | 数据丢失/损坏 |
| `session-dev.log` | 会话调试 | 会话列表异常 |
| `avr-risk.log` | 安全检测 | 安全相关问题 |
| `Matrx-usage.log` | 内存使用 | 内存泄漏排查 |

---

## 3. 问题排查流程

### 标准排查流程图

```
┌─────────────────────────────────────────────────────────────────┐
│                     问题发生                                     │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│ 步骤1: 确定问题类型                                              │
│   └── 应用崩溃? 功能异常? 消息问题? 会议问题?                     │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│ 步骤2: 记录问题发生时间                                          │
│   └── 精确到秒: 2025-02-05 14:30:45                             │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│ 步骤3: 打开对应日志文件                                          │
│   └── 参考"按症状定位日志"章节                                   │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│ 步骤4: 搜索时间戳或ERROR关键字                                   │
│   └── Ctrl+F 搜索 "14:30:45" 或 "(ERROR)"                       │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│ 步骤5: 分析错误上下文                                            │
│   └── 查看错误前后10-20行，理解完整流程                          │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│ 步骤6: 跨日志关联分析                                            │
│   └── 用相同时间戳在其他日志中查找                               │
└─────────────────────────────────────────────────────────────────┘
```

### 快速定位命令

```bash
# 查找最近的错误
grep -n "(ERROR)" main.log | tail -20

# 查找特定时间的日志
grep "14:30:" main.log

# 查找包含特定关键字的错误
grep -n "timeout\|failed\|error" main.log | tail -50

# 统计错误数量
grep -c "(ERROR)" main.log
```

---

## 4. 首先看什么

### 🎯 黄金法则：先看 main.log

无论什么问题，**第一步永远是查看 `main.log`**。

```bash
# 查看最新的50行日志
tail -50 main.log

# 查看最近的错误
grep "(ERROR)" main.log | tail -10
```

### 按问题类型的首选日志

| 问题类型 | 首先看 | 然后看 | 最后看 |
|---------|--------|--------|--------|
| **应用崩溃** | `main.log` | 崩溃前的时间段 | - |
| **消息发送失败** | `main.log` | `msgAllLog.log` | `ack.log` |
| **消息接收异常** | `msgAllLog.log` | `offlineMsg.log` | `main.log` |
| **会议无法加入** | `cst-meeting-sdk.log` | `main.log` | - |
| **会议音视频问题** | `cst-meeting-sdk.log` | `cst-meeting-agent.log` | - |
| **加密失败** | `e2ee.log` | `main.log` | - |
| **截屏不工作** | `screenshot.log` | `main.log` | - |
| **文件打不开** | `fileViewer.log` | `main.log` | - |
| **登录失败** | `main.log` | - | - |
| **界面卡顿** | `Matrx-usage.log` | `main.log` | - |

### 快速诊断检查清单

```
□ 打开 main.log，搜索 "(ERROR)"
□ 记录最近的错误信息
□ 查看错误发生的时间
□ 查看错误前的操作日志
□ 如果涉及特定功能，查看对应的日志文件
□ 整理错误信息用于上报
```

---

## 5. 按症状定位日志

### 症状 → 日志映射表

#### 🔴 登录/认证问题

| 症状 | 日志文件 | 搜索关键字 |
|------|---------|-----------|
| 登录失败 | `main.log` | `login`, `auth`, `token` |
| Token 过期 | `main.log` | `token expired`, `401` |
| SSO 失败 | `main.log` | `sso`, `oauth` |
| 2FA 验证失败 | `main.log` | `2fa`, `verify` |

#### 🔴 消息问题

| 症状 | 日志文件 | 搜索关键字 |
|------|---------|-----------|
| 消息发送失败 | `msgAllLog.log` | `send failed`, `timeout` |
| 消息未送达 | `ack.log` | `ack`, `receipt` |
| 历史消息加载失败 | `offlineMsg.log` | `history`, `fetch` |
| 消息乱序 | `msgAllLog.log` | `sequence`, `order` |
| 消息重复 | `msgAllLog.log` | `duplicate`, `uuid` |

#### 🔴 会议问题

| 症状 | 日志文件 | 搜索关键字 |
|------|---------|-----------|
| 无法创建会议 | `cst-meeting-sdk.log` | `create`, `failed` |
| 无法加入会议 | `cst-meeting-sdk.log` | `join`, `connect` |
| 音频不工作 | `cst-meeting-sdk.log` | `audio`, `microphone` |
| 视频黑屏 | `cst-meeting-sdk.log` | `video`, `camera` |
| 屏幕共享失败 | `cst-meeting-sdk.log` | `share`, `screen` |
| 会议断线 | `cst-meeting-sdk.log` | `disconnect`, `reconnect` |

#### 🔴 文件问题

| 症状 | 日志文件 | 搜索关键字 |
|------|---------|-----------|
| 文件上传失败 | `main.log` | `upload`, `file` |
| 文件下载失败 | `main.log` | `download`, `file` |
| 文件打开失败 | `fileViewer.log` | `open`, `read` |
| 图片显示异常 | `pictureViewer.log` | `image`, `render` |

#### 🔴 系统问题

| 症状 | 日志文件 | 搜索关键字 |
|------|---------|-----------|
| 应用崩溃 | `main.log` | `crash`, `exception`, `fatal` |
| 内存占用高 | `Matrx-usage.log` | `memory`, `heap` |
| 启动慢 | `main.log` | `init`, `start`, `load` |
| 界面卡顿 | `main.log` | `freeze`, `hang`, `timeout` |

---

## 6. 日志格式解读

### 标准日志格式

```
[2025-02-05 14:30:45.123] (INFO)=> 用户登录成功 [loginApi.js:45]
 │          │             │    │        │              │
 │          │             │    │        │              └── 源文件:行号
 │          │             │    │        └── 日志消息
 │          │             │    └── 分隔符
 │          │             └── 日志级别
 │          └── 时间 (时:分:秒.毫秒)
 └── 日期
```

### 日志级别含义

| 级别 | 标记 | 含义 | 需要关注 |
|------|------|------|---------|
| TRACE | `(TRACE)` | 最详细的追踪信息 | 🔍 调试时 |
| DEBUG | `(DEBUG)` | 调试信息 | 🔍 调试时 |
| INFO | `(INFO)` | 正常操作信息 | ✅ 了解流程 |
| WARN | `(WARN)` | 警告，潜在问题 | ⚠️ 需要注意 |
| ERROR | `(ERROR)` | 错误，功能异常 | ❌ **必须关注** |
| FATAL | `(FATAL)` | 致命错误，系统崩溃 | 🔥 **紧急处理** |

### 快速筛选不同级别

```bash
# 只看错误
grep "(ERROR)" main.log

# 只看警告和错误
grep -E "\(WARN\)|\(ERROR\)" main.log

# 只看致命错误
grep "(FATAL)" main.log

# 排除调试信息
grep -v "(DEBUG)" main.log
```

### 示例日志解读

**正常登录日志**:
```
[2025-02-05 14:30:45.100] (INFO)=> 开始登录流程 [loginApi.js:20]
[2025-02-05 14:30:45.200] (INFO)=> 发送登录请求 [loginApi.js:35]
[2025-02-05 14:30:45.800] (INFO)=> 收到登录响应 [loginApi.js:50]
[2025-02-05 14:30:45.850] (INFO)=> 登录成功, userId: xxx [loginApi.js:60]
```

**登录失败日志**:
```
[2025-02-05 14:30:45.100] (INFO)=> 开始登录流程 [loginApi.js:20]
[2025-02-05 14:30:45.200] (INFO)=> 发送登录请求 [loginApi.js:35]
[2025-02-05 14:30:50.200] (ERROR)=> 登录请求超时 [loginApi.js:45]
[2025-02-05 14:30:50.210] (ERROR)=> Error: Network timeout after 5000ms [loginApi.js:46]
```

---

## 7. 常见错误分析

### 7.1 网络相关错误

#### `Network timeout`
```
[时间] (ERROR)=> Network timeout after 5000ms
```
**原因**: 网络请求超时
**排查**:
1. 检查网络连接
2. 检查服务器状态
3. 查看是否有防火墙拦截

#### `Connection refused`
```
[时间] (ERROR)=> connect ECONNREFUSED 127.0.0.1:8080
```
**原因**: 连接被拒绝，目标服务未启动
**排查**:
1. 检查目标服务是否运行
2. 检查端口是否正确
3. 检查是否有端口占用

#### `Socket hang up`
```
[时间] (ERROR)=> socket hang up
```
**原因**: 连接被服务器意外关闭
**排查**:
1. 检查服务器日志
2. 检查是否超过连接限制
3. 检查是否有负载均衡超时

### 7.2 认证相关错误

#### `Token expired`
```
[时间] (ERROR)=> Token expired, please re-login
```
**原因**: 登录令牌已过期
**解决**: 重新登录

#### `401 Unauthorized`
```
[时间] (ERROR)=> Request failed with status code 401
```
**原因**: 未授权访问
**排查**:
1. 检查是否已登录
2. 检查 Token 是否有效
3. 检查权限配置

### 7.3 数据库相关错误

#### `SQLITE_BUSY`
```
[时间] (ERROR)=> SQLITE_BUSY: database is locked
```
**原因**: 数据库被锁定
**排查**:
1. 检查是否有多进程同时写入
2. 重启应用释放锁

#### `SQLITE_CORRUPT`
```
[时间] (ERROR)=> SQLITE_CORRUPT: database disk image is malformed
```
**原因**: 数据库文件损坏
**解决**:
1. 备份现有数据
2. 清除数据重新同步

### 7.4 SDK 相关错误

#### `SDK not initialized`
```
[时间] (ERROR)=> SDK not initialized, please call init first
```
**原因**: SDK 未初始化就调用方法
**排查**: 检查初始化流程

#### `Meeting join failed`
```
[时间] (ERROR)=> Failed to join meeting: invalid meeting id
```
**原因**: 会议 ID 无效
**排查**:
1. 检查会议 ID 格式
2. 检查会议是否存在
3. 检查会议是否已结束

### 7.5 IPC 相关错误

#### `IPC channel not found`
```
[时间] (ERROR)=> No handler registered for 'channelName'
```
**原因**: IPC 通道未注册
**排查**: 检查主进程是否注册了对应的 handler

#### `IPC timeout`
```
[时间] (ERROR)=> IPC invoke timeout after 10000ms
```
**原因**: IPC 调用超时
**排查**:
1. 检查主进程是否响应
2. 检查处理逻辑是否阻塞

---

## 8. 日志解密方法

### 识别加密日志

生产环境的日志消息部分会被加密，格式如下：

```
[2025-02-05 14:30:45.123] (ERROR)=> |+|SGVsbG8gV29ybGQ= [file.js:10]
                                    │
                                    └── |+| 标记表示后面是加密内容
```

### 解密步骤

**方法一：使用解密脚本**

```javascript
// decrypt-log.js
const crypto = require('crypto');

function decryptLog(encryptedText, password = 'empty') {
  // 移除 |+| 前缀
  const text = encryptedText.replace('|+|', '');

  // 反转字符串
  const reversed = text.split('').reverse().join('');

  // Base64 解码
  const buffer = Buffer.from(reversed, 'base64');

  // 生成密钥
  const hash = crypto.createHash('sha256');
  hash.update(password);
  const key = hash.digest().slice(0, 16);

  // AES-CTR 解密
  const decipher = crypto.createDecipheriv('aes-128-ctr', key, Buffer.alloc(16, 0));
  const decrypted = Buffer.concat([decipher.update(buffer), decipher.final()]);

  return decrypted.toString('utf8');
}

// 使用
const encrypted = '|+|SGVsbG8gV29ybGQ=';
console.log(decryptLog(encrypted));
```

**方法二：使用开发环境**

开发环境的日志不加密，可以直接查看：
```bash
# 启动开发模式
npm run dev
# 日志将以明文输出
```

### 批量解密日志

```javascript
// batch-decrypt.js
const fs = require('fs');
const readline = require('readline');

async function decryptLogFile(inputPath, outputPath) {
  const input = fs.createReadStream(inputPath);
  const output = fs.createWriteStream(outputPath);

  const rl = readline.createInterface({ input });

  for await (const line of rl) {
    if (line.includes('|+|')) {
      const decrypted = decryptLogLine(line);
      output.write(decrypted + '\n');
    } else {
      output.write(line + '\n');
    }
  }

  output.end();
}

decryptLogFile('main.log', 'main-decrypted.log');
```

---

## 9. 高级排查技巧

### 9.1 跨日志关联分析

当问题涉及多个模块时，需要关联多个日志：

```bash
# 提取特定时间段的日志
grep "14:30:4" main.log > main_14_30.log
grep "14:30:4" msgAllLog.log > msg_14_30.log
grep "14:30:4" cst-meeting-sdk.log > meeting_14_30.log

# 合并并按时间排序
cat main_14_30.log msg_14_30.log meeting_14_30.log | sort > combined.log
```

### 9.2 实时监控日志

```bash
# 实时查看主日志
tail -f main.log

# 实时查看并高亮错误
tail -f main.log | grep --color=always -E "ERROR|WARN|$"

# 同时监控多个日志
tail -f main.log msgAllLog.log cst-meeting-sdk.log
```

### 9.3 日志统计分析

```bash
# 统计各级别日志数量
echo "TRACE: $(grep -c '(TRACE)' main.log)"
echo "DEBUG: $(grep -c '(DEBUG)' main.log)"
echo "INFO: $(grep -c '(INFO)' main.log)"
echo "WARN: $(grep -c '(WARN)' main.log)"
echo "ERROR: $(grep -c '(ERROR)' main.log)"
echo "FATAL: $(grep -c '(FATAL)' main.log)"

# 统计错误类型分布
grep "(ERROR)" main.log | sed 's/.*=> //' | sed 's/ \[.*//' | sort | uniq -c | sort -rn | head -20
```

### 9.4 性能问题排查

查看 `Matrx-usage.log` 分析内存使用：

```bash
# 查看内存使用趋势
grep "heapUsed" Matrx-usage.log | tail -100

# 查找内存峰值
grep "heapUsed" Matrx-usage.log | sort -t':' -k2 -rn | head -10
```

### 9.5 使用调用栈定位

当 `enableCallStack: true` 时，错误日志会包含调用栈：

```
[时间] (ERROR)=> Error message
    at functionA (file1.js:10)
    at functionB (file2.js:20)
    at functionC (file3.js:30)
```

从下往上阅读调用栈，找到错误的根源。

---

## 10. 日志收集与上报

### 收集日志的步骤

1. **打开日志目录**
   ```
   %APPDATA%\Matrx\logs
   ```

2. **收集核心日志文件**
   - `main.log`
   - `msgAllLog.log`（如果是消息问题）
   - `cst-meeting-sdk.log`（如果是会议问题）
   - 相关功能的日志文件

3. **记录问题信息**
   - 问题发生时间
   - 问题描述
   - 复现步骤
   - 应用版本

4. **压缩打包**
   ```bash
   # 打包日志目录
   tar -czvf matrx-logs-$(date +%Y%m%d).tar.gz logs/
   ```

### 上报模板

```markdown
## 问题描述
[简要描述问题现象]

## 发生时间
[精确到秒: 2025-02-05 14:30:45]

## 复现步骤
1.
2.
3.

## 应用版本
[版本号]

## 系统环境
- 操作系统: Windows 10/11
- 内存: 8GB/16GB
- 网络: 公司内网/家庭网络

## 日志附件
[附上相关日志文件]

## 相关错误日志
```
[粘贴关键错误日志]
```
```

### 敏感信息脱敏

上报日志前，注意移除敏感信息：

```bash
# 移除 Token
sed -i 's/token=[^&]*/token=****/g' main.log

# 移除密码
sed -i 's/password=[^&]*/password=****/g' main.log

# 移除邮箱
sed -i 's/[a-zA-Z0-9._%+-]*@[a-zA-Z0-9.-]*\.[a-zA-Z]*/****@****.com/g' main.log
```

---

## 附录：快速参考卡片

### 常用 grep 命令

```bash
grep "(ERROR)" main.log              # 查找所有错误
grep -n "(ERROR)" main.log           # 显示行号
grep -c "(ERROR)" main.log           # 统计错误数量
grep -A 5 "(ERROR)" main.log         # 显示错误后5行
grep -B 5 "(ERROR)" main.log         # 显示错误前5行
grep -C 5 "(ERROR)" main.log         # 显示错误前后5行
grep "14:30:" main.log               # 查找特定时间
grep -i "timeout" main.log           # 忽略大小写
grep -E "error|failed" main.log      # 正则匹配多个词
```

### 日志文件速查表

| 问题 | 首选日志 | 关键字 |
|------|---------|--------|
| 崩溃 | main.log | crash, fatal, exception |
| 登录 | main.log | login, auth, token |
| 消息 | msgAllLog.log | send, receive, message |
| 会议 | cst-meeting-sdk.log | meeting, join, call |
| 加密 | e2ee.log | encrypt, decrypt, key |
| 文件 | fileViewer.log | file, open, read |
| 截屏 | screenshot.log | screenshot, capture |
| 性能 | Matrx-usage.log | memory, heap |

---

**手册版本**: 1.0
**更新日期**: 2026-02-05
