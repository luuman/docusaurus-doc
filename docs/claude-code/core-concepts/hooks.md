---
sidebar_position: 2
title: Hooks（钩子）
description: Hooks 是在特定事件触发时自动执行的脚本，用于拦截、增强或自动化 Claude Code 的行为
---

# Hooks（钩子）

## 什么是 Hooks

Hooks 是 Claude Code 的事件驱动自动化机制。当特定事件发生时（如用户提交提示词、工具被调用等），Claude Code 会自动执行预配置的脚本。

:::info 核心价值
通过 Hooks，你可以在不修改 Claude Code 源码的情况下，为其添加自定义行为——拦截危险操作、自动格式化代码、记录审计日志、发送通知等。
:::

Hooks 的典型应用场景：

- **安全防护**：拦截可能危险的命令执行
- **代码质量**：每次文件修改后自动运行格式化工具
- **审计合规**：记录所有 AI 操作到日志系统
- **团队通知**：重要操作完成后发送 Slack/邮件通知
- **自动测试**：代码变更后自动触发测试套件

---

## Hook 事件类型

| 事件名称 | 触发时机 | 常见用途 |
|---------|---------|---------|
| `UserPromptSubmit` | 用户提交提示词时 | 内容过滤、提示词增强 |
| `PreToolUse` | Claude 即将调用工具前 | 危险命令拦截、权限检查 |
| `PostToolUse` | 工具调用完成后 | 代码格式化、自动测试 |
| `Stop` | Claude 完成当前回复时 | 自动触发后续任务、记录会话 |
| `SubagentStop` | 子代理完成任务时 | 子任务结果汇总、通知 |
| `Notification` | Claude 发送通知时 | 消息转发、桌面通知 |
| `SessionStart` | 会话启动时 | 环境准备、上下文预加载 |

---

## 配置方式

### 方式一：通过命令配置

在 Claude Code 中运行：

```
/hooks
```

这会打开交互式 Hook 配置界面，可以添加、编辑或删除 Hooks。

### 方式二：直接编辑配置文件

编辑 `~/.claude/settings.json`（全局）或 `.claude/settings.json`（项目级）：

```json
{
  "hooks": {
    "UserPromptSubmit": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "~/.claude/hooks/prompt-filter.sh"
          }
        ]
      }
    ],
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [
          {
            "type": "command",
            "command": "~/.claude/hooks/safety-check.sh"
          }
        ]
      }
    ],
    "PostToolUse": [
      {
        "matcher": "Write|Edit|MultiEdit",
        "hooks": [
          {
            "type": "command",
            "command": "~/.claude/hooks/post-tool.sh"
          }
        ]
      }
    ],
    "SessionStart": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "~/.claude/hooks/session-init.sh"
          }
        ]
      }
    ],
    "Stop": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "~/.claude/hooks/on-complete.sh"
          }
        ]
      }
    ]
  }
}
```

#### 配置字段说明

| 字段 | 类型 | 说明 |
|------|------|------|
| `matcher` | string | 正则表达式，匹配工具名称（如 `"Bash"`、`"Write\|Edit"`）。不填则匹配所有 |
| `type` | string | Hook 类型，目前仅支持 `"command"` |
| `command` | string | 要执行的脚本路径（支持 `~` 展开） |

:::info 退出码决定行为
- **PreToolUse**：脚本退出码非零 → 阻止工具调用，Claude 收到错误信息
- **其他事件**：退出码仅影响错误日志，不阻止操作
:::

#### Hook 脚本接收输入

Hook 脚本通过 **stdin 接收 JSON 数据**，包含当前上下文信息：

| 事件 | stdin JSON 内容 |
|------|----------------|
| `UserPromptSubmit` | `{"prompt": "用户输入的内容", "session_id": "..."}` |
| `PreToolUse` | `{"tool_name": "Bash", "tool_input": {"command": "ls"}}` |
| `PostToolUse` | `{"tool_name": "Write", "tool_input": {...}, "tool_response": {...}}` |
| `Stop` | `{"stop_reason": "end_turn", "session_id": "..."}` |
| `SessionStart` | `{"session_id": "...", "cwd": "/path/to/project"}` |
| `Notification` | `{"message": "通知内容"}` |

在脚本中读取 stdin：

```bash
#!/bin/bash
# 读取 JSON 输入
INPUT=$(cat)
TOOL_NAME=$(echo "$INPUT" | jq -r '.tool_name // ""')
COMMAND=$(echo "$INPUT" | jq -r '.tool_input.command // ""')
```

---

## 实战示例

### 示例一：拦截危险命令

创建 `~/.claude/hooks/safety-check.sh`，在工具调用前检查是否包含危险操作：

```bash
#!/bin/bash
# safety-check.sh - 拦截危险命令的 PreToolUse Hook

# 读取 stdin JSON 输入
INPUT=$(cat)
TOOL_NAME=$(echo "$INPUT" | jq -r '.tool_name // ""')
COMMAND=$(echo "$INPUT" | jq -r '.tool_input.command // ""')

# 只对 Bash 工具进行检查（也可以在 matcher 中直接过滤）
if [[ "$TOOL_NAME" != "Bash" ]]; then
  exit 0
fi

# 定义危险命令关键词
DANGEROUS_COMMANDS=(
  "rm -rf /"
  "rm -rf ~"
  "dd if="
  "mkfs"
  "> /dev/sda"
  "chmod 777 /"
  "sudo rm -rf"
  "DROP DATABASE"
)

# 检查命令内容
for pattern in "${DANGEROUS_COMMANDS[@]}"; do
  if echo "$COMMAND" | grep -qi "$pattern"; then
    echo "⚠️  安全检查失败：检测到危险命令模式 '$pattern'"
    echo "操作已被 Hook 拦截。如需执行，请手动在终端中运行。"

    # 记录到审计日志
    mkdir -p ~/.claude/logs
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] 拦截危险命令: $pattern | 命令: $COMMAND" \
      >> ~/.claude/logs/security-audit.log

    exit 1  # 非零退出码阻止工具执行
  fi
done

exit 0  # 零退出码：检查通过，允许继续
```

```bash
# 赋予执行权限
chmod +x ~/.claude/hooks/safety-check.sh
```

---

### 示例二：自动格式化代码（PostToolUse Hook）

每次 Claude Code 修改文件后，自动运行相应的格式化工具：

```bash
#!/bin/bash
# post-tool.sh - 自动格式化代码的 PostToolUse Hook

# 从 stdin 读取 JSON 输入
INPUT=$(cat)
TOOL_NAME=$(echo "$INPUT" | jq -r '.tool_name // ""')
FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // ""')

# 只在文件写入操作后触发（matcher 也可以在配置中过滤）
if [[ "$TOOL_NAME" != "Write" && "$TOOL_NAME" != "Edit" && "$TOOL_NAME" != "MultiEdit" ]]; then
  exit 0
fi

# 检查文件是否存在
if [[ -z "$FILE_PATH" || ! -f "$FILE_PATH" ]]; then
  exit 0
fi

# 根据文件类型选择格式化工具
case "${FILE_PATH##*.}" in
  js|jsx|ts|tsx)
    if command -v prettier &>/dev/null; then
      prettier --write "$FILE_PATH" --quiet
      echo "✓ Prettier 已格式化: $FILE_PATH"
    fi
    ;;
  py)
    if command -v black &>/dev/null; then
      black "$FILE_PATH" --quiet
      echo "✓ Black 已格式化: $FILE_PATH"
    fi
    if command -v isort &>/dev/null; then
      isort "$FILE_PATH" --quiet
    fi
    ;;
  go)
    if command -v gofmt &>/dev/null; then
      gofmt -w "$FILE_PATH"
      echo "✓ gofmt 已格式化: $FILE_PATH"
    fi
    ;;
  rs)
    if command -v rustfmt &>/dev/null; then
      rustfmt "$FILE_PATH" --quiet 2>/dev/null
      echo "✓ rustfmt 已格式化: $FILE_PATH"
    fi
    ;;
  json)
    if command -v jq &>/dev/null; then
      tmp=$(mktemp)
      jq '.' "$FILE_PATH" > "$tmp" && mv "$tmp" "$FILE_PATH"
      echo "✓ jq 已格式化: $FILE_PATH"
    fi
    ;;
esac

exit 0
```

---

### 示例三：提示词内容审计（UserPromptSubmit Hook）

记录所有用户提示词到审计日志：

```bash
#!/bin/bash
# prompt-audit.sh - 记录用户提示词的 UserPromptSubmit Hook

# 从 stdin 读取 JSON 输入
INPUT=$(cat)
PROMPT=$(echo "$INPUT" | jq -r '.prompt // ""')
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')
LOG_DIR="$HOME/.claude/logs"
LOG_FILE="$LOG_DIR/prompt-audit.log"

# 确保日志目录存在
mkdir -p "$LOG_DIR"

# 记录提示词（截断超长内容）
PROMPT_PREVIEW=$(echo "$PROMPT" | head -c 200)
echo "[$TIMESTAMP] PROMPT: $PROMPT_PREVIEW" >> "$LOG_FILE"

exit 0
```

---

## Hook 脚本最佳实践

:::tip 开发建议

1. **始终设置超时**：避免 Hook 脚本卡死导致 Claude Code 无响应
2. **幂等性设计**：Hook 可能被重复调用，脚本应能安全地重复执行
3. **详细的错误输出**：错误信息会显示给用户，应清晰说明问题
4. **使用绝对路径**：Hook 脚本中的命令使用完整路径，避免 PATH 问题
5. **日志记录**：将重要事件记录到文件，方便事后审查
:::

:::warning 性能注意
Hook 脚本在主流程中同步执行，耗时较长的脚本会影响 Claude Code 的响应速度。建议：
- 将耗时操作改为异步（后台执行）
- 合理设置 `timeout` 值
- 避免在 Hook 中进行网络请求（除非必要）
:::

---

## stdin JSON 字段速查

Hook 脚本通过 stdin 接收 JSON 数据。各事件的完整字段如下：

| 事件 | 字段 | 类型 | 说明 |
|------|------|------|------|
| `UserPromptSubmit` | `prompt` | string | 用户输入的提示词内容 |
| `UserPromptSubmit` | `session_id` | string | 当前会话 ID |
| `PreToolUse` | `tool_name` | string | 即将调用的工具名称（如 `Bash`、`Write`） |
| `PreToolUse` | `tool_input` | object | 工具的输入参数（结构因工具而异） |
| `PreToolUse` | `session_id` | string | 当前会话 ID |
| `PostToolUse` | `tool_name` | string | 已完成调用的工具名称 |
| `PostToolUse` | `tool_input` | object | 工具的输入参数 |
| `PostToolUse` | `tool_response` | object | 工具的执行结果 |
| `PostToolUse` | `session_id` | string | 当前会话 ID |
| `Stop` | `stop_reason` | string | 停止原因（如 `end_turn`） |
| `Stop` | `session_id` | string | 当前会话 ID |
| `SessionStart` | `session_id` | string | 当前会话 ID |
| `SessionStart` | `cwd` | string | 当前工作目录路径 |
| `Notification` | `message` | string | 通知内容文本 |

读取字段的标准写法：

```bash
INPUT=$(cat)
# 用 // "" 提供默认值，避免字段缺失时报错
TOOL_NAME=$(echo "$INPUT" | jq -r '.tool_name // ""')
FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // ""')
SESSION_ID=$(echo "$INPUT" | jq -r '.session_id // ""')
```

---

## 🎯 实战案例：Hooks 如何提升工作效率

### 案例 1：代码自动格式化 + 质量检查

**场景：** 团队成员经常提交格式不统一的代码，代码审查中 30% 的时间浪费在风格问题上。

**传统方式：**
- Claude Code 生成代码 → 手动运行格式化工具 → 手动运行 linter → 提交
- 每次修改需要 5-10 分钟的手动步骤

**使用 Hooks：**

```bash
# 配置 PostToolUse Hook 自动格式化
PostToolUse → Write/Edit/MultiEdit 操作
  ↓
自动运行 Prettier（格式化）
自动运行 ESLint（代码质量）
自动运行 TypeScript 检查
  ↓
输出格式统一 + 质量达标的代码
```

**效果对比：**
| 指标 | 传统方式 | 使用 Hooks |
|------|---------|----------|
| 单次代码修改的手动步骤 | 5-10 分钟 | 0 分钟（自动） |
| 代码审查中的风格问题 | 30% | 0% |
| 每周节省时间 | — | 10-15 小时 |

**年度效益：** **节省 500+ 小时**开发时间

---

### 案例 2：提交前自动运行测试

**场景：** 开发者经常忘记在提交前运行测试，导致主分支 CI 失败，浪费 20 分钟 debug 时间。

**传统方式：**
- 手动运行 `npm test` → 等待结果 → 修复问题 → 再次提交
- 平均每个团队成员每周遇到 3-4 次 CI 失败

**使用 Hooks：**

```bash
# 配置 PreToolUse Hook，在 Bash 命令中检测 git push
if "git push" detected:
  ↓
自动运行完整测试套件
测试失败 → 阻止提交，显示错误
测试通过 → 允许提交继续
```

**Hook 脚本示例：**

```bash
#!/bin/bash
INPUT=$(cat)
COMMAND=$(echo "$INPUT" | jq -r '.tool_input.command // ""')

# 检测是否是 git push 命令
if echo "$COMMAND" | grep -q "git push"; then
  echo "📋 提交前检查：自动运行测试..."

  # 运行测试
  if npm test; then
    exit 0  # 测试通过，允许 push
  else
    echo "❌ 测试失败，已阻止提交。请修复后重试。"
    exit 1  # 阻止 push
  fi
fi

exit 0
```

**效果对比：**
| 指标 | 传统方式 | 使用 Hooks |
|------|---------|----------|
| 周 CI 失败次数 | 3-4 次 | 0 次 |
| 每次 CI 失败的修复时间 | 20 分钟 | — |
| 每个月节省时间 | — | 4-6 小时 |

**年度效益：** **节省 48-72 小时**，且零 CI 失败

---

### 案例 3：审计和合规性记录

**场景：** 企业级应用需要追踪所有 AI 操作的审计日志（合规要求）。

**传统方式：**
- 手动记录日志 → 管理日志文件 → 审查和分析
- 每月审计工作 4-6 小时

**使用 Hooks：**

```bash
# 配置多个 Hook 自动记录审计日志
UserPromptSubmit → 记录用户提示词
PostToolUse → 记录所有文件修改
PreToolUse → 记录危险命令尝试
  ↓
自动生成日志文件
日志包含：时间戳、操作者、操作类型、文件路径、修改内容哈希
```

**自动化审计日志示例：**

```bash
#!/bin/bash
# audit-hook.sh - 审计日志记录
INPUT=$(cat)
TOOL_NAME=$(echo "$INPUT" | jq -r '.tool_name // ""')
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')
USER=$(whoami)

LOG_FILE="$HOME/.claude/audit.log"
mkdir -p "$(dirname "$LOG_FILE")"

# 记录操作
echo "[$TIMESTAMP] USER=$USER TOOL=$TOOL_NAME COMMAND=$INPUT" >> "$LOG_FILE"

# 定期汇总（每 100 条记录生成报告）
if [ $(wc -l < "$LOG_FILE") -gt 100 ]; then
  echo "[$(date)] 生成月度审计报告..."
  cp "$LOG_FILE" "$LOG_FILE.$(date +%Y%m%d).bak"
  : > "$LOG_FILE"  # 清空当前日志
fi

exit 0
```

**效果对比：**
| 指标 | 传统方式 | 使用 Hooks |
|------|---------|----------|
| 审计日志记录 | 手动 | 全自动 |
| 审计覆盖率 | 70% | 100% |
| 月度审计工作 | 4-6 小时 | 0 小时（自动生成报告） |
| 日志准确性 | 中等 | 完美 |

**年度效益：** **节省 48-72 小时**，且提升合规性

---

### 案例 4：跨团队协作通知

**场景：** 大型团队分布在不同模块，某个重要文件修改需要及时通知相关人员。

**传统方式：**
- Claude Code 修改文件后，手动在 Slack 通知相关人员
- 容易遗漏、延迟通知

**使用 Hooks：**

```bash
# 配置 PostToolUse Hook，在关键文件修改后自动发送通知
PostToolUse → Edit/Write 操作:
  if 文件在监视列表中:
    ↓
  发送 Slack 通知
  包含：修改者、文件路径、修改摘要、Git diff 链接
```

**Hook 脚本：**

```bash
#!/bin/bash
INPUT=$(cat)
FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // ""')

# 监视的关键文件
WATCH_FILES=(
  "src/auth/*"
  "src/database/schema.sql"
  "package.json"
  "docker-compose.yml"
)

# 检查文件是否在监视列表中
for pattern in "${WATCH_FILES[@]}"; do
  if [[ "$FILE_PATH" == $pattern ]]; then
    # 发送 Slack 通知
    curl -X POST "$SLACK_WEBHOOK" \
      -H 'Content-Type: application/json' \
      -d "{
        \"text\": \"⚠️ 关键文件已修改: $FILE_PATH\",
        \"channel\": \"#dev-alerts\"
      }"
    break
  fi
done

exit 0
```

**效果对比：**
| 指标 | 传统方式 | 使用 Hooks |
|------|---------|----------|
| 通知延迟 | 5-30 分钟 | 实时（&lt;1 秒） |
| 通知完整性 | 70% | 100% |
| 人工操作 | 每次通知都需要 | 零 |

**年度效益：** **提升协作效率**，减少沟通成本

---

## 💡 Hooks 使用建议

### 最适合的场景

✅ **代码质量自动化**
- 自动格式化、linting、测试
- 可节省 **20-30% 的代码审查时间**

✅ **安全和合规**
- 危险命令拦截
- 审计日志记录
- 关键文件访问控制

✅ **工作流自动化**
- 提交前检查
- 自动生成报告
- 团队通知

✅ **性能优化**
- 自动清理临时文件
- 缓存管理
- 资源监控

### 性能注意

⚠️ Hook 脚本在主流程中同步执行
- 避免超过 10 秒的操作
- 对于耗时任务，使用 `timeout` 和后台执行
- 定期监控 Hook 执行时间

### 调试 Hooks

```bash
# 查看 Hook 执行日志
tail -f ~/.claude/logs/hook-debug.log

# 临时禁用 Hooks（用于故障排除）
export CLAUDE_DISABLE_HOOKS=1
claude
```
