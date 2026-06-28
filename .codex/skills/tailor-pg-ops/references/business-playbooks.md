# Business Playbooks

Use these mappings to turn user language into bounded database actions.

## User Lookup

Trigger phrases: "查用户", "用户信息", "手机号", "openid", "这个客户", "画像".

Preferred action:

```bash
node .codex/skills/tailor-pg-ops/scripts/pg-business-actions.js user-profile --phone 13800138000
```

Use `--openid` for WeChat identity, `--user-id` for internal IDs. Summarize nickname, status, phone, openid, phone verification, default body profile completeness, style preference, and latest selection. Default to full backend values; only mask fields when the user asks for a masked/export-safe view.

## Order Lookup

Trigger phrases: "查订单", "订单详情", "订单状态", "订单号", "最近订单".

Preferred actions:

```bash
node .codex/skills/tailor-pg-ops/scripts/pg-business-actions.js order-detail --order-no O202606270001
node .codex/skills/tailor-pg-ops/scripts/pg-business-actions.js user-orders --phone 13800138000
```

Summarize order number, status, amount in yuan, deposit in yuan, customer identity/contact, selected catalog codes, estimated days, remark, and linked bookings.

When the user asks "最新订单" or "最近订单", present the rows like an operations queue: newest first, customer identity/contact, order number, status, money, created time, and an obvious next handle (`user_id` or `order_no`). If the next user message says "这个用户", infer the most recent or last-mentioned user unless multiple users were shown; then run `user-profile` to retrieve body profile, style preference, and latest custom selection.

## Operational Analytics

Trigger phrases: "统计", "汇总", "最近几天", "订单分布", "有多少", "配置是否正常".

Preferred actions:

```bash
node .codex/skills/tailor-pg-ops/scripts/pg-business-actions.js order-status-summary --days 7
node .codex/skills/tailor-pg-ops/scripts/pg-business-actions.js recent-orders --limit 20
node .codex/skills/tailor-pg-ops/scripts/pg-business-actions.js config-summary
```

For larger analysis or export, keep direct DB access in Node first; add Python only for offline transformation of exported JSON/CSV.

## Data Quality Checks

Trigger phrases: "异常", "没填完", "数据不完整", "排查", "为什么推荐/下单不对".

Preferred actions:

```bash
node .codex/skills/tailor-pg-ops/scripts/pg-business-actions.js incomplete-user-profiles --limit 50
node .codex/skills/tailor-pg-ops/scripts/pg-business-actions.js health
```

Explain missing body profile, style preference, custom selection, inactive config, or empty table issues in business language.

## Controlled Status Updates

Trigger phrases: "改订单状态", "标记已支付", "进入制作", "完成订单", "取消预约".

Always dry-run first:

```bash
node .codex/skills/tailor-pg-ops/scripts/pg-business-actions.js update-order-status --order-no O202606270001 --status in_progress
```

Execute only after explicit confirmation:

```bash
node .codex/skills/tailor-pg-ops/scripts/pg-business-actions.js update-order-status --order-no O202606270001 --status in_progress --execute
```

Allowed order statuses: `pending`, `confirmed`, `paid`, `in_progress`, `completed`, `cancelled`.

Allowed booking statuses: `pending`, `confirmed`, `completed`, `cancelled`.
