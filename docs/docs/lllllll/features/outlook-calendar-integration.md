以下是你整理的“Outlook 邮件添加到日历”说明文档，附上**英文文件名建议**，内容保持中文：

### ✅ 建议英文文件名：

```plaintext
outlook-calendar-integration.md
```

### 📄 中文内容整理：

```markdown
# Outlook 邮件添加到日历

**负责人**：Yongmao Tian  
**最近更新日期**：2025 年 1 月 2 日  
**查看人数**：8

## 1. 私有化 Outlook 环境配置

### （1）私有化部署插件服务

- 使用老版本官网服务进行部署，需包含 Outlook 插件相关页面。
- `manifest.xml` 文件路径示例：
  - https://www.matrx.io/outlook_addin_static/manifest.xml
  - https://matrx.admcc.ae/outlook_addin_static/manifest_mcc.xml

> ⚠️ 注意：需在对应的私有域名服务器中开启 CSP 限制，配置如下：
```

frame-ancestors 'self' outlook.office.com outlook.office365.com outlook.live.com

```

> ⚙️ 同时服务器也需开启插件加载所需接口权限。

### （2）Outlook 客户端添加插件操作

- 打开 Outlook 客户端，点击插件添加按钮（如下图所示）。

- 加载页面如下，选择“添加自定义加载项”：

![插件添加入口](image-20250102-090952.png)
![插件添加页面](image-20250102-091121.png)

### （3）网页版 Outlook 添加插件操作

> 管理员操作步骤：

- 打开 Microsoft 管理后台：
  - https://admin.microsoft.com/Adminportal/Home?#/Settings/IntegratedApps

- 添加 XML 文件或 XML 链接（需私有服务开放 API 支持）。
- 注意：插件推送后约 6 小时才会同步至普通账户。

> 本地调试添加入口：
  - https://aka.ms/olksideload

![自定义插件添加](image-20240105-070050.png)

- 加载 XML 文件成功后，即可使用插件。

## 2. Matrx 插件使用添加日历事件

### （1）在事件中使用插件发送会议邀请

- 在 Matrx 插件中创建会议，并添加参会者邮箱。
- 被邀请人会收到邮件并**自动将会议添加到其 Outlook 日历**中。

![插件会议创建](image-20240105-070620.png)

## 3. 使用 ICS 文件自动添加会议至日历

### （1）发送包含 ICS 附件的邮件

- 客户端预约会议时，默认在邮件中附带 `.ics` 文件。

![发送带 ICS 的邮件](image-20240105-065941.png)

### （2）接收并打开 ICS 附件

- 收件人可点击附件查看详细的会议信息，并手动添加至日历。

![收到邮件](Matrx_2024010522638 PM-20240105-062741.jpg)
![打开 ICS 附件](Matrx_2024010522715 PM-20240105-062742.jpg)

如需进一步支持 Outlook Plugin API 调试或私有化部署配置，可补充技术对接说明。
```

如有更多 Outlook 功能点（如会议更新/取消同步、身份授权等），可以拆分为独立小节继续补充。是否需要我生成对应的 `.md` 文件结构并整理为知识库文档？
