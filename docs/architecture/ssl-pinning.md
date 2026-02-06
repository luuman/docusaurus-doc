# SSL Pinning 证书绑定

> SSL Pinning 用于防止中间人攻击,通过验证服务端证书指纹确保通信安全。

## 整体流程

```
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
当网络请求发生,Electron 自动触发 verificator
       ↓
verificator(info, callback)
       ↓
handleDomainConfig(info.hostname)
       ↓
匹配证书配置 → 验证 info.certificate.fingerprint 等
       ↓
通过或拒绝 callback(0/-2)
```

## 初始化流程

### 主窗口初始化

```js
import initVerifyProc from "@/main/certs/useCertificateVerifyProc";

if (debug) {
  const { enableDebugUpdater } = getStore("storage");
  cryptolog.info("enableDebugUpdater options", enableDebugUpdater);

  if (!enableDebugUpdater) {
    initVerifyProc(); // 安全环境下启用证书验证
  }
} else {
  // 非 debug 模式,直接启用 SSL Pinning 校验
  initVerifyProc();
}
```

### initVerifyProc 函数

```js
function initVerifyProc() {
  // 初始化证书配置(从文件或其他来源加载 ssl_cert_config)
  init_cert_config();

  // 如果配置非空,说明需要启用 SSL Pinning
  if (ssl_cert_config.length) {
    isVerify = setVerifyProc(global.currentWin);
  }

  log.log("function initVerifyProc isVerify=>", isVerify);

  // 注册主进程 IPC 事件,用于渲染进程请求变更证书校验配置
  ipcMain.on("CHANGE_CERTIFICATEVERIFY_CONFIG", async function (e, url, first) {
    let domainConfig = await handleDomainConfig(url, first);
    e.reply("CHANGE_CERTIFICATEVERIFY_CONFIG", domainConfig);
  });

  ipcMain.on("CHANGE_CERTIFICATEVERIFY_CONFIG_FIRST", async function (e, url, first) {
    let domainConfig = await handleDomainConfig(url, first);
    e.reply("CHANGE_CERTIFICATEVERIFY_CONFIG_FIRST", domainConfig);
  });

  ipcMain.on("CHANGE_CERTIFICATEVERIFY_CONFIG_WSS", async function (e, url, first) {
    let domainConfig = await handleDomainConfig(url, first);
    e.reply("CHANGE_CERTIFICATEVERIFY_CONFIG_WSS", domainConfig);
  });
}
```

## 证书配置

### init_cert_config 函数

```js
function init_cert_config() {
  switch (currentConfig.name) {
    case "MatrxO": {
      // MatrxO 配置适用于内网或特定环境 IP 地址直连(无域名)
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
      // Matrx 配置适用于公网环境,支持多个域名与通配符
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
      // 默认配置包含所有平台环境
      ssl_cert_config = [
        // 合并上述配置
      ];
    }
  }
}
```

### handleDomainConfig 函数

```js
async function handleDomainConfig(url, first) {
  let domainConfig;
  const wwwPattern = /^(?!-)([A-Za-z0-9-]{1,63}\.)+[A-Za-z]{2,14}$/;

  try {
    // 判断当前 URL 是否为域名,而非 IP 地址
    const isDomain = wwwPattern.test(url);
    log.log("url isDomain first", url, isDomain, first);

    // 根据 URL 和是否为域名的标志位,拉取 SSL 配置(包括证书指纹等信息)
    domainConfig = await fetchSslConfig(url, isDomain);

    if (domainConfig) {
      // 如果是首次访问,清空之前缓存的证书配置
      if (first) {
        ssl_cert_config = [];
      }

      // 将新的证书配置添加到全局配置列表中
      ssl_cert_config.push(domainConfig);

      // 使用 lodash 的 uniqWith + isEqual 去重
      ssl_cert_config = _.uniqWith(ssl_cert_config, _.isEqual);

      // 应用证书验证逻辑
      setVerifyProc(global.currentWin);
    }
  } catch (e) {
    console.error("CHANGE_CERTIFICATEVERIFY_CONFIG error=>", e, url, first);
    log.error("CHANGE_CERTIFICATEVERIFY_CONFIG error=>", e.message, e.stack, url, first);
  }

  return domainConfig;
}
```

## 证书验证器

### matrx_createSslVerificator 函数

```js
function matrx_createSslVerificator(config) {
  // 检查每个配置项中的 domain 格式是否合法
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
    const fingerprintSet = new Set(rule.fingerprints);
    const hostnameRegex = new RegExp("^" + rule.domain.replace("*.", ".*\\.?") + "$");

    return (hostname, fingerprints) => {
      let val = hostnameRegex.test(hostname);

      if (!val) {
        val = fingerprints.every((fp) => fingerprintSet.has(fp));
      }

      if (!val) {
        log.log("val false fingerprintSet", hostname, JSON.stringify([...fingerprintSet]), hostnameRegex.toString());
      }

      return val;
    };
  });

  // 提前构造 hostname 正则数组
  const domains = [];
  config.forEach(({ domain }) => {
    const hostnameRegex = new RegExp("^" + domain.replace("*.", ".*\\.?") + "$");
    domains.push(hostnameRegex);
  });

  // 返回证书验证函数
  return (request, callback) => {
    const fingerprints = [];

    // 遍历证书链,从 leaf 到 root,提取所有证书的指纹
    for (let cert = request.certificate; cert && cert !== cert.issuerCert; cert = cert.issuerCert) {
      fingerprints.push(cert.fingerprint);
    }

    // 检查该 hostname 是否属于配置中的任何一个域名
    let domain_exist = false;
    for (let i = 0; i < domains.length; i++) {
      if (domains[i].test(request.hostname)) {
        domain_exist = true;
        break;
      }
    }

    // 根据规则进行匹配判断
    if (rules.some((rule) => rule(request.hostname, fingerprints))) {
      // 匹配成功,接受证书
      callback(0);
    } else if (!domain_exist) {
      // 如果域名不在配置中,交给 Chromium 的默认验证逻辑
      callback(-3);
    } else {
      // 匹配失败,主动拒绝证书
      log.log("request.callback:", -2, "request.hostname:", request.hostname, "fingerprints:", fingerprints);
      callback(-2);
    }
  };
}
```

### setVerifyProc 函数

```js
export function setVerifyProc(win) {
  try {
    // 创建证书验证函数
    const matrx_sslVerificator = matrx_createSslVerificator(ssl_cert_config);

    // 设置为 Electron 默认的全局证书校验逻辑
    session.defaultSession.setCertificateVerifyProc(matrx_sslVerificator);

    // 如果传入了窗口,进行额外处理
    useCertificateVerifyProc(matrx_sslVerificator, win);

    return true;
  } catch (e) {
    console.error("setVerifyProc error=>", e);
    log.error("setVerifyProc error=>", e);
    return false;
  }
}

function useCertificateVerifyProc(conf, win) {
  if (win && !win.isDestroyed()) {
    win.webContents.session.setCertificateVerifyProc(conf);
  }
}
```

## 证书指纹获取

### fetchSslConfig 函数

```js
const tls = require("tls");
const https = require("https");
const { createHash } = require("crypto");

const sha256 = (data) => createHash("sha256").update(data).digest("base64");

const handleCert = (cert) => {
  if (!Object.keys(cert).length) {
    return false;
  }

  const fingerprints = [];

  // 遍历证书链,从 leaf -> issuer -> root
  for (let issuer = cert; issuer; issuer = issuer.issuerCertificate) {
    fingerprints.push("sha256/" + sha256(issuer.raw));

    // 如果已到根证书(自签),结束递归
    if (issuer === issuer.issuerCertificate) {
      break;
    }
  }

  return fingerprints;
};

async function fetchSslPinningConfig({ host, port, hostname, pathname }, isDomain) {
  return new Promise((resolve, reject) => {
    const options = {
      host: hostname,
      port: parseInt(port, 10) || 443,
      path: pathname,
      requestCert: false,
      rejectUnauthorized: false,
      agent: new https.Agent({ maxCachedSessions: 0 }),
    };

    const req = https.request(options, ({ socket }) => {
      if (socket instanceof tls.TLSSocket) {
        const cert = socket.getPeerCertificate(true);
        const fp = handleCert(cert);
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

    // 设置超时时间(30秒)
    reqTimer = setTimeout(() => {
      reject(new Error("Timeout"));
      req.abort();
    }, 30 * 1000);

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

    req.end();
  });
}

async function fetchSslConfig(url, isDomain) {
  try {
    const reqUrl = new URL(handleUrl(url));
    let res;

    // 最多尝试 5 次
    for (let i = 0; i < 5; i++) {
      if (i > 0) {
        await new Promise((resolve) => setTimeout(resolve, 600));
      }

      res = await fetchSslPinningConfig(reqUrl, isDomain)
        .then((config) => config)
        .catch((err) => {
          console.error("Fetching error", err);
          return err;
        });

      if (res.code === "ECONNRESET" || res instanceof Error) {
        if (res.code === "ETIMEDOUT") break;
        continue;
      } else {
        break;
      }
    }

    return res instanceof Error ? null : res;
  } catch (e) {
    console.error("fetchSslConfig error:", e);
    return null;
  }
}

function handleUrl(arg) {
  if (arg.match(/^https?:/)) {
    return arg;
  }
  return `https://${arg}`;
}

module.exports = fetchSslConfig;
```

## API 参考

### session.setCertificateVerifyProc

用于拦截并自定义 TLS/SSL 证书的验证流程。

#### 参数说明

| 参数 | 类型 | 说明 |
|------|------|------|
| `request.hostname` | String | 请求的主机名 |
| `request.certificate` | Certificate | 服务端返回的证书对象 |
| `request.error` | String | 默认验证结果的错误描述(如有) |
| `callback(resultCode)` | Function | 调用此函数以返回验证结果 |

#### Certificate 对象

| 字段名 | 类型 | 说明 |
|--------|------|------|
| `data` | String | 完整证书内容,为 PEM 编码格式 |
| `issuer` | CertificatePrincipal | 证书颁发者的详细信息 |
| `issuerName` | String | 证书颁发者(CA)的公用名 |
| `subject` | CertificatePrincipal | 证书持有者的详细信息 |
| `subjectName` | String | 被验证服务器证书的公用名 |
| `serialNumber` | String | 证书的序列号,十六进制字符串 |
| `validStart` | Number | 证书的有效开始时间(Unix 秒级时间戳) |
| `validExpiry` | Number | 证书的有效结束时间(Unix 秒级时间戳) |
| `fingerprint` | String | SHA1 指纹 |

#### 返回码

| 错误码 | 含义 |
|--------|------|
| `0` | 验证通过(不再进行默认验证) |
| `-2` | 验证失败(拦截请求) |
| `-3` | 使用 Chromium 默认验证结果 |

#### 示例

```js
const { BrowserWindow } = require("electron");

let win = new BrowserWindow();

win.webContents.session.setCertificateVerifyProc((request, callback) => {
  const { hostname } = request;

  if (hostname === "github.com") {
    callback(0); // 明确允许 github.com 的证书
  } else {
    callback(-2); // 拒绝所有其他站点的证书
  }
});
```

#### 恢复默认验证逻辑

```js
session.setCertificateVerifyProc(null);
```

## 已知问题

- 校验规则不够严谨,匹配域名不关联指纹
- 需要改进指纹验证逻辑,确保域名和指纹同时匹配
