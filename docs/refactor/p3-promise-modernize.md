# P3: Promise 现代化

**优先级**: P3
**涉及文件**: 多个 API 文件
**预期提升**: 代码清晰度↑30%

---

## 问题 1: Promise 反模式

### 问题代码 (peerApi.js)

```javascript
return new Promise(async (resolve, reject) => {
  commonUCRequest({...})
    .then(function (response) {
      resolve(response);
    })
    .catch(function (error) {
      reject(error);
    });
});
```

### 问题分析

- 不必要的 Promise 包装
- 混合 async 和 Promise 构造器
- 代码冗余

### 优化后

```javascript
export async function getContactInfoList(userList = [], spaceId) {
  return commonUCRequest({
    baseURL: getUCBaseURL(spaceId),
    url: '/contact/describe',
    method: 'POST',
    params: { rid: appdataStorage.getItem('c_rid'), enterpriseId: spaceId },
    data: { users: userList.join(',') }
  });
}
```

---

## 问题 2: 回调地狱

### 问题代码

```javascript
function processData(callback) {
  fetchData().then(data => {
    transformData(data).then(transformed => {
      saveData(transformed).then(result => {
        callback(null, result);
      }).catch(err => callback(err));
    }).catch(err => callback(err));
  }).catch(err => callback(err));
}
```

### 优化后

```javascript
async function processData() {
  const data = await fetchData();
  const transformed = await transformData(data);
  return saveData(transformed);
}
```

---

## 问题 3: 混用 CommonJS 和 ES6

### 问题代码 (messageManger.js)

```javascript
const { encodeMessageTransform } = require('@/utils/dataDao');  // CommonJS
import { renderName } from '@/utils/index';  // ES6
const { ipcRenderer } = require('electron');  // CommonJS
```

### 优化后

```javascript
import { encodeMessageTransform } from '@/utils/dataDao';
import { renderName } from '@/utils/index';
import { ipcRenderer } from 'electron';
```

---

## 问题 4: 串行 await 应并行

### 问题代码

```javascript
async function loadData() {
  const users = await fetchUsers();      // 等待
  const messages = await fetchMessages(); // 再等待
  const settings = await fetchSettings(); // 再等待
  return { users, messages, settings };
}
// 总时间 = 3 个请求时间之和
```

### 优化后

```javascript
async function loadData() {
  const [users, messages, settings] = await Promise.all([
    fetchUsers(),
    fetchMessages(),
    fetchSettings()
  ]);
  return { users, messages, settings };
}
// 总时间 = 最慢请求的时间
```

---

## 问题 5: 缺少错误处理

### 问题代码

```javascript
async function updateUser(user) {
  const result = await api.update(user);
  store.commit('SET_USER', result);
}
```

### 优化后

```javascript
async function updateUser(user) {
  try {
    const result = await api.update(user);
    store.commit('SET_USER', result);
    return result;
  } catch (error) {
    console.error('Failed to update user:', error);
    store.commit('SET_ERROR', error.message);
    throw error; // 或返回默认值
  }
}
```

---

## 问题 6: 未处理的 Promise 拒绝

### 问题代码

```javascript
// 忘记 await 或 .catch()
async function init() {
  loadData(); // Promise 被忽略
  setupListeners();
}
```

### 优化后

```javascript
async function init() {
  try {
    await loadData();
    setupListeners();
  } catch (error) {
    handleInitError(error);
  }
}

// 或者明确声明不等待
async function init() {
  loadData().catch(handleLoadError); // 明确处理
  setupListeners();
}
```

---

## 现代化改造清单

| 模式 | 旧写法 | 新写法 |
|------|--------|--------|
| 导入 | `require()` | `import` |
| 导出 | `module.exports` | `export` |
| 异步 | `.then().catch()` | `async/await` |
| 并发 | 串行 await | `Promise.all()` |
| 错误 | 忽略或回调 | `try/catch` |
| 函数 | `function()` | 箭头函数 (适当时) |

---

## ESLint 规则建议

```javascript
// .eslintrc.js
module.exports = {
  rules: {
    // 禁止 Promise 构造器中使用 async
    'no-async-promise-executor': 'error',

    // 要求 await 在循环中合理使用
    'no-await-in-loop': 'warn',

    // 禁止未处理的 Promise
    'no-floating-promises': 'error',

    // 优先使用 async/await
    'prefer-promise-reject-errors': 'error',

    // 要求一致的 import 风格
    'import/no-commonjs': 'error'
  }
};
```

---

**预计工时**: 2-3 天
**负责人**: 待分配
