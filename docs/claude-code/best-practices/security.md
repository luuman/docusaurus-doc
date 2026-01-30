---
sidebar_position: 3
title: 安全与故障排查
description: Claude Code 安全配置最佳实践，以及常见问题的诊断与解决方案
---

# 安全与故障排查

安全是使用 AI 编程助手的首要考量。本文介绍 Claude Code 的安全配置体系，以及常见问题的系统化解决方案。

---

## 安全配置

### Sandbox 模式

Sandbox 模式通过权限白名单/黑名单机制，精确控制 Claude Code 可以执行的操作，防止意外或恶意的文件/命令操作。

**配置方式一：交互式配置**

```bash
/permissions
# 打开权限配置界面，可视化管理所有权限
```

**配置方式二：直接编辑 settings.json**

```json
// .claude/settings.json
{
  "permissions": {
    "allow": {
      "bash": [
        "git *",
        "npm *",
        "npx *",
        "node *",
        "python *",
        "pytest *",
        "jest *",
        "tsc *",
        "eslint *"
      ],
      "write": [
        "src/**",
        "tests/**",
        "docs/**",
        ".claude/**",
        "*.md",
        "*.json",
        "*.yaml"
      ],
      "read": [
        "**/*"
      ]
    },
    "deny": {
      "bash": [
        "rm -rf *",
        "sudo *",
        "chmod 777 *",
        "curl * | bash",
        "wget * | sh",
        "dd if=*",
        "> /dev/sda*",
        "mkfs *",
        "fdisk *",
        "format *"
      ],
      "write": [
        "/etc/**",
        "/usr/**",
        "/sys/**",
        "/boot/**",
        "~/.ssh/**",
        "~/.aws/**",
        "**/.env",
        "**/*.key",
        "**/*.pem",
        "**/*.p12",
        "**/secrets/**"
      ]
    }
  }
}
```

### 最小权限原则配置示例

根据项目类型，使用最小必要权限：

```json
// 前端项目（极简配置）
{
  "permissions": {
    "allow": {
      "bash": ["npm *", "npx *", "git *"],
      "write": ["src/**", "public/**", "tests/**"],
      "read": ["**/*"]
    },
    "deny": {
      "bash": ["rm -rf *", "sudo *"],
      "write": [".env*", "**/*.key", "/etc/**"]
    }
  }
}
```

```json
// 后端项目（含数据库操作）
{
  "permissions": {
    "allow": {
      "bash": [
        "npm *", "node *", "git *",
        "psql -h localhost *",    // 只允许本地数据库
        "redis-cli -h localhost *"
      ],
      "write": ["src/**", "migrations/**", "tests/**"],
      "read": ["**/*"]
    },
    "deny": {
      "bash": [
        "psql -h production *",   // 禁止连接生产数据库
        "sudo *", "rm -rf *"
      ],
      "write": [".env", "**/*.key", "/etc/**"]
    }
  }
}
```

:::danger 永远不要在生产环境运行 Claude Code
Claude Code 的所有操作都应该在开发/测试环境中进行。即使配置了严格的权限，也存在误操作风险。建议通过 CI/CD 流水线将经过审查的代码部署到生产环境。
:::

---

### Hooks 安全检查

通过 Hooks 机制，在 Claude 执行命令前进行安全校验：

**配置 Pre-execution Hook：**

```json
// .claude/settings.json
{
  "hooks": {
    "preExecution": ".claude/hooks/security-check.sh"
  }
}
```

**创建安全检查脚本：**

```bash
#!/bin/bash
# .claude/hooks/security-check.sh
# 在 Claude 执行 Bash 命令前进行安全检查

COMMAND="$1"

# 定义危险命令黑名单
DANGEROUS_PATTERNS=(
  "rm -rf /"
  "rm -rf ~"
  "rm -rf \*"
  "> /dev/sd"
  "mkfs\."
  "dd if=.*of=/dev/sd"
  "curl.*| *sh"
  "curl.*| *bash"
  "wget.*| *sh"
  "wget.*| *bash"
  "sudo rm"
  "chmod 777 /"
  "chown.*root"
  ":(){ :|:& };:"    # Fork bomb
  "base64 -d.*| *sh" # 混淆执行
)

# 检查命令是否匹配危险模式
for pattern in "${DANGEROUS_PATTERNS[@]}"; do
  if echo "$COMMAND" | grep -qE "$pattern"; then
    echo "❌ 安全检查失败: 检测到危险命令模式: $pattern"
    echo "命令: $COMMAND"
    echo "请手动确认是否需要执行此命令。"
    exit 1  # 返回非零值阻止执行
  fi
done

# 检查是否尝试操作敏感路径
SENSITIVE_PATHS=(
  "/etc/passwd"
  "/etc/shadow"
  "~/.ssh/id_rsa"
  "~/.aws/credentials"
  ".env"
)

for path in "${SENSITIVE_PATHS[@]}"; do
  if echo "$COMMAND" | grep -q "$path"; then
    echo "⚠️  警告: 命令涉及敏感文件路径: $path"
    echo "命令: $COMMAND"
    read -p "确认执行? (yes/no): " confirm
    if [ "$confirm" != "yes" ]; then
      echo "已取消执行。"
      exit 1
    fi
  fi
done

echo "✅ 安全检查通过"
exit 0
```

```bash
# 设置脚本执行权限
chmod +x .claude/hooks/security-check.sh
```

---

### 敏感信息保护

#### 禁止事项

- 将 `.env` 文件或 `secrets.json` 包含在 `@引用` 中
- 在提示词中直接粘贴 API Key、密码或私钥
- 让 Claude 将敏感信息写入版本控制文件
- 使用 Claude 处理包含真实用户数据的文件
- 将生产数据库连接字符串放入 `CLAUDE.md`

#### 推荐做法

- 使用 `.env.example` 代替 `.env`（只包含变量名，不含值）
- 在 `.gitignore` 中确认 `.env*` 和 `*.key` 已排除
- 使用环境变量引用，而非硬编码：`process.env.API_KEY`
- 对包含敏感字段的数据使用脱敏数据进行测试
- 定期轮换 Claude Code 使用的 API Key

```bash
# 检查是否有敏感信息意外提交
!git log --all --full-history -- "**/.env"
!git grep -l "password\|secret\|api_key" -- "*.ts" "*.js"

# 使用 git-secrets 防止意外提交
!git secrets --install
!git secrets --register-aws
```

:::warning 一旦泄露，立即轮换
如果你意外地让 Claude 接触到了真实的 API Key 或密码，无论是否有实际泄露，都应该立即轮换该凭证。宁可多轮换一次，也不要承担安全风险。
:::

---

## 常见问题与解决

### 安装问题

#### Q1：`npm install -g @anthropic-ai/claude-code` 安装失败

**症状：** `EACCES: permission denied` 或 `npm ERR! code EINTEGRITY`

**解决方案一：使用 sudo（快速但不推荐）**

```bash
sudo npm install -g @anthropic-ai/claude-code
# 风险：可能影响系统 npm 目录权限
```

**解决方案二：修改 npm 全局目录（推荐）**

```bash
# 1. 创建用户级 npm 目录
mkdir -p ~/.npm-global

# 2. 配置 npm 使用新目录
npm config set prefix '~/.npm-global'

# 3. 添加到 PATH（添加到 ~/.bashrc 或 ~/.zshrc）
echo 'export PATH=~/.npm-global/bin:$PATH' >> ~/.zshrc
source ~/.zshrc

# 4. 重新安装
npm install -g @anthropic-ai/claude-code
```

**解决方案三：使用 nvm 管理 Node 版本（最佳实践）**

```bash
# 安装 nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
source ~/.bashrc

# 安装 LTS 版 Node
nvm install --lts
nvm use --lts

# 安装 Claude Code（无需 sudo）
npm install -g @anthropic-ai/claude-code
```

---

#### Q2：安装后 `claude` 命令未找到

**症状：** `bash: claude: command not found`

**诊断步骤：**

```bash
# 1. 确认 claude 已安装
npm list -g @anthropic-ai/claude-code

# 2. 找到 npm 全局二进制目录
npm config get prefix
# 输出示例：/home/user/.npm-global

# 3. 检查 PATH 是否包含该目录
echo $PATH | tr ':' '\n' | grep npm

# 4. 如果不包含，手动添加
echo 'export PATH=$(npm config get prefix)/bin:$PATH' >> ~/.zshrc
source ~/.zshrc

# 5. 验证
which claude
claude --version
```

---

### 配置问题

#### Q3：模型配置不生效

**症状：** 设置了 `claude-opus-4-6` 但实际使用的是其他模型

**排查步骤：**

```bash
# 1. 验证环境变量是否正确设置
echo $ANTHROPIC_MODEL
echo $CLAUDE_MODEL

# 2. 检查 settings.json 配置
cat .claude/settings.json | grep model

# 3. 重启终端后再次检查
source ~/.zshrc
echo $ANTHROPIC_MODEL

# 4. 使用 /status 命令检查当前配置
/status
# 输出当前使用的模型、API Key 状态、权限配置等

# 5. 临时指定模型（用于测试）
claude --model claude-opus-4-6 "测试模型配置"
```

**常见原因：**

- 环境变量在当前 Shell 会话中未生效（需要 `source ~/.zshrc`）
- `settings.json` 中的 `model` 字段与环境变量冲突（settings.json 优先级更高）
- 使用了不存在的模型 ID（检查 [官方模型列表](https://docs.anthropic.com/en/api/getting-started)）

---

#### Q4：MCP 服务器无法连接

**症状：** `@mcp:github` 引用报错，或 MCP 功能不可用

**系统化排查流程：**

```bash
# 步骤 1：检查 MCP 服务器状态
/mcp
# 输出所有已配置的 MCP 服务器及其连接状态

# 步骤 2：测试特定 MCP 服务器
/mcp test github
# 执行连接测试并输出详细错误信息

# 步骤 3：查看 MCP 配置
cat .claude/mcp.json

# 步骤 4：重新安装问题 MCP
claude mcp remove github
claude mcp add github
# 或指定版本
npm install -g @modelcontextprotocol/server-github@latest

# 步骤 5：检查网络连接
curl -I https://api.github.com
# 如果失败，检查防火墙或代理设置

# 步骤 6：运行全面诊断
/doctor
# 检查所有组件的健康状态，输出详细诊断报告
```

:::info /doctor 命令的作用
`/doctor` 会检查：Node.js 版本、API Key 有效性、网络连接、MCP 服务器状态、权限配置、文件系统访问等。遇到疑难问题，首先运行 `/doctor`。
:::

---

### 使用问题

#### Q5：上下文超出限制

**症状：** `Context length exceeded` 错误，或 Claude 开始"遗忘"之前的信息

**解决步骤：**

```bash
# 1. 查看当前上下文使用情况
/context
# 输出各部分 Token 占用，找出"大户"

# 2. 压缩历史（推荐首选）
/compact
# 保留关键信息的摘要，清理冗余对话

# 3. 如果 /compact 后仍然超限，清空上下文
/clear
# 然后使用精确的 @引用 重建必要上下文

# 4. 重建上下文时，只引用必要文件
@src/auth/AuthService.ts @src/types/user.ts
# 而不是整个 @src/

# 5. 对于超大型任务，使用 Subagents
# 每个子代理处理一个独立模块，避免单个上下文过大
claude --agent user-module "处理用户模块..."
claude --agent payment-module "处理支付模块..."
```

**预防措施：**

- 每完成一个功能点，执行 `/compact`
- 避免在单次对话中处理超过 3 个大型文件
- 将大型任务拆分为多个子任务，分别处理

---

#### Q6：代码生成质量差

**症状：** 生成的代码不符合项目规范，或频繁需要大量修改

**系统化改进方案：**

```bash
# 1. 完善 CLAUDE.md（最有效的改进方式）
cat >> CLAUDE.md << 'EOF'

## 代码规范（必须遵守）
- 使用函数式组件，禁止 class 组件
- 所有异步操作使用 async/await，禁止 .then() 链式调用
- 错误处理必须使用 try/catch，禁止 .catch()
- 状态管理使用 Zustand，禁止直接使用 React.useState 处理全局状态
- 所有接口必须有 TypeScript 类型定义

## 代码风格示例
// ✅ 正确示范
const fetchUser = async (id: string): Promise<User> => {
  try {
    const response = await api.get<User>(`/users/${id}`);
    return response.data;
  } catch (error) {
    throw new ApiError('Failed to fetch user', error);
  }
};
EOF
```

```bash
# 2. 使用 Plan 模式确认理解
# 让 Claude 先输出计划，确认理解正确再执行
# 按 Shift+Tab 两次进入 Plan 模式

# 3. 提供具体示例
"实现 fetchOrders 方法，参考 @src/services/UserService.ts 中
 fetchUsers 方法的实现风格和错误处理模式"

# 4. 明确约束条件
"实现订单列表组件，要求：
 - 使用 React.memo 优化性能
 - 支持虚拟滚动（使用 react-virtual 库）
 - 骨架屏加载状态
 - 空状态处理
 - 不要使用 any 类型"
```

---

### 性能问题

#### Q7：响应速度慢

**症状：** Claude 响应时间超过 30 秒，或频繁超时

**排查与解决：**

```bash
# 1. 测试网络连接到 Anthropic API
curl -w "@curl-format.txt" -o /dev/null -s https://api.anthropic.com/v1/models \
  -H "x-api-key: $ANTHROPIC_API_KEY"
# 检查 DNS 解析时间、连接时间、总时间

# 2. 切换到更快的模型（响应更快，适合简单任务）
claude --model claude-sonnet-4-5-20250929 "简单的代码问题"
# claude-sonnet 响应速度约是 claude-opus 的 3 倍

# 3. 优化提示词，减少不必要的复杂度
# 避免：
"请详细分析整个项目的所有可能问题..."
# 改为：
"分析 @src/auth.ts 中 login 方法的潜在 Bug"

# 4. 减少上下文大小
/context    # 查看当前使用量
/compact    # 如果超过 50%，立即压缩
```

**网络优化（可选）：**

```bash
# 如果在中国大陆，配置代理
export HTTPS_PROXY=http://127.0.0.1:7890
export HTTP_PROXY=http://127.0.0.1:7890

# 或在 settings.json 中配置
{
  "proxy": "http://127.0.0.1:7890"
}
```

---

#### Q8：Token 消耗过快

**症状：** 账单超出预期，或频繁触发速率限制

**Token 消耗诊断：**

```bash
# 1. 查看当前会话 Token 消耗
/cost
# 输出：本次会话消耗的 Token 数和估算费用

# 2. 使用 /compact 减少历史 Token
/compact
# 效果：通常可以减少 40-60% 的上下文 Token

# 3. 新任务开始时彻底清空
/clear
# 避免将上一个任务的上下文带入新任务

# 4. 简单任务使用便宜的模型
claude --model claude-haiku-20240307 "格式化这段代码"
# Haiku 价格约是 Opus 的 1/20

# 5. 监控使用量
/usage
# 查看今日/本月消耗，设置预算提醒
```

**Token 使用率优化对照：**

| 场景 | 高消耗方式 | 低消耗方式 | 节省比例 |
|------|----------|----------|--------|
| 文件引用 | `@src/` 整个目录 | `@src/auth.ts` 单文件 | 70-90% |
| 任务切换 | 继续之前的对话 | `/clear` 后新开始 | 30-50% |
| 模型选择 | 全程使用 Opus | 按任务选择模型 | 60-80% |
| 上下文管理 | 从不清理 | 定期 `/compact` | 40-60% |

---

## 调试技巧

### 启用调试模式

```bash
# 启用完整调试输出
export CLAUDE_DEBUG=true

# 设置日志级别（debug/info/warn/error）
export CLAUDE_LOG_LEVEL=debug

# 指定日志输出文件
export CLAUDE_LOG_FILE=~/.claude/debug.log

# 启动后查看详细日志
claude
tail -f ~/.claude/debug.log
```

### 常用诊断命令

```bash
# 全面健康检查
claude /doctor
# 检查项目：Node 版本、API 连接、MCP 状态、权限配置、文件系统

# 查看版本信息
claude --version

# 检查 API Key 有效性
claude /status
# 输出：API Key 状态、使用的模型、当前配额

# 查看所有配置
claude /config
# 输出：所有有效的配置项及其来源（全局/项目/环境变量）

# 重置到默认配置（谨慎使用）
claude /reset --confirm
```

### 日志分析技巧

```bash
# 查找错误日志
grep "ERROR\|FATAL" ~/.claude/debug.log | tail -50

# 查看 API 请求统计
grep "API request" ~/.claude/debug.log | wc -l

# 分析 Token 消耗峰值
grep "tokens_used" ~/.claude/debug.log | awk '{print $NF}' | sort -n | tail -10

# 清理旧日志（日志可能很大）
find ~/.claude/logs -name "*.log" -mtime +7 -delete
```

:::tip 提交 Bug 报告时的必要信息
向 Anthropic 提交 Bug 时，请附上：`claude --version` 输出、`/doctor` 报告、相关错误日志（去除敏感信息）、操作系统和 Node.js 版本。这些信息能大幅加速问题定位。
:::

---

## 安全审计清单

在正式使用 Claude Code 之前，按此清单完成安全配置：

| 检查项 | 命令/操作 | 状态 |
|--------|----------|------|
| 权限配置已设置 | 查看 `.claude/settings.json` | [ ] |
| 危险命令已列入黑名单 | `permissions.deny.bash` | [ ] |
| 敏感路径已保护 | `permissions.deny.write` | [ ] |
| `.env` 在 `.gitignore` 中 | `cat .gitignore | grep env` | [ ] |
| Pre-execution Hook 已配置 | `cat .claude/hooks/security-check.sh` | [ ] |
| MCP 服务器权限已最小化 | `/mcp` 检查各服务器权限 | [ ] |
| CLAUDE.md 不含敏感信息 | 人工检查 | [ ] |
| 日志文件不含 API Key | `grep -r "sk-ant" ~/.claude/logs/` | [ ] |

:::info 定期安全审计
建议每月执行一次安全审计，特别是在添加新的 MCP 服务器或修改权限配置后。随着 Claude Code 功能更新，安全最佳实践也会相应演进。
:::
