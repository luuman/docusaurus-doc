# 登录前接口安全校验 —— Token 生成与刷新机制

## 一、客户端保存私钥

客户端需保存一段 base64 编码的私钥：

```ts
const PRI_KEY = "+KivqNbL1XHWeHryhcWM8B9jOQZFMIcK8mvDz4qvAVg=";
```

````

## 二、获取服务端公钥信息

**请求接口**：

```
GET /buua/v1/get?endpoint=mobile&version=1.0
```

**返回示例**：

```json
{
  "responseHeader": {
    "status": 200,
    "msg": null,
    "version": "1.0"
  },
  "response": {
    "serverPubs": [
      {
        "serverPub": "tH5ktnN0/ZIcW7IEij2eHIIF+nVtKAKFdzgb0IduOHs=\r\n",
        "uid": "10086",
        "hosts": "https://tech01-mapi.svc.matrx.tech"
      },
      {
        "serverPub": "8Kn5ZhHSobS2Lb22vTc+Bmlc+U9T2+jez8dkQMt/+kE=\r\n",
        "uid": "10086",
        "hosts": "https://tech02-mapi.svc.matrx.tech"
      }
    ]
  }
}
```

## 三、初始化 IKEY

```ts
const ikey_buffer = await sendSdk(
  "Util-SDK-Method",
  2,
  Buffer.from(pub, "base64"),
  stringToUint8Array(PRI_KEY)
);

const hid = numberToHid(data.uid);
const uid_buffer = Buffer.from(hid, "base64").reverse();

await sendSdk("IKEY-SDK-Init", ikey_buffer, uid_buffer, "第3");
```

## 四、设置 Token

```ts
await setBeforeLoginIKey();

// 服务端密钥每隔 30 分钟需刷新一次，需根据时间判断是否重新初始化 IKEY
let signature = await processSignature(axiosConfig);
let token = await sendSdk(
  "IKEY-SDK-API-Token",
  signature,
  axiosConfig.params.ts + ""
);

axiosConfig.headers["token"] = token;
```

## 🔐 注意事项

- 每次调用 token 设置方法前，需判断 IKEY 是否过期（30 分钟刷新一次）；
- 该流程适用于登录前接口（如获取短信验证码、验证码校验、账号注册等）；
- token 签名过程建议加入随机因子、防重放机制（详见相关文档）。

```

如你有其他类似的文档也需要整理并统一英文命名，欢迎继续发我 👍
```
````
