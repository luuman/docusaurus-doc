---
sidebar_position: 2
title: Headless 模式（无头模式）
description: 在 CI/CD 流水线、脚本自动化和批量处理场景中使用 Claude Code 的非交互式模式
---

# Headless 模式（无头模式）

:::tip 适用场景
Headless 模式让 Claude Code 脱离交互式界面，以**命令行管道**或**脚本调用**的形式工作。这是将 AI 能力集成到自动化工作流的核心方式，适用于 CI/CD、批量处理、定时任务等场景。
:::

## 基本用法

### 核心参数

| 参数 | 说明 |
|------|------|
| `-p "提示词"` | 指定提示词（非交互式执行） |
| `--output-format json` | 以 JSON 格式输出结果 |
| `--output-format stream-json` | 流式 JSON 输出（实时） |
| `--verbose` | 显示详细的思考过程和工具调用 |
| `--dangerously-skip-permissions` | 跳过权限确认（CI 环境专用） |
| `--max-turns N` | 限制最大对话轮数 |

### 管道输入

最常见的用法是通过 Unix 管道将内容传递给 Claude：

```bash
# 解释 git diff 的变更内容
git diff | claude -p "解释这些代码变更，重点说明影响范围和潜在风险"

# 总结文件内容
cat README.md | claude -p "用 3 句话总结这个项目的核心功能"

# 分析日志文件中的错误
tail -n 100 /var/log/app.log | claude -p "找出其中的错误模式，按严重程度分类"

# 检查代码质量
cat src/main.js | claude -p "检查代码质量，指出潜在的 Bug 和不良实践"
```

### 文件重定向输入

```bash
# 使用重定向符号传入文件
claude -p "检查代码质量" < src/main.js

# 组合多个文件（通过 heredoc）
claude -p "对比这两个配置文件的差异" << EOF
$(cat config/dev.json)
---
$(cat config/prod.json)
EOF
```

### 命令行直接分析

```bash
# 分析目录结构
ls -la src/ | claude -p "根据这个目录结构，描述项目的模块划分方式"

# 分析系统信息
df -h | claude -p "判断磁盘使用情况是否需要关注，给出建议"

# 审查提交历史
git log --oneline -20 | claude -p "分析最近 20 次提交的工作模式，有无不规范之处"
```

---

## Stream-JSON 输出格式

对于需要程序化处理 Claude 输出的场景，使用结构化输出格式：

```bash
# 基础 stream-json 输出
claude -p "分析这段代码的复杂度" \
  --dangerously-skip-permissions \
  --output-format stream-json \
  --verbose \
  < src/complex-module.js
```

输出格式示例：

```json
{"type":"thinking","content":"正在分析代码结构..."}
{"type":"tool_use","tool":"Read","input":{"file_path":"src/complex-module.js"}}
{"type":"tool_result","content":"// 文件内容..."}
{"type":"text","content":"该模块的圈复杂度约为 12，主要集中在..."}
{"type":"result","exit_code":0,"cost_usd":0.0023}
```

使用 `jq` 提取特定字段：

```bash
claude -p "列出所有 TODO 注释" \
  --output-format stream-json \
  < src/app.js | \
  jq -r 'select(.type=="text") | .content'
```

---

## CI/CD 集成

### GitHub Actions 完整示例

以下是一个完整的 GitHub Actions 工作流，在每次 PR 时自动触发 Claude Code 进行代码审查：

```yaml title=".github/workflows/claude-review.yml"
name: Claude Code Review

on:
  pull_request:
    types: [opened, synchronize, reopened]
    paths:
      - 'src/**'
      - 'tests/**'

jobs:
  claude-review:
    name: AI 代码审查
    runs-on: ubuntu-latest
    permissions:
      contents: read
      pull-requests: write

    steps:
      # 1. 检出代码（包含完整历史以支持 diff）
      - name: Checkout Repository
        uses: actions/checkout@v4
        with:
          fetch-depth: 0

      # 2. 配置 Node.js 环境
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      # 3. 安装 Claude Code CLI
      - name: Install Claude Code
        run: npm install -g @anthropic-ai/claude-code

      # 4. 生成 PR Diff
      - name: Generate PR Diff
        id: diff
        run: |
          git diff origin/${{ github.base_ref }}...HEAD \
            -- '*.ts' '*.tsx' '*.js' '*.jsx' '*.py' \
            > /tmp/pr-diff.txt
          echo "diff_lines=$(wc -l < /tmp/pr-diff.txt)" >> $GITHUB_OUTPUT

      # 5. 运行 Claude 代码审查
      - name: Run Claude Review
        id: review
        env:
          ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
        run: |
          REVIEW=$(cat /tmp/pr-diff.txt | claude -p "
          请对以下代码变更进行专业的代码审查，输出格式如下：

          ## 总体评价
          [简短总结]

          ## 潜在问题
          [列出发现的 Bug 或安全隐患]

          ## 代码质量
          [评价代码风格、可读性、可维护性]

          ## 改进建议
          [具体的优化建议]

          ## 优点
          [值得肯定的实践]
          " --dangerously-skip-permissions 2>/dev/null)

          # 将多行输出存储为环境变量
          {
            echo 'REVIEW_CONTENT<<REVIEW_EOF'
            echo "$REVIEW"
            echo 'REVIEW_EOF'
          } >> $GITHUB_ENV

      # 6. 将审查结果评论到 PR
      - name: Comment Review on PR
        uses: actions/github-script@v7
        with:
          github-token: ${{ secrets.GITHUB_TOKEN }}
          script: |
            const review = process.env.REVIEW_CONTENT;
            const diffLines = '${{ steps.diff.outputs.diff_lines }}';

            await github.rest.issues.createComment({
              owner: context.repo.owner,
              repo: context.repo.repo,
              issue_number: context.issue.number,
              body: `## 🤖 Claude Code 自动审查报告\n\n` +
                    `> 审查范围：${diffLines} 行变更\n\n` +
                    `${review}\n\n` +
                    `---\n*由 Claude Code 自动生成 · ${new Date().toISOString()}*`
            });

      # 7. 安全检查（可选）
      - name: Security Scan
        env:
          ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
        run: |
          cat /tmp/pr-diff.txt | claude -p "
          专注于安全角度审查以下代码变更：
          1. SQL 注入风险
          2. XSS 漏洞
          3. 敏感信息泄露（API Key、密码硬编码）
          4. 不安全的依赖
          5. 权限控制缺失

          如果发现高危问题，请在输出开头标注 [HIGH_RISK]
          " --dangerously-skip-permissions 2>/dev/null | \
          grep -q "\[HIGH_RISK\]" && exit 1 || exit 0
```

### GitLab CI 示例

```yaml title=".gitlab-ci.yml"
claude-code-review:
  stage: test
  image: node:20-alpine
  only:
    - merge_requests
  script:
    - npm install -g @anthropic-ai/claude-code
    - git diff $CI_MERGE_REQUEST_DIFF_BASE_SHA...HEAD > /tmp/diff.txt
    - |
      cat /tmp/diff.txt | claude -p "进行代码审查并输出 Markdown 格式报告" \
        --dangerously-skip-permissions > review.md
  artifacts:
    paths:
      - review.md
    expire_in: 1 week
```

---

## 脚本自动化

### 批量代码质量分析

```bash title="scripts/batch-process.sh"
#!/bin/bash
# batch-process.sh - 批量分析代码质量
# 用法: ./batch-process.sh [目标目录]

set -euo pipefail

TARGET_DIR="${1:-./src}"
OUTPUT_DIR="./quality-reports"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
REPORT_FILE="${OUTPUT_DIR}/quality-report-${TIMESTAMP}.md"

# 创建输出目录
mkdir -p "$OUTPUT_DIR"

# 初始化报告
cat > "$REPORT_FILE" << EOF
# 代码质量分析报告

- 分析时间：$(date)
- 目标目录：${TARGET_DIR}
- 分析工具：Claude Code Headless

---

EOF

echo "开始批量分析 ${TARGET_DIR} 目录..."
echo ""

# 统计计数
total=0
analyzed=0
issues_found=0

# 遍历目标文件（TypeScript 和 JavaScript）
while IFS= read -r -d '' file; do
  total=$((total + 1))
  filename=$(basename "$file")

  # 跳过测试文件和配置文件
  if [[ "$filename" == *.test.* ]] || [[ "$filename" == *.config.* ]]; then
    continue
  fi

  echo "分析: $file"

  # 调用 Claude 分析（带超时保护）
  analysis=$(timeout 60 claude -p "
分析以下代码文件，重点检查：
1. 潜在的 Bug（空指针、边界条件、类型错误）
2. 性能问题（不必要的循环、内存泄露风险）
3. 代码异味（过长函数、重复代码、魔法数字）
4. 缺失的错误处理

输出格式（JSON）：
{
  \"score\": 1-10,
  \"issues\": [\"issue1\", \"issue2\"],
  \"summary\": \"一句话总结\"
}
" --dangerously-skip-permissions \
    --output-format json \
    < "$file" 2>/dev/null || echo '{"score":0,"issues":["分析超时"],"summary":"跳过"}')

  # 提取评分
  score=$(echo "$analysis" | jq -r '.score // 0' 2>/dev/null || echo "0")
  summary=$(echo "$analysis" | jq -r '.summary // "无"' 2>/dev/null || echo "无")

  # 写入报告
  cat >> "$REPORT_FILE" << EOF
## ${file}

- **质量评分：** ${score}/10
- **问题摘要：** ${summary}

EOF

  analyzed=$((analyzed + 1))

  # 低分文件计入问题统计
  if [ "$score" -lt 6 ] 2>/dev/null; then
    issues_found=$((issues_found + 1))
  fi

  # 避免 API 频率限制
  sleep 1

done < <(find "$TARGET_DIR" -type f \( -name "*.ts" -o -name "*.js" \) -print0)

# 写入汇总
cat >> "$REPORT_FILE" << EOF

---

## 汇总统计

| 指标 | 数值 |
|------|------|
| 扫描文件总数 | ${total} |
| 成功分析数 | ${analyzed} |
| 需关注文件数 | ${issues_found} |

EOF

echo ""
echo "分析完成！"
echo "报告已保存至：${REPORT_FILE}"
echo "扫描：${total} 个文件，分析：${analyzed} 个，需关注：${issues_found} 个"
```

### 自动生成提交信息

```bash title="scripts/auto-commit-msg.sh"
#!/bin/bash
# 根据 git diff 自动生成规范的提交信息

DIFF=$(git diff --cached)

if [ -z "$DIFF" ]; then
  echo "没有已暂存的变更"
  exit 1
fi

echo "正在生成提交信息..."

COMMIT_MSG=$(echo "$DIFF" | claude -p "
根据以下 git diff 生成一条规范的 Git 提交信息。

要求：
1. 遵循 Conventional Commits 规范（feat/fix/docs/refactor/test/chore）
2. 标题不超过 72 个字符
3. 使用中文
4. 如有必要，添加简短的 body 说明

只输出提交信息本身，不要其他内容。
" --dangerously-skip-permissions 2>/dev/null)

echo "建议的提交信息："
echo "---"
echo "$COMMIT_MSG"
echo "---"

read -rp "使用此提交信息？(y/n/e[编辑]): " choice
case "$choice" in
  y|Y) git commit -m "$COMMIT_MSG" ;;
  e|E) git commit -e -m "$COMMIT_MSG" ;;
  *) echo "已取消" ;;
esac
```

### 定时代码健康检查

```bash title="scripts/daily-health-check.sh"
#!/bin/bash
# 每日代码健康检查（配合 cron 使用）
# cron: 0 9 * * 1-5 /path/to/daily-health-check.sh

SLACK_WEBHOOK="${SLACK_WEBHOOK_URL:-}"
PROJECT_ROOT="/path/to/your/project"

# 生成健康报告
report=$(git -C "$PROJECT_ROOT" log --since="24 hours ago" --oneline | \
  claude -p "
分析过去 24 小时的提交记录，生成每日健康报告：
1. 活跃度评估
2. 主要工作内容
3. 需要关注的模式（如频繁修复同一模块）

输出简洁的 Slack 消息格式（Markdown）
" --dangerously-skip-permissions 2>/dev/null)

# 发送到 Slack
if [ -n "$SLACK_WEBHOOK" ]; then
  curl -s -X POST "$SLACK_WEBHOOK" \
    -H 'Content-type: application/json' \
    --data "{\"text\": \"*每日代码健康报告*\n${report}\"}"
fi

echo "$report"
```

---

## 最佳实践

:::warning 关于 `--dangerously-skip-permissions`
此参数会跳过所有权限确认提示，**仅适用于 CI/CD 环境或受控的自动化脚本**。在本地开发环境中，建议去掉此参数以保留安全保护。
:::

### 输出处理技巧

```bash
# 仅提取文本输出（过滤系统消息）
claude -p "..." --output-format stream-json | \
  jq -r 'select(.type=="text") | .content' | \
  tr -d '\n'

# 提取最终成本
claude -p "..." --output-format stream-json | \
  jq -r 'select(.type=="result") | "Cost: $\(.cost_usd)"'

# 检查是否执行成功
claude -p "..." --output-format json | jq -e '.exit_code == 0'
```

### 性能优化

| 策略 | 说明 |
|------|------|
| 限制输入大小 | 超大文件先用 `head -n 200` 截取关键部分 |
| 使用 `--max-turns` | 防止复杂任务无限循环 |
| 并行处理 | 使用 `xargs -P 4` 并行分析多个文件 |
| 缓存结果 | 对相同内容的分析结果做本地缓存 |
| 指定模型 | `--model claude-haiku-4-5` 用于简单任务节省成本 |
