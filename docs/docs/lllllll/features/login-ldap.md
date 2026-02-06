下面是你提供的 **LDAP 登录相关加密算法及登录流程** 的整理版本，包含 AES-GCM 和 RSA 的代码示例，登录流程和注意事项。方便你后续查阅或纳入技术文档。

# LDAP 登录及加密算法说明

## 1. 加密算法介绍

- **RSA**：非对称加密算法，用于公钥加密和解密
- **AES-GCM**：对称加密算法，支持加密和解密，带认证标签保证数据完整性

## 2. AES-GCM 加密解密实现

`aes128gcm.js` 主要代码示例：

```js
"use strict";

const crypto = require("crypto");

const ALGORITHM = "aes-256-gcm";
const TAG_SIZE = 16;
const KEY_SIZE = 32;
const PAYLOAD_MIN_SIZE = TAG_SIZE + 1;

const VALID_PLAINTEXT_ENCODING = ["ascii", "utf8", "buffer"];
const VALID_PAYLOAD_ENCODING = ["base64", "hex", "buffer"];

let _encryptionKey = new WeakMap();

export class CryptoGcm {
  constructor(options) {
    if (!options || !options.key || !options.encoding)
      throw new Error("missing options");

    const { key, encoding } = options;

    if (
      !encoding.plaintext ||
      VALID_PLAINTEXT_ENCODING.indexOf(encoding.plaintext) === -1
    )
      throw new Error("plaintext encoding should be ascii, utf8 or buffer");

    if (
      !encoding.payload ||
      VALID_PAYLOAD_ENCODING.indexOf(encoding.payload) === -1
    )
      throw new Error("payload encoding should be base64, hex or buffer");

    this.encoding = Object.freeze(encoding);
    _encryptionKey.set(this, key);
  }

  destroy() {
    if (!_encryptionKey.has(this))
      throw new Error("instance has been destroyed");

    _encryptionKey.delete(this);
  }

  _createBufferWithEncoding(input, inputType) {
    const encoding = this.encoding[inputType];

    if (!input) return false;

    if (encoding !== "buffer") input = Buffer.from(input, encoding);

    return input;
  }

  encrypt(plaintext, iv) {
    if (!_encryptionKey.has(this))
      throw new Error("instance has been destroyed");

    plaintext = this._createBufferWithEncoding(plaintext, "plaintext");

    if (!plaintext) return false;

    const cipher = crypto.createCipheriv(
      ALGORITHM,
      _encryptionKey.get(this),
      iv
    );
    cipher.end(plaintext);
    const ciphertext = cipher.read();
    const tag = cipher.getAuthTag();

    const payload = Buffer.concat([ciphertext, tag]);

    const encoding = this.encoding.payload;

    return encoding === "buffer" ? payload : payload.toString(encoding);
  }

  decrypt(payload, iv) {
    if (!_encryptionKey.has(this))
      throw new Error("instance has been destroyed");

    payload = this._createBufferWithEncoding(payload, "payload");

    if (!payload) return false;

    if (payload.length < PAYLOAD_MIN_SIZE) return false;

    const plaintext_size = payload.length - TAG_SIZE;
    const ciphertext = payload.slice(0, plaintext_size);
    const tag = payload.slice(plaintext_size);

    const decipher = crypto.createDecipheriv(
      ALGORITHM,
      _encryptionKey.get(this),
      iv
    );
    decipher.setAuthTag(tag);
    try {
      decipher.end(ciphertext);
    } catch (e) {
      return false;
    }

    const plaintext = decipher.read();

    const encoding = this.encoding.plaintext;

    return encoding === "buffer" ? plaintext : plaintext.toString(encoding);
  }
}
```

### AES-GCM 使用示例

```js
// AES加密
export function CryptoGcmEncrypt(aesKeyData, str) {
  const { CryptoGcm } = require("@/utils/aes128gcm.js");
  const aes = new CryptoGcm({
    key: Buffer.from(aesKeyData.key, "hex"),
    encoding: { plaintext: "buffer", payload: "buffer" },
  });
  const result = aes.encrypt(str, Buffer.from(aesKeyData.iv, "hex"));
  return Buffer.from(result).toString("hex");
}

// AES解密
export function CryptoGcmDecrypt(aesKeyData, str) {
  const { CryptoGcm } = require("@/utils/aes128gcm.js");
  const aes = new CryptoGcm({
    key: Buffer.from(aesKeyData.key, "hex"),
    encoding: { plaintext: "buffer", payload: "buffer" },
  });
  const result = aes.decrypt(
    Buffer.from(str, "hex"),
    Buffer.from(aesKeyData.iv, "hex")
  );
  return Buffer.from(result).toString();
}
```

## 3. RSA 公钥加解密示例

```js
// RSA公钥加密
export function publicEncrypt(plaintext) {
  const crypto = require("crypto");
  return crypto
    .publicEncrypt(
      {
        key: publicKey,
        passphrase: "",
        padding: crypto.constants.RSA_PKCS1_PADDING,
      },
      Buffer.from(plaintext, "utf8")
    )
    .toString("base64");
}

// RSA公钥解密
export function publicDecrypt(ciphertext) {
  const crypto = require("crypto");
  return crypto
    .publicDecrypt(publicKey, Buffer.from(ciphertext, "base64"))
    .toString("utf8");
}
```

## 4. LDAP 登录流程（简述）

- 用户输入账号密码，密码通过 AES-GCM 加密后发送到服务器。
- 服务器端使用 RSA 公钥验证身份，或解密数据。
- 登录成功后，用户进入企业空间。

## 5. 注意事项

- LDAP 账户支持隐藏、删除账号、修改密码、二次认证等操作。
- LDAP 账户未登录时被踢出空间，再次登录会自动加入企业空间。
- LDAP 退出登录需要记录账号信息。
- 当前环境支持 LDAP 功能时，才显示 LDAP 登录按钮。

## 6. 相关文档与文章

- \[私有化] 支持 LDAP 账号登录 MatrxO 客户端 https://matrx.atlassian.net/wiki/spaces/privatization/pages/11174028/LDAP+MatrxO
- AD 接入技术文档
- 20220808-LDAP 登录的加密方案说明

  如果需要我帮你写一份更详细的 LDAP 登录流程设计文档，或者整理成 Markdown 格式，请告诉我！
