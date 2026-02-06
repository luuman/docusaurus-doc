明白了，以下是你提供的内容整理成的中文 Markdown 文档版本：

### ✅ 建议英文文件名：

```plaintext
outlook-addin-add-email-to-calendar.md
```

### 📄 Markdown 文档内容（中文整理版）：

````markdown
# Outlook 插件实现邮件添加到日历

**原文档**：Outlook add-in to add.doc  
**最后更新日期**：2025 年 1 月 21 日  
**负责人**：Yongmao Tian

## 1. 私有化 Outlook 环境下的配置

### （1）私有化部署插件服务

部署旧版官网服务，包含 Outlook 插件相关页面，可访问 manifest.xml 文件，例如：

- https://www.matrx.io/outlook_addin_static/manifest.xml
- https://matrx.admcc.ae/outlook_addin_static/manifest_mcc.xml

需在对应域名开启 CSP 安全策略限制：

```text
frame-ancestors 'self' outlook.office.com outlook.office365.com outlook.live.com
```
````

### （2）Outlook 客户端插件添加入口

#### 客户端版本

打开 Outlook 客户端，点击添加插件的入口按钮，随后会弹出加载页面进行插件添加。

#### 网页端版本

如果使用浏览器打开 Outlook，管理员需在应用添加页面：

- 上传本地 XML 文件，或
- 填写 manifest.xml 链接地址

同时需确保私有服务端开放对应 API 接口支持。

网页端添加插件地址：

- [https://aka.ms/olksideload](https://aka.ms/olksideload)

添加自定义加载项并加载 manifest.xml 后，插件即可正常使用。

#### 管理员推送插件设置

管理员推送插件地址：

- [https://admin.microsoft.com/Adminportal/Home?#/Settings/IntegratedApps](https://admin.microsoft.com/Adminportal/Home?#/Settings/IntegratedApps)

> ⚠️ 注意：管理员安装插件后，Microsoft 服务器通常需要 **6 小时** 生效，之后普通用户账户中才会显示插件菜单。

### （3）使用 Matrx 插件创建会议

- 在 Outlook 事件中使用 Matrx 插件创建会议
- 添加与会者邮箱地址
- 系统会自动将该会议邮件添加至与会者的日历中

## 2. 客户端预约会议时自动附加 ICS 文件

### （1）测试发送 ICS 文件或链接

- 邮件中附加 `.ics` 文件或包含会议链接

### （2）接收 ICS 附件

- 收件人可在邮件中看到 `.ics` 附件

### （3）打开 ICS 附件

- 点击打开 `.ics` 文件，即可自动将会议添加到本地日历

```

如需继续整理其他文档，请直接粘贴内容，我会统一保持这类格式并给出推荐文件名。是否需要我为你整理过的文档生成目录或打包下载链接？
```
