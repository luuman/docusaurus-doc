# SSL 证书验证逻辑

综合实际结果这里的指纹校验不够严谨

```js
[创建窗口]
       ↓
useCertificateVerifyProc.js ← 从本地或远程拉取证书配置
       ↓
initVerifyProc()
       ↓
setVerifyProc(verificator) → matrx_createSslVerificator() 创建实际验证函数
       ↓
session.defaultSession.setCertificateVerifyProc(verificator)

-----------------------【网络请求时】-----------------------
当网络请求发生，Electron 自动触发 setverificator
       ↓
verificator(info, callback)
       ↓
handleDomainConfig(info.hostname)
       ↓
匹配证书配置 → 验证 info.certificate.fingerprint 等
       ↓
通过或拒绝 callback(0/−2)
```

```js
// 主窗口
import initVerifyProc from "@/main/certs/useCertificateVerifyProc";

if (debug) {
  // 获取本地存储配置中的 enableDebugUpdater 设置项（可能来自 Electron Store 或自定义实现）
  const { enableDebugUpdater } = getStore("storage");

  // 打印调试信息，查看是否允许调试状态下跳过验证流程
  cryptolog.info("enableDebugUpdater options", enableDebugUpdater);

  // 如果处于 debug 模式，但未开启 debug 升级器，才初始化证书验证流程
  // 否则，可能为了调试升级流程而跳过 SSL Pinning 校验
  if (!enableDebugUpdater) {
    initVerifyProc(); // 安全环境下启用证书验证
  }
} else {
  // 非 debug 模式，直接启用 SSL Pinning 校验
  initVerifyProc();
}
```

## useCertificateVerifyProc

### initVerifyProc

initVerifyProc 应该是你模块中用于 初始化证书验证逻辑 的核心函数。从上下文看，你的 Electron 应用中有 SSL Pinning 或自定义证书验证机制，这个函数就是用于设置相关处理器或钩子的。

```js
/**
 * 初始化证书验证流程（SSL Pinning）
 */
function initVerifyProc() {
  // 初始化证书配置（从文件或其他来源加载 ssl_cert_config）
  init_cert_config();

  // 如果配置非空，说明需要启用 SSL Pinning
  if (ssl_cert_config.length) {
    // 将证书验证逻辑绑定到当前主窗口
    // setVerifyProc 内部会使用 matrx_createSslVerificator 和 useCertificateVerifyProc
    isVerify = setVerifyProc(global.currentWin);
  }

  // 打印当前证书验证是否启用状态
  log.log("function initVerifyProc isVerify=>", isVerify);

  // 注册主进程 IPC 事件，用于渲染进程请求变更证书校验配置（例如用户修改或远程配置更新）

  ipcMain.on("CHANGE_CERTIFICATEVERIFY_CONFIG", async function (e, url, first) {
    // 根据渲染进程传入的 URL 和首次标志，处理域名验证配置
    let domainConfig = await handleDomainConfig(url, first);
    // 异步返回配置结果
    e.reply("CHANGE_CERTIFICATEVERIFY_CONFIG", domainConfig);
  });

  ipcMain.on(
    "CHANGE_CERTIFICATEVERIFY_CONFIG_FIRST",
    async function (e, url, first) {
      let domainConfig = await handleDomainConfig(url, first);
      e.reply("CHANGE_CERTIFICATEVERIFY_CONFIG_FIRST", domainConfig);
    }
  );

  ipcMain.on(
    "CHANGE_CERTIFICATEVERIFY_CONFIG_WSS",
    async function (e, url, first) {
      let domainConfig = await handleDomainConfig(url, first);
      e.reply("CHANGE_CERTIFICATEVERIFY_CONFIG_WSS", domainConfig);
    }
  );
}
```

> init_cert_config

```js
// 初始化证书指纹配置，根据当前环境配置不同的域名与对应的 SSL Pinning 签名
function init_cert_config() {
  switch (currentConfig.name) {
    case "MatrxO": {
      // MatrxO 配置适用于内网或特定环境 IP 地址直连（无域名）
      ssl_cert_config = [
        {
          domain: "188.116.30.70",
          fingerprints: [],
          host: "188.116.30.70:8081",
        },
        {
          domain: "188.116.29.150",
          fingerprints: [],
          host: "188.116.29.150:9090",
        },
        {
          domain: "188.116.30.70",
          fingerprints: [],
          host: "188.116.30.70:6111",
        },
      ];
      break;
    }

    case "Matrx": {
      // Matrx 配置适用于公网环境，支持多个域名与通配符
      ssl_cert_config = [
        {
          domain: "*.matrx.work",
          fingerprints: [],
        },
        {
          domain: "*.matrx.solutions",
          fingerprints: [],
        },
        {
          domain: "*.matrx.io",
          fingerprints: [],
        },
        {
          domain: "*.matrx.tech",
          fingerprints: [],
        },
      ];
      break;
    }

    default: {
      // 默认配置包含所有平台环境（包括 Matrx 和 MatrxO），用于集成测试或 fallback 模式
      ssl_cert_config = [
        // 下略，重复上面两个 case 的合并内容
        // 略去注释避免重复，你可以按需复制上面的注释内容
      ];
    }
  }
}
```

> handleDomainConfig

```js
/**
 * 处理指定 URL 的证书配置
 * @param {string} url - 目标域名或 IP 地址
 * @param {boolean} first - 是否为首次访问（首次访问会清空旧配置）
 * @returns {Promise<object|null>} - 返回拉取到的证书配置对象
 */
async function handleDomainConfig(url, first) {
  let domainConfig;

  // 匹配合法的域名格式（排除 IP 地址等情况）
  const wwwPattern = /^(?!-)([A-Za-z0-9-]{1,63}\.)+[A-Za-z]{2,14}$/;

  try {
    // 判断当前 URL 是否为域名，而非 IP 地址（用于传参或条件判断）
    const isDomain = wwwPattern.test(url);
    log.log("url isDomain first", url, isDomain, first);

    // 根据 URL 和是否为域名的标志位，拉取 SSL 配置（包括证书指纹等信息）
    domainConfig = await fetchSslConfig(url, isDomain);

    if (domainConfig) {
      // 如果是首次访问，清空之前缓存的证书配置（用于初始化绑定）
      if (first) {
        ssl_cert_config = [];
      }

      // 将新的证书配置添加到全局配置列表中
      ssl_cert_config.push(domainConfig);

      // 使用 lodash 的 uniqWith + isEqual 去重，避免重复添加相同配置
      ssl_cert_config = _.uniqWith(ssl_cert_config, _.isEqual);

      // 应用证书验证逻辑，使用 Electron 的 setCertificateVerifyProc 设置校验规则
      setVerifyProc(global.currentWin);
    }
  } catch (e) {
    // 捕获异常并打印详细错误信息
    console.error("CHANGE_CERTIFICATEVERIFY_CONFIG error=>", e, url, first);
    log.error(
      "CHANGE_CERTIFICATEVERIFY_CONFIG error=>",
      e.message,
      e.stack,
      url,
      first
    );
  }

  // 返回最终获取的证书配置（可能为 null）
  return domainConfig;
}
```

> matrx_createSslVerificator

```js
/**
 * @file session ssl
 * @description SSL Pinning 自定义证书验证函数
 */
function matrx_createSslVerificator(config) {
  // 检查每个配置项中的 domain 格式是否合法，限制通配符 * 只能出现一次
  config.forEach(({ domain }) => {
    const wildcardCount = domain.match(/\*/g);
    if (wildcardCount && wildcardCount.length > 1) {
      log.error("config.forEach error", domain, wildcardCount);
      throw new Error('Wrong wildcard format specified. Use "*.example.org".');
    } else {
      log.log("config.forEach00", domain, wildcardCount);
    }
  });

  // 构造每条证书规则验证器
  const rules = config.map((rule) => {
    const fingerprintSet = new Set(rule.fingerprints); // 用 Set 快速查找指纹是否匹配
    const hostnameRegex = new RegExp(
      "^" + rule.domain.replace("*.", ".*\\.?") + "$"
    ); // 将 *.example.com 转为正则表达式

    // 返回一个规则函数，用于判断 hostname 和 证书指纹 是否匹配
    return (hostname, fingerprints) => {
      // 初始判断：是否域名正则匹配
      let val = hostnameRegex.test(hostname);

      // 若域名不匹配，再判断指纹是否全部匹配（此逻辑可能偏严）
      if (!val) {
        val = fingerprints.every((fp) => fingerprintSet.has(fp));
      }

      // 打印调试日志（匹配失败）
      if (!val) {
        log.log(
          "val false fingerprintSet",
          hostname,
          JSON.stringify([...fingerprintSet]),
          hostnameRegex.toString()
        );
      }

      return val;
    };
  });

  // 提前构造 hostname 正则数组，用于快速判断某域名是否在配置中
  const domains = [];
  config.forEach(({ domain }) => {
    const hostnameRegex = new RegExp(
      "^" + domain.replace("*.", ".*\\.?") + "$"
    );
    domains.push(hostnameRegex);
  });

  // 返回证书验证函数，用于集成进 Electron session 的 certificate 验证逻辑
  return (request, callback) => {
    const fingerprints = [];

    // 遍历证书链，从 leaf 到 root，提取所有证书的指纹
    for (
      let cert = request.certificate;
      cert && cert !== cert.issuerCert;
      cert = cert.issuerCert
    ) {
      fingerprints.push(cert.fingerprint);
    }

    // 检查该 hostname 是否属于配置中的任何一个域名（用于 fallback）
    let domain_exist = false;
    for (let i = 0; i < domains.length; i++) {
      if (domains[i].test(request.hostname)) {
        domain_exist = true;
        break;
      }
    }

    // 根据规则进行匹配判断
    if (rules.some((rule) => rule(request.hostname, fingerprints))) {
      // 匹配成功，接受证书，关闭证书透明度验证
      callback(0);
    } else if (!domain_exist) {
      // 如果域名不在配置中，不验证，自行交给 Chromium 的默认验证逻辑处理
      callback(-3);
    } else {
      // 匹配失败，主动拒绝证书
      log.log(
        "request.callback:",
        -2,
        "request.hostname:",
        request.hostname,
        "fingerprints:",
        fingerprints,
        "ssl_cert_config:",
        ssl_cert_config // ⚠️ 这里的变量需在外部传入或去掉
      );
      log.log("request.000:", request);
      callback(-2);
    }
  };
}
```

### setVerifyProc

```js
export function setVerifyProc(win) {
  try {
    // 1. 创建证书验证函数（自定义的校验逻辑，内部会使用 ssl_cert_config 进行匹配）
    const matrx_sslVerificator = matrx_createSslVerificator(ssl_cert_config);

    // 2. 设置为 Electron 默认的全局证书校验逻辑（会作用于所有请求）
    session.defaultSession.setCertificateVerifyProc(matrx_sslVerificator);

    // 3. 如果传入了窗口（可能用于子窗口、特定 session），进行额外处理
    useCertificateVerifyProc(matrx_sslVerificator, win);

    // 4. 若需要将当前配置写入缓存，可取消注释以下代码
    // setStore('storage.ssl_cert_config', ssl_cert_config);

    return true;
  } catch (e) {
    // 错误处理
    console.error("setVerifyProc error=>", e);
    log.error("setVerifyProc error=>", e);
    return false;
  }
}
```

> useCertificateVerifyProc

```js
/**
 * 设置证书验证过程（SSL Pinning Hook）
 * @param {Function} conf - 自定义证书验证函数（如 matrx_createSslVerificator 返回的函数）
 * @param {BrowserWindow} win - Electron 窗口实例，获取其 session 对象
 */
function useCertificateVerifyProc(conf, win) {
  // 确保窗口实例存在且未被销毁（避免对无效窗口操作）
  if (win && !win.isDestroyed()) {
    // 为该窗口所属的 session 设置证书验证函数
    // 每次网络请求时，都会调用该函数进行证书校验
    win.webContents.session.setCertificateVerifyProc(conf);
  }
}
```

## fetchSslPinningConfig

SSL Pinning 指纹抓取与配置工具模块，适用于 Electron 应用中用于实现证书绑定（SSL Pinning）机制。

### fetchSslConfig

```js
const tls = require("tls");
const https = require("https");
const { createHash } = require("crypto");
const log = require("../../logs/cryptolog.js");

// 计算输入数据的 SHA-256 哈希值并返回 base64 编码格式
const sha256 = (data) => createHash("sha256").update(data).digest("base64");

/**
 * 递归提取证书链的 SHA256 指纹（从服务端证书到根证书）
 * @param {tls.PeerCertificate} cert - 从 TLS 连接中获取的证书对象
 * @returns {string[]|false} - 指纹数组，格式为 'sha256/...'，无效则返回 false
 */
const handleCert = (cert) => {
  if (!Object.keys(cert).length) {
    return false;
  }

  const fingerprints = [];

  // 遍历证书链，从 leaf -> issuer -> root
  for (let issuer = cert; issuer; issuer = issuer.issuerCertificate) {
    // 计算每一级证书的指纹并添加前缀
    fingerprints.push("sha256/" + sha256(issuer.raw));

    // 如果已到根证书（自签），结束递归
    if (issuer === issuer.issuerCertificate) {
      break;
    }
  }

  return fingerprints;
};

// 请求超时控制变量（全局共享）
let reqTimer = null;

/**
 * 自定义请求错误类型，用于标记特定错误场景
 */
class ReqError extends Error {
  constructor({ message, code }) {
    super(message);
    this.name = "ReqError";
    this.message = message;
    this.code = code;
  }
}

/**
 * 建立 HTTPS 请求并从 TLS 握手中提取证书信息与指纹
 * @param {URL} param0 - 分解后的 URL 参数对象
 * @param {boolean} isDomain - 是否为域名（否则为 IP）
 * @returns {Promise<{domain: string, fingerprints: string[], host: string}>}
 */
async function fetchSslPinningConfig(
  { host, port, hostname, pathname },
  isDomain
) {
  return new Promise((resolve, reject) => {
    const options = {
      host: hostname,
      port: parseInt(port, 10) || 443,
      path: pathname,
      requestCert: false, // 不要求客户端提供证书
      rejectUnauthorized: false, // 忽略服务端证书验证（我们要自定义验证）
      agent: new https.Agent({ maxCachedSessions: 0 }), // 禁用会话缓存，避免缓存指纹
    };

    // 发起请求
    const req = https.request(options, ({ socket }) => {
      if (socket instanceof tls.TLSSocket) {
        const cert = socket.getPeerCertificate(true); // 获取整个证书链
        const fp = handleCert(cert); // 提取指纹
        const domain = isDomain ? cert.subject.CN : hostname;

        if (fp && fp.length) {
          resolve({ domain, fingerprints: fp, host });
        } else {
          reject(new Error("No valid certificate fingerprints"));
        }
      } else {
        reject(new Error("Unexpected socket type"));
      }
    });

    // 设置超时时间（30秒）
    clearTimeout(reqTimer);
    reqTimer = setTimeout(() => {
      clearTimeout(reqTimer);
      reject(
        new ReqError({
          message: "setTimeout, aborting request",
          code: "ETIMEDOUT",
        })
      );
      req.abort();
    }, 30 * 1000);

    // 请求异常处理
    req.on("error", (err) => {
      if (err.cert) {
        const fp = handleCert(err.cert);
        const domain = isDomain ? err.cert.subject.CN : hostname;

        if (fp && fp.length) {
          resolve({ domain, fingerprints: fp, host });
        } else {
          reject(err);
        }
      } else {
        reject(err);
      }
    });

    // socket 事件监听：处理连接超时和握手完成
    req.on("socket", (socket) => {
      // 套接字超时
      socket.on("timeout", () => {
        reject(
          new ReqError({
            message: "Timeout, aborting request",
            code: "ETIMEDOUT",
          })
        );
        req.abort();
      });

      // TLS 握手完成后提取证书
      socket.on("secureConnect", () => {
        if (socket instanceof tls.TLSSocket) {
          const cert = socket.getPeerCertificate(true);
          const fp = handleCert(cert);
          const domain = isDomain ? cert.subject.CN : hostname;

          if (fp && fp.length) {
            resolve({ domain, fingerprints: fp, host });
            req.abort(); // 提前中断请求，节省资源
          } else {
            reject(new Error("No valid certificate fingerprints"));
            req.abort();
          }
        } else {
          reject(new Error("Unexpected socket type"));
          req.abort();
        }
      });
    });

    req.end(); // 发送请求
  });
}

/**
 * 补全裸域名或 IP 地址为 HTTPS URL
 * @param {string} arg - 原始输入地址
 * @returns {string} - 规范化后的 URL（带 https://）
 */
function handleUrl(arg) {
  if (arg.match(/^https?:/)) {
    return arg;
  }
  return `https://${arg}`;
}

/**
 * 对外暴露接口：根据 URL 获取证书指纹信息，最多尝试 5 次
 * @param {string} url - 输入地址（域名或 IP）
 * @param {boolean} isDomain - 是否为域名
 * @returns {Promise<{domain: string, fingerprints: string[], host: string} | null>}
 */
async function fetchSslConfig(url, isDomain) {
  try {
    const reqUrl = new URL(handleUrl(url));
    let res;

    // 最多尝试 5 次（中间间隔）
    for (let i = 0; i < 5; i++) {
      if (i > 0) {
        await new Promise((resolve) => setTimeout(resolve, 600));
      }

      log.log("fetchSslConfig", i);

      res = await fetchSslPinningConfig(reqUrl, isDomain)
        .then((config) => config)
        .catch((err) => {
          console.error("Fetching error", err);
          log.error("Fetching error", err.message);
          return err;
        });

      // 如果是连接重置或其它错误，尝试重试
      if (res.code === "ECONNRESET" || res instanceof Error) {
        log.error("Retrying after error =>", res.message, res.code);
        if (res.code === "ETIMEDOUT") break;
        continue;
      } else {
        break;
      }
    }

    log.log("fetchSslConfig res=>", res);
    return res instanceof Error ? null : res;
  } catch (e) {
    console.error("fetchSslConfig error:", e);
    log.error("fetchSslConfig error:", e.message, e.stack);
    return null;
  }
}

module.exports = fetchSslConfig;
```

## 知识点

`session.setCertificateVerifyProc(proc)`
用于 **拦截并自定义 TLS/SSL 证书的验证流程**。适用于安全控制场景，比如实现 SSL Pinning，拒绝不符合要求的证书。

> proc(request, callback)

| 参数                   | 类型          | 说明                           |
| ---------------------- | ------------- | ------------------------------ |
| `request`              | `Object`      | 包含当前验证请求的详细信息     |
| `request.hostname`     | `String`      | 请求的主机名                   |
| `request.certificate`  | `Certificate` | 服务端返回的证书对象           |
| `request.error`        | `String`      | 默认验证结果的错误描述（如有） |
| `callback(resultCode)` | `Function`    | 调用此函数以返回验证结果       |

> Certificate

| 字段名         | 类型                   | 说明                                                                     |
| -------------- | ---------------------- | ------------------------------------------------------------------------ |
| `data`         | `String`               | 完整证书内容，为 PEM 编码格式（`-----BEGIN CERTIFICATE-----` 开头）      |
| `issuer`       | `CertificatePrincipal` | 证书颁发者的详细信息（对象格式，见下）                                   |
| `issuerName`   | `String`               | 证书颁发者（CA）的公用名（Common Name，如 `Let's Encrypt Authority X3`） |
| `subject`      | `CertificatePrincipal` | 证书持有者（被验证方）的详细信息（对象格式）                             |
| `subjectName`  | `String`               | 被验证服务器证书的公用名（如 `www.github.com`）                          |
| `serialNumber` | `String`               | 证书的序列号，十六进制字符串，可用于唯一标识                             |
| `validStart`   | `Number`               | 证书的有效开始时间（Unix 秒级时间戳）                                    |
| `validExpiry`  | `Number`               | 证书的有效结束时间（Unix 秒级时间戳）                                    |
| `fingerprint`  | `String`               | SHA1 指纹（一般不推荐）                                                  |

> resultCode

| 错误码 | 含义                            |
| ------ | ------------------------------- |
| `0`    | 验证通过 ✅（不再进行默认验证） |
| `-2`   | 验证失败 ❌（拦截请求）         |
| `-3`   | 使用 Chromium 默认验证结果      |

> 🧪 示例解析

```js
const { BrowserWindow } = require("electron");

let win = new BrowserWindow();

win.webContents.session.setCertificateVerifyProc((request, callback) => {
  const { hostname } = request;

  if (hostname === "github.com") {
    callback(0); // 明确允许 github.com 的证书（即使无效也强制信任）
  } else {
    callback(-2); // 拒绝所有其他站点的证书（阻断请求）
  }
});
```

> 🔄 恢复默认验证逻辑

这会禁用自定义逻辑，恢复为 Chromium 的默认证书验证流程。

```js
session.setCertificateVerifyProc(null);
```

```js
const { BrowserWindow } = require("electron");
const crypto = require("crypto");

const allowedFingerprint = "SHA256:ABC123..."; // 你的目标证书指纹

win.webContents.session.setCertificateVerifyProc((request, callback) => {
  const { certificate } = request;
  const fingerprint = certificate.fingerprint256;

  if (fingerprint === allowedFingerprint) {
    callback(0); // 通过
  } else {
    callback(-2); // 拒绝
  }
});
```

> 使用 crypto 模块提取 SHA-256 指纹

```js
const crypto = require("crypto");

/**
 * 计算证书的 SHA-256 指纹（base64）
 * @param {string} pemCert - PEM 编码的证书
 * @returns {string} - 形如 sha256/xxxx 的格式
 */
function getSha256Fingerprint(pemCert) {
  // 转为 DER 格式（二进制）
  const base64Cert = pemCert
    .replace(/-----BEGIN CERTIFICATE-----/, "")
    .replace(/-----END CERTIFICATE-----/, "")
    .replace(/\s+/g, "");

  const derCert = Buffer.from(base64Cert, "base64");
  const hash = crypto.createHash("sha256").update(derCert).digest("base64");
  return `sha256/${hash}`;
}
```

## 问题

- [ ] 校验规则不够严谨，匹配域名不关联指纹
