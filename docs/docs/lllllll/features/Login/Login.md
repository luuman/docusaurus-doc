# 登录

| 函数名             | 账号            | 用途说明                                    |
| ------------------ | --------------- | ------------------------------------------- |
| emailToLogin       | 邮箱 + 密码     | 结构类似 phoneToLogin，但账户类型为 email   |
| phoneToLogin       | 手机号 + 密码   | 含预登录、E2EE 密钥准备、发送加密登录数据等 |
| phoneVerifyToLogin | 手机号 + 验证码 | 用于验证码登录流程                          |
| ssoToLogin         | SSO（单点登录） | OAuth / 内网跳转等企业账号登录              |
| ldapToLogin        | 专属账号+密码   | 一般适用于私有化部署或企业集成环境          |
| QRToLogin          |                 |                                             |
| ToLogin            |                 |                                             |

| debounceToLogin | 登录防抖封装，用于防止按钮连点时重复调用 toLogin，提高稳定性和用户体验 |
| toLogin | 通用入口登录函数，可能用于默认账户密码登录，实际调用 emailToLogin 或其他 |

## 通用方法

### toLogin 登录入口

```js
点击登录按钮
       ↓
检查网络连接（navigator.onLine）
       ↓
记录登录起始时间（sessionStorage.startLoginTime）
       ↓
判断登录类型 loginType
       ↓
 ┌───────────────┬────────────────┬────────────────┐
 ↓               ↓                ↓
phone && 无验证码   phone && 有验证码      email
 ↓               ↓                ↓
phoneToLogin()   phoneVerifyToLogin()   emailToLogin()
```

## postLogin 成功登录处理器

✅ 方法名：`postLogin({rs, alice, keysResult}, extraParams)`

| 参数          | 类型   | 描述                                   |
| ------------- | ------ | -------------------------------------- |
| `rs`          | object | 登录信息                               |
| `alice`       | object | 客户端 E2EE 公钥对象（含 priv、pub）   |
| `keysResult`  | object | Signal 风格的密钥结构                  |
| `extraParams` | object | 附加信息，如账号类型、手机号、国家码等 |

```
1. 用户输入账号/密码 → 点击登录
        ↓
2. toLogin() → 判断 loginType，调用 phoneToLogin/emailToLogin 等
        ↓
3. phoneToLogin → 调用 preLogin() 初始化密钥对
        ↓
4. 调用登录接口 phoneLogin()，带上密钥信息
        ↓
5. 登录成功后调用 postLogin()，完成 DH 密钥协商
        ↓
6. 若含 2FA，再次 getPub() 获取服务端公钥
        ↓
7. 验证通过，调用最终 SDK postLogin(...) 方法，完成上线
        ↓
8. 通知主进程登录成功（`ipcRenderer.send('MATRX_SIGNIN')`）

1	保存 hid 到 appdataStorage	rs.hid 是服务端返回的用户唯一标识
2	提取服务端公钥 bob_pub	来自登录返回的 rs.pub
3	判断是否存在两步验证（2FA）	rs.two_step_type 存在并有值
4	执行两步验证流程：getPub(...)	获取新的 pub 并更新 rs.pub
5	检查最终 bob_pub 是否存在	若仍为空，则提示网络错误并中止登录
6	调用 SDK 的核心登录逻辑 postLogin(...)	将用户身份、加密公钥等信息传入 SDK


用户点击登录按钮
        │
        ▼
[1] 验证手机号、密码、锁状态
        │
        ▼
[2] 调用 preLogin(phoneAddr, 'phone')
    └─ 2.1 checkDns() DNS状态检测
    └─ 2.2 checkDiskSpace() 磁盘空间检测
    └─ 2.3 sendSdk('Util-SDK-Method', 1) → 获取 Alice（DH 公钥）
    └─ 2.4 sendSdk('E2EE-Help-Method', 1, phoneAddr)
             → 获取 identityKey、signedPrekey、preKeys
        │
        ▼
[3] 如果是公网部署：调用 getPhoneIDC(phoneAddr)
        │
        ▼
[4] 调用 phoneLogin(...)，发起登录请求，上传如下信息：
    ├─ 加密后的密码（parsePhonePassword）
    ├─ 手机号
    ├─ Alice 公钥（base64 格式，兼容化）
    ├─ e2eedid（=2）
    └─ keys（身份密钥 + 预共享密钥列表）
        │
        ▼
[5] 调用 postLogin(...)，处理 token 保存、初始化等
        │
        ▼
[6] 通知主进程已登录：ipcRenderer.send('MATRX_SIGNIN')
        │
        ▼
[7] 捕获异常，根据错误码翻译提示信息，并调用 this.loginError(...)
    └─ 若是错误码 670：自动删除旧账号缓存（deleteUserData）
        │
        ▼
[8] 尝试 SSO 登录 fallback：continueSSologin()

```
