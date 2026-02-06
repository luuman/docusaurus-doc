```bash
├── .browserslistrc                   # 浏览器兼容性配置
├── .editorconfig                    # 编辑器统一配置
├── .env                             # 默认环境变量
├── .env.development                 # 开发环境变量
├── .env.production                  # 生产环境变量
├── .eslintignore                    # ESLint 忽略文件列表
├── .eslintrc.js                     # ESLint 配置
├── .git/                            # Git 仓库目录
├── .gitignore                       # Git 忽略文件列表
├── .gitmodules                      # Git 子模块配置
├── .husky/                          # Git 提交钩子配置（如 lint 检查）
├── .lintstagedrc                    # lint-staged 配置（配合 husky 使用）
├── .sentryclirc                     # Sentry CLI 配置
├── .vscode/                         # VS Code 编辑器设置目录
├── appxConfig.js                    # Windows AppX 打包配置
├── avr_electron/                    # 主进程源码/替换模块（可能用于加固）
├── avr_scripts/                     # 项目构建脚本集合
├── babel.config.js                  # Babel 转码配置
├── bash.icon.matrx*.sh              # 构建图标或版本脚本（多个版本）
├── body.json                        # 可能为模板或打包配置
├── build/                           # 构建输出资源目录（如图标）
├── build-matrxo.sh                  # 特定版本构建脚本
├── build.js                         # 构建入口 JS 脚本
├── build.sh                         # 构建入口 Shell 脚本
├── build_base/                      # 图标基础构建目录
├── cleargit.sh                      # 一键清除 Git 更改的脚本
├── commitlint.config.js             # Git 提交信息规范配置
├── common.json                      # 公共配置数据
├── config.js                        # 构建或运行配置文件
├── copyright.js                     # 打包版权配置脚本
├── dev-init.bat                     # 初始化开发环境脚本（Windows）
├── devtools/                        # 本地调试工具目录
├── dist_electron/                   # Electron 打包输出目录
├── exeConfig.js                     # Windows 可执行文件打包配置
├── install.bat                      # 一键安装脚本
├── msiConfig.js                     # Windows MSI 安装包配置
├── node_modules/                    # NPM 安装的依赖目录
├── nsis_build/                      # Windows 安装包脚本（NSIS 格式）
├── package-lock.json                # NPM 锁定依赖版本
├── package.json                     # 项目依赖与脚本配置
├── patches/                         # 补丁目录（可能用于手动修改依赖）
├── postcss.config.js                # PostCSS 配置
├── prettier.config.js               # Prettier 代码格式化配置
├── public/                          # Vue 静态资源目录
├── pull-build.sh                    # 拉取并构建脚本
├── pullmodules.sh                   # 拉取 Git 子模块脚本
├── README.md                        # 项目说明文档
├── resources/                       # 应用构建资源（图标、证书等）
├── scripts/                         # 构建图标脚本目录
├── sentry-symbols.js                # Sentry 错误追踪符号配置
├── sentry.properties                # Sentry 配置文件
├── sonar-project.properties         # SonarQube 配置
├── sonarqube.bat                    # SonarQube 执行脚本（Windows）
├── sonarqube.sh                     # SonarQube 执行脚本（Linux）
├── src/                             # 项目源码主目录
│   ├── api/                         # 接口请求封装目录
│   ├── assets/                      # 静态资源（图片、图标等）
│   ├── push/                        # 推送通信模块（socket 推送）
│   ├── renderer/                    # 渲染进程（窗口）模块
│   ├── scss/                        # SCSS 样式目录
│   ├── sentry/                      # Sentry 错误上报模块
│   ├── socket/                      # 通信模块（WebSocket）
│   ├── sql/                         # 本地 SQLite 数据库结构文件
│   ├── sqlApi/                      # SQLite 数据访问封装
│   ├── staticData/                  # 静态数据（如枚举、配置项）
│   ├── store/                       # Vuex 状态管理
│   ├── styles/                      # 样式目录（CSS/SCSS）
│   ├── tools/                       # 工具函数库
│   ├── utils/                       # 通用工具库
│   ├── views/                       # Vue 页面视图组件
│   ├── App.vue                      # Vue 主组件
│   ├── background.js                # Electron 主进程入口
│   ├── background.rd.js             # 主进程备用/废弃文件
│   ├── IPCRenderChannel.js          # 渲染进程与主进程的 IPC 封装
│   ├── main.js                      # Vue 渲染进程入口
│   ├── preload.js                   # Electron 预加载脚本（与主进程通信）
│   ├── router.js                    # Vue 路由配置
│   ├── userInfo.js                  # 用户信息管理模块
├── upload-sourcemaps.js             # 上传 sourcemap 到 Sentry 脚本
└── vue.config.js                    # Vue CLI 配置文件
```
