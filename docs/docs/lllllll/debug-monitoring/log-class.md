# 日志实例

## 使用示例

```js
// infoLog.js
const { log4js } = require("./index");
const name = "info-dev";
module.exports = log4js.getLogger(name);
```

```js
// 使用infoLog
const infoLog = require("./logs/infoLog.js");
infoLog.info(val);
```

## 日志实例

以下是 `index.js` 的日志配置代码示例：

```js
// index.js
const pkg = require("../../package.json"); // 获取 package.json 信息
const log4js = require("./lib/log4js"); // 引入 log4js 进行日志管理
const { handleConfig, initLogConfig } = require("./log.config.js"); // 引入日志配置相关方法
const { debug } = require("../../config"); // 获取 debug 配置项

// 根据 debug 模式设置密码，若 debug 模式开启，则密码为空
const password = debug ? "" : "empty";

// 获取应用名称
const name = pkg.name;

// 确定日志存储目录，优先使用 global.userDatapath，否则从 config.js 获取
const configDir =
  global.userDatapath || require("@/config/config.js").configDir;
// const configDir = global.userDatapath || 'd:/logfiles/'; // 备用默认路径

// 定义日志类别，每个类别代表一类日志
const categoryNames = [
  { categoryName: "appLog" }, // 应用日志
  { categoryName: "bridgeLog" }, // 桥接日志
  { categoryName: "ipcMainLog" }, // IPC 主进程日志
  { categoryName: "sdkLog" }, // SDK 相关日志
  { categoryName: "e2eeLog" }, // 加密通信日志
  { categoryName: "meetingLog" }, // 会议相关日志
  { categoryName: "updaterLog" }, // 更新相关日志
  { categoryName: "renderLog" }, // 渲染进程日志
  { categoryName: "callfeedbackLogMain", appenderName: "callfeedbackLog" }, // 呼叫反馈日志
  { categoryName: "fileViewerMainLog", appenderName: "fileViewer" }, // 文件查看器日志
  { categoryName: "screenshotLogMain", appenderName: "screenshot" }, // 截图日志
  { categoryName: "fileLog" }, // 文件操作日志
  { categoryName: "messageLog" }, // 消息日志
  { categoryName: "apiLog" }, // API 请求日志
  { categoryName: "storageDataLog" }, // 数据存储日志
];

// 定义日志输出目标（appenders）
const appenderNames = [
  { appenderName: "cst-meeting-agent", filename: "CST_Meeting/agent" }, // 会议代理日志
  { appenderName: "avr-risk" },
  { appenderName: "callfeedbackLog" },
  { appenderName: "cst-meeting-sdk" },
  { appenderName: "delete-account" },
  { appenderName: "deleteAccountFeedback" },
  { appenderName: "file-dev" },
  { appenderName: "fileViewer" },
  { appenderName: "h-sdk" },
  { appenderName: "info-dev" },
  { appenderName: pkg.name + "-usage" }, // 应用使用日志
  { appenderName: "msgAllLog" },
  { appenderName: "pictureViewer" },
  { appenderName: "screenshot" },
  { appenderName: "session-dev" },
  { appenderName: "setEmoji" },
  { appenderName: "storage-data" },
];

// 初始化日志配置，设置日志存储路径、应用名称、日志大小限制等
const config = initLogConfig(configDir, name, "5M", password);

// 处理日志配置，将类别和输出目标应用到配置
handleConfig(config, { appenderNames, categoryNames }, configDir);

// 配置 log4js，使其生效
log4js.configure(config);

// 获取默认日志对象
const log = log4js.getLogger();

// 创建日志对象，并为每个类别添加相应的 logger
const object = {
  log4js, // 绑定 log4js 库
  default: log, // 绑定默认日志对象
};

// 遍历 categoryNames，为每个日志类别创建 logger 并存入 object
for (let index = 0; index < categoryNames.length; index++) {
  const item = categoryNames[index];
  if (item.categoryName) {
    object[item.categoryName] = log4js.getLogger(item.categoryName);
  }
}

// 记录日志初始化时间
log.info("loginit on:", new Date().toString());

// 导出日志对象，使其他模块可以使用
module.exports = object;
```

```js
// 导入模块并导出配置对象
module.exports = {
  // 判断是否为调试模式（development/debug/electron:test 触发）
  debug:
    process.env.npm_lifecycle_event === "electron:test" ||
    process.env.BUILD_ENV === "debug" ||
    process.env.NODE_ENV === "development",

  // 判断是否为 MSI 安装包（用于 Windows 安装程序）
  isMsi: process.env.npm_lifecycle_event === "electron:msi",

  // 忽略更新的过期时间（单位：秒），当前设定为 1 天
  skipUpdateExpireTime: 60 * 60 * 24 * 1, // 1 天（24 小时）

  // 指纹认证（默认关闭，x64 版本不使用）
  fingerToken: false, // x64 not use

  // 是否使用硬件加速（仅 Matrx 相关功能使用）
  useHw: false, // only matrx use

  // 是否使用硬件直播加速（仅 Matrx 相关功能使用）
  useHwLive: false, // only matrx use
};
```

```js
const path = require("path");
const { joinSep } = require("./lib/encrypt"); // 导入自定义的 joinSep 函数

// 处理配置，生成日志配置
function handleConfig(config, { appenderNames, categoryNames }, configDir) {
  const appendersConf = config.appenders.main; // 获取主 appender 配置
  const categoryConf = config.categories.main; // 获取主 category 配置

  // 遍历 appenderNames，设置每个 appender 的配置
  for (let index = 0; index < appenderNames.length; index++) {
    const item = appenderNames[index];
    if (item.appenderName) {
      // 如果有 appenderName
      if (item.appenderName === "cst-meeting-agent") {
        // 特定的 appender 配置
        config.appenders[item.appenderName] = {
          ...appendersConf, // 继承主配置
          filename: path.join(
            configDir,
            "logs",
            item.filename,
            item.appenderName + ".log"
          ), // 设置日志文件路径
          layout: {
            ...appendersConf.layout,
            pattern: "%d{yyyy-MM-dd hh:mm:ss.SSS}${joinSep}%m", // 设置日志格式
          },
        };
      } else {
        // 其他 appender 配置
        config.appenders[item.appenderName] = {
          ...appendersConf, // 继承主配置
          filename: path.join(
            configDir,
            "logs",
            item.filename || "",
            item.appenderName + ".log"
          ), // 设置日志文件路径
        };
      }
      // 配置日志类别，关联 appender
      config.categories[item.appenderName] = {
        ...categoryConf,
        appenders: [item.appenderName],
        enableCallStack: true, // 启用调用堆栈
      };
    }
  }

  // 遍历 categoryNames，设置每个 category 的配置
  for (let index = 0; index < categoryNames.length; index++) {
    const item = categoryNames[index];
    if (item.categoryName) {
      // 如果有 categoryName
      if (item.appenderName) {
        // 如果有 appenderName，关联 appender
        config.categories[item.categoryName] = {
          ...categoryConf,
          appenders: [item.appenderName],
        };
      } else {
        // 没有 appenderName，则使用默认配置
        config.categories[item.categoryName] = {
          ...categoryConf,
        };
      }
    }
  }
}

// 初始化日志配置
function initLogConfig(defaultUrl, filename = "main", size, password) {
  return {
    // 控制台输出配置
    appenders: {
      console: {
        type: "console", // 控制台输出类型
        layout: {
          type: "colored", // 使用彩色输出，使日志更加鲜明
        },
      },
      // 文件同步输出配置
      main: {
        type: "fileSync", // 使用同步文件输出
        filename: path.join(defaultUrl, "logs", filename + ".log"), // 设置日志文件路径
        fileNameSep: ".", // 文件名分隔符
        maxLogSize: size || "6M", // 最大日志大小，默认 6M
        backups: 2, // 保留的备份文件数量
        keepFileExt: true, // 保留文件扩展名
        pattern: "log", // 默认的文件名模式
        alwaysIncludePattern: true, // 总是包括日志模式
        compress: false, // 不压缩日志
        layout: {
          type: "mypattern", // 自定义的日志布局
          pattern: "[%d{yyyy-MM-dd hh:mm:ss.SSS}] (%p${joinSep}%m [%f{1}:%l])", // 日志格式
          password: password, // 密码字段，用于日志配置
        },
      },
    },
    categories: {
      default: { appenders: ["main"], level: "all", enableCallStack: true }, // 默认类别配置
      main: { appenders: ["main"], level: "all", enableCallStack: true }, // 主类别配置
    },
  };
}

module.exports = {
  joinSep, // 导出 joinSep 函数
  initLogConfig, // 导出 initLogConfig 函数
  handleConfig, // 导出 handleConfig 函数
};
```

```js
cryptoLogUtil.js;
// 引入所需模块
let crypto = require("crypto");
let pureAes = require("aes-js"); // AES加密库
let { debug } = require("../../config"); // 从配置中获取debug模式
var Log = require("log4js"); // 日志记录库
var logConfig = require("./log.config.js"); // 日志配置
let key_p_d = "empty"; // 盐值，用于加密

// 返回一个反转后的字符串或数组
function reverse(xs) {
  xs = Array.isArray(xs) ? xs : xs.split(""); // 如果是字符串，先转换为数组
  if (xs.length == 0) {
    return ""; // 空数组返回空字符串
  } else {
    return xs.reverse().join(""); // 反转数组并连接成字符串
  }
}

let salt = key_p_d; // 盐值（密钥）

// 通过AES加密算法加密输入的文本
// 返回Base64编码的加密文本
function encrypt(text) {
  // 使用SHA-256对盐值进行哈希处理，生成密钥
  let hash = crypto.createHash("sha256");
  hash.update(salt);
  let key128 = hash.digest().slice(0, 16); // 获取前16字节作为密钥
  let textbytes = pureAes.utils.utf8.toBytes(text); // 将输入文本转换为字节数组
  let ctr = new pureAes.ModeOfOperation.ctr(key128); // 使用AES CTR模式加密
  let outBytes = ctr.encrypt(textbytes); // 执行加密
  return Buffer.from(outBytes).toString("base64"); // 返回Base64编码的加密结果
}

// 如果debug为true，直接返回原始字符串；
// 否则，返回加密后的字符串并且进行反转
function encryptStr(str) {
  if (debug) {
    return str; // 如果是调试模式，直接返回原始字符串
  } else {
    return "|+|" + reverse(encrypt(str)); // 否则返回加密后的字符串，并加上特定标记
  }
}

// 初始化日志配置
let configDir;
function initLog(fileName = "app", size) {
  // 获取配置目录路径
  configDir = global.userDatapath || require("@/config/config.js").configDir;

  // 如果文件名没有以'.log'结尾，自动加上
  if (!fileName.endsWith(".log")) {
    fileName = fileName + ".log";
  }

  // 配置日志记录器
  Log.configure(logConfig(configDir, fileName, size)); // 配置日志格式和存储位置
  let logger = Log.getLogger(fileName); // 获取日志实例

  logger.log("init-index-log", fileName); // 输出初始化日志

  return encryptLog(logger); // 返回加密后的日志对象
}

// 包装日志记录方法，确保日志内容被加密
function encryptLog(log) {
  return {
    // 错误日志，记录前加密
    error(...args) {
      log.error(encryptStr(args));
    },
    // 警告日志，记录前加密
    warn(...args) {
      log.warn(encryptStr(args));
    },
    // 普通日志，记录前加密
    log(...args) {
      log.log(encryptStr(args));
    },
    // 信息日志，记录前加密
    info(...args) {
      log.info(encryptStr(args));
    },
    // 调试日志，记录前加密
    debug(...args) {
      log.debug(encryptStr(args));
    },
    // 初始化密钥的日志
    initKey(key) {
      log.info(encryptStr(`initKey=> ${key}`)); // 输出初始化密钥的加密日志
    },
  };
}

// 导出加密函数和日志相关函数
module.exports = {
  encryptStr: encryptStr, // 导出加密字符串的方法
  initLog: initLog, // 导出初始化日志的方法
  encryptLog: encryptLog, // 导出加密日志的方法
};
```

```js
const path = require("path"); // 引入路径处理模块
const { joinSep } = require("./lib/encrypt"); // 引入加密库中的joinSep函数，用于分隔符

// 配置日志，处理appender和category的配置
function handleConfig(config, { appenderNames, categoryNames }, configDir) {
  const appendersConf = config.appenders.main; // 获取默认的appender配置
  const categoryConf = config.categories.main; // 获取默认的category配置

  // 遍历所有的appender名称
  for (let index = 0; index < appenderNames.length; index++) {
    const item = appenderNames[index];
    if (item.appenderName) {
      if (item.appenderName === "cst-meeting-agent") {
        // 如果appenderName是'cst-meeting-agent'，修改其配置
        config.appenders[item.appenderName] = {
          ...appendersConf,
          filename: path.join(
            configDir,
            "logs",
            item.filename,
            item.appenderName + ".log"
          ), // 设置日志文件路径
          layout: {
            ...appendersConf.layout,
            pattern: `(%d{yyyy-MM-dd hh:mm:ss.SSS}${joinSep}%m`, // 修改输出格式，加入分隔符
          },
        };
      } else {
        // 对其他appender进行常规配置
        config.appenders[item.appenderName] = {
          ...appendersConf,
          filename: path.join(
            configDir,
            "logs",
            item.filename || "",
            item.appenderName + ".log"
          ), // 设置日志文件路径
        };
      }
      // 配置category，指定使用该appender进行日志输出
      config.categories[item.appenderName] = {
        ...categoryConf,
        appenders: [item.appenderName],
        enableCallStack: true, // 启用调用栈信息
      };
    }
  }

  // 遍历所有category名称
  for (let index = 0; index < categoryNames.length; index++) {
    const item = categoryNames[index];
    if (item.categoryName) {
      // 配置category，如果有指定appender，使用指定的appender
      if (item.appenderName) {
        config.categories[item.categoryName] = {
          ...categoryConf,
          appenders: [item.appenderName],
        };
      } else {
        // 如果没有指定appender，则使用默认配置
        config.categories[item.categoryName] = {
          ...categoryConf,
        };
      }
    }
  }
}

// 初始化日志配置
function initLogConfig(defaultUrl, filename = "main", size, password) {
  return {
    appenders: {
      // 控制台输出配置
      console: {
        type: "console", // 输出到控制台
        layout: {
          type: "colored", // 使用颜色格式显示日志
        },
      },
      // 文件日志输出配置
      main: {
        type: "fileSync", // 同步写入文件
        filename: path.join(defaultUrl, "logs", filename + ".log"), // 日志文件的路径
        fileNameSep: ".", // 文件名分隔符
        maxLogSize: size || "6M", // 最大日志文件大小，默认为6MB
        backups: 2, // 保留的备份文件数量
        keepFileExt: true, // 保留文件扩展名
        pattern: "log", // 日志文件的命名模式
        alwaysIncludePattern: true, // 始终包含命名模式
        compress: false, // 不压缩备份文件
        layout: {
          type: "mypattern", // 自定义日志输出格式
          pattern: `[%d{yyyy-MM-dd hh:mm:ss.SSS}] (%p${joinSep}%m [%f{1}:%l]`, // 日志输出的格式
          password: password, // 加密日志时使用的密码
        },
      },
    },
    categories: {
      // 默认category配置，输出所有日志
      default: { appenders: ["main"], level: "all", enableCallStack: true },
      // 主category配置
      main: { appenders: ["main"], level: "all", enableCallStack: true },
    },
  };
}

// 导出函数
module.exports = {
  joinSep, // 导出joinSep函数
  initLogConfig, // 导出初始化日志配置函数
  handleConfig, // 导出处理日志配置函数
};
```

```js

```
