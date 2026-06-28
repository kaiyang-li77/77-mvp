# Safety Rules

## Database Access

- Require `PG_HOST`, `PG_PORT`, `PG_USER`, `PG_PASSWORD`, and `PG_DATABASE`.
- Use `PG_SSL=true` for managed PostgreSQL connections that need SSL.
- Never commit credentials or print passwords.
- Prefer a least-privilege database role for this skill. Read-only is best for normal use; use a separate controlled-write role for status updates.

## Read Operations

- Use fixed script actions or parameterized SQL.
- Treat the operator as an authorized backend administrator for read-only lookups. Show full `phone`, `openid`, and `avatar_url` values by default when they help identify or serve the customer.
- Mask customer identifiers only when the user asks for a masked/export-safe view, when preparing public/shareable output, or when the result is not operationally necessary.
- Avoid dumping large tables. Use limits and summaries.
- Never print database passwords, connection strings, or other infrastructure credentials.

## Write Operations

- First run without `--execute`.
- Report the dry-run target rows before executing.
- Execute only bounded writes by primary key or unique business key.
- Include `updated_at = now()` where the table has `updated_at`.
- Verify after writing by re-reading the changed row.

## Prohibited Operations

Do not perform these through this skill unless the user explicitly asks for a separate database migration or maintenance task outside the skill flow:

- `DROP`, `TRUNCATE`, `ALTER`, `CREATE`, schema migrations.
- Unbounded `UPDATE` or `DELETE`.
- Bulk deletion of business data.
- Writes to `users.openid`, order money fields, or `orders.snapshot` without a dedicated reviewed plan.
- Direct edits to production-like data using Python analysis scripts.

## Response Discipline

- Tell the user whether the result is dry-run or executed.
- Include the script action name and key filters for traceability.
- Do not claim a write happened unless the command output confirms it.
