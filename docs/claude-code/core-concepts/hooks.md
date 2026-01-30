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
| `user-prompt-submit` | 用户提交提示词时 | 内容过滤、提示词增强 |
| `tool-use` | Claude 即将调用工具时（调用前） | 危险命令拦截、权限检查 |
| `after-tool-use` | 工具调用完成后 | 代码格式化、自动测试 |
| `permission-request` | Claude 请求特定权限时 | 权限审批流程 |
| `notification` | Claude 发送通知时 | 消息转发、日志记录 |

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
    "user-prompt-submit-hook": {
      "enabled": true,
      "script": "~/.claude/hooks/prompt-filter.sh",
      "timeout": 5000,
      "on_error": "warn"
    },
    "tool-use-hook": {
      "enabled": true,
      "script": "~/.claude/hooks/safety-check.sh",
      "timeout": 3000,
      "on_error": "block"
    },
    "after-tool-use-hook": {
      "enabled": true,
      "script": "~/.claude/hooks/post-tool.sh",
      "timeout": 10000,
      "on_error": "warn"
    }
  }
}
```

#### 配置字段说明

| 字段 | 类型 | 说明 |
|------|------|------|
| `enabled` | boolean | 是否启用此 Hook |
| `script` | string | 脚本文件路径（支持 `~` 展开） |
| `timeout` | number | 超时时间（毫秒），超时后按 `on_error` 处理 |
| `on_error` | string | 错误处理策略：`warn`（警告继续）、`block`（阻止操作）、`ignore`（忽略） |

---

## 实战示例

### 示例一：拦截危险命令

创建 `~/.claude/hooks/safety-check.sh`，在工具调用前检查是否包含危险操作：

```bash
#!/bin/bash
# safety-check.sh - 拦截危险命令的 tool-use Hook

# 定义危险工具和命令关键词
DANGEROUS_TOOLS=("Bash" "Terminal" "Execute")
DANGEROUS_COMMANDS=(
  "rm -rf"
  "dd if="
  "mkfs"
  "> /dev/sda"
  "chmod 777"
  "sudo rm"
  "DROP TABLE"
  "DROP DATABASE"
)

# 从环境变量中读取工具调用信息
TOOL_NAME="${CLAUDE_TOOL_NAME}"
TOOL_INPUT="${CLAUDE_TOOL_INPUT}"

# 检查是否是危险工具
is_dangerous_tool=false
for tool in "${DANGEROUS_TOOLS[@]}"; do
  if [[ "$TOOL_NAME" == "$tool" ]]; then
    is_dangerous_tool=true
    break
  fi
done

# 如果是命令执行工具，检查命令内容
if [[ "$is_dangerous_tool" == true ]]; then
  for cmd in "${DANGEROUS_COMMANDS[@]}"; do
    if echo "$TOOL_INPUT" | grep -qi "$cmd"; then
      echo "⚠️  安全检查失败：检测到危险命令 '$cmd'"
      echo "操作已被 Hook 拦截。如需执行，请手动在终端中运行。"

      # 记录到审计日志
      echo "[$(date '+%Y-%m-%d %H:%M:%S')] 拦截危险命令: $cmd | 工具: $TOOL_NAME" \
        >> ~/.claude/logs/security-audit.log

      exit 1  # 非零退出码会阻止工具执行
    fi
  done
fi

exit 0  # 零退出码表示检查通过，允许继续
```

```bash
# 赋予执行权限
chmod +x ~/.claude/hooks/safety-check.sh
```

:::warning 重要提示
Hook 脚本的退出码决定了行为：
- **退出码 0**：检查通过，Claude Code 继续执行
- **非零退出码**：检查失败，根据 `on_error` 配置决定是否阻止操作
:::

---

### 示例二：自动格式化代码（PostToolUse Hook）

每次 Claude Code 修改文件后，自动运行相应的格式化工具：

```bash
#!/bin/bash
# post-tool.sh - 自动格式化代码的 after-tool-use Hook

# 从环境变量读取本次工具调用信息
TOOL_NAME="${CLAUDE_TOOL_NAME}"
FILE_PATH="${CLAUDE_MODIFIED_FILE}"

# 只在文件写入操作后触发
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
# prompt-audit.sh - 记录用户提示词的 user-prompt-submit Hook

PROMPT="${CLAUDE_USER_PROMPT}"
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

## 环境变量参考

Hook 脚本执行时，Claude Code 会注入以下环境变量：

| 变量名 | 说明 | 适用事件 |
|-------|------|---------|
| `CLAUDE_TOOL_NAME` | 当前调用的工具名称 | `tool-use`, `after-tool-use` |
| `CLAUDE_TOOL_INPUT` | 工具的输入参数（JSON） | `tool-use` |
| `CLAUDE_TOOL_OUTPUT` | 工具的输出结果 | `after-tool-use` |
| `CLAUDE_MODIFIED_FILE` | 被修改的文件路径 | `after-tool-use`（写入操作） |
| `CLAUDE_USER_PROMPT` | 用户提交的提示词 | `user-prompt-submit` |
| `CLAUDE_SESSION_ID` | 当前会话 ID | 所有事件 |
| `CLAUDE_PROJECT_DIR` | 当前项目根目录 | 所有事件 |
