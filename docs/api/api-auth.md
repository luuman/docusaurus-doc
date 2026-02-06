# 认证与账户 API

登录认证、账户管理、用户资料相关接口。

---

## loginApi.js - 登录认证

**大小**: 20KB | **重要性**: ⭐⭐⭐⭐⭐

### fetchIdc - 预登录检查

```javascript
import { fetchIdc } from '@/api/loginApi';

// 检查邮箱/手机是否已注册，获取 IDC 信息
const result = await fetchIdc('user@example.com');
// 返回: { idc: 'UAE', exists: true, ... }
```

### emialLogin - 邮箱登录

```javascript
import { emialLogin } from '@/api/loginApi';

const response = await emialLogin(
  {
    email: 'user@example.com',
    password: 'hashedPassword',
    kind: 2  // 邮箱登录
  },
  {
    deviceId: 'device-xxx',
    pattern: 'windows'
  }
);
// 返回: { accessToken, refreshToken, userInfo, cc, ... }
```

### phoneLogin - 手机号登录

```javascript
import { phoneLogin } from '@/api/loginApi';

const response = await phoneLogin(
  {
    phone: '13800138000',
    countryCode: '86',
    password: 'hashedPassword',
    kind: 0  // 手机登录
  },
  { deviceId: 'device-xxx' }
);
```

### twoFactor - 两步验证

```javascript
import { twoFactor, smsCodeForTwoFactor } from '@/api/loginApi';

// 发送短信验证码
await smsCodeForTwoFactor(verifyToken, 'sms');

// 验证两步验证码
const response = await twoFactor({
  verify: 'verify_token',
  code: '123456',
  type: 'sms',        // 'sms' | 'app' | 'recoverycode'
  sendWay: 'sms'
});
```

### 其他认证函数

```javascript
import {
  phoneVerifyLogin,     // 验证码登录
  getWhiteList,         // 获取白名单/Bot列表
  ldapLogin,            // LDAP 企业登录
  ssoLogin,             // SSO 单点登录
  logout,               // 登出
  refreshToken,         // 刷新 Token
  getLoginInfo,         // 获取登录信息
  switchAccount         // 切换账号
} from '@/api/loginApi';
```

---

## account.js - 账户管理

**大小**: 955B

```javascript
import {
  resetPassword,
  changePassword,
  verifyAccount
} from '@/api/account';

// 重置密码
await resetPassword({ email, newPassword });

// 修改密码
await changePassword({ oldPassword, newPassword });
```

---

## profile.js - 用户资料

**大小**: 1.3KB

```javascript
import { updateProfile, getProfile } from '@/api/profile';

// 更新资料
await updateProfile({
  displayName: '新昵称',
  bio: '个人简介'
});
```

---

## userInfoApi.js - 用户偏好设置

**大小**: 3.9KB

```javascript
import { queryPreference, updatePreference } from '@/api/userInfoApi';

// 查询偏好设置
const prefs = await queryPreference({
  type: 'ReadReceiptStatus,RemoteStoragePath,NotificationEnabled'
});
// 返回: { ReadReceiptStatus: true, RemoteStoragePath: '/path', ... }

// 更新偏好
await updatePreference({
  ReadReceiptStatus: false,
  NotificationEnabled: true
});
```

---

**最后更新**: 2026-02-05
