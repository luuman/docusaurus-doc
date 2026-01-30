---
sidebar_position: 4
title: Claude Agent SDK
description: 将 Claude Code 的核心能力作为 SDK 调用，构建自定义 AI Agent 和自动化工作流
---

# Claude Agent SDK

:::tip 什么是 Agent SDK
Claude Agent SDK 将 Claude Code 的底层核心能力——**Agent Loop**、**工具管理**、**上下文管理**——开放为可编程的 SDK 接口。开发者不再需要从零实现 AI Agent 的基础设施，而是直接在这些能力之上构建业务逻辑。
:::

## 核心概念

Claude Agent SDK 的架构由三个核心层次组成：

```
┌────────────────────────────────────────────────┐
│              你的业务逻辑（Custom Agent）         │
├────────────────────────────────────────────────┤
│   Agent Loop   │   工具管理   │   上下文管理     │
├────────────────────────────────────────────────┤
│              Claude API（底层模型）               │
└────────────────────────────────────────────────┘
```

**Agent Loop（智能体循环）**
Claude 的核心执行引擎，驱动"思考 → 工具调用 → 观察 → 迭代"的循环，直到任务完成。

**工具管理（Tool Management）**
定义 Agent 能够使用哪些工具（文件读写、Shell 命令、HTTP 请求等），SDK 负责工具调用的编排和结果处理。

**上下文管理（Context Management）**
自动管理对话历史、压缩超长上下文、优先级排序，确保 Agent 始终在有效的上下文窗口内工作。

---

## 核心能力代码示例

### 基础 Agent 创建

```typescript title="src/agent-basic.ts"
import { Agent, Tool, Context } from '@anthropic-ai/claude-code-sdk';

// 定义工具：文件读取
const readFileTool = new Tool({
  name: 'read_file',
  description: '读取指定路径的文件内容',
  parameters: {
    type: 'object',
    properties: {
      path: {
        type: 'string',
        description: '文件路径（相对或绝对路径）'
      },
      encoding: {
        type: 'string',
        enum: ['utf-8', 'base64'],
        default: 'utf-8'
      }
    },
    required: ['path']
  },
  execute: async ({ path, encoding = 'utf-8' }) => {
    const fs = await import('fs/promises');
    const content = await fs.readFile(path, encoding as BufferEncoding);
    return { content, path, size: content.length };
  }
});

// 定义工具：Shell 命令执行
const shellTool = new Tool({
  name: 'run_command',
  description: '执行 Shell 命令并返回输出',
  parameters: {
    type: 'object',
    properties: {
      command: { type: 'string', description: '要执行的命令' },
      cwd: { type: 'string', description: '工作目录（可选）' }
    },
    required: ['command']
  },
  execute: async ({ command, cwd = process.cwd() }) => {
    const { exec } = await import('child_process');
    const { promisify } = await import('util');
    const execAsync = promisify(exec);

    try {
      const { stdout, stderr } = await execAsync(command, { cwd });
      return { success: true, stdout, stderr, exitCode: 0 };
    } catch (error: any) {
      return { success: false, stdout: '', stderr: error.message, exitCode: 1 };
    }
  }
});

// 创建上下文配置
const context = new Context({
  maxSize: 100_000,        // 最大 token 数
  compression: 'auto',     // 自动压缩策略
  priority: 'recent',      // 优先保留最近内容
  systemPrompt: `你是一个专业的代码分析助手。
你的目标是帮助开发者理解和改进代码质量。
始终提供具体、可操作的建议。`
});

// 创建并运行基础 Agent
const agent = new Agent({
  model: 'claude-opus-4-5',
  tools: [readFileTool, shellTool],
  context,
  maxIterations: 10,
  onThink: (thought) => console.log('思考中:', thought.slice(0, 100) + '...'),
  onToolUse: (tool, input) => console.log(`工具调用: ${tool}(${JSON.stringify(input)})`),
  onError: (error) => console.error('错误:', error.message),
  onComplete: (result) => console.log('完成:', result.summary)
});

const result = await agent.run('分析 src/ 目录的整体代码质量');
console.log(result.output);
```

---

## 案例 1：自动化测试生成器

将测试生成能力封装为可复用的 Agent，自动为任意源文件生成对应的测试用例。

```typescript title="src/agents/test-generator.ts"
import { Agent, Tool } from '@anthropic-ai/claude-code-sdk';
import * as fs from 'fs/promises';
import * as path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

class TestGenerator extends Agent {
  private sourceDir: string;
  private testDir: string;
  private framework: 'jest' | 'vitest' | 'mocha';

  constructor(options: {
    sourceDir: string;
    testDir: string;
    framework?: 'jest' | 'vitest' | 'mocha';
  }) {
    const readSourceTool = new Tool({
      name: 'read_source',
      description: '读取源代码文件，返回内容和元信息',
      parameters: {
        type: 'object',
        properties: {
          filePath: { type: 'string', description: '源文件路径' }
        },
        required: ['filePath']
      },
      execute: async ({ filePath }: { filePath: string }) => {
        const absolutePath = path.resolve(options.sourceDir, filePath);
        const content = await fs.readFile(absolutePath, 'utf-8');
        const stats = await fs.stat(absolutePath);

        // 提取函数和类的签名（辅助 Claude 理解结构）
        const functionMatches = content.match(/(?:export\s+)?(?:async\s+)?function\s+\w+/g) || [];
        const classMatches = content.match(/(?:export\s+)?class\s+\w+/g) || [];

        return {
          content,
          filePath: absolutePath,
          size: stats.size,
          functions: functionMatches,
          classes: classMatches,
          lines: content.split('\n').length
        };
      }
    });

    const writeTestTool = new Tool({
      name: 'write_test',
      description: '将生成的测试代码写入对应的测试文件',
      parameters: {
        type: 'object',
        properties: {
          sourcePath: { type: 'string', description: '对应的源文件路径' },
          testContent: { type: 'string', description: '测试代码内容' },
          overwrite: { type: 'boolean', description: '是否覆盖已有测试文件', default: false }
        },
        required: ['sourcePath', 'testContent']
      },
      execute: async ({ sourcePath, testContent, overwrite = false }) => {
        // 生成测试文件路径（src/utils/parser.ts → tests/utils/parser.test.ts）
        const relative = path.relative(options.sourceDir, sourcePath);
        const testPath = path.join(
          options.testDir,
          relative.replace(/\.(ts|js|tsx|jsx)$/, '.test.$1')
        );

        // 检查文件是否已存在
        const exists = await fs.access(testPath).then(() => true).catch(() => false);
        if (exists && !overwrite) {
          return { success: false, reason: '测试文件已存在，设置 overwrite=true 覆盖' };
        }

        // 确保目录存在
        await fs.mkdir(path.dirname(testPath), { recursive: true });
        await fs.writeFile(testPath, testContent, 'utf-8');

        return { success: true, testPath, linesWritten: testContent.split('\n').length };
      }
    });

    const runTestsTool = new Tool({
      name: 'run_tests',
      description: '运行指定的测试文件并返回结果',
      parameters: {
        type: 'object',
        properties: {
          testFile: { type: 'string', description: '测试文件路径（可选，不指定则运行全部）' }
        }
      },
      execute: async ({ testFile }: { testFile?: string }) => {
        const framework = options.framework || 'jest';
        const cmd = testFile
          ? `npx ${framework} ${testFile} --no-coverage`
          : `npx ${framework} --no-coverage`;

        try {
          const { stdout, stderr } = await execAsync(cmd, {
            cwd: process.cwd(),
            timeout: 60_000
          });
          return { passed: true, output: stdout, errors: stderr };
        } catch (error: any) {
          return { passed: false, output: error.stdout || '', errors: error.stderr || error.message };
        }
      }
    });

    super({
      model: 'claude-opus-4-5',
      tools: [readSourceTool, writeTestTool, runTestsTool],
      maxIterations: 20,
      systemPrompt: `你是一个专业的测试工程师，擅长为 TypeScript/JavaScript 代码编写高质量的单元测试。

使用 ${options.framework || 'jest'} 测试框架。

测试要求：
1. 测试覆盖正常路径、边界情况和异常情况
2. 使用描述性的测试名称（describe/it/test 块）
3. Mock 外部依赖（HTTP 请求、文件 I/O、数据库）
4. 每个函数至少 3 个测试用例
5. 生成测试后运行验证，修复失败的测试`
    });

    this.sourceDir = options.sourceDir;
    this.testDir = options.testDir;
    this.framework = options.framework || 'jest';
  }

  async generateForFile(filePath: string): Promise<{ testPath: string; coverage: number }> {
    const result = await this.run(
      `为文件 ${filePath} 生成完整的测试套件。
      步骤：1) 读取源文件  2) 分析所有导出  3) 生成测试代码  4) 写入测试文件  5) 运行测试确认通过`
    );

    return {
      testPath: result.metadata?.testPath as string,
      coverage: result.metadata?.coverage as number || 0
    };
  }
}

// 使用示例
const generator = new TestGenerator({
  sourceDir: './src',
  testDir: './tests',
  framework: 'jest'
});

await generator.generateForFile('utils/parser.ts');
await generator.generateForFile('services/auth.ts');
```

---

## 案例 2：代码审查机器人

自动进行代码审查，输出结构化的审查报告，可集成到 CI/CD 流水线。

```typescript title="src/agents/code-reviewer.ts"
import { Agent, Tool } from '@anthropic-ai/claude-code-sdk';
import * as fs from 'fs/promises';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

interface ReviewReport {
  overall: 'approve' | 'request_changes' | 'comment';
  score: number;           // 1-10
  summary: string;
  issues: ReviewIssue[];
  suggestions: string[];
  positives: string[];
}

interface ReviewIssue {
  severity: 'critical' | 'major' | 'minor' | 'info';
  file: string;
  line?: number;
  message: string;
  suggestion?: string;
}

class CodeReviewer extends Agent {
  constructor() {
    const readFileTool = new Tool({
      name: 'read_file',
      description: '读取指定文件的内容',
      parameters: {
        type: 'object',
        properties: {
          path: { type: 'string' },
          startLine: { type: 'number', description: '开始行（可选）' },
          endLine: { type: 'number', description: '结束行（可选）' }
        },
        required: ['path']
      },
      execute: async ({ path, startLine, endLine }: {
        path: string;
        startLine?: number;
        endLine?: number;
      }) => {
        const content = await fs.readFile(path, 'utf-8');
        if (startLine !== undefined && endLine !== undefined) {
          const lines = content.split('\n');
          return lines.slice(startLine - 1, endLine).join('\n');
        }
        return content;
      }
    });

    const gitDiffTool = new Tool({
      name: 'git_diff',
      description: '获取 Git 差异，支持比较分支或提交',
      parameters: {
        type: 'object',
        properties: {
          base: { type: 'string', description: '基础分支或提交（默认: main）' },
          head: { type: 'string', description: '目标分支或提交（默认: HEAD）' },
          file: { type: 'string', description: '仅显示特定文件的差异（可选）' }
        }
      },
      execute: async ({ base = 'main', head = 'HEAD', file }: {
        base?: string;
        head?: string;
        file?: string;
      }) => {
        const fileArg = file ? `-- ${file}` : '';
        const { stdout } = await execAsync(
          `git diff ${base}...${head} ${fileArg}`,
          { maxBuffer: 10 * 1024 * 1024 }
        );
        return stdout;
      }
    });

    super({
      model: 'claude-opus-4-5',
      tools: [readFileTool, gitDiffTool],
      maxIterations: 15,
      systemPrompt: `你是一位资深软件工程师，负责进行严格但建设性的代码审查。

审查重点：
1. 正确性：逻辑错误、边界条件、竞态条件
2. 安全性：SQL 注入、XSS、不安全的反序列化、硬编码密钥
3. 性能：N+1 查询、不必要的计算、内存泄露
4. 可维护性：命名规范、函数职责单一、重复代码
5. 测试覆盖：是否有对应的测试

输出格式要求：
- 输出合法的 JSON，匹配 ReviewReport 接口
- severity 分级：critical（必须修复）/ major（强烈建议）/ minor（建议）/ info（仅供参考）
- overall：只有无 critical/major 问题时才选 approve`
    });
  }

  async reviewPR(baseBranch: string, headBranch: string): Promise<ReviewReport> {
    const result = await this.run(
      `对以下 PR 进行全面代码审查：
      - 基础分支：${baseBranch}
      - 目标分支：${headBranch}

      步骤：
      1. 获取完整 diff
      2. 对每个变更文件进行深度分析
      3. 重点检查安全性和逻辑正确性
      4. 输出符合 ReviewReport 格式的 JSON 审查报告`
    );

    try {
      // 从输出中提取 JSON
      const jsonMatch = result.output.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('无法提取 JSON 报告');
      return JSON.parse(jsonMatch[0]) as ReviewReport;
    } catch {
      // 降级处理
      return {
        overall: 'comment',
        score: 5,
        summary: result.output,
        issues: [],
        suggestions: [],
        positives: []
      };
    }
  }

  formatReport(report: ReviewReport): string {
    const icons = { critical: '🔴', major: '🟠', minor: '🟡', info: '🔵' };
    const overall = { approve: '✅ 批准', request_changes: '❌ 需要修改', comment: '💬 已评论' };

    let output = `# 代码审查报告\n\n`;
    output += `**结论：** ${overall[report.overall]}\n`;
    output += `**质量评分：** ${report.score}/10\n\n`;
    output += `## 总体评价\n${report.summary}\n\n`;

    if (report.issues.length > 0) {
      output += `## 发现的问题\n\n`;
      for (const issue of report.issues) {
        const loc = issue.line ? `${issue.file}:${issue.line}` : issue.file;
        output += `${icons[issue.severity]} **[${issue.severity.toUpperCase()}]** \`${loc}\`\n`;
        output += `  ${issue.message}\n`;
        if (issue.suggestion) output += `  > 建议：${issue.suggestion}\n`;
        output += '\n';
      }
    }

    if (report.positives.length > 0) {
      output += `## 值得肯定\n`;
      report.positives.forEach(p => output += `- ${p}\n`);
    }

    return output;
  }
}

// 使用示例
const reviewer = new CodeReviewer();
const report = await reviewer.reviewPR('main', 'feat/user-auth');
console.log(reviewer.formatReport(report));
```

---

## 案例 3：自动化部署助手

封装完整的部署流程，支持多环境部署、自动回滚和实时状态通知。

```typescript title="src/agents/deployment-bot.ts"
import { Agent, Tool, Context } from '@anthropic-ai/claude-code-sdk';

type Environment = 'staging' | 'production';

interface DeploymentResult {
  success: boolean;
  environment: Environment;
  version: string;
  duration: number;
  rollbackTag?: string;
}

class DeploymentBot extends Agent {
  private environment: Environment;
  private notificationWebhook?: string;

  constructor(environment: Environment, notificationWebhook?: string) {
    const runTestsTool = new Tool({
      name: 'run_tests',
      description: '运行测试套件，返回通过率和失败用例',
      parameters: {
        type: 'object',
        properties: {
          suite: {
            type: 'string',
            enum: ['unit', 'integration', 'e2e', 'all'],
            default: 'all'
          }
        }
      },
      execute: async ({ suite = 'all' }) => {
        const { exec } = await import('child_process');
        const { promisify } = await import('util');
        const execAsync = promisify(exec);

        const cmd = suite === 'all'
          ? 'npm run test:ci'
          : `npm run test:${suite}`;

        try {
          const { stdout } = await execAsync(cmd, { timeout: 300_000 });
          const passMatch = stdout.match(/(\d+) passed/);
          const failMatch = stdout.match(/(\d+) failed/);
          return {
            passed: !failMatch,
            totalPassed: parseInt(passMatch?.[1] || '0'),
            totalFailed: parseInt(failMatch?.[1] || '0'),
            output: stdout.slice(-2000)  // 最后 2000 字符
          };
        } catch (error: any) {
          return { passed: false, error: error.message };
        }
      }
    });

    const buildTool = new Tool({
      name: 'build',
      description: '构建生产包，返回构建产物信息',
      parameters: {
        type: 'object',
        properties: {
          env: { type: 'string', enum: ['staging', 'production'] }
        },
        required: ['env']
      },
      execute: async ({ env }) => {
        const { exec } = await import('child_process');
        const { promisify } = await import('util');
        const execAsync = promisify(exec);

        const start = Date.now();
        await execAsync(`NODE_ENV=${env} npm run build`);
        const duration = Date.now() - start;

        const { stdout: du } = await execAsync('du -sh dist/');
        return { success: true, size: du.split('\t')[0], duration };
      }
    });

    const deployTool = new Tool({
      name: 'deploy',
      description: '将构建产物部署到指定环境',
      parameters: {
        type: 'object',
        properties: {
          environment: { type: 'string', enum: ['staging', 'production'] },
          dryRun: { type: 'boolean', description: '演习模式（不实际部署）', default: false }
        },
        required: ['environment']
      },
      execute: async ({ environment, dryRun = false }) => {
        if (dryRun) {
          return { success: true, dryRun: true, message: '演习模式：部署命令验证通过' };
        }
        const { exec } = await import('child_process');
        const { promisify } = await import('util');
        const execAsync = promisify(exec);

        await execAsync(`npm run deploy:${environment}`);
        return { success: true, environment, deployedAt: new Date().toISOString() };
      }
    });

    const verifyTool = new Tool({
      name: 'verify',
      description: '验证部署后的服务健康状态',
      parameters: {
        type: 'object',
        properties: {
          environment: { type: 'string' },
          checks: {
            type: 'array',
            items: { type: 'string' },
            description: '要检查的端点列表'
          }
        },
        required: ['environment']
      },
      execute: async ({ environment, checks = ['/health', '/api/status'] }) => {
        const baseUrl = environment === 'production'
          ? process.env.PROD_URL
          : process.env.STAGING_URL;

        const results = await Promise.all(
          checks.map(async (endpoint: string) => {
            try {
              const { default: fetch } = await import('node-fetch');
              const res = await fetch(`${baseUrl}${endpoint}`, { timeout: 10_000 } as any);
              return { endpoint, status: res.status, ok: res.ok };
            } catch (err: any) {
              return { endpoint, status: 0, ok: false, error: err.message };
            }
          })
        );

        return {
          allPassed: results.every(r => r.ok),
          results
        };
      }
    });

    const rollbackTool = new Tool({
      name: 'rollback',
      description: '回滚到指定版本',
      parameters: {
        type: 'object',
        properties: {
          tag: { type: 'string', description: 'Git tag 或部署 ID' },
          environment: { type: 'string' }
        },
        required: ['tag', 'environment']
      },
      execute: async ({ tag, environment }) => {
        const { exec } = await import('child_process');
        const { promisify } = await import('util');
        const execAsync = promisify(exec);

        await execAsync(`git checkout ${tag}`);
        await execAsync(`npm run deploy:${environment}`);
        return { success: true, rolledBackTo: tag, environment };
      }
    });

    const notifyTool = new Tool({
      name: 'notify',
      description: '发送部署状态通知到 Slack/飞书',
      parameters: {
        type: 'object',
        properties: {
          status: { type: 'string', enum: ['started', 'success', 'failure', 'rollback'] },
          message: { type: 'string' },
          details: { type: 'object' }
        },
        required: ['status', 'message']
      },
      execute: async ({ status, message, details }) => {
        if (!notificationWebhook) return { sent: false, reason: '未配置 webhook' };

        const emoji = { started: '🚀', success: '✅', failure: '❌', rollback: '↩️' }[status];
        const payload = {
          text: `${emoji} *部署通知*: ${message}`,
          attachments: details ? [{ text: JSON.stringify(details, null, 2) }] : []
        };

        const { default: fetch } = await import('node-fetch');
        await fetch(notificationWebhook, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        return { sent: true };
      }
    });

    const context = new Context({
      maxSize: 80_000,
      compression: 'auto',
      priority: 'recent',
      systemPrompt: `你是一个专业的 DevOps 助手，负责安全、可靠地执行部署流程。

部署原则：
1. 安全第一：测试未通过绝不部署
2. 谨慎操作：生产部署前必须在 Staging 验证
3. 留有后路：部署前创建回滚点
4. 及时通知：每个关键节点通知团队
5. 快速响应：发现问题立即触发回滚`
    });

    super({
      model: 'claude-opus-4-5',
      tools: [runTestsTool, buildTool, deployTool, verifyTool, rollbackTool, notifyTool],
      context,
      maxIterations: 30
    });

    this.environment = environment;
    this.notificationWebhook = notificationWebhook;
  }

  async deploy(version: string): Promise<DeploymentResult> {
    const startTime = Date.now();

    const result = await this.run(`
执行 ${this.environment} 环境部署，版本：${version}

部署流程：
1. 发送"部署开始"通知
2. 运行完整测试套件（unit + integration）
3. 如测试通过：构建 ${this.environment} 包
4. ${this.environment === 'production' ? '先部署 staging 验证，再部署 production' : '部署到 staging'}
5. 验证部署后健康状态
6. 发送"部署成功/失败"通知
7. 如失败：执行回滚并通知

关键约束：任何步骤失败都必须停止并回滚，不允许带着问题继续。
    `);

    return {
      success: !result.output.includes('失败') && !result.output.includes('回滚'),
      environment: this.environment,
      version,
      duration: Date.now() - startTime
    };
  }
}

// 使用示例
const bot = new DeploymentBot('production', process.env.SLACK_WEBHOOK);
const result = await bot.deploy('v2.3.1');

console.log(`部署${result.success ? '成功' : '失败'}`);
console.log(`耗时：${(result.duration / 1000).toFixed(1)}s`);
```

---

## 核心优势

### 1. 完整的 Agent Loop

Agent SDK 内置了经过生产验证的执行引擎：

```
                    ┌─────────────────────────────┐
                    │         任务输入             │
                    └─────────────┬───────────────┘
                                  ↓
                    ┌─────────────────────────────┐
             ┌─── │   Thinking（深度思考）        │
             │    └─────────────┬───────────────┘
             │                  ↓
             │    ┌─────────────────────────────┐
             │    │   Tool Use（工具调用）        │
             │    └─────────────┬───────────────┘
    循         │                  ↓
    环         │    ┌─────────────────────────────┐
    执         │    │   Observation（结果观察）     │
    行         │    └─────────────┬───────────────┘
             │                  ↓
             │    ┌─────────────────────────────┐
             └─── │   Iteration（决策下一步）     │
                  └─────────────┬───────────────┘
                                  ↓ 任务完成
                    ┌─────────────────────────────┐
                    │         结果输出             │
                    └─────────────────────────────┘
```

### 2. 强大的上下文管理

```typescript
const context = new Context({
  maxSize: 100_000,          // 最大 100K token
  compression: 'auto',       // 自动压缩策略
  priority: 'recent',        // 优先保留最近内容
  preservePatterns: [        // 永远保留的内容模式
    /ERROR:/,
    /CRITICAL:/,
    /## 部署计划/
  ],
  onCompress: (before, after) => {
    console.log(`上下文压缩：${before} → ${after} tokens`);
  }
});
```

### 3. 灵活的工具系统

```typescript
// 工具可以是同步或异步
const syncTool = new Tool({ execute: ({ x }) => x * 2 });

// 工具可以调用外部 API
const apiTool = new Tool({
  execute: async ({ endpoint }) => {
    const res = await fetch(endpoint);
    return res.json();
  }
});

// 工具可以执行 Shell 命令
const shellTool = new Tool({
  execute: async ({ cmd }) => {
    const { stdout } = await execAsync(cmd);
    return stdout;
  }
});

// 工具可以是其他 Agent（Multi-Agent）
const subAgent = new Agent({ ... });
const agentTool = new Tool({
  execute: async ({ task }) => subAgent.run(task)
});
```

### 4. 完整的可观测性

```typescript
const agent = new Agent({
  onThink: (thought, iteration) => {
    console.log(`[迭代 ${iteration}] 思考:`, thought.slice(0, 200));
  },
  onToolUse: (toolName, input, output) => {
    console.log(`工具: ${toolName}`);
    console.log(`输入:`, JSON.stringify(input).slice(0, 100));
    console.log(`输出:`, JSON.stringify(output).slice(0, 100));
  },
  onError: (error, context) => {
    console.error(`错误 [${context.iteration}]:`, error.message);
    // 可以选择重试或降级处理
  },
  onComplete: (result) => {
    console.log(`完成！`);
    console.log(`- 总迭代次数：${result.iterations}`);
    console.log(`- 工具调用次数：${result.toolCalls}`);
    console.log(`- Token 消耗：${result.tokenUsage}`);
    console.log(`- 耗时：${result.duration}ms`);
  }
});
```

---

## 使用场景

| 场景 | Agent 示例 | 主要工具 | 价值 |
|------|-----------|----------|------|
| **CI/CD 集成** | 代码审查机器人、部署助手 | gitDiff、deploy、notify | 自动化质量门禁，减少人工干预 |
| **自动化运维** | 监控告警处理、日志分析 | readLogs、callAPI、runScript | 7x24 小时无人值守响应 |
| **文档生成** | API 文档生成器、变更日志生成 | readSource、writeDoc、gitLog | 文档与代码始终同步 |
| **代码迁移** | 框架升级助手、依赖迁移工具 | readFile、writeFile、runTests | 大规模代码变更的安全执行 |
| **教学工具** | 代码讲解助手、练习生成器 | readFile、explainCode | 个性化学习体验 |

:::note 注意事项
Agent SDK 目前处于早期访问阶段，API 可能发生变化。在生产环境使用前，建议锁定依赖版本并充分测试。

使用 `--dangerously-skip-permissions` 或 SDK 的 `skipPermissions: true` 时，请确保 Agent 运行在受控环境中，避免误操作生产数据。
:::
