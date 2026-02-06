# DLL 调试指南

> 在 Visual Studio 中通过附加到进程调试 Matrx 应用中的 DLL 模块。

## 准备工作

1. 修改相关配置项,使 DLL 编译为可调试版本(开启 `DEBUG` 宏、生成 `.pdb` 文件)
2. 使用 Release 或 Debug 模式打包 DLL,生成对应的 `.dll` 和 `.pdb` 文件

## 替换 DLL 文件

将打包生成的 DLL 文件替换到 Matrx 应用所在的目录中(`/resources` 或指定模块路径),确保 Matrx 使用的是调试版 DLL。

## 附加调试

1. 启动 Matrx 应用(运行 `Matrx.exe` 或启动脚本)
2. 打开 Visual Studio
3. 菜单栏选择 `调试(Debug)` > `附加到进程(Attach to Process)...`
4. 在进程列表中选择 `Matrx.exe`
5. 点击 **"附加(Attach)"**

## 加载符号

确保 VS 已能加载 `.pdb` 文件(通过 `调试` > `符号设置` 手动添加路径)。

## 断点调试

- 在 DLL 中感兴趣的函数处打断点(如导出函数、回调函数等)
- 回到 Matrx 应用,进行触发操作以命中断点

## 补充建议

- 确保 VS 调试器类型匹配(`Native`、`Managed`、`Mixed`)
- Electron + Node 环境中的 DLL,可结合 `node-gyp` 调试原生模块
- DLL 初始化较早时,可延迟加载以便更容易 attach
