---
slug: cicd-integration
title: 案例 5：CI/CD 集成与自动 PR 审查
date: 2026-02-15
authors: [claude-team]
tags: [claude-code, tutorial, automation, parallel]
description: 在 GitHub Actions 中集成 Claude Code，每次 PR 自动触发 AI 审查并发布评论
---

# 案例 5：CI/CD 集成与自动 PR 审查

**场景：** 希望每次提交 PR 时自动获得 AI 审查意见，无需人工触发，审查结果直接作为 PR 评论发布。团队 review 周期从平均 4 小时缩短至 30 分钟。

<!-- truncate -->

---

## 核心思路

```
PR 提交
  → GitHub Actions 触发
    → Claude Code（Headless 模式）分析 diff
      → 输出审查报告
        → 自动发布为 PR 评论
```

Claude Code 的 `-p` 参数（Headless 模式）是实现这一流程的关键——它让 Claude Code 脱离交互界面，以命令行工具的形式在 CI 环境中运行。

---

## 快速接入：5 分钟配置

### 第 1 步：添加 API Key 到 GitHub Secrets

在 GitHub 仓库 Settings → Secrets and variables → Actions 中添加：

```
ANTHROPIC_API_KEY = sk-ant-xxxxxxxxxxxxxxxx
```

### 第 2 步：创建工作流文件

```yaml title=".github/workflows/claude-review.yml"
name: Claude Code Review

on:
  pull_request:
    types: [opened, synchronize, reopened]
    paths:
      - 'src/**'
      - 'tests/**'

jobs:
  review:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      pull-requests: write

    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: 安装 Claude Code
        run: npm install -g @anthropic-ai/claude-code

      - name: 生成 PR Diff
        id: diff
        run: |
          git diff origin/${{ github.base_ref }}...HEAD \
            -- '*.ts' '*.tsx' '*.js' '*.py' \
            > /tmp/pr-diff.txt
          echo "lines=$(wc -l < /tmp/pr-diff.txt)" >> $GITHUB_OUTPUT

      - name: Claude 代码审查
        env:
          ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
        run: |
          REVIEW=$(cat /tmp/pr-diff.txt | claude -p "
          请对以下代码变更进行专业审查，用中文输出，格式如下：

          ## 总体评价
          [简短总结，说明本次变更的质量]

          ## 发现的问题
          [列出 Bug、安全漏洞、性能问题，标注严重程度]

          ## 改进建议
          [具体可操作的优化建议]

          ## 值得肯定的地方
          [优秀的实践值得表扬]
          " --dangerously-skip-permissions 2>/dev/null)

          {
            echo 'REVIEW<<REVIEW_EOF'
            echo "$REVIEW"
            echo 'REVIEW_EOF'
          } >> $GITHUB_ENV

      - name: 发布 PR 评论
        uses: actions/github-script@v7
        with:
          github-token: ${{ secrets.GITHUB_TOKEN }}
          script: |
            const review = process.env.REVIEW;
            await github.rest.issues.createComment({
              owner: context.repo.owner,
              repo: context.repo.repo,
              issue_number: context.issue.number,
              body: `## 🤖 Claude Code 自动审查\n\n${review}\n\n---\n*审查范围：${{ steps.diff.outputs.lines }} 行变更 · ${new Date().toISOString()}*`
            });
```

---

## 进阶配置

### 安全门禁：检测高危问题自动拦截

在工作流中添加安全检查步骤，发现高危问题时阻止 PR 合并：

```yaml
      - name: 安全扫描（高危问题自动拦截）
        env:
          ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
        run: |
          SECURITY_RESULT=$(cat /tmp/pr-diff.txt | claude -p "
          专注于安全角度审查以下代码变更：
          1. SQL 注入
          2. XSS 漏洞
          3. 硬编码密钥或密码
          4. 权限控制缺失
          5. 不安全的反序列化

          如果发现任何高危漏洞，在输出开头加上 [SECURITY_BLOCK]
          " --dangerously-skip-permissions 2>/dev/null)

          if echo "$SECURITY_RESULT" | grep -q "\[SECURITY_BLOCK\]"; then
            echo "❌ 检测到高危安全漏洞，PR 被拦截"
            echo "$SECURITY_RESULT"
            exit 1  # 非零退出码使 CI 失败
          fi
          echo "✅ 安全检查通过"
```

在 Branch Protection Rules 中将此 Job 设为 Required Status Check，PR 有高危漏洞时无法合并。

### 结构化 JSON 输出（便于解析）

对于需要进一步处理审查结果的场景，使用 `--output-format stream-json`：

```yaml
      - name: 结构化审查（供其他工具消费）
        env:
          ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
        run: |
          cat /tmp/pr-diff.txt | claude -p "
          审查代码，输出 JSON 格式：
          {
            \"score\": 1-10,
            \"issues\": [{\"severity\": \"high|medium|low\", \"file\": \"...\", \"description\": \"...\"}],
            \"summary\": \"...\"
          }
          只输出 JSON，不要其他内容
          " --dangerously-skip-permissions \
            --output-format stream-json | \
          jq -r 'select(.type=="text") | .content' > /tmp/review.json

          # 可以进一步处理 JSON，例如创建 GitHub Check 注释
          cat /tmp/review.json
```

### 增量审查（只审查新变更）

避免每次审查整个 PR，只审查新增的提交：

```yaml
      - name: 增量 Diff（只看新提交）
        run: |
          # 获取最新 commit 的变更，而非整个 PR 的 diff
          git diff HEAD~1...HEAD \
            -- '*.ts' '*.py' \
            > /tmp/incremental-diff.txt
```

---

## GitLab CI 接入

```yaml title=".gitlab-ci.yml"
claude-review:
  stage: test
  image: node:20-alpine
  only:
    - merge_requests
  script:
    - npm install -g @anthropic-ai/claude-code
    - git diff $CI_MERGE_REQUEST_DIFF_BASE_SHA...HEAD > /tmp/diff.txt
    - |
      cat /tmp/diff.txt | claude -p "进行代码审查，用中文输出 Markdown 格式报告" \
        --dangerously-skip-permissions > review.md
    - cat review.md
  artifacts:
    paths:
      - review.md
    expire_in: 1 week
  variables:
    ANTHROPIC_API_KEY: $ANTHROPIC_API_KEY  # 在 GitLab CI/CD Variables 中配置
```

---

## 实际效果

发布到 PR 的审查评论示例：

```markdown
## 🤖 Claude Code 自动审查

## 总体评价
本次 PR 实现了 JWT 刷新机制，整体逻辑清晰，但存在一个中等风险的安全问题需要处理。

## 发现的问题
**[Medium] 安全** `src/auth/AuthService.ts:89`
JWT 验证时未检查 `exp`（过期时间）字段，过期的 token 可能仍被接受。
建议：在第 89 行添加 `if (payload.exp < Date.now() / 1000) throw new Error('Token expired')`

**[Low] 质量** `src/auth/routes.ts:45`
`refreshToken` 函数返回 `any` 类型，影响类型安全。

## 改进建议
1. 添加 token 过期检查（必须）
2. 将 refreshToken 返回类型改为 `Promise<TokenPair>`
3. 考虑将刷新逻辑提取为 `TokenRefreshService`，降低 AuthService 的职责

## 值得肯定的地方
- 刷新逻辑与认证逻辑分离得很好
- 错误处理覆盖了主要边界情况
- 测试覆盖了 happy path 和异常情况

---
*审查范围：147 行变更 · 2025-02-18T14:30:00Z*
```

---

## 关键参数说明

| 参数 | 用途 |
|------|------|
| `-p "提示词"` | Headless 模式，非交互式执行 |
| `--dangerously-skip-permissions` | CI 环境必须，跳过交互式权限确认 |
| `--output-format stream-json` | 结构化输出，便于脚本解析 |
| `--max-turns 5` | 限制最大循环次数，防止 CI 超时 |

:::info 关于成本
每次 PR 审查大约消耗 500-2000 个 token（取决于 diff 大小），使用 claude-sonnet-4-6 大约花费 $0.005-0.02，远低于人工 review 的时间成本。可以通过 `head -n 500 /tmp/pr-diff.txt` 截断超大 diff 控制成本。
:::
