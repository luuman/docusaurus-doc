---
slug: web-scraping
title: 案例 2：自动化数据抓取与导出
date: 2026-02-05
authors: [claude-team]
tags: [claude-code, tutorial, automation]
description: 通过 Chrome DevTools MCP 让 Claude Code 直接操控浏览器抓取数据，自动生成 Excel 报表
---

# 案例 2：自动化数据抓取与导出

**场景：** 每日需要从内部管理后台（需要登录，无公开 API）抓取各区域销售数据，整理成固定格式的 Excel 报表发送给运营团队。原本需要 1 小时手工操作，目标压缩至 10 分钟全自动执行。

<!-- truncate -->

---

## 前置准备

### 安装 Chrome DevTools MCP

```bash
# 添加 Chrome DevTools MCP 服务器
claude mcp add chrome-devtools npx @modelcontextprotocol/server-chrome-devtools
```

确认安装成功：

```bash
# 在 Claude Code 中检查
/mcp
# 应该看到 chrome-devtools: 已连接
```

### 安装 Python 依赖

```bash
pip install openpyxl pandas
```

---

## 实现过程

### 第 1 步：登录并获取数据

```
使用 Chrome DevTools 打开我们的管理后台：
1. 导航到 https://admin.internal.com/login
2. 用账号 admin@company.com 登录（我来输密码）
3. 进入"销售报表"→"区域概览"页面
4. 截图确认页面加载完成
```

Claude Code 通过 `chrome_navigate` 打开页面，`chrome_fill` 填写表单，`chrome_screenshot` 截图确认：

```
[截图：已成功登录到管理后台，当前在区域概览页面]

页面上我看到一个表格，包含以下列：
- 区域名称
- 昨日销售额
- 本周累计
- 完成率
- 同比增长

共 12 个区域的数据。需要我抓取这些数据吗？
```

### 第 2 步：提取表格数据

```
是的，把所有行的数据都抓下来，输出为 JSON 格式
```

Claude Code 使用 `chrome_evaluate` 执行 JavaScript 提取数据。

---

## 自动化定时执行

将整个流程封装成脚本，配合 cron 每天自动运行：

```bash title="scripts/daily-sales-report.sh"
#!/bin/bash
# 每日自动抓取销售数据并发送报表
# cron: 0 8 * * 1-5 /path/to/daily-sales-report.sh

claude -p "
使用 Chrome DevTools 登录管理后台，抓取区域销售数据，
生成格式化 Excel 文件保存到 ~/reports/ 目录，
完成后输出文件路径
" --dangerously-skip-permissions \
  --output-format stream-json | \
  jq -r 'select(.type=="text") | .content' | \
  tail -1  # 获取文件路径

# 发送邮件
REPORT_FILE=$(ls ~/reports/销售日报_*.xlsx | tail -1)
python3 -c "
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.base import MIMEBase
from email import encoders
import os

msg = MIMEMultipart()
msg['From'] = 'robot@company.com'
msg['To'] = 'team@company.com'
msg['Subject'] = '每日销售报表'

with open('$REPORT_FILE', 'rb') as f:
    attachment = MIMEBase('application', 'octet-stream')
    attachment.set_payload(f.read())
    encoders.encode_base64(attachment)
    attachment.add_header('Content-Disposition', f'attachment; filename=\"{os.path.basename(\"$REPORT_FILE\")}\"')
    msg.attach(attachment)

with smtplib.SMTP('smtp.company.com', 587) as s:
    s.login('robot@company.com', os.environ['EMAIL_PASS'])
    s.send_message(msg)
print('邮件已发送')
"
```

---

## 效率对比

| 指标 | 手动操作 | Claude Code 自动化 |
|------|---------|-------------------|
| 耗时 | ~60 分钟 | ~10 分钟 |
| 需要人工值守 | 全程 | 仅首次配置 |
| 出错风险 | 高（手动复制粘贴） | 低（程序化提取） |
| 节假日执行 | 需专人操作 | 自动运行 |

---

## 关键技巧

| 技巧 | 说明 |
|------|------|
| Chrome DevTools MCP | 可以操控需要登录的页面，无公开 API 也能抓取 |
| `chrome_evaluate` | 直接执行 JS 提取结构化数据，比解析 HTML 更稳定 |
| `chrome_screenshot` | 截图确认页面状态，方便调试 |
| 数据数字化 | 抓取时转换为数值类型，方便后续计算合计 |
| cron 定时化 | 结合 Headless 模式实现全自动定时执行 |

:::tip 扩展应用
同样的方式可以抓取：竞品价格监控、行业数据报告、内部 OA 系统数据、ERP 系统报表……只要能在浏览器中访问，Claude Code + Chrome DevTools MCP 就能实现自动化。
:::
