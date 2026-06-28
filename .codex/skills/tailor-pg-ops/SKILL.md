---
name: tailor-pg-ops
description: Safely query and operate the 77-mvp PostgreSQL business database for Codex conversations. Use when the user asks about this project's users, orders, custom selections, body profiles, style preferences, advisor bookings, configuration data, operational analytics, database health, or controlled PG data fixes such as updating an order or booking status.
---

# Tailor Pg Ops

## Overview

Use this skill as the project-specific PostgreSQL business assistant for `77-mvp`, a high-end private tailoring mini program. Prefer fixed business actions and parameterized queries over ad hoc SQL.

## Operating Rules

1. Treat the database as a live business system. Default to read-only actions.
2. Never hardcode database credentials in repository files or responses.
3. Use Node.js scripts for database control because this project already uses `pg` in Node cloud functions.
4. Use Python only for optional offline analysis/export tasks; do not use Python for direct high-risk writes unless the user explicitly approves that path.
5. Before write operations, show the target table, matching condition, proposed value, dry-run result, and whether `--execute` is absent or present.
6. Do not run raw `DROP`, `TRUNCATE`, schema changes, unbounded `UPDATE`, or unbounded `DELETE` from this skill.
7. Treat the operator as an authorized backend administrator. For read-only business lookups, show full customer identifiers and contact fields by default so the result is useful for operations. Do not print database passwords or credentials.
8. Avoid inline `node -e` or shell-embedded SQL for business queries. If an action is missing data, update `scripts/pg-business-actions.js` and run its tests instead of composing ad hoc SQL in the shell.

## Resource Loading

- Read `references/schema.md` before answering table/field relationship questions or writing queries.
- Read `references/business-playbooks.md` before mapping a natural-language user request to a business action.
- Read `references/safety-rules.md` before any write, privacy-sensitive lookup, or production-like database operation.
- Use `scripts/pg-business-actions.js` for repeatable database operations.

## Quick Start

Set connection environment variables outside the repository:

```bash
PG_HOST=... PG_PORT=5432 PG_USER=... PG_PASSWORD=... PG_DATABASE=... \
node .codex/skills/tailor-pg-ops/scripts/pg-business-actions.js list-actions
```

For SSL-enabled managed PostgreSQL, also set:

```bash
PG_SSL=true
```

## Workflow

1. Classify the request as read-only, analysis/export, or write.
2. Load the minimum relevant reference file.
3. Prefer a script action from `pg-business-actions.js`.
4. For read-only actions, run the action and summarize the result in backend-friendly business language. For orders, always answer "which user placed which order" using `customer_summary` / `order_summary` when present, with full customer identifiers unless the user asks for masking.
5. For write actions, first run without `--execute` and present the dry-run output.
6. Execute a write only after explicit user confirmation and with `--execute`.
7. Report the exact action, target criteria, row count, and any verification query result.

## Supported Script Actions

Run:

```bash
node .codex/skills/tailor-pg-ops/scripts/pg-business-actions.js list-actions
```

Common actions:

- `health`: verify connection and table counts.
- `user-profile`: find a user plus default body profile, style preference, and latest custom selection.
- `user-orders`: list orders for a user.
- `order-detail`: inspect one order, its user, custom selection, and booking records.
- `recent-orders`: list recent orders with optional status filter.
- `order-status-summary`: aggregate order statuses.
- `incomplete-user-profiles`: find active users missing core profile/preference data.
- `config-summary`: count and list active catalog configuration.
- `update-order-status`: dry-run or execute a bounded order status update.
- `update-booking-status`: dry-run or execute a bounded advisor booking status update.

## Intent Mapping Examples

- "查一下这个手机号的用户和最近订单" -> `user-profile --phone ...` then `user-orders --phone ...`
- "订单 O2026... 现在是什么状态" -> `order-detail --order-no ...`
- "最近 7 天有多少订单" -> `order-status-summary --days 7`
- "查一下最新的订单" -> `recent-orders --limit ...`; if the user then asks for "这个用户的身材数据/方案要求/画像", use the returned `user_id`, `phone`, or `openid` with `user-profile` and, when needed, `user-orders`.
- "把订单改成制作中" -> dry-run `update-order-status --order-no ... --status in_progress`, then ask for confirmation before `--execute`
- "哪些用户画像没填完" -> `incomplete-user-profiles`

## Output Guidance

Give the user business-level results first: who, what order, current state, money in yuan, anomalies, and suggested next action. Write like an internal operations dashboard, not a raw JSON dump. Mention table names and action names only when useful for traceability.

Default read-only output should include useful full values for operations:

- Customer identity: `user_id`, nickname, phone, `openid`, phone verification/status when available.
- Order facts: order number, status, total amount, deposit, created time, estimated days, remarks, selected catalog codes or snapshot highlights.
- Follow-up handles: include the best identifier to use for the next lookup, such as `user_id` or `order_no`.
- Privacy mode: only mask phone, `openid`, or avatar URL when the user explicitly asks for a masked/export-safe view.

For `recent-orders`, each row should include:

- `customer_summary`: full backend identity, such as `用户#2 / 手机号 13800138000 / openid oTCgn7abcdef3YHk`.
- `order_summary`: direct business sentence, such as `用户#2 / openid oTCgn7abcdef3YHk 下单 O202606269nr2169001，状态 pending，总价 ¥4740.00，定金 ¥1469.40`.
- `created_at`: serialized as a readable string, never `{}`.

## Script Maintenance

When improving `scripts/pg-business-actions.js`, keep it import-safe with `if (require.main === module)` and export testable helpers. Run:

```bash
node --test .codex/skills/tailor-pg-ops/scripts/pg-business-actions.test.js
```
