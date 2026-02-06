# 审批模块

## 概述

审批模块是 Matrx Windows 客户端的企业级工作流功能，支持创建、提交、审批、驳回、撤回等完整的审批流程。该模块基于 workflow-engine 后端服务构建，通过 RESTful API 与服务端交互，在客户端实现了审批面板、审批创建、审批详情、审批记录等完整的业务界面。同时，审批消息可通过聊天消息卡片的形式在 IM 会话中流转，实现审批通知与操作的闭环。

## 核心文件结构

```
src/
├── api/
│   └── approvalApi.js                    # 审批 API 接口定义
├── enum/
│   └── approvalEnum.js                   # 审批枚举常量
├── store/
│   └── modules/
│       └── approval.js                   # Vuex 审批状态管理
├── components/
│   ├── Approval/
│   │   ├── ApprovalCreate.vue            # 审批创建表单
│   │   ├── ApprovalDetail.vue            # 审批详情页
│   │   ├── ApprovalDialog.vue            # 审批/驳回对话框
│   │   ├── ApprovalField.vue             # 动态表单字段
│   │   ├── ApprovalItem.vue              # 审批列表卡片
│   │   ├── ApprovalMenu.vue              # 审批菜单导航
│   │   ├── ApprovalProcess.vue           # 审批流程编辑器
│   │   ├── ApprovalRecords.vue           # 审批记录时间线
│   │   ├── ApprovalTag.vue               # 审批状态标签
│   │   └── ApprovalInEditCard.vue        # 编辑中的审批卡片
│   ├── Chat/
│   │   ├── ApprovalCard.vue              # IM 聊天审批卡片
│   │   └── ApprovalForwardCard.vue       # 审批转发卡片
│   └── Panel/
│       └── ApprovalPanel.vue             # 审批面板入口
└── lang/
    └── locales/
        ├── en/approval.js                # 英文国际化
        └── ar/approval.js                # 阿拉伯语国际化
```

## 详细代码分析

### 1. approvalApi.js - API 接口层

`approvalApi.js` 封装了与 workflow-engine 后端服务交互的所有 HTTP 请求，基于 `commonUCRequest` 统一请求实例。

```javascript
// src/api/approvalApi.js
import { commonUCRequest } from './axiosInstance';
import { getUCBaseURL } from '@/utils/base';
```

#### API 接口总览

| 函数名 | HTTP 方法 | 路径 | 说明 |
|-------|-----------|------|------|
| `getApprovalScenarios` | GET | `/workflow-engine/api/v1/approval/scenarios` | 获取审批场景列表 |
| `getApprovalScenarioDetail` | GET | `/workflow-engine/api/v1/approval/scenario` | 获取审批场景详情 |
| `getApprovalCount` | GET | `/workflow-engine/api/v1/dashboard/approvals/count` | 获取各类审批数量 |
| `getApprovalTodoList` | GET | `/workflow-engine/api/v1/approvals/tasks/todo` | 获取待办审批列表 |
| `getApprovalDoneList` | GET | `/workflow-engine/api/v1/approvals/tasks/done` | 获取已办审批列表 |
| `getApprovalSubmittedList` | GET | `/workflow-engine/api/v1/approvals/submitted` | 获取已提交审批列表 |
| `getApprovalDetail` | GET | `/workflow-engine/api/v1/approval/detail` | 获取审批详情 |
| `getApprovalRejectReason` | GET | `/workflow-engine/api/v1/approvals/tasks/reject/reasons` | 获取驳回原因列表 |
| `approvalSubmit` | POST | `/workflow-engine/api/v1/approval/submit` | 提交审批 |
| `taskApprove` | POST | `/workflow-engine/api/v1/approvals/tasks/task/approve` | 审批通过/驳回 |
| `approvalRecall` | POST | `/workflow-engine/api/v1/approval/recall` | 撤回审批 |

列表类 API 支持 `cancelToken` 取消请求，避免快速切换 Tab 时产生竞态问题：

```javascript
export function getApprovalTodoList(params, cancelSource) {
    return commonUCRequest({
        baseURL: getUCBaseURL(),
        url: '/workflow-engine/api/v1/approvals/tasks/todo',
        method: 'GET',
        params,
        cancelToken: cancelSource?.token
    });
}
```

### 2. approvalEnum.js 与 approval.js - 状态管理

#### 审批菜单枚举

```javascript
// src/enum/approvalEnum.js
export const ApprovalMenuEnum = {
    TO_DO: 0,      // 待办
    DONE: 1,       // 已办
    SUBMITTED: 2   // 已提交
};
```

#### Vuex Store

```javascript
// src/store/modules/approval.js
const state = {
    scenariosList: [],       // 审批场景列表
    rejectReasonList: [],    // 驳回原因列表
    todoCount: 0,            // 待办数量
    doneCount: 0,            // 已办数量
    submittedCount: 0        // 已提交数量
};

const actions = {
    // 模块初始化：同时拉取场景列表、驳回原因、数量统计
    initApproval({ dispatch }) {
        dispatch('getScenariosList');
        dispatch('getRejectReasons');
        dispatch('getCount');
    },
    // 获取数量使用 lodash.throttle 限流（1 秒内最多执行一次）
    getCount: _.throttle(async function ({ commit }) {
        const res = await getApprovalCount();
        commit('setCount', res);
    }, 1000)
};
```

Store 模块在用户登录后通过 `initApproval` action 初始化，加载审批场景配置和各类数量统计。`getCount` 使用 throttle 避免频繁请求。

### 3. ApprovalMenu.vue - 菜单导航

```javascript
// src/components/Approval/ApprovalMenu.vue
computed: {
    menuList() {
        return [
            { key: ApprovalMenuEnum.TO_DO, name: this.$t('approval.Todo'),
              icon: 'ic_approval_to_do', count: this.todoCount },
            { key: ApprovalMenuEnum.DONE, name: this.$t('approval.Done'),
              icon: 'ic_approval_done', count: this.doneCount },
            { key: ApprovalMenuEnum.SUBMITTED, name: this.$t('approval.Submitted'),
              icon: 'ic_approval_submit', count: this.submittedCount }
        ];
    }
}
```

菜单组件通过 `v-model` 双向绑定当前选中 Tab，各 Tab 右侧显示未处理数量角标（超过 99 显示 `99+`）。

### 4. ApprovalCreate.vue - 创建审批

审批创建表单是一个动态表单组件，根据后端返回的场景配置动态渲染表单字段。

```javascript
// src/components/Approval/ApprovalCreate.vue
export default {
    props: {
        size: { type: String, default: 'small' },   // 面板尺寸
        isResubmit: Boolean,                          // 是否为重新提交
        approvalDetail: Object,                       // 重新提交时的原审批详情
        scenarioDetail: Object                        // 当前场景配置
    },
    data() {
        return {
            params: { businessCode: '' },
            approverList: [],            // 审批人列表
            scenarioFormData: {},        // 表单数据
            scenarioFormFields: null     // 表单字段配置
        };
    }
};
```

#### 动态表单渲染

表单字段由 `scenarioDetail.form.fields` 配置驱动，通过 `ApprovalField` 组件动态渲染：

```html
<template v-for="field in scenarioFormFields">
    <el-form-item v-if="field.visible" :required="!!field.required"
                  :label="getLangText(field.name)">
        <ApprovalField :type="field.type"
                       v-model="scenarioFormData[field.key]"
                       :field="field" />
    </el-form-item>
</template>
```

`ApprovalField.vue` 支持三种字段类型：

| 类型 | 渲染组件 | 说明 |
|------|---------|------|
| `input` | `el-input` | 单行文本输入，最大 30 字符 |
| `textarea` | `el-input type="textarea"` | 多行文本输入，最大 300 字符 |
| `attachment` | `AttachmentField` | 附件上传组件 |

#### 提交验证

提交按钮的禁用状态通过 `submitDisabled` computed 属性计算：

```javascript
submitDisabled() {
    // 1. 必填字段验证
    for (let field of this.scenarioFormFields) {
        if (field.required && !this.scenarioFormData[field.key]) return true;
        if (field.type === 'attachment' && !this.scenarioFormData[field.key].length) return true;
    }
    // 2. 附件上传中检查
    if (field.type === 'attachment' &&
        this.scenarioFormData[field.key]?.some(item => item.state === 'uploading')) return true;
    // 3. 审批人必须已选择
    if (!this.approverList?.length) return true;
    return false;
}
```

### 5. ApprovalProcess.vue - 审批流程编辑器

审批流程编辑器允许用户自定义审批链路，最多支持 10 个审批节点。

```javascript
// 生成流程数据（提交时调用）
getData() {
    const nodes = [{ id: 'START', nodeType: 1 }];
    const lines = [];
    let fromId = 'START';

    for (let i = 0; i < hidList.length; i++) {
        let nodeId = `approval_${Date.now()}`;
        lines.push({ id: `LINE_${++data}`, fromId, toId: nodeId });
        nodes.push({
            approverId: hidToNumber(hidList[i]),
            id: nodeId,
            nodeType: 3     // 审批节点
        });
        fromId = nodeId;
    }

    // 添加结束节点
    lines.push({ id: `LINE_${++data}`, fromId, toId: 'END' });
    nodes.push({ id: 'END', nodeType: 2 });

    return { lines, nodes };
}
```

流程数据结构采用图模型，包含 `nodes`（节点数组）和 `lines`（连线数组），节点类型分为：

- `nodeType: 1` - 开始节点 (START)
- `nodeType: 2` - 结束节点 (END)
- `nodeType: 3` - 审批节点

### 6. ApprovalDetail.vue - 审批详情

审批详情页展示完整的审批信息和操作按钮，根据当前用户角色和审批状态显示不同操作。

```javascript
// 权限计算
computed: {
    isCanApprove() {
        return this.myEventRecord && this.data?.approvalStatus === 'underReview';
    },
    isCanResubmit() {
        return this.isMyApprove &&
            (this.data?.approvalStatus === 'rejected' || this.data?.approvalStatus === 'recalled');
    },
    isCanWithdraw() {
        return this.data?.startAttributes?.allowRecall === 1 &&
            this.isMyApprove && this.data?.approvalStatus === 'underReview';
    }
}
```

| 操作 | 条件 | 说明 |
|------|------|------|
| 审批/驳回 | 当前用户是审批人且状态为审核中 | 弹出审批对话框 |
| 重新提交 | 当前用户是发起人且状态为已驳回/已撤回 | 跳转创建页并预填数据 |
| 撤回 | 发起人且状态为审核中且场景允许撤回 | 确认后调用 `approvalRecall` API |
| 转发 | 所有查看者 | 将审批卡片转发给其他联系人 |

### 7. ApprovalDialog.vue - 审批操作对话框

```javascript
// src/components/Approval/ApprovalDialog.vue
methods: {
    async onApprove() {
        await taskApprove({
            businessId: this.businessId,
            taskId: this.taskId,
            pass: true,
            reason: { opinion: this.approveDialog.opinion?.trim() }
        });
        // 更新 IM 聊天中的审批卡片消息状态
        updateApprovalCardMessage(this.businessId, this.taskId,
            { taskStatus: 'approved', taskRemark });
    },
    onReject() {
        await taskApprove({
            businessId: this.businessId,
            taskId: this.taskId,
            pass: false,
            reason: { opinion: this.rejectDialog.opinion?.trim(),
                      type: this.rejectDialog.type }
        });
        updateApprovalCardMessage(this.businessId, this.taskId,
            { taskStatus: 'rejected', taskRemark });
    }
}
```

审批操作完成后通过 `updateApprovalCardMessage` 同步更新 IM 会话中对应的审批消息卡片状态。

### 8. ApprovalTag.vue - 状态标签

```javascript
// src/components/Approval/ApprovalTag.vue
computed: {
    statusText() {
        if (this.status === 'approved' || this.status === 'autoApproved')
            return this.$t('approval.Approved');
        if (this.status === 'rejected') return this.$t('approval.Rejected');
        if (this.status === 'underReview') return this.$t('approval.UnderReview');
        if (this.status === 'recalled') return this.$t('approval.Recalled');
        return this.status;
    }
}
```

审批状态样式映射：

| 状态 | 颜色方案 | 说明 |
|------|---------|------|
| `approved` / `autoApproved` | 绿色（green-4） | 已通过 |
| `rejected` | 红色（red-4） | 已驳回 |
| `underReview` | 蓝色（blue-4） | 审核中 |
| `recalled` | 灰色（grey-6） | 已撤回 |

### 9. ApprovalCard.vue - IM 聊天审批卡片

审批消息通过 `ApprovalCard.vue` 在 IM 聊天中展示，支持直接在聊天中执行审批/驳回操作。

```javascript
// src/components/Chat/ApprovalCard.vue
computed: {
    isActionCard() {
        // 区分通知型卡片和操作型卡片
        return this.approvalInfo.type === 'approval-assistant-msg-new';
    },
    approvalInfo() {
        return this.chatInfo.plainMsg?.meta || {};
    }
}
```

卡片类型分为两种：

- **通知型卡片**（`approval-assistant-msg-application`）：显示审批名称、时间、驳回/通过结果
- **操作型卡片**（`approval-assistant-msg-new`）：显示审批信息并提供"审批"/"驳回"按钮，状态变更后按钮替换为状态标签

## 审批流程总结

```
创建审批                              审批处理
┌──────────┐                    ┌──────────────┐
│ ApprovalCreate │──submit──→  │  workflow-engine │
│  选择场景     │               │   后端服务      │
│  填写表单     │               └───────┬────────┘
│  设置审批人   │                       │
└──────────┘                    IM 消息推送
                                        │
                                        ▼
                                ┌──────────────┐
                                │ ApprovalCard  │ (聊天中展示)
                                │  审批 / 驳回  │
                                └───────┬────────┘
                                        │
                                        ▼
                                ┌──────────────┐
                                │ ApprovalDialog│
                                │  填写意见     │──taskApprove API──→ 更新状态
                                └──────────────┘
                                        │
                                        ▼
                                updateApprovalCardMessage
                                (同步更新 IM 卡片状态)
```
