# 新功能开发指南

## 概述

本指南介绍如何在 Matrx Windows 项目中添加新功能，包括添加新页面、新组件、新 API 等常见开发场景。

## 添加新的功能窗口

### 步骤 1: 创建渲染进程入口

```bash
# 创建目录
mkdir -p src/renderer/newFeature
```

创建入口文件 `src/renderer/newFeature/main.js`:

```javascript
import Vue from 'vue';
import App from './App.vue';
import i18n from '@/lang';
import ElementUI from 'element-ui';
import 'element-ui/lib/theme-chalk/index.css';

Vue.use(ElementUI);

new Vue({
  i18n,
  render: h => h(App)
}).$mount('#app');
```

创建根组件 `src/renderer/newFeature/App.vue`:

```vue
<template>
  <div class="new-feature">
    <div class="title-bar">
      <span class="title">{{ $t('newFeature.title') }}</span>
      <div class="window-controls">
        <button @click="minimize">-</button>
        <button @click="close">×</button>
      </div>
    </div>
    <div class="content">
      <!-- 功能内容 -->
    </div>
  </div>
</template>

<script>
const { ipcRenderer } = window.electron;

export default {
  name: 'NewFeature',
  methods: {
    minimize() {
      ipcRenderer.send('minimize-window');
    },
    close() {
      ipcRenderer.send('close-window');
    }
  }
};
</script>

<style lang="scss" scoped>
.new-feature {
  height: 100vh;
  display: flex;
  flex-direction: column;
}

.title-bar {
  height: 32px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 12px;
  -webkit-app-region: drag;
  background: var(--bg-secondary);
}

.window-controls {
  -webkit-app-region: no-drag;
}

.content {
  flex: 1;
  overflow: auto;
  padding: 16px;
}
</style>
```

### 步骤 2: 配置 Vue 多页面

编辑 `vue.config.js`:

```javascript
module.exports = {
  pages: {
    // ... 其他页面
    newFeature: {
      entry: 'src/renderer/newFeature/main.js',
      template: 'public/newFeature.html',
      filename: 'newFeature.html',
      title: 'New Feature'
    }
  }
};
```

### 步骤 3: 创建 HTML 模板

创建 `public/newFeature.html`:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
  <title>New Feature</title>
</head>
<body>
  <div id="app"></div>
</body>
</html>
```

### 步骤 4: 创建主进程窗口管理

编辑或创建 `src/main/newFeature.js`:

```javascript
const { BrowserWindow } = require('electron');
const path = require('path');

let newFeatureWin = null;

function createNewFeatureWindow(options = {}) {
  if (newFeatureWin && !newFeatureWin.isDestroyed()) {
    newFeatureWin.focus();
    return newFeatureWin;
  }

  newFeatureWin = new BrowserWindow({
    width: options.width || 600,
    height: options.height || 400,
    parent: global.currentWin,
    modal: false,
    show: false,
    frame: false,
    resizable: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload/newFeature.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  if (process.env.NODE_ENV === 'development') {
    newFeatureWin.loadURL('http://localhost:8080/newFeature.html');
  } else {
    newFeatureWin.loadFile(path.join(__dirname, '../dist/newFeature.html'));
  }

  newFeatureWin.once('ready-to-show', () => {
    newFeatureWin.show();
    // 传递初始数据
    newFeatureWin.webContents.send('init-data', options.data);
  });

  newFeatureWin.on('closed', () => {
    newFeatureWin = null;
  });

  return newFeatureWin;
}

function closeNewFeatureWindow() {
  if (newFeatureWin && !newFeatureWin.isDestroyed()) {
    newFeatureWin.close();
  }
}

module.exports = {
  createNewFeatureWindow,
  closeNewFeatureWindow
};
```

### 步骤 5: 创建预加载脚本

创建 `src/main/preload/newFeature.js`:

```javascript
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
  ipcRenderer: {
    send: (channel, ...args) => {
      const validChannels = ['minimize-window', 'close-window', 'new-feature-action'];
      if (validChannels.includes(channel)) {
        ipcRenderer.send(channel, ...args);
      }
    },
    on: (channel, func) => {
      const validChannels = ['init-data', 'update-data'];
      if (validChannels.includes(channel)) {
        ipcRenderer.on(channel, (event, ...args) => func(...args));
      }
    },
    invoke: (channel, ...args) => {
      const validChannels = ['get-data', 'save-data'];
      if (validChannels.includes(channel)) {
        return ipcRenderer.invoke(channel, ...args);
      }
    }
  }
});
```

### 步骤 6: 注册 IPC 处理器

在 `src/main/IPCMainChannel.js` 中添加:

```javascript
const { createNewFeatureWindow } = require('./newFeature');

// 打开新功能窗口
ipcMain.on('open-new-feature', (event, data) => {
  createNewFeatureWindow({ data });
});

// 处理新功能操作
ipcMain.handle('new-feature-action', async (event, action, params) => {
  // 处理逻辑
  return { success: true };
});
```

## 添加新的 Vue 组件

### 步骤 1: 创建组件文件

创建 `src/components/NewComponent/index.vue`:

```vue
<template>
  <div class="new-component">
    <div class="new-component__header">
      <slot name="header">{{ title }}</slot>
    </div>
    <div class="new-component__content">
      <slot></slot>
    </div>
    <div class="new-component__footer">
      <slot name="footer">
        <el-button @click="handleCancel">{{ $t('common.cancel') }}</el-button>
        <el-button type="primary" @click="handleConfirm">{{ $t('common.confirm') }}</el-button>
      </slot>
    </div>
  </div>
</template>

<script>
export default {
  name: 'NewComponent',

  props: {
    title: {
      type: String,
      default: ''
    },
    visible: {
      type: Boolean,
      default: false
    }
  },

  data() {
    return {
      loading: false
    };
  },

  methods: {
    handleConfirm() {
      this.$emit('confirm');
    },
    handleCancel() {
      this.$emit('cancel');
      this.$emit('update:visible', false);
    }
  }
};
</script>

<style lang="scss" scoped>
.new-component {
  &__header {
    padding: 16px;
    font-size: 16px;
    font-weight: 500;
    border-bottom: 1px solid var(--border-color);
  }

  &__content {
    padding: 16px;
    min-height: 100px;
  }

  &__footer {
    padding: 16px;
    text-align: right;
    border-top: 1px solid var(--border-color);
  }
}
</style>
```

### 步骤 2: 导出组件

创建 `src/components/NewComponent/index.js`:

```javascript
import NewComponent from './index.vue';

NewComponent.install = function(Vue) {
  Vue.component(NewComponent.name, NewComponent);
};

export default NewComponent;
```

### 步骤 3: 使用组件

```vue
<template>
  <new-component
    :title="dialogTitle"
    :visible.sync="dialogVisible"
    @confirm="handleConfirm"
  >
    <p>组件内容</p>
  </new-component>
</template>

<script>
import NewComponent from '@/components/NewComponent';

export default {
  components: { NewComponent },
  data() {
    return {
      dialogTitle: '新功能',
      dialogVisible: false
    };
  },
  methods: {
    handleConfirm() {
      // 处理确认逻辑
    }
  }
};
</script>
```

## 添加新的 API

### 步骤 1: 创建 API 模块

创建 `src/api/newFeatureApi.js`:

```javascript
import { commonUCRequest, getBaseSpaceUserURL } from './request';

/**
 * 获取新功能数据列表
 * @param {Object} params - 查询参数
 * @returns {Promise}
 */
export function getNewFeatureList(params) {
  return commonUCRequest({
    url: `${getBaseSpaceUserURL()}/new-feature/list`,
    method: 'GET',
    params
  });
}

/**
 * 创建新功能项
 * @param {Object} data - 创建数据
 * @returns {Promise}
 */
export function createNewFeatureItem(data) {
  return commonUCRequest({
    url: `${getBaseSpaceUserURL()}/new-feature`,
    method: 'POST',
    data
  });
}

/**
 * 更新新功能项
 * @param {string} id - 项目 ID
 * @param {Object} data - 更新数据
 * @returns {Promise}
 */
export function updateNewFeatureItem(id, data) {
  return commonUCRequest({
    url: `${getBaseSpaceUserURL()}/new-feature/${id}`,
    method: 'PUT',
    data
  });
}

/**
 * 删除新功能项
 * @param {string} id - 项目 ID
 * @returns {Promise}
 */
export function deleteNewFeatureItem(id) {
  return commonUCRequest({
    url: `${getBaseSpaceUserURL()}/new-feature/${id}`,
    method: 'DELETE'
  });
}
```

### 步骤 2: 创建 Vuex 模块

创建 `src/store/modules/newFeature.js`:

```javascript
import {
  getNewFeatureList,
  createNewFeatureItem,
  updateNewFeatureItem,
  deleteNewFeatureItem
} from '@/api/newFeatureApi';

export default {
  namespaced: true,

  state: {
    list: [],
    loading: false,
    total: 0,
    currentPage: 1,
    pageSize: 20
  },

  getters: {
    isEmpty: state => state.list.length === 0
  },

  mutations: {
    SET_LIST(state, list) {
      state.list = list;
    },
    SET_LOADING(state, loading) {
      state.loading = loading;
    },
    SET_TOTAL(state, total) {
      state.total = total;
    },
    SET_PAGE(state, { page, pageSize }) {
      if (page !== undefined) state.currentPage = page;
      if (pageSize !== undefined) state.pageSize = pageSize;
    },
    ADD_ITEM(state, item) {
      state.list.unshift(item);
      state.total += 1;
    },
    UPDATE_ITEM(state, { id, data }) {
      const index = state.list.findIndex(item => item.id === id);
      if (index !== -1) {
        state.list.splice(index, 1, { ...state.list[index], ...data });
      }
    },
    REMOVE_ITEM(state, id) {
      state.list = state.list.filter(item => item.id !== id);
      state.total -= 1;
    }
  },

  actions: {
    async fetchList({ commit, state }, params = {}) {
      commit('SET_LOADING', true);
      try {
        const response = await getNewFeatureList({
          page: state.currentPage,
          pageSize: state.pageSize,
          ...params
        });
        commit('SET_LIST', response.data.list);
        commit('SET_TOTAL', response.data.total);
      } finally {
        commit('SET_LOADING', false);
      }
    },

    async create({ commit }, data) {
      const response = await createNewFeatureItem(data);
      commit('ADD_ITEM', response.data);
      return response.data;
    },

    async update({ commit }, { id, data }) {
      await updateNewFeatureItem(id, data);
      commit('UPDATE_ITEM', { id, data });
    },

    async delete({ commit }, id) {
      await deleteNewFeatureItem(id);
      commit('REMOVE_ITEM', id);
    }
  }
};
```

### 步骤 3: 注册 Store 模块

编辑 `src/store/index.js`:

```javascript
import newFeature from './modules/newFeature';

export default new Vuex.Store({
  modules: {
    // ... 其他模块
    newFeature
  }
});
```

## 添加国际化文案

### 步骤 1: 添加语言文件

编辑 `src/lang/locales/en/index.js`:

```javascript
export default {
  // ... 其他文案
  newFeature: {
    title: 'New Feature',
    create: 'Create',
    edit: 'Edit',
    delete: 'Delete',
    confirmDelete: 'Are you sure you want to delete this item?',
    createSuccess: 'Created successfully',
    updateSuccess: 'Updated successfully',
    deleteSuccess: 'Deleted successfully'
  }
};
```

编辑 `src/lang/locales/zh-CN/index.js`:

```javascript
export default {
  // ... 其他文案
  newFeature: {
    title: '新功能',
    create: '创建',
    edit: '编辑',
    delete: '删除',
    confirmDelete: '确定要删除此项吗？',
    createSuccess: '创建成功',
    updateSuccess: '更新成功',
    deleteSuccess: '删除成功'
  }
};
```

### 步骤 2: 使用国际化

```vue
<template>
  <div>
    <h1>{{ $t('newFeature.title') }}</h1>
    <el-button @click="create">{{ $t('newFeature.create') }}</el-button>
  </div>
</template>

<script>
export default {
  methods: {
    async create() {
      // 创建逻辑
      this.$message.success(this.$t('newFeature.createSuccess'));
    }
  }
};
</script>
```

## 添加数据库操作

### 步骤 1: 创建表结构

编辑 `src/sql/init/index.js`:

```javascript
// 在 createTables 方法中添加
createNewFeatureTable() {
  return `
    CREATE TABLE IF NOT EXISTS new_feature (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      status TEXT DEFAULT 'active',
      created_at INTEGER,
      updated_at INTEGER
    )
  `;
}
```

### 步骤 2: 创建 SQL API

创建 `src/sqlApi/newFeature.js`:

```javascript
const db = require('../sql/init');

export async function getNewFeatureItems(limit = 50, offset = 0) {
  return db.all(`
    SELECT * FROM new_feature
    ORDER BY created_at DESC
    LIMIT ? OFFSET ?
  `, [limit, offset]);
}

export async function getNewFeatureItem(id) {
  return db.get('SELECT * FROM new_feature WHERE id = ?', [id]);
}

export async function saveNewFeatureItem(item) {
  const now = Date.now();
  return db.run(`
    INSERT OR REPLACE INTO new_feature
    (id, name, description, status, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `, [item.id, item.name, item.description, item.status, now, now]);
}

export async function deleteNewFeatureItem(id) {
  return db.run('DELETE FROM new_feature WHERE id = ?', [id]);
}
```

## 测试新功能

### 单元测试

创建 `tests/unit/newFeature.spec.js`:

```javascript
import { shallowMount } from '@vue/test-utils';
import NewComponent from '@/components/NewComponent';

describe('NewComponent.vue', () => {
  it('renders title correctly', () => {
    const title = 'Test Title';
    const wrapper = shallowMount(NewComponent, {
      propsData: { title }
    });
    expect(wrapper.find('.new-component__header').text()).toBe(title);
  });

  it('emits confirm event when confirm button clicked', async () => {
    const wrapper = shallowMount(NewComponent);
    await wrapper.find('.el-button--primary').trigger('click');
    expect(wrapper.emitted().confirm).toBeTruthy();
  });
});
```

### 运行测试

```bash
# 运行单元测试
npm run test:unit

# 运行特定测试文件
npm run test:unit -- --grep "NewComponent"
```

## 代码提交检查清单

- [ ] 代码符合 ESLint 规范
- [ ] 组件有完整的 Props 定义
- [ ] API 有完整的 JSDoc 注释
- [ ] 添加了必要的国际化文案
- [ ] 添加了必要的单元测试
- [ ] 在开发环境测试通过
- [ ] 更新了相关文档
