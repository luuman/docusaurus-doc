# 签名打包

## 登录

> 远程控制器

| Account        | Password     |
| -------------- | ------------ |
| `yongmao.tian` | `eufaix4O`   |
| `434980607`    | `Matrx2022*` |
| `开机密码`     | `pin:261982` |

> 连接 VPN

188.116.29.146

## 打包

```bash
# 项目路径：
cd D:/project/matrx_64

# 打包前的准备

# 检查current.js配置
# 检查public.js版本
# 检查sdk分支名称

# 打包 Matrx 与 MatrxO：
npm run package-build
npm run package-build matrxo

# 打包 MSI 安装包：
npm run package-msi
npm run package-msi matrxo
```
