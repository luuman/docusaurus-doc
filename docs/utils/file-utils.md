# 文件处理工具

本文档介绍项目中与文件操作相关的工具函数，包括文件上传下载、SHA 加密模块、长路径处理、文件类型检测等。

---

## 目录

- [核心文件结构](#核心文件结构)
- [FileTool - 文件上传下载核心](#filetool---文件上传下载核心)
- [FileSHAModule - 文件加密模块](#fileshamodule---文件加密模块)
- [FileLongPath - Windows 长路径处理](#filelongpath---windows-长路径处理)
- [fileType - 文件类型检测](#filetype---文件类型检测)

---

## 核心文件结构

```
src/utils/
├── FileTool.js          # 文件上传/下载核心逻辑（分片、加密、进度管理）
├── FileSHAModule.js     # AES 加解密、SHA256/HMAC-SHA256 计算
├── FileLongPath.js      # Windows 长路径（>260字符）兼容处理
└── fileType.js          # 文件 MIME 类型检测与图片类型验证
```

---

## FileTool - 文件上传下载核心

**文件**: `src/utils/FileTool.js`

FileTool 是项目文件传输的核心模块，实现了文件分片上传、分片下载、AES 加解密、断点续传、进度回调等完整的文件传输流程。

### 导入方式

```javascript
import {
    uploadFileHandle,
    saveFileHandle,
    decodePic,
    decodeCover,
    existFile,
    throttleRequest,
    clearAllFilePieces,
    equalAndSetSecretKeyMap
} from '@/utils/FileTool';
```

### uploadFileHandle(file, sendTo, progressCallback, uploadSuccessCallback, cancelObj, originMessage, enterpriseId, uploadFailCallback, idcUrl)

分片处理并上传文件。对图片文件走图片上传通道（含压缩和缩略图生成），对普通文件走分片上传通道。

```javascript
await uploadFileHandle(
    file,                    // 文件对象 { name, size, type, originPath, coverFilePath?, cover? }
    sendTo,                  // 接收方 HID
    (progress) => {          // 进度回调 { loaded, total }
        console.log(`${progress.loaded / progress.total * 100}%`);
    },
    (result) => {            // 上传成功回调
        console.log('上传完成', result);
    },
    cancelObj,               // 取消控制对象
    originMessage,           // 原始消息对象
    enterpriseId,            // 企业空间 ID
    (err) => {},             // 上传失败回调
    idcUrl                   // IDC 服务地址
);
```

**关键逻辑**:
- 图片文件（&lt;10MB）: 整体上传，支持自动压缩（超过 1920px 缩放），生成 2KB 压缩预览图
- 普通文件: 按 800KB 分片，每片独立加密上传，最终合并为 tar 文件
- 支持断点续传: 通过 `checkFileFragmentisUploaded` 检查已上传分片
- 并发控制: 上传队列最大 8 个并发，下载队列最大 5 个并发

### saveFileHandle(message, processCallback, cancelObj, successCallback, idcUrl)

下载并保存文件到本地。

```javascript
await saveFileHandle(
    message,                 // 消息对象（含下载信息）
    (progress) => {},        // 进度回调
    cancelObj,               // 取消控制对象
    (filePath) => {          // 成功回调，返回本地文件路径
        console.log('文件已保存到:', filePath);
    },
    idcUrl                   // IDC 服务地址
);
```

### decodePic(originMessage, hid)

下载并解密图片消息。从服务器获取加密图片数据，使用 AES 解密后保存到本地。

```javascript
const filePath = await decodePic(originMessage, dialogHid);
// filePath: 解密后的图片本地路径
```

**流程**:
1. 检查磁盘空间
2. 通过 `refreshImgUrl` 获取最新下载地址
3. 下载加密图片数据
4. 使用 `FileSHAModule.AESDecrypt` 解密
5. 保存到本地并触发 `picture-download-success` 事件

### decodeCover(cover, uuid, dialogId, peerId)

下载并解密视频封面图。

```javascript
const filePath = await decodeCover(cover, uuid, dialogId, peerId);
```

### throttleRequest(dcID, cb, activeDelta, offset)

文件传输请求节流控制器，限制并发请求数量。

```javascript
await throttleRequest(
    'upload',              // 队列标识（upload 或 fid）
    () => fetchData(),     // 实际请求函数（返回 Promise）
    2,                     // 占用的并发槽位数
    offset                 // 分片偏移量
);
```

**参数**:
- `dcID` (string): 队列标识。`'upload'` 限制 8 并发，其他限制 5 并发
- `cb` (Function): 返回 Promise 的回调函数
- `activeDelta` (number): 占用的并发槽位数，默认 1
- `offset` (number): 当前分片偏移（用于错误定位）

### equalAndSetSecretKeyMap(spaceId)

初始化并缓存文件加密密钥对（HmacSHA256Key + aesKey）。

```javascript
await equalAndSetSecretKeyMap();
// 密钥对缓存在 store.state.fileCollection.secretKeyMap
```

### existFile(filePath)

检查文件是否存在于本地磁盘，兼容 Windows 长路径。

```javascript
import { existFile } from '@/utils/FileTool';

if (existFile('/path/to/file.jpg')) {
    console.log('文件存在');
}
```

**参数**:
- `filePath` (string): 文件路径，支持 `file://` 前缀

**返回**: `boolean` - 文件是否存在

### clearAllFilePieces(filePieceObj, dialogId, uuid, dcID, isPic)

清除下载完成后的临时分片文件。

```javascript
clearAllFilePieces(filePieceMap, dialogId, messageUuid, downloadFid);
```

---

## FileSHAModule - 文件加密模块

**文件**: `src/utils/FileSHAModule.js`

FileSHAModule 封装了文件传输中使用的加解密和哈希计算功能，底层依赖 `crypto-js` 和 `aes128gcm` 模块。

### 导入方式

```javascript
import FileSHAModule from '@/utils/FileSHAModule';
```

### AESDecrypt(aesKey, aesIv, filePieceBuf)

使用 AES-256-GCM 解密文件数据。

```javascript
const decryptedBuffer = await FileSHAModule.AESDecrypt(
    aesKeyHex,       // 64 字符 hex 密钥
    aesIvHex,        // 32 字符 hex IV（取 sha256 第 16-48 字符）
    encryptedBuffer  // 加密数据的 ArrayBuffer
);
```

**参数**:
- `aesKey` (string): AES 密钥，hex 编码
- `aesIv` (string): AES 初始化向量，hex 编码
- `filePieceBuf` (ArrayBuffer): 加密数据

**返回**: `Promise&lt;Buffer&gt;` - 解密后的数据

### AESEncrypt(aesKey, aesIv, fileBaseBuf)

使用 AES-256-GCM 加密文件数据。

```javascript
const encryptedBuffer = await FileSHAModule.AESEncrypt(
    aesKeyBuffer,    // Buffer 密钥
    aesIvBuffer,     // Buffer IV
    plainBuffer      // 明文数据
);
```

**返回**: `Promise&lt;ArrayBuffer&gt;` - 加密后的数据

### generateRandomAlphaNum(len, isHex)

生成指定长度的随机字符串。

```javascript
const randomStr = FileSHAModule.generateRandomAlphaNum(32, true);
// 返回 32 字符的 hex 随机字符串（0-9, a-f）

const alphaNum = FileSHAModule.generateRandomAlphaNum(16, false);
// 返回 16 字符的 base36 随机字符串（0-9, a-z）
```

**参数**:
- `len` (number): 目标长度
- `isHex` (boolean): `true` 生成 hex 字符，`false` 生成 base36 字符

### getHmacSHA256(fileArrayBuffer, secret)

计算文件数据的 HMAC-SHA256 签名。

```javascript
const hmac = FileSHAModule.getHmacSHA256(fileBuffer, secretKey);
```

### getSHA256(fileArrayBuffer)

计算文件数据的 SHA256 哈希。

```javascript
const sha256 = FileSHAModule.getSHA256(fileBuffer);
```

### hexStrToString(hexStr) / stringToHex(str)

hex 字符串与普通字符串之间的转换。

```javascript
FileSHAModule.stringToHex('hello');                    // "68656c6c6f"
FileSHAModule.hexStrToString('68656c6c6f');            // "hello"
```

### toArrayBuffer(buf)

将 Node.js Buffer 转换为 ArrayBuffer。

```javascript
const arrayBuffer = FileSHAModule.toArrayBuffer(nodeBuffer);
```

---

## FileLongPath - Windows 长路径处理

**文件**: `src/utils/FileLongPath.js`

Windows 系统默认路径长度限制为 260 字符（MAX_PATH）。当文件路径超过此限制时，需要使用 `\\?\` 前缀的 UNC 路径格式。

### 导入方式

```javascript
import { getSafeFilePath, getLongPathMedias } from '@/utils/FileLongPath';
```

### getSafeFilePath(path, mimetype)

根据路径长度自动选择处理策略。短路径直接返回，长路径读取文件内容生成 Blob URL。

```javascript
const safePath = await getSafeFilePath('/very/long/.../path/image.png', 'image/png');
// 短路径: 直接返回原路径
// 长路径: 返回 { blob, blobUrl } 对象
```

**参数**:
- `path` (string): 文件路径
- `mimetype` (string): MIME 类型

**返回**: `string | Promise<{blob, blobUrl}>` - 安全路径或 Blob URL 对象

### getLongPathMedias(longPath, mimetype)

将超长路径的文件读取为 Blob URL，供渲染层使用。

```javascript
const result = await getLongPathMedias(longFilePath, 'image/png');
console.log(result.blobUrl);  // "blob:file:///xxxxx"
```

**参数**:
- `longPath` (string): 超长文件路径
- `mimetype` (string): MIME 类型，默认 `'image/png'`

**返回**: `Promise<{blob: Blob, blobUrl: string}>`

---

## fileType - 文件类型检测

**文件**: `src/utils/fileType.js`

文件类型检测工具，通过读取文件头部的魔数（magic number）来判断文件真实类型，底层依赖 `file-type` 库。

### 导入方式

```javascript
import {
    filterPictureMimeTypes,
    checkImageFileType,
    validationFileExtname,
    validationFileCludesImage,
    isPictureExtname,
    getFileType,
    PICTURE_MIMES,
    PICTURE_SUFFIXS
} from '@/utils/fileType';
```

### 常量定义

```javascript
// 支持的图片 MIME 类型
PICTURE_MIMES = ['image/png', 'image/jpeg', 'image/jpg', 'image/bmp', 'image/gif', 'image/jfif'];

// 支持的图片后缀名
PICTURE_SUFFIXS = ['.png', '.jpeg', '.jpg', '.bmp', '.gif', '.jfif'];
```

### filterPictureMimeTypes(fileList)

过滤文件列表，仅保留图片类型文件（通过文件内容检测）。

```javascript
const imageFiles = await filterPictureMimeTypes(fileList);
```

**参数**:
- `fileList` (Array): 文件对象数组，每项需含 `path` 属性

**返回**: `Promise&lt;Array&gt;` - 仅包含图片类型的文件列表

### checkImageFileType(fileList)

检查文件列表是否全部为图片类型。

```javascript
const allImages = await checkImageFileType(fileList);
// true: 全部是图片; false: 包含非图片文件
```

### validationFileExtname(fileList)

通过文件扩展名快速检测是否全部为图片（不读取文件内容）。

```javascript
const result = validationFileExtname(fileList);
// true: 所有文件后缀都是图片格式
```

### validationFileCludesImage(fileList)

检查文件列表中是否包含至少一个图片文件（通过后缀名判断）。

```javascript
const hasImage = validationFileCludesImage(fileList);
```

### isPictureExtname(filePath)

判断单个文件的后缀是否为图片格式。

```javascript
isPictureExtname('/path/to/photo.jpg');   // true
isPictureExtname('/path/to/doc.pdf');     // false
```

### getFileType(filepath)

获取文件的真实 MIME 类型，通过文件头部魔数检测。

```javascript
const type = await getFileType('/path/to/file');
// { ext: 'png', mime: 'image/png' }
// 无法识别时: { ext: 'xyz', mime: 'unkown/xyz' }
```

**参数**:
- `filepath` (string): 文件路径

**返回**: `Promise<{ext: string, mime: string} | undefined>`

---

## 文件传输流程概览

```
发送文件:
  1. uploadFileHandle 接收文件
  2. equalAndSetSecretKeyMap 初始化加密密钥
  3. 图片: uploadPictureApi 整体上传
     文件: 按 800KB 分片 -> uploadFileApi 逐片上传 -> createTarFileApi 合并
  4. 每片使用 AES-256-GCM 加密，计算 SHA256 和 HMAC-SHA256
  5. 进度回调更新 UI

接收文件:
  1. saveFileHandle / decodePic 发起下载
  2. getTarFileApi 获取分片映射
  3. throttleRequest 控制并发下载各分片
  4. FileSHAModule.AESDecrypt 解密每个分片
  5. saveFileFromPiece 合并分片并保存
  6. 触发 Bus 事件通知 UI 更新
```
