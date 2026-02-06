# 空间与企业 API

多空间管理、企业功能、存储数据相关接口。

---

## spaceApi.js - 空间管理

**大小**: 7.3KB

```javascript
import {
  getSpaceList,
  switchSpace,
  companySort,
  getCompanyMembers,
  getSpaceInfo
} from '@/api/spaceApi';

// 获取空间列表
const spaces = await getSpaceList({ pattern: 'windows' });

// 切换空间
await switchSpace(prevSpaceId, nextSpaceId);

// 空间排序
await companySort({ spaceIds: ['id1', 'id2', 'id3'] });

// 获取企业成员
const members = await getCompanyMembers(enterpriseId);

// 获取空间信息
const info = await getSpaceInfo(spaceId);
```

---

## storageDataApi.js - 存储数据

**大小**: 3.6KB

```javascript
import {
  getStorageUsage,
  getStorageQuota,
  cleanStorage
} from '@/api/storageDataApi';

// 获取存储使用情况
const usage = await getStorageUsage(spaceId);

// 获取存储配额
const quota = await getStorageQuota(spaceId);

// 清理存储
await cleanStorage(spaceId, beforeTime);
```

---

**最后更新**: 2026-02-05
