以下是你提供的英文版内容的整理文档，保持原文为英文，但文档结构优化，并为你建议了英文文件名（保留你给的原始文件名风格）。

### ✅ 建议英文文件名：

```plaintext
add-ins-for-outlook-in-exchange-online.md
```

### 📄 Markdown 文档整理：

````markdown
# Add-ins for Outlook in Exchange Online

**Document**: Add-ins for Outlook in Exchange Online.doc  
**Last Updated**: —  
**Maintainer**: Yongmao Tian

## 1. In a Private Outlook Environment

### (1) Private Deployment

Privately deploy the old version of the official website service, including Outlook add-in-related pages. Access the `manifest.xml` file from:

- https://www.matrx.io/outlook_addin_static/manifest.xml
- https://matrx.admcc.ae/outlook_addin_static/manifest_mcc.xml

Make sure to enable CSP (Content Security Policy) restrictions for the corresponding domain:

```text
frame-ancestors 'self' outlook.office.com outlook.office365.com outlook.live.com
```
````

### (2) Outlook Add-ins

#### Microsoft Official Documentation:

Refer to: **Add-ins for Outlook in Exchange Online**

#### Add an Add-in via Exchange Management Shell

**From URL:**

```powershell
New-App -OrganizationApp -Url https://matrx.admcc.ae/outlook_addin_static/manifest_mcc.xml
```

Or, for specific users:

```powershell
New-App -OrganizationApp -Url https://matrx.admcc.ae/outlook_addin_static/manifest_mcc.xml `
  -ProvidedTo SpecificUsers `
  -UserList "user1,user2,user3,user4,user5" `
  -DefaultStateForUser Enabled
```

**From File:**

```powershell
New-App -OrganizationApp -FileData ([System.IO.File]::ReadAllBytes('C:\Apps\FinanceTestApp.xml'))
```

#### Administrator Push Settings

Administrator push settings page:

- [https://admin.microsoft.com/Adminportal/Home?#/Settings/IntegratedApps](https://admin.microsoft.com/Adminportal/Home?#/Settings/IntegratedApps)

> **Note**: After the administrator installs the add-in, it may take up to **6 hours** for Microsoft services to reflect the changes on user accounts.

#### Using the Add-in in Events

- Use the Matrx add-in to create a meeting
- Add attendee email addresses
- Attendees will automatically receive an email and the meeting will be added to their calendars

## 2. ICS File in Client-Scheduled Meetings

### (1) Test Sending ICS File or Link

- Send test emails with `.ics` file attached or linked

### (2) Receive ICS Attachment

- Recipients receive the `.ics` attachment in the email

### (3) Open the ICS File

- The event is automatically imported into the recipient's calendar application

```

如果你想要我把所有相关文档统一导出为 `.md` 文件或打包为一个知识库结构，也可以告诉我。是否继续整理下一个？
```

https://matrx.atlassian.net/wiki/spaces/frontend/pages/555417610/Add-ins+for+Outlook+in+Exchange+Online
