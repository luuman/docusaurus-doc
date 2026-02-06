# 文件处理模块

## 概述

文件处理模块负责 Matrx Windows 客户端中所有文件的上传、下载、加密解密、分片处理、断点续传等核心功能。模块采用分层架构：`FileTool.js` 提供文件上传/下载的业务逻辑层，`FileApi.js` 提供文件系统操作层，`uploadApi.js` 提供日志文件上传接口。所有文件传输均经过 AES 加密处理，支持大文件分片上传/下载与断点续传。

## 核心文件结构

```
src/
  utils/
    FileTool.js                 # 文件上传/下载业务逻辑核心
    FileSHAModule.js            # AES 加密/解密、SHA256 哈希工具
    FileLongPath.js             # Windows 长路径处理
    files/
      compress.js               # 图片压缩工具
      checkDisk.js              # 磁盘空间检测
      BatchFileSaver.js         # 批量文件保存
  api/
    FileApi.js                  # 文件系统 API（路径管理/分片存储/流式读写）
    uploadApi.js                # 日志文件上传 API（分片上传流程）
    messageApi.js               # 消息相关 API（含文件上传/下载接口）
```

## 文件上传/下载核心：FileTool.js

### 文件位置

`src/utils/FileTool.js`

### 并发控制：throttleRequest

文件上传/下载通过 `throttleRequest` 函数进行并发限制：

```javascript
let downloadPulls = {};
let downloadActives = {};

export function throttleRequest(dcID, cb, activeDelta, offset) {
    return new Promise(function (resolve, reject) {
        if (downloadPulls[dcID] === undefined) {
            downloadPulls[dcID] = [];
            downloadActives[dcID] = 0;
        }
        downloadPulls[dcID].push({cb, res: resolve, rej: reject, activeDelta, offset});
        downloadCheck(dcID);
    });
}
```

并发限制策略：
- **下载**：每个 `dcID` 最多 5 个并发请求
- **上传**：`upload` 通道最多 8 个并发请求
- 每个任务可指定 `activeDelta`（占用的并发槽位数），文件分片默认占 2 个槽位

### 图片消息解密：decodePic

图片消息从服务器下载后需进行 AES 解密：

```javascript
async function decodePic(originMessage, hid) {
    // 1. 检查磁盘空间
    const diskSpace = await checkUserDiskFreeSpace(store.state.config.configDir);
    if (diskSpace && diskSpace.free <= downloadMinDiskSize) {
        throw { status: 'warning', message: '磁盘空间不足' };
    }

    // 2. 获取下载地址（支持重试刷新 URL）
    let newImgRes = await tryFetchImage({fid, filename, MIMETYPE, spaceId, dialogId, peerId});

    // 3. 下载加密文件
    let fileResponse = await promiseRetry(fetchPlainRequest, {
        times: 2, delay: 1000,
        data: { url: fileAddress, responseType: 'arraybuffer', timeout: 60000 }
    });

    // 4. AES 解密
    let aesIV = sha256.substr(16, 32);
    var dcArrayByffer = await FileSHAModule.AESDecrypt(iKey, aesIV, resArrayBuffer);

    // 5. 保存到本地磁盘
    let filePath = await saveRomingFile({uuid, hid, fid, fileName, blob: pieceFileBlob, isPic: true, type: 'buffer'});

    // 6. 触发下载成功事件
    Bus.$emit('picture-download-success', {uuid, assertPath: filePath});
    return filePath;
}
```

### 文件下载：downloadFileFromServer

大文件下载流程支持分片下载与断点续传：

**流程概要：**

1. 调用 `getTarFileApi` 获取文件分片映射表（`filePieceMap`）
2. 遍历每个分片（`offset = 1` 到 `total`）
3. 检查本地是否已有该分片（断点续传关键）
4. 未下载的分片通过 `throttleRequest` 并发下载
5. 每个分片下载后进行 AES 解密
6. 解密后的分片保存到磁盘临时目录
7. 所有分片完成后调用 `saveFileFromPiece` 合并文件
8. 合并完成后清理分片文件

**断点续传机制：**

```javascript
// 检查分片是否已下载
let fileFragmentBlob = await checkFileFragmentisDownloaded(
    location.dialogId,
    originMessage.m.uuid,
    fileFid,
    filePieceMap[offset].fid
);

if (fileFragmentBlob) {
    // 分片已存在，跳过下载
    requectCount++;
    loadedSize += filePieceMap[offset].size;
    processCallback({loaded: loadedSize, total: size});
    continue;
}
```

**用户取消支持：**

```javascript
if (store.state.fileCancelCollection.fileCancelMap[originMessage.m.uuid]?.isCancel) {
    errorHandler({message: 'user cancel'});
    return Promise.resolve();
}
```

### 文件上传：uploadFileHandle

文件上传根据文件类型走不同流程：

**图片上传（< 10MB）：**

1. 读取文件到 ArrayBuffer
2. 大于 1920px 的图片进行缩放（`resizeCanvasToMaxSize`）
3. 生成 2KB 压缩缩略图（`compressImageTo2KBBase64`）
4. 初始化加密密钥（`equalAndSetSecretKeyMap`）
5. 调用 `uploadPictureApi` 一次性上传
6. 返回上传结果含原始宽高和压缩缩略图 base64

**大文件上传（分片）：**

分片大小为 800KB（`partSize = 800 * 1024`），超过 1GB 的文件直接拒绝。

```javascript
for (offset = 0; offset < fileSize; offset += partSize) {
    currentPartIdx++;

    // 断点续传：检查分片是否已上传
    let fileFragmentUploaded = await checkFileFragmentisUploaded(
        currentPartIdx, originMessage.m.uuid, spaceId
    );

    if (fileFragmentUploaded) {
        // 已上传，恢复进度
        uploadResults[currentPartIdx] = {...};
        doneParts++;
        continue;
    }

    // 新上传：读取分片 -> 加密 -> 上传
    throttleRequest('upload', function() {
        let piceBuffer = await readDiskPiceFileByStream(originPath, {
            start: offset, end: offset + partSize - 1
        });
        // AES 加密后上传
        uploadFileApi({data: new Uint8Array(piceBuffer), ...});
    }, activeDelta);
}

// 所有分片完成后创建 tar 文件
if (doneParts >= totalParts) {
    let tarFileParms = await warpFile(uploadResults, originPath, fileName, mime, uploadSecrets);
    createTarFileApi({user: sendTo, completed: 1, ...}, tarFileParms, idcUrl);
}
```

### 文件封装：warpFile

上传完成后将所有分片信息封装为 JSON：

```javascript
async function warpFile(uploadResults, originPath, fileName, type, secretParmList) {
    // 计算原始文件的 SHA256
    let totalSha256 = crypto.createHash('sha256');
    await readDiskFileByStream(originPath, function(data) {
        totalSha256.update(data);
    });
    originFileSha256 = totalSha256.digest('hex');

    // 构建分片映射
    fileJson.tar = {
        originName: fileName,
        type: type,
        originSha256: originFileSha256,
        tarfilekey: uuidv1()
    };
    // 每个分片记录 fid, sha256, hmac-sha256
}
```

### 密钥管理：equalAndSetSecretKeyMap

文件加密使用两个密钥，存储在 Vuex Store 和数据库中：

```javascript
async function equalAndSetSecretKeyMap(spaceId) {
    if (!store.state.fileCollection.secretKeyMap) {
        let customerInfo = await getDBCustomer(spaceId);
        let HmacSHA256Key = customerInfo?.HmacSHA256Key || FileSHAModule.generateRandomAlphaNum(32, true);
        let aesKey = customerInfo?.aesKey || FileSHAModule.generateRandomAlphaNum(64, true);

        store.commit('fileCollection/SET_SECRET_KEY_MAP', {HmacSHA256Key, aesKey});
        await store.dispatch('customerInfo/setCustomerInfo', {HmacSHA256Key, aesKey});
    }
}
```

### 视频封面上传

视频文件支持提取封面并单独上传：

```javascript
if (file.coverFilePath && file.cover) {
    let fileBuffer = await readDiskPiceFileByStream(file.coverFilePath);
    let sendImageResult = await uploadPictureApi({
        contentType: 'image/jpeg',
        params: {user: sendTo, filename, type: 'image/jpeg', enterpriseId},
        data: new Uint8Array(fileBuffer),
        secretKeyMap: store.state.fileCollection.secretKeyMap
    }, cancelObj, idcUrl);

    cover = {
        w: file.cover.w, h: file.cover.h,
        download: sendImageResult[0].download,
        iKey: store.state.fileCollection.secretKeyMap.aesKey,
        // ...
    };
}
```

## 文件系统 API：FileApi.js

### 文件位置

`src/api/FileApi.js`

### 路径管理

文件存储采用分层目录结构：

```
UserData/
  {hid}/
    files/
      {fid}/
        {fileName}          # 图片文件
fileCache/
  {hid}/
    files/
      {uuid}/
        {fid}/
          {fragmentFid}     # 下载分片临时文件
```

**路径安全处理：**

```javascript
function replaceSafeWindowPath(fileName) {
    // 移除 Windows 不允许的路径字符: /\:*?"<>|#% 和空格
    return fileName.replace(/\/|\\|\:|"|\>|\<|\*|\?|\|\#|\%|\s/g, '_');
}
```

**长文件名处理：**

```javascript
function shortenFilename(filename, maxLength = 100) {
    // 路径总长度接近 260 字符限制时截断文件名
    const keepStart = Math.floor(availableLength * 0.6);
    const keepEnd = Math.floor(availableLength * 0.4);
    return `${start}~${end}.${extension}`;
}
```

### 下载路径优先级

文件下载路径按以下优先级确定：

1. **传递的绝对路径**：调用方显式指定
2. **数据库保存路径**：之前下载过的文件路径
3. **用户自定义设置路径**：通过设置面板配置的默认下载目录
4. **默认路径**：`{configDir}/../{appName}Files/{loginAccount}/`

```javascript
export async function getSettingDownloadPath({fileName, settingPath, uuid, isNeedFormate}) {
    if (settingPath) return path.resolve(settingPath, safeFileName);

    if (uuid) {
        let res = await getSingleFilePath({uuid});
        if (res.downloadpath) return res.downloadpath;
    }

    let performancePathSetting = await getDownloadSetting();
    if (performancePathSetting?.defalutPath) {
        return path.resolve(performancePathSetting.defalutPath, safeFileName);
    }

    return await getDefalutDownloadPath(safeFileName);
}
```

### 流式文件读取

提供两种流式读取方式：

**分片读取（指定范围）：**

```javascript
export function readDiskPiceFileByStream(fileOriginPath, options) {
    let readStream = fs.createReadStream(fileOriginPath, options);
    let buf = [];
    return new Promise((res, rej) => {
        readStream
            .on('data', data => buf.push(data))
            .on('end', () => res(Buffer.concat(buf)))
            .on('error', err => rej(err));
    });
}
```

**全文件流式处理：**

```javascript
export function readDiskFileByStream(fileOriginPath, processFn, endFn) {
    let readStream = fs.createReadStream(fileOriginPath, {
        highWaterMark: 10 * 1024 * 1024  // 10MB 每次读取
    });
    // 每读取一块调用 processFn（用于计算 SHA256 等）
}
```

### 分片文件合并

下载的分片通过 `merge-files` 库合并为最终文件：

```javascript
export async function saveFileFromPiece({hid, fid, fileName, uuid, isPic, fileMap}) {
    let sortFilePieceList = sortFileMap(fileMap); // 按顺序排列分片路径
    let targetPath = await getTargetPath(hid, fid, fileName, uuid, isPic);
    const status = await mergeFiles(sortFilePieceList, targetPath);
    if (!status) throw Error('download merge failed');
    return targetPath;
}
```

### 分片信息持久化

上传分片信息保存到数据库，用于断点续传恢复：

```javascript
export async function setDBFileFragmentMap(originMessage, fileFragmentItem, fileFragmentIdx) {
    originMessage.fileFragmentMap[fileFragmentIdx] = fileFragmentItem;
    let message = {
        fileFragmentMap: JSON.stringify(originMessage.fileFragmentMap),
        uuid: originMessage.uuid,
        mcTo: originMessage.mcTo,
        mcFrom: originMessage.mcFrom
    };
    await updateMessageWithDatabase([message]);
}
```

## 日志文件上传：uploadApi.js

### 文件位置

`src/api/uploadApi.js`

### 上传流程

日志文件上传采用分片上传协议：

1. **初始化**（`uploadLogInit`）：计算文件 SHA256，获取 uploadId 和 objectName
2. **分片上传**（`uploadLog`）：每片 3MB（私有化部署 6MB），并发数限制为 3
3. **完成确认**（`uploadLogComplete`）：提交所有分片的 etag 信息

```javascript
export async function toUploadLog(file, isLogin = true) {
    // 计算文件 SHA256
    let hash = crypto.createHash('sha256');
    hash.update(fileBuffer);
    let sha256 = hash.digest().toString('hex');

    // 初始化上传
    let initResult = await uploadLogInit({sha256}, idcUrl, isLogin);

    // 分片上传
    const dataArr = await fileTransferBreak({
        fileName: file.name,
        length: fileBufferSize,
        objectName, sha256, uploadId,
        originPath: file.path
    }, idcUrl, isLogin);

    // 完成确认
    let resComplete = await uploadLogComplete({
        filename: file.name, sha256, fileLength: fileBufferSize, uploadId
    }, JSON.stringify(dataArr), idcUrl, isLogin);

    // 清理临时文件
    await clearTempZip(file.path);
    return resComplete.download;
}
```

### 分片处理

```javascript
async function fileTransferBreak({fileName, objectName, sha256, uploadId, length, originPath}, idcUrl) {
    const filebytes = isPrivated ? 6 * 1024 * 1024 : 3 * 1024 * 1024;

    // 构建分片请求队列
    for (let i = 0; i < chunkSize; i++) {
        resArr.push([{start, end}, {uploadId, sha256, partNumber: i + 1, objectName}, chunk, idcUrl]);
    }

    // 每次并发 3 个分片
    async function requestByLimit(limit = 3, resArr, result) {
        while (resArr.length > 0) {
            let currentReq = resArr.splice(0, 3);
            for (let reqParms of currentReq) {
                let piceBuffer = await readDiskPiceFileByStream(originPath, {
                    start: reqParms[0].start,
                    end: reqParms[0].end - 1
                });
                let pieceRes = await uploadLog(reqParms[0], pBuf, reqParms[2], isLogin);
                // ...
            }
        }
    }
}
```

## 文件加密架构

所有文件传输均通过 AES 对称加密：

| 组件 | 用途 |
|------|------|
| `aesKey` | AES 加密密钥（64 字符随机串） |
| `HmacSHA256Key` | HMAC-SHA256 完整性校验密钥（32 字符随机串） |
| `sha256` | 文件/分片的 SHA256 哈希值 |
| `aesIV` | AES 初始化向量（从 SHA256 截取 16-48 位） |

加解密流程：
- **加密**：`FileSHAModule.AESEncrypt(aesKey, aesIV, data)` -> 上传
- **解密**：`FileSHAModule.AESDecrypt(iKey, aesIV, data)` -> 存储

## 磁盘空间检测

下载前检查磁盘剩余空间，空间不足时提示用户：

```javascript
const diskSpace = await checkUserDiskFreeSpace(store.state.config.configDir);
if (diskSpace && diskSpace.free <= downloadMinDiskSize) {
    Message({type: 'warning', message: i18n.t('errorCode.error_space_noleft')});
    throw {status: 'warning', message: '磁盘空间不足'};
}
```

定义了两个阈值：
- `downloadMinDiskSize`：图片下载最小空间要求
- `downloadDiskSize`：文件下载最小空间要求
