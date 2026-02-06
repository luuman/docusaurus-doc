<!-- ## 前端规范

##

0. 使用 vscode 编辑器开发，依赖于 setting.json 进行代码规范（编码规范、代码风格）的落地，及配套的 vscode 扩展插件
1. 扩展插件需安装 debugger for chrome(调试) GitLens (git 查看) Prettier (代码风格) Prettier Eslint(规范和风格) Vetur (vue 插件)
2. 通过运行 lint:fix 进行提交前修复。

### git 规范

##

##

### 工作流规范 -->

# GIT 规范

| tag      | 描述                                      |
| -------- | ----------------------------------------- |
| feat     | 新功能                                    |
| fix      | 修复                                      |
| docs     | 文档变更                                  |
| style    | 代码格式（不影响代码运行的变动）          |
| refactor | 重构（既不是增加 feature）,也不是修复 bug |
| pref     | 性能优化                                  |
| test     | 增加测试                                  |
| chore    | 构建过程或辅助工具的变动                  |
| revert   | 回退                                      |
| build    | 打包                                      |
| merge    | 合并分支                                  |
| ci       | 构建                                      |

```js
// commitlint.config.js;
module.exports = {
  extends: ["@commitlint/config-conventional"],
  // 定义规则类型
  rules: {
    // type 类型定义，表示 git 提交的 type 必须在以下类型范围内
    "type-enum": [
      2,
      "always",
      [
        "feat", // 新功能
        "fix", //  修复
        "docs", // 文档变更
        "style", // 代码格式（不影响代码运行的变动）
        "refactor", // 重构（既不是增加feature）,也不是修复bug
        "pref", // 性能优化
        "test", // 增加测试
        "chore", // 构建过程或辅助工具的变动
        "revert", // 回退
        "build", // 打包
        "merge", // 合并分支
        "ci" // 构建
      ]
    ],
    // subject 大小写不做校验
    "subject-case": [0]
  }
};

// git commit -m 'feat(meeting join): 加入会议功能'
// git commit -m 'fix(account): 修复8459的bug，发送消息失败'
// git commit -m 'refactor: 重构xx.vue文件'
```

## 相关资料

[Git 的学与记：工程化配置 commit 规范](https://juejin.cn/post/6844903710112350221)
