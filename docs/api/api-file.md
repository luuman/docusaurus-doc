# 文件管理 API

文件上传、下载、分片处理相关接口。

---

## FileApi.js - 文件操作

**大小**: 19KB

### 文件分片操作

```javascript
import {
  setDiskFileFragment,
  setDBFileFragmentMap,
  removeFilePiece,
  copyFile
} from '@/api/FileApi';

// 保存文件分片到磁盘
await setDiskFileFragment(hid, uuid, fileFid, fragmentFid, bufferData, isPic);

// 保存分片信息到数据库
await setDBFileFragmentMap(originMessage, fragmentItem, fragmentIndex);

// 删除文件分片
await removeFilePiece(hid, uuid, fid, pieceName, isPic);

// 复制文件
const newPath = await copyFile(originPath, hid, uuid, fileFid, fileName);
```

### 文件路径

```javascript
import {
  getFileDownloadFilePath,
  getPicMessageRomingFilePath,
  getSafeShortImageDiskFile
} from '@/api/FileApi';

// 获取下载文件路径
const downloadPath = await getFileDownloadFilePath(hid, uuid, fid, fileName);

// 获取图片漫游路径
const picPath = getPicMessageRomingFilePath(hid, fid, fileName);

// 安全获取图片文件
const exists = await getSafeShortImageDiskFile(hid, fid, filename);
```

---

## uploadApi.js - 文件上传

**大小**: 6.7KB

```javascript
import {
  uploadFile,
  uploadAvatar,
  uploadImage,
  toUploadLog
} from '@/api/uploadApi';

// 上传文件
const result = await uploadFile({
  file: fileData,
  onProgress: (percent) => {
    console.log(`上传进度: ${percent}%`);
  }
});
// 返回: { fid, url, size, ... }

// 上传头像
const avatarUrl = await uploadAvatar(imageFile);

// 上传图片
const imageResult = await uploadImage(imageFile);

// 上传日志
await toUploadLog(logData);
```

---

## fileServerApi.js - 文件服务器

**大小**: 1.5KB

```javascript
import { getFileServerUrl } from '@/api/fileServerApi';

// 获取文件服务器地址
const serverUrl = await getFileServerUrl(spaceId);
```

---

**最后更新**: 2026-02-05
