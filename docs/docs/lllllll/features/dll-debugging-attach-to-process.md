以下是该文档的整理版本，并附上建议的英文命名（适用于 `.md` 文件）：

### ✅ 建议文件名：

```plaintext
dll-debugging-attach-to-process.md
```

### 📄 中文内容整理：

```markdown
# DLL 调试：附加到进程

**负责人**：yongmao.tian  
**最后更新**：2023 年 6 月 12 日  
**查看人数**：2

## 一、准备工作

1. 修改相关配置项，使 DLL 编译为可调试版本（例如开启 `DEBUG` 宏、生成 `.pdb` 文件等）。
2. 使用 Release 或 Debug 模式打包 DLL（根据实际需求）并生成对应的 `.dll` 和 `.pdb` 文件。

## 二、替换 DLL 文件

1. 将打包生成的 DLL 文件替换到 Matrx 应用所在的目录中（例如 `/resources` 或某个指定模块路径）。
2. 确保 Matrx 使用的是刚才打包的调试版 DLL。

## 三、启动 Matrx 并附加调试

1. 启动 Matrx 应用（例如通过运行 `Matrx.exe` 或启动脚本）。
2. 打开 Visual Studio。
3. 使用 **“附加到进程”（Attach to Process）** 功能：

   - 菜单栏选择 `调试(Debug)` > `附加到进程(Attach to Process)...`
   - 在进程列表中选择 `Matrx.exe`
   - 点击右下角的 **“附加(Attach)”**

4. 加载符号（Symbols）：
   - 确保 VS 已能加载你的 `.pdb` 文件（可以通过调试 > 符号设置手动添加路径）

## 四、断点调试

- 在 DLL 中你感兴趣的函数处打断点（如导出函数、回调函数等）。
- 回到 Matrx 应用，进行触发操作以命中断点。

## 补充建议

- 确保 VS 的调试器类型匹配（如 `Native`、`Managed`、`Mixed`）；
- 如果是 Electron + Node 环境中的 DLL，也可结合 `node-gyp` 调试原生模块；
- 如果 DLL 初始化较早（如在主进程加载阶段），可延迟加载以便更容易 attach。

  如需整理 DLL 编译脚本、符号加载技巧等内容，也可一并补充。
```

是否需要我根据你的实际项目结构，把调试相关操作写入构建文档或开发者手册？
