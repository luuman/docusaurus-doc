---
summary: "`moltbot agent` 的 CLI 参考（通过网关发送一个代理回合）"
read_when:
  - 您想从脚本运行一个代理回合（可选地传递回复）
---

# `moltbot agent`

通过网关运行一个代理回合（嵌入式使用 `--local`）。
使用 `--agent <id>` 直接定位配置的代理。

相关：
- 代理发送工具：[代理发送](/tools/agent-send)

## 示例

```bash
moltbot agent --to +15555550123 --message "状态更新" --deliver
moltbot agent --agent ops --message "汇总日志"
moltbot agent --session-id 1234 --message "汇总收件箱" --thinking medium
moltbot agent --agent ops --message "生成报告" --deliver --reply-channel slack --reply-to "#reports"
```
