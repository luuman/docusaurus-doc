以下是你这篇关于 Exchange Online 中 Outlook 插件部署文档的中文整理版本（Markdown 格式），并附上建议的英文文件名：

### ✅ 建议英文文件名：

```plaintext
outlook-addins-exchange-online.md
```

### 📄 Markdown 中文整理版：

````markdown
# Exchange Online 中部署 Outlook 插件说明

**原文档**：Add-ins for Outlook in Exchange Online.doc  
**负责人**：Yongmao Tian  
**更新时间**：2025 年 1 月 21 日

## 1. 私有 Outlook 环境下部署插件

### （1）部署旧版插件服务

部署包含 Outlook 插件相关页面的旧版服务，确保可以访问 manifest.xml 文件，示例地址如下：

- https://www.matrx.io/outlook_addin_static/manifest.xml
- https://matrx.admcc.ae/outlook_addin_static/manifest_mcc.xml

需为对应域名配置 CSP 安全策略，示例配置如下：

```text
frame-ancestors 'self' outlook.office.com outlook.office365.com outlook.live.com
```
````

### （2）通过 PowerShell 添加插件

参考微软官方文档：**Add-ins for Outlook in Exchange Online**

#### 方式一：通过 URL 安装插件

```powershell
New-App -OrganizationApp -Url https://matrx.admcc.ae/outlook_addin_static/manifest_mcc.xml
```

指定用户安装（例如 5 个用户）：

```powershell
New-App -OrganizationApp -Url https://matrx.admcc.ae/outlook_addin_static/manifest_mcc.xml `
    -ProvidedTo SpecificUsers `
    -UserList "user1,user2,user3,user4,user5" `
    -DefaultStateForUser Enabled
```

#### 方式二：通过本地文件安装插件

```powershell
New-App -OrganizationApp -FileData ([System.IO.File]::ReadAllBytes('C:\Apps\FinanceTestApp.xml'))
```

### （3）管理员推送插件

管理员可以在 Microsoft 管理后台推送插件：

- [https://admin.microsoft.com/Adminportal/Home?#/Settings/IntegratedApps](https://admin.microsoft.com/Adminportal/Home?#/Settings/IntegratedApps)

> ⚠️ 注意：管理员推送插件后，Microsoft 服务器通常 **6 小时后** 才会在普通用户账户中显示插件菜单。

### （4）使用插件创建会议

在事件中使用 Matrx 插件创建会议，添加与会者邮箱后：

- Outlook 会自动将会议邮件添加到对方日历中。

## 2. 客户端预约会议时默认添加 ICS 文件

### （1）发送 `.ics` 文件或链接测试

- 客户端预约会议后，邮件中会默认附加 `.ics` 日历文件。

### （2）收件人收到 `.ics` 附件

- 邮件中可见 `.ics` 文件，点击后可查看会议详情。

### （3）打开 `.ics` 附件

- 打开后，系统自动识别会议时间、地点、参与人等信息，可直接保存到日历应用。

```

是否需要我将已整理的文档统一汇总或打包成 ZIP 下载？如你有更多文档待整理，请继续贴出内容。
```
