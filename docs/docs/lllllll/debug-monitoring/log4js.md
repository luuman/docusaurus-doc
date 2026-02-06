## Node.js 日志管理：log4js 详解

log4js 是一个强大的日志管理库，支持日志的分级、分类和多种输出方式。本文介绍 log4js 的核心概念、安装配置及 Koa 集成使用。

### 1. 安装 log4js

```bash
npm install log4js
```

### 2. 日志收集（入口）

#### 2.1 日志等级（Level）

log4js 提供九个日志等级，分别是：
| 级别 | 权重 | 说明 |
|------|------|------|
| ALL | 最小值 | 记录所有日志 |
| TRACE | 5000 | 追踪信息 |
| DEBUG | 10000 | 调试信息 |
| INFO | 20000 | 普通信息 |
| WARN | 30000 | 警告信息 |
| ERROR | 40000 | 错误信息 |
| FATAL | 50000 | 严重错误 |
| MARK | 特殊值 | 特殊标记 |
| OFF | 最大值 | 关闭日志 |

示例

```js
const log4js = require("log4js");
const logger = log4js.getLogger();

logger.level = "all"; // 设置日志等级

logger.trace("This is trace");
logger.debug("This is debug");
logger.info("This is info");
logger.warn("This is warn");
logger.error("This is error");
logger.fatal("This is fatal");
logger.mark("This is mark");
```

#### 2.2 日志分类（Category）

在实例化 log4js 时可以指定别名，以便区分不同日志来源：

```js
const logger = log4js.getLogger("日志1");
logger.level = "all";
logger.info("分类日志输出");
```

### 3. 日志输出（出口）

#### 3.1 Appender（日志存储方式）

log4js 提供多种日志存储方式：

- Console：控制台输出
- File：文件存储
- DateFile：按日期滚动存储日志
- SMTP / Mailgun：邮件发送日志
- stdout：标准输出

#### 3.2 文件存储（File Appender）

日志存储到本地文件：

```js
log4js.configure({
  appenders: {
    fileAppender: {
      type: "file",
      filename: "./logs/app.log",
      layout: {
        type: "pattern",
        pattern: '{"date":"%d","level":"%p","message":"%m"}',
      },
      maxLogSize: 10485760, // 10MB
      backups: 5,
      encoding: "utf-8",
      keepFileExt: true,
    },
  },
  categories: { default: { appenders: ["fileAppender"], level: "debug" } },
});

const logger = log4js.getLogger();
logger.info("日志存储在文件");
```

#### 3.3 按日期存储（DateFile Appender）

每天生成新的日志文件：

```js
log4js.configure({
  appenders: {
    dateFileAppender: {
      type: "dateFile",
      filename: "./logs/server.log",
      pattern: "-yyyy-MM-dd",
      alwaysIncludePattern: true,
      keepFileExt: true,
    },
  },
  categories: { default: { appenders: ["dateFileAppender"], level: "info" } },
});

const logger = log4js.getLogger();
logger.info("每天生成新日志文件");
```

#### 3.4 标准输出（stdout）

```js
log4js.configure({
  appenders: { stdout: { type: "stdout" } },
  categories: { default: { appenders: ["stdout"], level: "info" } },
});
```

### 4. Koa 集成 log4js

#### 4.1 配置 log4js（middlewares/logger.js）

```js
const log4js = require("log4js");
const Path = require("path");

log4js.configure({
  replaceConsole: true,
  appenders: {
    cheese: {
      type: "dateFile",
      filename: Path.resolve(__dirname, "../logs/info.log"),
      pattern: "yyyy-MM-dd",
      alwaysIncludePattern: true,
      keepFileExt: true,
      encoding: "utf-8",
    },
  },
  categories: { default: { appenders: ["cheese"], level: "debug" } },
});

exports.logger = (name, level = "debug") => {
  const logger = log4js.getLogger(name);
  logger.level = level;
  return logger;
};

exports.use = (app) => {
  app.use(
    log4js.connectLogger(log4js.getLogger("http"), {
      level: "info",
      format: ":method :url :status",
    })
  );
};
```

#### 4.2 在 Koa 中使用

server.js

```js
const Koa = require("koa");
const app = new Koa();
const log4js = require("./middlewares/logger");

log4js.use(app);

const logger = log4js.logger("server", "warn");
logger.warn("Koa 日志集成");
```

### 5. 总结

- log4js 支持日志等级划分（ALL, TRACE, DEBUG, INFO, WARN, ERROR, FATAL, MARK, OFF）
- 支持多种日志输出方式（控制台、文件、按日期存储、邮件等）
- 可结合 Koa 实现 Web 服务器日志管理

log4js 提供了丰富的功能，适用于 Node.js 项目的日志收集与管理。
