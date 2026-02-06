# 已读回执处理机制

## 发送机制

| 函数名                  | 说明                         |
| ----------------------- | ---------------------------- |
| sendMsgReceiptInfo      | 主入口函数，直接发送已读回执 |
| scrollToMetionedReceipt | 用户点击 @ 消息跳转时触发    |
| scrollBottomNewReceipt  | 用户向下滚动查看旧消息时触发 |
| scrollNewMessageReceipt | 用户上跳翻查时触发           |

## 接收机制

## 回执信息查询

```ts
/**
 * 查看并同步已读回执详情
 */
export async function viewAndUpdateReadReceipt(receiptInfos, uuidList, SpaceId) {
  try {
    const res = await getMessageWithDatabase(uuidList, SpaceId);
    if (!Array.isArray(res) || res.length === 0) return;

    const message = res[0];
    const meta = message.m?.meta ?? {};
    const oldReceipt = meta.receiptInfos ?? {};
    const newReceipt = receiptInfos ?? {};

    if (oldReceipt.readcnt !== newReceipt.readcnt) {
      meta.receiptInfos = newReceipt;
      message.m.meta = meta;

      updateMessageReceiptList(SpaceId, [{
        uuid: message.uuid,
        content: message.content,
        m: message.m,
        meta,
      }], 'receiptGroup');
    }
  } catch (err) {
    console.error('[viewAndUpdateReadReceipt] error:', err);
  }
}
```

## 回执缓存清除


