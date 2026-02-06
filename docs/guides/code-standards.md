# 代码规范

> 项目开发规范，包括 Git 提交规范、编码规范和内部资源。

## Git 提交规范

项目使用 `commitlint` 校验提交信息，格式为：

```
<type>(<scope>): <description>
```

### Type 类型

| tag | 描述 |
|-----|------|
| `feat` | 新功能 |
| `fix` | 修复 |
| `docs` | 文档变更 |
| `style` | 代码格式（不影响代码运行的变动） |
| `refactor` | 重构（不是新增 feature，也不是修复 bug） |
| `pref` | 性能优化 |
| `test` | 增加测试 |
| `chore` | 构建过程或辅助工具的变动 |
| `revert` | 回退 |
| `build` | 打包 |
| `merge` | 合并分支 |
| `ci` | CI 构建 |

### 示例

```bash
git commit -m 'feat(meeting join): 加入会议功能'
git commit -m 'fix(account): 修复8459的bug，发送消息失败'
git commit -m 'refactor: 重构xx.vue文件'
```

### commitlint 配置

```javascript
// commitlint.config.js
module.exports = {
    extends: ['@commitlint/config-conventional'],
    rules: {
        'type-enum': [
            2,
            'always',
            ['feat', 'fix', 'docs', 'style', 'refactor', 'pref', 'test', 'chore', 'revert', 'build', 'merge', 'ci']
        ],
        'subject-case': [0]
    }
};
```

## 编码规范

### 开发工具

- 使用 **VSCode** 编辑器
- 依赖 `settings.json` 进行代码规范落地

### 必装 VSCode 插件

| 插件 | 用途 |
|------|------|
| Debugger for Chrome | 调试 |
| GitLens | Git 查看 |
| Prettier | 代码风格 |
| Prettier ESLint | 规范和风格 |
| Vetur | Vue 插件 |

### 代码提交前

运行 `npm run lint:fix` 进行代码风格修复。

### 文档注释规范

使用 JSDoc 风格：

```javascript
/**
 * @description 递归扁平化
 * @param {array} arr 扁平化数组
 * @param {boolean} isObjBack 是否返回对象
 */
```

## 内部资源

### 开发工具

| 工具 | 用途 |
|------|------|
| NetLimiter 4 (x64) | 网络限制器（弱网测试） |
| DB Browser (SQLCipher) | 数据库查看 |
| LookHandles | 进程分析器 |
| decrypt | 日志解密工具 |

### 内部平台

| 平台 | 用途 |
|------|------|
| [禅道](https://chandao.corp.matrx.team/) | 项目管理 |
| [Gitlab](https://gitlab.corp.matrx.team/) | 代码仓库 |
| [Jenkins](https://jenkins-apk.corp.matrx.team/) | CI/CD 编译 |
| [SonarQube](https://sonar.corp.matrx.team/) | 代码扫描 |
| [下包地址](https://matrx-app.corp.matrx.team/) | 安装包发布 |
| [日志后台](https://fed.corp.matrx.team/matrx-log/) | 线上日志查看 |
| [Atlassian Wiki](https://matrx.atlassian.net/) | 文档协作 |
