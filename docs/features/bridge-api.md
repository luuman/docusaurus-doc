# Bridge API (移动端)

> 移动端 (iPad/Android) 通过 bridge 协议与 Web 页面通信的接口定义。

## 页面地址示例

- `https://stage.rabdan.ai/r100web/?f=app&t=mission_dashboard`
- `https://stage.rabdan.ai/r100web/?f=app&t=stability_spectrum`
- `https://stage.rabdan.ai/r100web/?f=app&t=stability_history`

## initAppData - 初始化接口

```
bridge://initAppData?uuid={uuid}&callback=window.web_bridge_callback.initData_{uuid}
```

### Android → Web 参数

```json
{
  "uid": "string",
  "ts": 1705892065145,
  "rid": 123,
  "spaceId": "string",
  "account": "email 或 account",
  "uuid": "88d4859d-f1ae-4496-9c75-8a0885796c32"
}
```

## getApiToken - 获取 Token

```
bridge://getApiToken?url=[base64-url]&uuid={uuid}&callback=window.web_bridge_callback.returnToken_{uuid}
```

### Web → Android 参数

```json
{
  "url": "base64 string",
  "uuid": "d3f0550a-8102-4b67-80c9-66e64112d12a"
}
```

### Android → Web 返回

```json
{
  "ts": 1705892065145,
  "token": "string",
  "uuid": "d3f0550a-8102-4b67-80c9-66e64112d12a"
}
```

## inputFile - 选择相册图片

```
bridge://inputFile?type=image&uuid={uuid}&callback=window.web_bridge_callback.initData_{uuid}
```

### Android → Web 返回

```json
{
  "url": "string",
  "base64": "string",
  "uuid": "88d4859d-f1ae-4496-9c75-8a0885796c32"
}
```

## getMediaAccess - 获取媒体权限

```
bridge://getMediaAccess?uuid={uuid}&callback=window.web_bridge_callback.mediaAccess_{uuid}
```

### Android → Web 返回

```json
{
  "access": true,
  "uuid": "88d4859d-f1ae-4496-9c75-8a0885796c32"
}
```
