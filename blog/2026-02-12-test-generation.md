---
slug: test-generation
title: 案例 4：自动化测试生成
date: 2026-02-12
authors: [claude-team]
tags: [claude-code, tutorial, automation]
description: 配置自修复 Agent 为遗留代码库自动补全测试，直到覆盖率达标
---

# 案例 4：自动化测试生成

**场景：** 历史遗留代码库缺乏测试，覆盖率不足 20%。重构前需要补全关键路径的测试，但手写测试耗时巨大。目标：用 Claude Code 自动生成测试，并自动运行、自动修复失败，直到覆盖率达标。

<!-- truncate -->

---

## 执行流程

### 第 1 步：扫描需要补测试的文件

```
扫描 src/services/ 目录，找出所有没有对应测试文件的源码文件，
列出它们的函数数量和代码行数，按"函数数量多"到"函数数量少"排序
```

Claude Code 分析后输出：

```
找到以下文件缺少测试覆盖：

文件                              行数    函数数    优先级
src/services/OrderService.ts      342     18       🔴 高
src/services/PaymentService.ts    289     14       🔴 高
src/services/UserService.ts       156     9        🟡 中
src/services/NotificationService  98      5        🟢 低

建议从 OrderService.ts 开始，它是核心业务逻辑且函数最多。
```

### 第 2 步：触发自动测试生成

```
使用 test-writer agent 为 src/services/OrderService.ts 生成完整测试，
要求单元测试覆盖率达到 85% 以上，所有测试必须通过才算完成
```

### 第 3 步：Agent 自动运行（自修复循环）

Agent 自动执行以下循环：

```
[循环 1]
✓ 读取 OrderService.ts（342 行，18 个公共方法）
✓ 检测到使用 Jest 测试框架
✓ 生成初始测试文件：__tests__/OrderService.test.ts（89 个测试用例）
✗ 运行测试：12 个失败

失败原因分析：
- createOrder 测试：Mock 的 database.save 返回值格式不对
- calculateDiscount 测试：边界值计算有误
- cancelOrder 测试：缺少对 status 字段的 Mock

[自动修复中...]
✓ 修正 Mock 返回值格式
✓ 修正边界值计算（0.00 → 0）
✓ 添加 status 字段 Mock

[循环 2]
✗ 运行测试：3 个失败（原有 12 个减少到 3 个）

失败原因分析：
- sendNotification 在 cancelOrder 中被调用，但 Mock 未配置

[自动修复中...]
✓ 在测试前添加 jest.spyOn(NotificationService, 'send').mockResolvedValue(undefined)

[循环 3]
✓ 运行测试：89/89 全部通过 ✅

覆盖率报告：
- 语句覆盖率：92.3%
- 分支覆盖率：87.6%
- 函数覆盖率：100%
- 行覆盖率：91.8%

✅ 目标达成（要求 85%，实际 92.3%）
```

---

## 实际生成的测试示例

以下是 Agent 为 `OrderService.createOrder` 生成的测试：

```typescript
// __tests__/services/OrderService.test.ts（由 Claude Code 自动生成）

import { OrderService } from '../../src/services/OrderService';
import { Database } from '../../src/db/Database';
import { NotificationService } from '../../src/services/NotificationService';
import { OrderStatus, PaymentMethod } from '../../src/types/order';

jest.mock('../../src/db/Database');
jest.mock('../../src/services/NotificationService');

const MockedDatabase = Database as jest.MockedClass<typeof Database>;

describe('OrderService', () => {
  let orderService: OrderService;
  let mockDb: jest.Mocked<Database>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockDb = new MockedDatabase() as jest.Mocked<Database>;
    orderService = new OrderService(mockDb);
  });

  describe('createOrder', () => {
    const validOrderData = {
      userId: 'user-123',
      items: [{ productId: 'prod-1', quantity: 2, price: 50 }],
      paymentMethod: PaymentMethod.CREDIT_CARD
    };

    it('should create order successfully with valid data', async () => {
      const savedOrder = { id: 'order-456', ...validOrderData, status: OrderStatus.PENDING };
      mockDb.save.mockResolvedValue(savedOrder);

      const result = await orderService.createOrder(validOrderData);

      expect(result.id).toBe('order-456');
      expect(result.status).toBe(OrderStatus.PENDING);
      expect(mockDb.save).toHaveBeenCalledWith(
        expect.objectContaining({ userId: 'user-123' })
      );
    });

    it('should throw error when order has no items', async () => {
      const emptyOrder = { ...validOrderData, items: [] };

      await expect(orderService.createOrder(emptyOrder))
        .rejects.toThrow('Order must contain at least one item');
    });

    it('should calculate total price correctly', async () => {
      const multiItemOrder = {
        ...validOrderData,
        items: [
          { productId: 'prod-1', quantity: 2, price: 50 },
          { productId: 'prod-2', quantity: 1, price: 30 }
        ]
      };
      mockDb.save.mockResolvedValue({ id: 'order-789', ...multiItemOrder, total: 130 });

      const result = await orderService.createOrder(multiItemOrder);

      expect(result.total).toBe(130); // 2×50 + 1×30
    });
  });
});
```

---

## 批量自动化处理

对多个文件批量生成测试：

```bash title="scripts/auto-test-generation.sh"
#!/bin/bash
# 批量为遗留文件生成测试

set -euo pipefail

COVERAGE_TARGET=${1:-80}  # 默认覆盖率目标 80%
OUTPUT_LOG="./test-generation.log"

echo "开始自动测试生成，覆盖率目标：${COVERAGE_TARGET}%" | tee "$OUTPUT_LOG"

# 找出没有测试的文件
MISSING_TESTS=$(find src/services -name "*.ts" ! -name "*.test.ts" | while read file; do
  test_file=$(echo "$file" | sed 's/src\///' | sed 's/\.ts$/.test.ts/')
  if [ ! -f "__tests__/$test_file" ]; then
    echo "$file"
  fi
done)

TOTAL=$(echo "$MISSING_TESTS" | wc -l)
CURRENT=0

echo "$MISSING_TESTS" | while read source_file; do
  CURRENT=$((CURRENT + 1))
  echo ""
  echo "[$CURRENT/$TOTAL] 处理：$source_file" | tee -a "$OUTPUT_LOG"

  result=$(claude --agent test-writer \
    "为 $source_file 生成完整测试，覆盖率目标 ${COVERAGE_TARGET}%，所有测试必须通过" \
    --dangerously-skip-permissions \
    --output-format stream-json 2>/dev/null | \
    jq -r 'select(.type=="text") | .content' | tail -5)

  echo "$result" | tee -a "$OUTPUT_LOG"

  # 防止 API 速率限制
  sleep 3
done

echo ""
echo "========================================" | tee -a "$OUTPUT_LOG"
echo "自动测试生成完成，查看日志：$OUTPUT_LOG"
echo "运行 npm test -- --coverage 查看总覆盖率"
```

---

## 关键技巧

| 技巧 | 说明 |
|------|------|
| 自修复循环 | Agent 自动运行测试并修复失败，无需人工介入 |
| 覆盖率驱动 | 指定覆盖率目标，Agent 持续优化直到达标 |
| 框架自动检测 | Agent 从 package.json 检测已有测试框架，不引入新依赖 |
| 批量处理 | 脚本化后可以一次性处理整个目录 |
| 限制重试次数 | 设置最大重试次数，避免无限循环 |

:::warning 测试质量注意
自动生成的测试覆盖了 API 表面，但可能遗漏业务意图的深层验证。建议：
1. 生成后人工 review 核心业务逻辑的测试用例
2. 重点关注 Agent 未能生成的测试（提示"需要人工介入"的部分）
3. 将自动生成的测试作为基础，人工补充边界场景
:::
