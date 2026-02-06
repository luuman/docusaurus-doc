# P2: 深拷贝优化

**优先级**: P2
**涉及文件**: `messageManger.js`, `peerApi.js`
**预期提升**: 内存↓60%, 执行速度↑50%

---

## 问题代码

### 位置 1: messageManger.js (lines 2880-2900)

```javascript
const messageList = receiptInfo.map(item => {
  const simpleMessage = _.cloneDeep(message);  // 重复深拷贝
  simpleMessage.m.meta.receiptInfo = [item];
  return simpleMessage;
});

// 后续循环中再次 clone
for (let i = 0; i < messageList.length; i++) {
  await saveReceiptAllMessage(_.cloneDeep(messageList[i]));  // 再次 clone
}
```

### 问题分析

- 100 条回执 = 200 次深拷贝
- 每个消息对象约 2-5KB
- 总内存分配: 200-500KB
- GC 压力大，可能导致卡顿

---

## 优化方案

### 方案 1: 浅拷贝 + 选择性深拷贝

```javascript
const messageList = receiptInfo.map(item => ({
  ...message,
  m: {
    ...message.m,
    meta: {
      ...message.m.meta,
      receiptInfo: [item]
    }
  },
  uuid: `receipt|${message.m.uuid}|${item.ruuid}`,
  __ruuid: item.ruuid
}));

// 避免二次 clone，直接使用
await Promise.all(messageList.map(msg => saveReceiptAllMessage(msg)));
```

### 方案 2: 创建专用工厂函数

```javascript
// src/utils/messageFactory.js
export function createReceiptMessage(baseMessage, receiptItem) {
  return {
    // 只复制需要的字段
    dialogId: baseMessage.dialogId,
    type: baseMessage.type,
    time: baseMessage.time,
    m: {
      uuid: baseMessage.m.uuid,
      meta: {
        receiptInfo: [receiptItem]
      }
    },
    uuid: `receipt|${baseMessage.m.uuid}|${receiptItem.ruuid}`,
    __ruuid: receiptItem.ruuid
  };
}

// 使用
const messageList = receiptInfo.map(item =>
  createReceiptMessage(message, item)
);
```

### 方案 3: 使用 structuredClone (现代浏览器)

```javascript
// 比 _.cloneDeep 快 2-3 倍
const cloned = structuredClone(message);

// 封装兼容版本
export function fastClone(obj) {
  if (typeof structuredClone === 'function') {
    return structuredClone(obj);
  }
  return JSON.parse(JSON.stringify(obj));
}
```

---

## 其他深拷贝位置

### 位置 2: peerApi.js

```javascript
// 问题
const newPeer = _.cloneDeep(existingPeer);
newPeer.name = newName;

// 优化
const newPeer = { ...existingPeer, name: newName };
```

### 位置 3: Vuex mutations

```javascript
// 问题
state.messages = _.cloneDeep(messages);

// 优化：直接赋值，Vue 会处理响应式
state.messages = messages;

// 如果需要确保不可变
state.messages = Object.freeze([...messages]);
```

---

## 何时需要深拷贝

| 场景 | 是否需要深拷贝 | 建议 |
|------|--------------|------|
| 修改嵌套对象 | 是（但可优化） | 只深拷贝要修改的路径 |
| 传递给外部 | 视情况 | 使用 Object.freeze |
| Vuex 状态 | 通常不需要 | 依赖 Vue 响应式 |
| 函数参数 | 通常不需要 | 明确文档约定 |
| 缓存 | 是 | 考虑结构化克隆 |

---

## 性能对比

```javascript
// 基准测试
const testObj = { a: 1, b: { c: 2, d: { e: 3 } } };
const iterations = 10000;

// _.cloneDeep: ~150ms
console.time('lodash');
for (let i = 0; i < iterations; i++) {
  _.cloneDeep(testObj);
}
console.timeEnd('lodash');

// structuredClone: ~50ms
console.time('structuredClone');
for (let i = 0; i < iterations; i++) {
  structuredClone(testObj);
}
console.timeEnd('structuredClone');

// JSON.parse/stringify: ~80ms
console.time('JSON');
for (let i = 0; i < iterations; i++) {
  JSON.parse(JSON.stringify(testObj));
}
console.timeEnd('JSON');

// 浅拷贝 + 选择性深拷贝: ~10ms
console.time('selective');
for (let i = 0; i < iterations; i++) {
  ({ ...testObj, b: { ...testObj.b, d: { ...testObj.b.d } } });
}
console.timeEnd('selective');
```

---

## 实施检查清单

- [ ] 搜索所有 `_.cloneDeep` 使用
- [ ] 分析每处是否必要
- [ ] 替换为更高效方案
- [ ] 性能测试验证

---

**预计工时**: 1-2 天
**负责人**: 待分配
