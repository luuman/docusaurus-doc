---
slug: batch-rename
title: 案例 1：批量文件重命名
date: 2026-02-01
authors: [claude-team]
tags: [claude-code, tutorial, automation]
description: 用自然语言驱动批量文件操作，无需手写 Shell 脚本
---

# 案例 1：批量文件重命名

**场景：** 设计师交付了 300 张切图，文件名规则混乱（如 `icon_home_v2_final_FINAL.png`、`btn-submit_copy2.png`），需要按照项目命名规范重命名为 `icon-home.png`、`btn-submit.png` 格式。

<!-- truncate -->

---

## 解决过程

### 第 1 步：将文件夹拖入终端

将设计资产文件夹从 Finder/Explorer 拖拽到终端，路径会自动填入：

```bash
# 路径自动填入后，启动 Claude Code
claude
```

### 第 2 步：描述重命名规则

```
我的 /Users/me/project/assets/icons/ 目录下有 300 张切图，
文件名像这样：icon_home_v2_final_FINAL.png、btn-submit_copy2.png

请帮我重命名，规则如下：
1. 全部转为小写
2. 下划线统一换成连字符
3. 去掉 _v2、_final、_copy[数字] 这类版本后缀
4. 文件名只保留语义部分，如 icon-home.png、btn-submit.png

执行前先预览变更列表，我确认后再执行。
```

### 第 3 步：Claude 生成预览

Claude Code 会先分析目录，生成变更预览：

```
分析完成，找到 283 个文件需要重命名：

icon_home_v2_final_FINAL.png    →  icon-home.png
icon_search_v1_copy3.png        →  icon-search.png
btn_submit_v2_FINAL.png         →  btn-submit.png
bg_hero_section_final2.png      →  bg-hero-section.png
... (还有 279 个)

注意事项：
⚠️  发现 3 组重名冲突（重命名后文件名相同）：
   - icon_user.png 和 icon_user_v2.png → 都会变成 icon-user.png
   - 建议：保留最新版，旧版加 -old 后缀？

是否按此规则执行？(确认 / 调整规则 / 处理冲突后再执行)
```

### 第 4 步：处理冲突并确认

```
重名冲突的处理：icon_user_v2.png 保留为 icon-user.png，
icon_user.png 改名为 icon-user-v1.png

其余的按你说的规则执行，开始吧
```

### 第 5 步：执行重命名

Claude Code 生成并执行重命名脚本：

```bash
#!/bin/bash
# 由 Claude Code 生成的重命名脚本

rename_file() {
  local old="$1"
  local new="$2"
  if [ -f "$new" ]; then
    echo "⚠️  跳过（目标已存在）: $old → $new"
    return
  fi
  mv "$old" "$new"
  echo "✓ $old → $new"
}

cd /Users/me/project/assets/icons/

rename_file "icon_home_v2_final_FINAL.png" "icon-home.png"
rename_file "icon_search_v1_copy3.png" "icon-search.png"
# ... 283 行
```

执行完成后输出统计：

```
完成！
✓ 成功重命名：280 个
⚠️  跳过（冲突）：3 个
✗ 失败：0 个
```

---

## 常见变体

### 按日期前缀重命名

```
把 exports/ 目录下所有文件加上今天的日期前缀，格式：2025-02-18_原文件名
```

### 序号化重命名

```
把 screenshots/ 里的图片按修改时间排序，
重命名为 screenshot-001.png、screenshot-002.png...
```

### 跨格式重命名

```
把所有 .jpeg 扩展名改成 .jpg，同时把文件名里的空格替换成连字符
```

### 基于内容重命名（配合 Vision）

```
看一下 banners/ 目录里每张图的内容（可以截图），
按图片中显示的产品名称重命名文件
```

---

## 关键技巧

| 技巧 | 说明 |
|------|------|
| 先预览后执行 | 要求 Claude Code 在执行前展示变更列表 |
| 拖拽引用路径 | 直接拖文件夹到终端，避免手敲路径出错 |
| 冲突明确处理 | 预先指定冲突文件的处理策略 |
| 保留备份 | 大规模操作前建议 `cp -r assets/ assets.bak/` |

:::tip 无需写脚本
整个过程不需要你手写任何 Shell 脚本——用自然语言描述规则，Claude Code 生成脚本并执行。如果规则有例外情况，直接在对话中补充说明即可。
:::
