# 编辑器模块

## 概述

编辑器模块为 Matrx Windows 客户端提供消息输入、富文本编辑、表情选择、@提及、粘贴处理等核心交互能力。模块核心由 `Editor` 类实现自定义的撤销/重做历史栈，配合 `MessageInput` 组件处理消息发送逻辑，`EmojisPannel` 提供表情选择，`RichText` 组件提供富文本消息的渲染展示。整体基于 `contenteditable` 原生编辑能力构建，未依赖第三方富文本编辑器库。

## 核心文件结构

```
src/
  utils/
    editor.js                       # Editor 核心类（历史栈/光标管理/@插入）
    editor/
      parse.js                      # Markdown 解析工具
  components/
    MessageInput/
      MessageInput.vue              # 消息输入组件（发送/粘贴/@提及）
    EmojisPannel/
      EmojisPannel.vue              # 表情选择面板
    RichText/
      index.vue                     # 富文本消息渲染组件
      RichVideo.vue                 # 富文本视频渲染
      RichImage.vue                 # 富文本图片渲染
      RichReference.vue             # 富文本引用渲染
      RichUnsupported.vue           # 不支持的富文本类型
    Chat/
      SuggestionPannel.vue          # @提及建议面板
      Backtarget.vue                # 回到底部/未读提示
```

## Editor 核心类：editor.js

### 文件位置

`src/utils/editor.js`

### 设计思路

由于 `contenteditable` 元素使用 `innerHTML` 赋值或手动修改 Selection Range 时，浏览器内置的 `execCommand('undo')` 历史栈会失效。Editor 类通过自定义快照机制实现撤销功能，记录每次光标位置变化前的 DOM 状态。

### 类接口

```javascript
export default class Editor {
    static attrKey = 'data-e-key';      // DOM 元素唯一标识属性名

    constructor(targetNode, maxLen)      // 初始化编辑器
    observe()                            // MutationObserver 监听 DOM 变化
    addEvent()                           // 绑定输入事件
    record()                             // 记录当前状态快照
    undo()                               // 撤销到上一个快照
    reset()                              // 重置历史栈
    insertText(text)                     // 在光标位置插入纯文本
    insertMetion(peer)                   // 在光标位置插入 @提及
    focusEnd()                           // 将光标移到内容末尾
    focus()                              // 聚焦编辑器
}
```

### 初始化

```javascript
constructor(targetNode, maxLen) {
    this.targetKey = uuidv4();                              // 编辑器根节点唯一 ID
    this.targetNode = targetNode;
    this.targetNode.setAttribute(Editor.attrKey, this.targetKey);

    this.lastRangeEndContainerInfo = {                      // 上一次光标位置信息
        endNodeIndex: 0,
        parentKey: this.targetKey,
        endOffset: 0,
        nodeType: Node.ELEMENT_NODE
    };

    this.historyStack = [];                                 // 撤销历史栈
    this.composition = false;                               // 中文输入法标志
    this.maxLen = maxLen;                                   // 最大字符数限制

    this.observe();                                         // 开始 DOM 监听
    this.addEvent();                                        // 绑定事件
}
```

### DOM 变更监听

通过 MutationObserver 为所有新增的 DOM 元素自动添加 `data-e-key` 唯一标识：

```javascript
observe() {
    const observer = new MutationObserver(mutationsList => {
        mutationsList.forEach(mutation => {
            if (mutation.type === 'childList' && mutation.addedNodes.length) {
                const htmlList = mutation.target.querySelectorAll(`:not([${Editor.attrKey}])`);
                htmlList.forEach(ele => {
                    if (ele.nodeType === Node.ELEMENT_NODE) {
                        ele.setAttribute(Editor.attrKey, uuidv4());
                    }
                });
            }
        });
    });
    observer.observe(this.targetNode, {subtree: true, childList: true});
}
```

### 事件绑定

```javascript
addEvent() {
    this.targetNode.addEventListener('compositionstart', e => this.onCompositionStart(e));
    this.targetNode.addEventListener('compositionend', e => this.onCompositionEnd(e));
    this.targetNode.addEventListener('beforeinput', e => this.onBeforeInput(e));
    this.targetNode.addEventListener('input', debounce(this.onInput, 300, {trailing: true}).bind(this));
}
```

事件处理逻辑：

| 事件 | 处理 |
|------|------|
| `compositionstart` | 标记中文输入开始，记录快照 |
| `compositionend` | 标记中文输入结束，更新光标信息 |
| `beforeinput` | 校正光标位置，判断是否需要记录快照 |
| `input` | 修复 @提及元素的 contenteditable 属性（防抖 300ms） |

### 光标位置变化检测

`isInputPositionMove` 方法判断是否需要记录新的快照：

```javascript
isInputPositionMove(event, range) {
    // 有选区 -> 需要记录
    if (range.startOffset !== range.endOffset) return true;

    // 节点变化 -> 需要记录
    if (lastInfo.endNodeIndex !== endNodeIndex || lastInfo.parentKey !== parentKey) return true;

    switch (event.inputType) {
        case 'insertText':           // 插入文本：检查偏移量是否连续
        case 'deleteContentBackward': // 删除文本：检查偏移量是否连续
        case 'insertCompositionText': // 中文输入：不记录
    }
}
```

### 快照记录与恢复

**记录快照 `record()`：**

每个快照保存完整的 innerHTML 和光标所在节点的 childNodes 简要信息：

```javascript
record() {
    const {range} = this.getSelectionRange();
    const html = this.targetNode.innerHTML;
    const {endNodeIndex, parentKey, endOffset, nodeType} = this.getRangeEndContainerInfo(range);

    // 记录父节点的子节点信息（用于恢复光标位置）
    parentNode.childNodes.forEach(ele => {
        if (ele.nodeType === Node.TEXT_NODE) {
            childNodes.push({nodeType, nodeValue: ele.nodeValue});
        } else {
            childNodes.push({nodeType, nodeName: ele.nodeName, outerHTML: ele.outerHTML});
        }
    });

    this.historyStack.push({html, parentKey, childNodes, endNodeIndex, endOffset, nodeType});
}
```

**撤销 `undo()`：**

```javascript
undo() {
    const record = this.historyStack.pop();
    if (record) {
        this.targetNode.innerHTML = record.html;     // 恢复 HTML
        this.setRangeByRecord(record);               // 恢复光标位置
    } else {
        this.targetNode.innerHTML = '';               // 栈空则清空
    }
}
```

### @提及插入

`insertMetion` 方法在光标位置插入 @提及 HTML：

```javascript
insertMetion(peer) {
    this.record();  // 先记录快照

    const metionHtml = `<span class="mention" data-mention="${peer.hid}">
        &#xFEFF;<a metion ccd="ccd" hid="${peer.hid}" name="${renderName(peer)}"
        contenteditable="false">@${peer.hid === 'all' ? 'All' : renderName(peer, 2)}</a>
        &#xFEFF;</span>&nbsp;`;

    // 查找光标前的 @ 符号并删除
    const expRes = /@([^\s]*)$/.exec(metionText);
    if (expRes) {
        range.setStart(endContainer, expRes.index);
        range.deleteContents();
    }

    // 插入 @元素
    range.insertNode(document.createRange().createContextualFragment(metionHtml));
    selection.collapseToEnd();
}
```

@提及的 HTML 结构设计：
- 外层 `<span data-mention="hid">` 标记为提及容器
- 内层 `<a contenteditable="false">` 禁止编辑
- `&#xFEFF;` 零宽字符确保光标可以停留在提及前后

### 光标位置校正

当光标落入 @提及元素内部时，自动校正到元素前后：

```javascript
moveRangePosition(range) {
    const {metionNode, position} = this.getMetionNodeInfo(range.startContainer, range.startOffset);
    if (metionNode) {
        metionNode.setAttribute('contenteditable', false);
        position ? range.setStartAfter(metionNode) : range.setStartBefore(metionNode);
    }
}
```

## 消息输入组件：MessageInput.vue

### 文件位置

`src/components/MessageInput/MessageInput.vue`

### 组件职责

MessageInput 是聊天界面底部的消息输入区域，核心职责包括：

1. **文本输入**：基于 `contenteditable` div 的文本编辑
2. **消息发送**：Enter 键发送，Shift+Enter 换行
3. **@提及**：输入 @ 触发成员建议面板
4. **粘贴处理**：支持粘贴文本、图片、文件
5. **撤销**：Ctrl+Z 调用 Editor.undo()
6. **草稿保存**：输入内容实时保存到草稿
7. **大文本处理**：超长文本转为 .txt 文件发送

### 组件初始化

```javascript
mounted() {
    this.editor = new Editor(this.$refs.contentEditor);
}
```

### @提及功能

**触发条件**：输入 `@` 字符时匹配正则 `/(^|\s|[?!\@|\S])(@)([\S]*)$/`

**处理流程**：

1. `checkAutocomplete` 检测输入内容是否匹配 @ 模式
2. `suggestionHandle` 获取群组成员列表（分批加载，每批 10 人）
3. `renderMember` 过滤匹配成员并显示建议面板
4. 用户选择后调用 `editor.insertMetion(selectedPeer)` 插入

**群组成员获取优化**：

```javascript
async getGroupPeerList() {
    const processMember = async function (count = 0) {
        let currentList = groupHidList.friends.slice(count * 10, (count + 1) * 10);
        if (currentList.length > 0) {
            let groupPeerList = await mangePeerList(spaceId, currentList, 0);
            this.$store.commit('suggestionList/ADD_MEMBER_LIST', groupPeerList);
            this.renderMember();
            // 使用 requestAnimationFrame 分批加载
            let reqId = window.requestAnimationFrame(processMember.bind(this, count + 1));
            this.reqIdList.push(reqId);
        }
    };
    window.requestAnimationFrame(processMember.bind(this, 0));
}
```

### 粘贴处理

```javascript
async pasteHandle(e) {
    let clipboardData = await getClipboardData(e.base64Url);

    if (clipboardData.files) {
        // 文件粘贴 -> 触发文件发送弹框
        this.$emit('clipboardData', clipboardData);
    } else if (clipboardData.text) {
        let text = clipboardData.text;
        if (text.length >= inputMaxLen) {
            // 超长文本 -> 直接发送
            this.messageSubmit(e, this.$refs.contentEditor.innerText + text);
            return;
        }
        // 普通文本 -> 插入到光标位置
        this.editor.insertText(text);
        this.onInputChange();
    }
}
```

### 消息发送逻辑

```javascript
onMessageSubmit(event, fromPasteText = '') {
    if (fromPasteText) {
        // 粘贴触发的发送
        this.batchSend(tempStr);
    } else if (!this.isForce) {
        // 普通发送（需要有内容）
        if (this.inputValue.trim()) {
            this.batchSend(tempStr);
        }
    } else {
        // 强制发送模式（文件发送场景）
        this.$emit('sendMsg', this.inputValue.trim());
    }
}
```

**大文本发送策略**：

| 文本长度 | 处理方式 |
|---------|---------|
| `>= inputMaxLen` | 转为 .txt 文件发送（`longTxtSend`） |
| `inputMinLen ~ inputMaxLen` | 长消息发送（`sendLongMsg`） |
| `< inputMinLen` | 普通消息发送（`sendMsg`） |

### 草稿功能

输入内容变化时通过防抖（800ms）保存草稿：

```javascript
changeDraft: debounce(function (hid, spaceId, value) {
    draft(this.peerId + defaultSpaceId(), value);
}, 800),

onInputChange() {
    this.changeDraft(this.peerId, defaultSpaceId(), {
        lastDraftTime: getTimestamp(),
        value: this.$refs.contentEditor.innerHTML
    });
}
```

发送消息后清除草稿：

```javascript
messageSubmit(event) {
    this.onMessageSubmit(event);
    this.changeDraft(this.peerId, defaultSpaceId(), {
        lastDraftTime: getTimestamp(),
        value: ''
    });
    this.resetMessageInputer();
}
```

### 键盘导航

在 @建议面板可见时，支持上下键导航和 Enter 键选择：

```javascript
handleMetionKeyborad(pos, e) {
    if (this.suggestionPannelVisable) {
        e.preventDefault();
        Bus.$emit('mention-select-navigate', pos);  // 上下导航
    }
    if (!this.inputValue) {
        e.preventDefault();
        Bus.$emit('session-list-select-navigate', pos);  // 会话列表导航
    }
}
```

### 输入状态通知

输入过程中通过 `sendTextStart` / `sendTextEnd` 通知对方正在输入：

```javascript
onChange() {
    if (this.inputValue) {
        sendTextStart(this.peerId);   // 通知"正在输入"
    } else {
        sendTextEnd(this.peerId);     // 通知"停止输入"
    }
}
```

## 表情面板：EmojisPannel.vue

### 文件位置

`src/components/EmojisPannel/EmojisPannel.vue`

### 功能说明

表情面板支持两种展示模式：

1. **分类模式**（`showCategory = true`）：按分类 Tab 展示
2. **平铺模式**（`showCategory = false`）：所有表情平铺展示

### 定位计算

面板位置根据触发图标的 DOM 位置动态计算：

```javascript
watch: {
    currentEmojiPanel() {
        let pos = emojiIconEl.getBoundingClientRect();
        this.position = {
            left: left + pos.width / 2 - emojiWidth / 2,  // 水平居中对齐
            top: top - emojiHeight - 5                      // 向上偏移
        };
    }
}
```

### 表情数据源

表情数据来自 `@/lang/emojiData.js`，包含 `EmojiCategories` 分类数组和 `emojiData` 映射表。

### 表情选择

选择表情后保持编辑器焦点，通过 `editor.insertText` 插入原生 Unicode 表情：

```javascript
emojiClick(emoji) {
    this.$parent.$refs.contentEditor.focus();
    this.$emit('emojiItemClick', {native: this.getEmoji(emoji)});
}
```

## 富文本渲染组件：RichText/index.vue

### 文件位置

`src/components/RichText/index.vue`

### 功能说明

RichText 组件负责渲染服务端返回的 Markdown 格式消息为 HTML：

```javascript
render(h) {
    const rawHtml = parseMarkdown(this.str);           // Markdown -> HTML
    const vnodes = this.parseHtmlToVNodes(rawHtml, h); // HTML -> VNodes
    return h('div', {class: 'm-rich-content'}, vnodes);
}
```

### 自定义元素渲染

通过 `parseNode` 递归解析 DOM 树，对特殊标签进行自定义渲染：

| 标签 | 渲染组件 | 描述 |
|------|---------|------|
| `<a>` | `<span>` | 链接转为可点击 span，调用 `openLink` |
| `<rich-video>` | `RichVideo` | 视频附件渲染 |
| `<rich-image>` | `RichImage` | 图片附件渲染（支持下载/预览） |
| `<rich-reference>` | `RichReference` | 引用消息渲染 |
| `<rich-unsupported>` | `RichUnsupported` | 不支持的消息类型提示 |

### 样式规范

富文本渲染支持以下 Markdown 样式：

- **加粗**：`<strong>` 标签，递归应用 `font-weight: bold`
- **列表**：`<ul>` / `<ol>` 支持三级嵌套样式（decimal -> lower-alpha -> lower-roman）
- **媒体**：图片和视频限制最大宽度 100%
- **换行**：`white-space: normal` 允许自然换行

## 组件协作关系

```
MessageInput.vue
  |
  +-- Editor (editor.js)              # 编辑核心
  |     +-- insertText()              # 文本/表情插入
  |     +-- insertMetion()            # @提及插入
  |     +-- undo()                    # 撤销操作
  |
  +-- SuggestionPannel.vue            # @建议面板
  |     +-- selectMember -> editor.insertMetion()
  |
  +-- EmojisPannel.vue                # 表情面板
  |     +-- emojiClick -> editor.insertText()
  |
  +-- Backtarget.vue                  # 回到底部/未读提示

RichText/index.vue                    # 消息展示
  +-- parseMarkdown()                 # Markdown 解析
  +-- RichImage.vue                   # 图片渲染
  +-- RichVideo.vue                   # 视频渲染
  +-- RichReference.vue               # 引用渲染
```

## 数据流

```
用户输入
  |
  v
contenteditable div
  |
  +---> beforeinput 事件
  |      +---> Editor.moveRangePosition()  (光标校正)
  |      +---> Editor.record()             (快照记录)
  |
  +---> input 事件 (debounce 300ms)
  |      +---> 修复 mention contenteditable
  |
  +---> checkAutocomplete()
  |      +---> 匹配 @ 模式 -> 展示建议面板
  |      +---> onInputChange() -> 保存草稿
  |
  +---> Enter 键
         +---> messageSubmit()
         +---> getRichValue() -> 提取纯文本
         +---> batchSend() -> 按长度策略发送
         +---> resetMessageInputer() -> 清空编辑器
```
