# AI 模块

## 概述

AI 模块是 Matrx Windows 客户端的智能助手功能，以独立渲染进程窗口的形式运行，提供与 AI 后端服务的对话交互能力。该模块基于 ai-facade 后端服务构建，支持多轮对话、会话管理、深度思考（DeepThink）、文件上传分析、Markdown 渲染、SSE 流式响应等功能。模块采用独立的 Vue 实例挂载，通过 IPC 通信与主进程交互，通过 preload 脚本暴露安全的 API 接口。

## 核心文件结构

```
src/
├── api/
│   └── aiApi.js                              # AI API 接口定义
├── renderer/
│   └── aiModel/
│       ├── main.js                           # Vue 实例入口
│       ├── App.vue                           # 根组件（核心业务逻辑）
│       ├── preload.js                        # IPC 预加载脚本
│       ├── element.config.js                 # Element UI 配置
│       ├── services/
│       │   └── fileUploadService.js          # 文件上传与流式请求服务
│       ├── components/
│       │   └── aiModelMain/
│       │       ├── index.vue                 # 主布局组件
│       │       ├── TopHeader.vue             # 顶部标题栏
│       │       ├── WelcomeMessage.vue        # 欢迎页
│       │       ├── AiMessageBox.vue          # 消息列表容器
│       │       ├── AiMessageItem.vue         # 单条消息组件
│       │       ├── InputArea.vue             # 输入区域
│       │       ├── HistoryArea.vue           # 历史会话侧边栏
│       │       ├── HistoryAreaList.vue       # 历史会话列表
│       │       ├── FunctionShortcuts.vue     # 功能快捷按钮
│       │       ├── MessageInput.vue          # 消息输入框
│       │       ├── MessageInput.js           # 输入框逻辑
│       │       ├── FileSend.vue              # 文件选择发送
│       │       ├── ShowFileList.vue          # 已选文件列表
│       │       ├── editor.js                 # 编辑器配置
│       │       ├── MarkDownIt/               # Markdown 渲染组件
│       │       │   ├── index.vue
│       │       │   ├── github-markdown-light.css
│       │       │   └── markdown-it-image/    # 图片查看器插件
│       │       └── buttons/                  # 按钮图标组件集
│       │           ├── aiAddBtn.vue          # 新建对话按钮
│       │           ├── aiAnalyzeCode.vue     # 分析代码图标
│       │           ├── aiWriteCode.vue       # 写代码图标
│       │           ├── aiTranslateCode.vue   # 翻译图标
│       │           ├── copyBtn.vue           # 复制按钮
│       │           ├── refreshBtn.vue        # 重新生成按钮
│       │           ├── deepThink.vue         # 深度思考图标
│       │           ├── sentMessageBtn.vue    # 发送按钮
│       │           ├── aiSuspendBtn.vue      # 停止生成按钮
│       │           └── chatListBtn.vue       # 历史列表按钮
│       └── assets/                           # AI 模块静态资源
```

## 详细代码分析

### 1. aiApi.js - API 接口层

`aiApi.js` 封装了与 ai-facade 后端服务交互的所有请求，所有接口均携带 `pattern: 'windows'` 参数标识客户端平台。

```javascript
// src/api/aiApi.js
import { commonUCRequest } from './axiosInstance';
import { getUCBaseURL } from '@/utils/base';
```

#### API 接口总览

| 函数名 | HTTP 方法 | 路径 | 说明 |
|-------|-----------|------|------|
| `getAiNewId` | POST | `/ai-facade/v1/api/ai-facade/conversation/initialize` | 创建新会话 |
| `getAiChart` | POST | `/ai-facade/v1/api/ai-facade/conversation` | 发送消息（SSE 流式） |
| `getAiMessage` | GET | `/ai-facade/v1/api/ai-facade/conversation/{id}/message` | 获取会话消息历史 |
| `getAiDeleteMessage` | DELETE | `/ai-facade/v1/api/ai-facade/conversation/{id}/message` | 删除单条消息 |
| `getAiDeleteConversationId` | DELETE | `/ai-facade/v1/api/ai-facade/conversation/{id}` | 删除整个会话 |
| `getAiList` | GET | `/ai-facade/v1/api/ai-facade/conversation/list` | 获取会话列表 |
| `getAiFile` | POST | `/ai-facade/v1/api/ai-facade/conversation/file` | 上传文件到会话 |
| `getAiFileUpload` | POST | `/ai-facade/v1/api/common/file/upload/sign` | 获取文件上传签名 URL |
| `getAiFileDownload` | POST | `/ai-facade/v1/api/common/file/download/sign` | 获取文件下载签名 URL |

`getAiChart` 函数支持 SSE 流式响应，通过 `commonUCRequest` 的第二、三个参数启用：

```javascript
export function getAiChart(postData, params) {
    return commonUCRequest(
        { /* 请求配置 */ },
        true,  // 启用流式
        true   // SSE 模式
    ).catch(async err => err);
}
```

### 2. preload.js - IPC 通信桥接

`preload.js` 在渲染进程中暴露安全的 `window.aiIpcBack` 对象，通过 `ipcRenderer.invoke` 与主进程双向通信。

```javascript
// src/renderer/aiModel/preload.js
window.aiIpcBack = {
    createSession: data => ipcRenderer.invoke('get-ai-new-id', data),
    listSessions: data => ipcRenderer.invoke('get-ai-list', data),
    deleteConversation: data => ipcRenderer.invoke('delete-ai-conversation', data),
    sendMessage: data => ipcRenderer.invoke('get-ai-chart', data),
    getMessageHistory: data => ipcRenderer.invoke('get-ai-message', data),
    deleteMessage: data => ipcRenderer.invoke('delete-ai-message', data),
    uploadFile: data => ipcRenderer.invoke('get-ai-file', data),
    uploadAiFile: data => ipcRenderer.invoke('get-ai-file-upload', data),
    downLoadAiFile: data => ipcRenderer.invoke('get-ai-file-down', data)
};
```

IPC 通道与 API 的对应关系：

| IPC 通道 | 主进程处理 | 最终调用 API |
|---------|-----------|-------------|
| `get-ai-new-id` | AI 控制器 | `getAiNewId` |
| `get-ai-chart` | AI 控制器 | `getAiChart` |
| `get-ai-list` | AI 控制器 | `getAiList` |
| `get-ai-message` | AI 控制器 | `getAiMessage` |
| `delete-ai-conversation` | AI 控制器 | `getAiDeleteConversationId` |
| `get-ai-file-upload` | AI 控制器 | `getAiFileUpload` |

### 3. App.vue - 根组件核心逻辑

`App.vue` 是 AI 模块的顶层组件，管理会话状态、消息发送、流式响应处理等核心逻辑。

```javascript
// src/renderer/aiModel/App.vue
export default {
    name: 'App',
    data() {
        return {
            conversationId: '',           // 当前会话 ID
            refreshConversationId: '',    // 重新生成时的目标消息 ID
            response: '',                  // 累积的流式响应内容
            responseThinking: '',          // 累积的思考内容
            isSendMessage: false,          // 是否正在发送/等待响应
            controller: '',                // AbortController 实例
            messageList: [],               // 当前会话消息列表
            historyList: [],               // 会话历史列表
            topTitle: ''                   // 当前会话标题
        };
    }
};
```

#### 消息发送流程

`sendMessage` 方法实现了完整的消息发送逻辑：

```javascript
async sendMessage(mgObj, isrefresh = false) {
    // 1. 如果没有会话 ID，先创建新会话
    if (!this.conversationId) {
        const response = await window.aiIpcBack.createSession({ agent: 'assistant' });
        this.conversationId = response.data.conversation_id;
        this.historyList.unshift({
            id: this.conversationId,
            title: response.title || mgObj.aiMessage,
            updatedAt: Date.now()
        });
        tasksList = ['title'];  // 标记需要生成标题
    }

    // 2. 构建历史消息上下文（取最近 4 条用户消息）
    const historyMessages = this.messageList
        .filter(i => i.role === 'user')
        .map(item => ({ role: item.role, messageId: item.messageId, ... }))
        .slice(-4);

    // 3. 添加用户消息到列表
    this.messageList.push({
        role: 'user',
        messageId: uuidv4(),
        message: { delta: mgObj.aiMessage, ... }
    });

    // 4. 添加 AI 占位消息（loading 状态）
    this.messageList.push({
        loading: true,
        role: 'assistant',
        messageId: uuidv4(),
        message: { delta: '', thinking: null, thinkingTime: 0 }
    });

    // 5. 延迟 3 秒后发起流式请求
    setTimeout(() => {
        this.chatCompletions({
            conversationId: this.conversationId,
            message: { ... },
            thinkingEnabled: mgObj.isDeepThink || false,
            enableSearch: mgObj.isSearchInfo || false,
            historyMessages: historyMessages
        });
    }, 3000);
}
```

#### SSE 流式响应处理

流式响应通过 `fileUploadService.streamRequest` 发起 Fetch 请求，使用 ReadableStream 逐块读取：

```javascript
processStreamResponse(response, updateHandler, doneHandler,
                      errorHandler, setTitleHandler, updateThinkHandler) {
    const lines = response.split('\n');
    for (const line of lines) {
        const eventMatch = cleanedLine.match(/^event:\s*(\S+)/);
        const dataMatch = cleanedLine.match(/^data:\s*(.*)$/);

        switch (currentEvent) {
            case 'delta':           // AI 回复内容增量
                updateHandler({ content: fullContent });
                break;
            case 'delta_thinking':  // 深度思考内容增量
                updateThinkHandler({ content: fullContent });
                break;
            case 'title':           // 会话标题更新
                setTitleHandler(fullContent);
                break;
            case 'error':           // 错误信息
                errorHandler(dataMatch.message);
                break;
            case 'done':            // 生成完成
                doneHandler(currentId);
                break;
        }
    }
}
```

SSE 事件类型说明：

| 事件 | 说明 | 处理方式 |
|------|------|---------|
| `delta` | AI 回复内容增量 | 累积拼接到 `response` 并更新 messageList |
| `delta_thinking` | 深度思考内容增量 | 累积拼接到 `responseThinking` |
| `title` | 自动生成的会话标题 | 更新 historyList 和 topTitle |
| `error` | 服务端错误 | 在消息项上显示错误提示 |
| `done` | 生成完毕 | 重置发送状态，保存消息到历史 |

### 4. aiModelMain/index.vue - 主布局组件

```javascript
// src/renderer/aiModel/components/aiModelMain/index.vue
export default {
    name: 'MainLayout',
    components: { TopHeader, WelcomeMessage, InputArea, HistoryArea, AiMessageBox },
    data() {
        return {
            isHistoryOpen: false,    // 历史侧边栏是否展开
            isDeepThink: true,       // 深度思考默认开启
            isSearchInfo: false      // 联网搜索默认关闭
        };
    }
};
```

布局结构：

```
┌──────────────────────────────────────┐
│ TopHeader (历史列表按钮 | 标题 | 新建按钮) │
├──────────┬───────────────────────────┤
│ History  │  WelcomeMessage (无会话时)  │
│ Area     │  或                        │
│ (可折叠)  │  AiMessageBox (有会话时)   │
│          ├───────────────────────────┤
│          │  InputArea (输入区域)       │
└──────────┴───────────────────────────┘
```

### 5. AiMessageItem.vue - 消息渲染

每条消息根据角色（`user`/`assistant`）和状态（`loading`/`done`/`error`）呈现不同 UI：

```javascript
// src/renderer/aiModel/components/aiModelMain/AiMessageItem.vue
// 用户消息：紫色渐变背景，右对齐
// AI 消息：白色背景，左对齐，支持 Markdown 渲染
// loading 状态：彩虹渐变边框动画 + 圆点跳动动画
// 错误状态：红色左边框提示条 + 重试/编辑链接
```

AI 回复消息支持深度思考展示：

```html
<div v-if="messageInfo?.thinking" class="thinking">
    <div class="thinking-title" @click="isThinking = !isThinking">
        <span v-if="!messageInfo?.thinkingTime">深度思考中...</span>
        <span v-else>思考了 {{ formatTime(messageInfo?.thinkingTime) }}</span>
    </div>
    <div class="thinking-main" v-show="isThinking">{{ messageInfo?.thinking }}</div>
</div>
```

消息操作按钮（仅在 AI 回复生成完成后显示）：
- **复制**：`copyBtn` 复制消息内容到剪贴板
- **重新生成**：`refreshBtn` 重新发送上一条用户消息获取新回复

### 6. InputArea.vue - 输入区域

```javascript
// src/renderer/aiModel/components/aiModelMain/InputArea.vue
export default {
    name: 'InputArea',
    components: {
        deepThink,              // 深度思考切换按钮
        FunctionShortcuts,      // 功能快捷入口
        FileSend,               // 文件上传入口
        MessageInput,           // 消息输入框
        ShowFileList            // 已选文件列表
    }
};
```

输入区域功能：
- **消息输入**：支持多行输入，Enter 发送
- **文件上传**：通过 `FileSend` 组件选择文件，支持文档分析
- **深度思考切换**：`isDeepThink` 按钮控制是否启用 AI 深度思考模式
- **功能快捷入口**：新会话时显示 "写代码"、"分析文档"、"英文翻译" 快捷按钮

### 7. FunctionShortcuts.vue - 快捷功能

```javascript
// src/renderer/aiModel/components/aiModelMain/FunctionShortcuts.vue
data() {
    return {
        functions: ['WriteCode', 'AnalyzeDocuments', 'TranslateInEnglish'],
        components: ['aiWriteCode', 'aiAnalyzeCode', 'aiTranslateCode']
    };
},
methods: {
    sendMessage(value) {
        this.$emit('sendMessage', value + ': ');
    }
}
```

快捷功能仅在无活跃会话时显示，点击后自动填充预设提示词到输入框。

### 8. fileUploadService.js - 文件上传与流式请求

```javascript
// src/renderer/aiModel/services/fileUploadService.js
export default {
    // 文件上传：先获取签名 URL，再直接上传到云存储
    async uploadFile(file) {
        const signResponse = await window.aiIpcBack.uploadAiFile({
            file_name: file.name,
            bucket_name: 'matrx-tech01',
            expiresSecond: 600
        });
        const { object_key, signed_url, headers, bucket_name } = signResponse.data;
        await this.uploadFileToCloud(signed_url, headers, file);
        return { bucket_name, object_key };
    },

    // SSE 流式请求：基于 Fetch API + ReadableStream
    async streamRequest(axiosConfig, onData) {
        const response = await fetch(url.toString(), {
            method: axiosConfig.method || 'GET',
            headers: { ...axiosConfig.headers, Accept: 'text/event-stream' },
            body: axiosConfig.method !== 'GET' ? body : undefined,
            signal: axiosConfig.signal   // 支持 AbortController 取消
        });

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        const read = async () => {
            const { done, value } = await reader.read();
            if (done) return;
            onData(decoder.decode(value, { stream: true }));
            read();  // 递归读取
        };
        await read();
    }
};
```

## 数据流总结

```
用户输入
    │
    ▼
InputArea ──sendMessage──→ App.vue
    │                        │
    │                        ├─ 1. 无会话 → createSession (IPC) → 新建会话
    │                        ├─ 2. 添加用户消息到 messageList
    │                        ├─ 3. 添加 AI 占位消息（loading）
    │                        └─ 4. chatCompletions → sendMessageStream
    │                                                     │
    │                              ┌──────────────────────┘
    │                              ▼
    │                     fileUploadService.streamRequest
    │                              │
    │                     Fetch API + ReadableStream
    │                              │
    │                     SSE Events 逐块解析
    │                     ├── delta → 更新 AI 回复内容
    │                     ├── delta_thinking → 更新思考内容
    │                     ├── title → 更新会话标题
    │                     ├── error → 显示错误提示
    │                     └── done → 完成，保存历史
    │
    ▼
AiMessageBox → AiMessageItem (Markdown 渲染)
```
