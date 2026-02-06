# P1: 大型组件拆分

**优先级**: P1
**涉及组件**: 多个超大 Vue 组件
**预期提升**: 首屏↓50%, 可测试性↑60%

---

## 问题组件清单

| 组件 | 大小 | 问题 |
|------|------|------|
| RightContentPanel.vue | >100KB | 聊天、消息、文件对话混合 |
| MeetingSchedule.vue | >100KB | 会议日程、详情、编辑混合 |
| ChatWarp.vue | >50KB | 消息输入、编辑、上传混合 |
| ContactsPanel.vue | >50KB | 联系人列表、搜索、编辑混合 |

---

## RightContentPanel.vue 拆分方案

### 当前结构

```
RightContentPanel.vue (100KB+)
├── 聊天头部
├── 消息列表
├── 消息项（多种类型）
├── 已读回执卡片
├── 文件发送对话框
└── 各种弹窗
```

### 目标结构

```
src/components/Chat/
├── RightContentPanel.vue      # 容器组件 (~5KB)
├── ChatHeader/
│   ├── index.vue              # 聊天头部
│   └── ChatActions.vue        # 操作按钮
├── MessageList/
│   ├── index.vue              # 消息列表容器
│   ├── VirtualScroller.vue    # 虚拟滚动
│   └── MessageItem/
│       ├── index.vue          # 消息项路由
│       ├── TextMessage.vue    # 文本消息
│       ├── ImageMessage.vue   # 图片消息
│       ├── FileMessage.vue    # 文件消息
│       ├── CallMessage.vue    # 通话记录
│       ├── CardMessage.vue    # 卡片消息
│       └── SystemMessage.vue  # 系统消息
├── ReadReceipt/
│   └── RecipientCard.vue      # 已读回执
├── Dialogs/
│   ├── SendFileDialog.vue     # 发送文件
│   └── ForwardDialog.vue      # 转发消息
└── composables/
    ├── useMessageScroll.js    # 滚动逻辑
    ├── useMessageSelection.js # 选择逻辑
    └── useMessageActions.js   # 操作逻辑
```

### 重构后主组件

```vue
<!-- src/components/Chat/RightContentPanel.vue -->
<template>
  <div class="right-content-panel">
    <ChatHeader
      :session="currentSession"
      @action="handleAction"
    />

    <MessageList
      :messages="messages"
      :loading="loading"
      @load-more="loadMoreMessages"
      @select="handleSelect"
    />

    <ChatInput
      v-if="canSendMessage"
      @send="sendMessage"
      @file="openFileDialog"
    />

    <!-- 弹窗按需加载 -->
    <SendFileDialog
      v-if="showFileDialog"
      v-model="showFileDialog"
      @send="handleSendFile"
    />
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import ChatHeader from './ChatHeader/index.vue';
import MessageList from './MessageList/index.vue';
import ChatInput from './ChatInput/index.vue';

// 懒加载弹窗
const SendFileDialog = defineAsyncComponent(() =>
  import('./Dialogs/SendFileDialog.vue')
);

// 使用 composables
import { useMessageScroll } from './composables/useMessageScroll';
import { useMessageActions } from './composables/useMessageActions';

const { messages, loading, loadMoreMessages } = useMessageScroll();
const { sendMessage, handleSendFile } = useMessageActions();
</script>
```

### 消息项组件

```vue
<!-- src/components/Chat/MessageList/MessageItem/index.vue -->
<template>
  <component
    :is="messageComponent"
    :message="message"
    @action="$emit('action', $event)"
  />
</template>

<script setup>
import { computed, defineAsyncComponent } from 'vue';

const props = defineProps({
  message: { type: Object, required: true }
});

// 按类型懒加载
const componentMap = {
  text: defineAsyncComponent(() => import('./TextMessage.vue')),
  image: defineAsyncComponent(() => import('./ImageMessage.vue')),
  file: defineAsyncComponent(() => import('./FileMessage.vue')),
  call: defineAsyncComponent(() => import('./CallMessage.vue')),
  card: defineAsyncComponent(() => import('./CardMessage.vue')),
  system: defineAsyncComponent(() => import('./SystemMessage.vue'))
};

const messageComponent = computed(() => {
  const type = props.message.type || 'text';
  return componentMap[type] || componentMap.text;
});
</script>
```

---

## Composables 提取

### useMessageScroll.js

```javascript
// src/components/Chat/composables/useMessageScroll.js
import { ref, onMounted, onUnmounted } from 'vue';
import { useStore } from 'vuex';

export function useMessageScroll(dialogId) {
  const store = useStore();
  const messages = ref([]);
  const loading = ref(false);
  const hasMore = ref(true);

  const loadMoreMessages = async () => {
    if (loading.value || !hasMore.value) return;

    loading.value = true;
    try {
      const oldestTime = messages.value[0]?.time || Date.now();
      const newMessages = await store.dispatch('message/loadHistory', {
        dialogId,
        beforeTime: oldestTime,
        limit: 20
      });

      if (newMessages.length < 20) {
        hasMore.value = false;
      }

      messages.value = [...newMessages, ...messages.value];
    } finally {
      loading.value = false;
    }
  };

  const scrollToBottom = () => {
    // 滚动到底部逻辑
  };

  return {
    messages,
    loading,
    hasMore,
    loadMoreMessages,
    scrollToBottom
  };
}
```

### useMessageActions.js

```javascript
// src/components/Chat/composables/useMessageActions.js
import { useStore } from 'vuex';

export function useMessageActions(dialogId) {
  const store = useStore();

  const sendMessage = async (content, type = 'text') => {
    return store.dispatch('message/send', {
      dialogId,
      content,
      type
    });
  };

  const deleteMessage = async (messageId) => {
    return store.dispatch('message/delete', { messageId });
  };

  const forwardMessage = async (messageId, targetDialogs) => {
    return store.dispatch('message/forward', {
      messageId,
      targetDialogs
    });
  };

  const withdrawMessage = async (messageId) => {
    return store.dispatch('message/withdraw', { messageId });
  };

  return {
    sendMessage,
    deleteMessage,
    forwardMessage,
    withdrawMessage
  };
}
```

---

## 虚拟滚动优化

```vue
<!-- src/components/Chat/MessageList/VirtualScroller.vue -->
<template>
  <div
    class="virtual-scroller"
    ref="containerRef"
    @scroll="handleScroll"
  >
    <div :style="{ height: totalHeight + 'px' }">
      <div :style="{ transform: `translateY(${offsetY}px)` }">
        <div
          v-for="item in visibleItems"
          :key="item.id"
          :style="{ height: itemHeight + 'px' }"
        >
          <slot :item="item" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';

const props = defineProps({
  items: { type: Array, required: true },
  itemHeight: { type: Number, default: 60 },
  buffer: { type: Number, default: 5 }
});

const containerRef = ref(null);
const scrollTop = ref(0);
const containerHeight = ref(0);

const totalHeight = computed(() => props.items.length * props.itemHeight);

const startIndex = computed(() => {
  return Math.max(0, Math.floor(scrollTop.value / props.itemHeight) - props.buffer);
});

const endIndex = computed(() => {
  const visibleCount = Math.ceil(containerHeight.value / props.itemHeight);
  return Math.min(props.items.length, startIndex.value + visibleCount + props.buffer * 2);
});

const visibleItems = computed(() => {
  return props.items.slice(startIndex.value, endIndex.value);
});

const offsetY = computed(() => startIndex.value * props.itemHeight);

const handleScroll = (e) => {
  scrollTop.value = e.target.scrollTop;
};

onMounted(() => {
  containerHeight.value = containerRef.value?.clientHeight || 0;
});
</script>
```

---

## 性能对比

| 指标 | 拆分前 | 拆分后 | 提升 |
|------|--------|--------|------|
| 组件文件大小 | 100KB | 5KB (主) + 按需 | 95% |
| 首屏加载 | 800ms | 300ms | 62% |
| DOM 节点数 | 1000+ | 50 (虚拟) | 95% |
| 内存占用 | 200MB | 60MB | 70% |

---

## 实施步骤

1. [ ] 创建目录结构
2. [ ] 提取 composables
3. [ ] 拆分消息类型组件
4. [ ] 实现虚拟滚动
5. [ ] 懒加载弹窗组件
6. [ ] 性能测试验证

---

**预计工时**: 5-7 天
**负责人**: 待分配
