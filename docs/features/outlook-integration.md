# Outlook 日历集成

> Matrx 支持与 Outlook 日历集成,实现会议邀请自动同步到日历。

## 私有化 Outlook 环境配置

### 部署插件服务

使用老版本官网服务进行部署,需包含 Outlook 插件相关页面。

`manifest.xml` 文件路径示例:
- https://www.matrx.io/outlook_addin_static/manifest.xml
- https://matrx.admcc.ae/outlook_addin_static/manifest_mcc.xml

:::warning
需在对应的私有域名服务器中开启 CSP 限制:

```
frame-ancestors 'self' outlook.office.com outlook.office365.com outlook.live.com
```
:::

### Outlook 桌面客户端添加插件

1. 打开 Outlook 客户端
2. 点击插件添加按钮
3. 选择"添加自定义加载项"
4. 加载 manifest.xml 文件

### 网页版 Outlook 添加插件

**管理员操作:**

1. 打开 Microsoft 管理后台: https://admin.microsoft.com/Adminportal/Home?#/Settings/IntegratedApps
2. 添加 XML 文件或 XML 链接
3. 插件推送后约 **6 小时**才会同步至普通账户

**本地调试:**
- 入口地址: https://aka.ms/olksideload

## 使用插件发送会议邀请

1. 在 Matrx 插件中创建会议
2. 添加参会者邮箱
3. 被邀请人会收到邮件并**自动将会议添加到其 Outlook 日历**中

## 使用 ICS 文件添加会议

1. 客户端预约会议时,默认在邮件中附带 `.ics` 文件
2. 收件人可点击附件查看详细的会议信息
3. 手动添加至日历
