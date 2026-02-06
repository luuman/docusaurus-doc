以下是你整理的 **iPad 页面加载流程** 的文档内容，已按你的要求保留中文内容并提供英文文件名建议。

### ✅ 建议英文文件名：

```plaintext
ipad-page-load-flow.md
```

### 📄 中文内容整理：

````markdown
# iPad 页面加载流程

**负责人**：Yongmao Tian  
**最近更新日期**：2024 年 1 月 31 日  
**查看人数**：3

## 页面地址示例

- https://stage.rabdan.ai/r100web/?f=app&t=mission_dashboard
- https://stage.rabdan.ai/r100web/?f=app&t=stability_spectrum
- https://stage.rabdan.ai/r100web/?f=app&t=stability_history

## 1. 初始化接口：`initAppData`

### 示例：

```text
bridge://initAppData?uuid=88d4859d-f1ae-4496-9c75-8a0885796c32&callback=window.web_bridge_callback.initData_88d4859d-f1ae-4496-9c75-8a0885796c32
```
````

### Android to Web 参数：

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

## 2. 获取 Token 接口：`getApiToken`

### 示例：

```text
bridge://getApiToken?url=[base64-url字符串]&uuid=d3f0550a-8102-4b67-80c9-66e64112d12a&callback=window.web_bridge_callback.returnToken_d3f0550a-8102-4b67-80c9-66e64112d12a
```

### Web to Android 参数：

```json
{
  "url": "base64 string",
  "uuid": "d3f0550a-8102-4b67-80c9-66e64112d12a"
}
```

### Android to Web 返回：

```json
{
  "ts": 1705892065145,
  "token": "string",
  "uuid": "d3f0550a-8102-4b67-80c9-66e64112d12a"
}
```

## 3. 选择相册图片接口：`inputFile`

### 示例：

```text
bridge://inputFile?type=image&uuid=88d4859d-f1ae-4496-9c75-8a0885796c32&callback=window.web_bridge_callback.initData_88d4859d-f1ae-4496-9c75-8a0885796c32
```

### Android to Web 返回：

```json
{
  "url": "string",
  "base64": "string",
  "uuid": "88d4859d-f1ae-4496-9c75-8a0885796c32"
}
```

## 4. 获取媒体权限接口：`getMediaAccess`

### 示例：

```text
bridge://getMediaAccess?uuid=88d4859d-f1ae-4496-9c75-8a0885796c32&callback=window.web_bridge_callback.mediaAccess_88d4859d-f1ae-4496-9c75-8a0885796c32
```

### Android to Web 返回：

```json
{
  "access": true,
  "uuid": "88d4859d-f1ae-4496-9c75-8a0885796c32"
}
```

如需导出 `.md` 文件或同步整理为技术文档知识库，请告知我是否需要生成目录索引和打包多个模块文档。

```

```
