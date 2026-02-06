# 安全与加密 API

E2EE 端对端加密、DNS 安全、风险检测相关接口。

---

## e2eeApi.js - E2EE 加密

**大小**: 2.4KB

```javascript
import {
  getE2EEKey,
  uploadE2EEKey,
  verifyE2EECode,
  getE2EEStatus
} from '@/api/e2eeApi';

// 获取 E2EE 公钥
const publicKey = await getE2EEKey(userId);

// 上传 E2EE 公钥
await uploadE2EEKey(myPublicKey);

// 验证 E2EE 验证码
const isValid = await verifyE2EECode(code, peerId);

// 获取 E2EE 状态
const status = await getE2EEStatus(dialogId);
```

---

## dohApi.js - DNS over HTTPS

**大小**: 9.6KB

```javascript
import { resolveDNS, getDohServer } from '@/api/dohApi';

// 解析 DNS
const ip = await resolveDNS('api.example.com');

// 获取 DoH 服务器
const server = await getDohServer();
```

---

## avrRiskApi.js - 风险检测

**大小**: 326B

```javascript
import { checkRisk } from '@/api/avrRiskApi';

// 检查风险
const risk = await checkRisk(requestData);
```

---

**最后更新**: 2026-02-05
