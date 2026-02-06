# SonarQube 扫描

[sonarqube](https://www.sonarsource.com/sem/products/sonarqube/?s_campaign=SQ-APJ-4-All-Brand&s_content=SonarQubeServer&s_term=sonarqube&s_category=Paid&s_source=Paid%20Search&s_origin=Google&cq_src=google_ads&cq_cmp=22281307569&cq_con=178645347034&cq_term=sonarqube&cq_med=&cq_plac=&cq_net=g&cq_pos=&cq_plt=gp&gad_source=1&gad_campaignid=22281307569&gbraid=0AAAAAC0fKmrjcTjrXPkAMRWwveJnvY94p&gclid=Cj0KCQjwtMHEBhC-ARIsABua5iS76OY4OPg58eeMP_LmGWOyIk9zcC8Z_-fPeTWrrq6n0iKtKyJ_Pm4aAiRlEALw_wcB)

这是一个 `sonar-project.properties`（SonarQube 项目配置）片段，逐行解释如下：

### 必填元数据部分（Required metadata）

- `sonar.projectKey=frontend_matrx_windows`
  项目的唯一标识符。SonarQube 用它来区分不同项目。通常是组合了产品/模块名的字符串。

- `sonar.host.url=https://sonar.corp.matrx.team`
  SonarQube 服务器的地址，分析结果会发到这个 URL 上去。

- `sonar.branch.name=feat_0430_all`
  指定当前分析所对应的分支名称（分支分析）。便于在 SonarQube 中看到该分支的质量门和差异。

- `sonar.login=1c860c505ebf4dff62737f4c54388f2af452629e`
  用于认证的令牌（token），让扫描脚本有权限向 SonarQube 推送数据。**注意：这个敏感字段不应该明文提交到源码仓库，应通过 CI Secret、环境变量或凭据管理器注入。**

### 源码范围设置

- `sonar.sources=src/`
  告诉 SonarQube 哪些目录包含需要分析的源代码，这里是 `src/` 目录下的内容。

- `sonar.inclusions=src/**/*.js,src/**/*.vue,src/**/*.jsx`
  细化只分析某些文件类型（JS、Vue 组件、JSX）。如果不配置，Sonar 根据文件扩展名自动识别；这个是显式包含过滤。

- `sonar.sourceEncoding=GBK`
  源代码的字符编码。默认是 UTF-8，这里设为 GBK 说明代码可能含中文且保存为 GBK 编码。要小心：SonarQube 在处理非 UTF-8 时可能出现解析问题，除非有明确需要，建议统一转为 UTF-8 以减少编码相关的异常。

### 被注释掉的配置（目前未生效）

```properties
# sonar.exclusions=src/**/index.js,src/mapboxgl/web-map/layer/fill-extrusion/**,src/mapboxgl/web-map/control/fill-extrusion/**
# sonar.test.inclusions=src/**/*.spec.js
```

- `sonar.exclusions`：排除某些不想分析的路径，比如某些自动生成、第三方大文件或者特定入口文件。
- `sonar.test.inclusions`：指定哪些是测试代码（如果希望单独区分），不过通常 Sonar 会自动识别 `*.spec.js`、`*.test.js` 之类的。

### 语言设置

- `sonar.language=js`
  旧版 SonarQube 用来指定语言的字段。现代版本已弃用（多语言项目默认根据文件扩展名判断），可以去掉以避免混淆。

---

### 附加建议 / 注意点

1. **不要把 `sonar.login` 的 token 直接写在版本库。** 改用 CI 的 secret 机制，比如在构建脚本中通过环境变量传入：

   ```sh
   sonar-scanner -Dsonar.login="$SONAR_TOKEN"
   ```

2. **编码统一：** 如果没有硬性依赖 GBK，建议把源码改成 UTF-8 并把 `sonar.sourceEncoding` 改成 `UTF-8`，能避免跨平台乱码或分析失败。

3. **分支分析：** `sonar.branch.name` 在不同 SonarQube 版本行为略有差异（某些版本要用 Pull Request/branch 功能），确认服务端配置匹配你的用法。

4. **进一步精细控制：** 可以补充 `sonar.javascript.lcov.reportPaths`（前端 coverage）、`sonar.coverage.exclusions`、`sonar.tests` 等，用以区分测试和生产代码、引入测试覆盖率。

5. **安全和审计：** 结合 Sonar 的质量门（Quality Gate）配置，确保在代码质量不达标时 CI 失败。

如果你想，我可以帮你：

- 把这个配置改写成安全的 CI 友好模板（用环境变量注入 token）。
- 给出一个更完整的 `sonar-scanner` 命令行示例和典型配套脚本。
  你想先从哪部分开始？
