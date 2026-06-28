# 77-mvp PostgreSQL Schema Reference

Source of truth: `db/init.sql` plus migrations under `db/migrations/`.

## Identity And User Data

- `users`: Mini program user master table.
  - Primary key: `id`.
  - Business identity: `openid` unique and not null.
  - Optional identity/contact: `phone`, `nickname`, `avatar_url`, `phone_verified`.
  - Status: `active`, `inactive`.
- `body_profiles`: Body measurement profiles.
  - `user_id` references `users.id` with cascade delete.
  - Measurements are centimeters except `weight` in kilograms.
  - `body_type`: `直筒`, `梨形`, `倒三角`, `苹果型`, `沙漏型`.
  - `is_default` marks the current profile.
- `style_preferences`: User preference records.
  - `preferred_styles`, `preferred_colors`, `preferred_scenes` are JSON arrays.
  - `fit`: `修身`, `合体`, `宽松`, `廓形`.

## Catalog Configuration

- `garments`: Product categories such as coat, suit, shirt. `base_price` is cents.
- `fabrics`: Fabric catalog. `extra_price` is cents.
- `details`: Craft/detail catalog. `extra_price` is cents.
- `colors`: Color catalog with `hex_value`.
- `styles`: Style tags.
- `scenes`: Wearing scenes.
- Config tables share `code`, `name`, `display_order`, `is_active`, and creation time. Existing DBs may rely on `20260626_align_config_columns.sql` for `display_order`.

## Recommendation Flow

- `recommendations`: AI recommendation plan summary.
  - `code`, `name`, `match_score`, `base_price`, `scene_description`, `reason`, `style_code`.
- `recommendation_items`: Items inside a recommendation.
  - References recommendation ID and catalog `code` values.
  - `detail_codes` is a JSON array of detail codes.

## Customization And Order Flow

- `custom_selections`: User's current or historical customization selection.
  - `user_id` references `users.id`.
  - Stores selected `garment_code`, `fabric_code`, `color_code`, `fit`, `detail_codes`, and `calculated_price`.
- `orders`: Order master table.
  - `order_no` is the business unique identifier.
  - `user_id` references `users.id` with set-null on delete.
  - `custom_selection_id` references `custom_selections.id` with set-null on delete.
  - Money fields `total_price` and `deposit` are cents.
  - `status`: `pending`, `confirmed`, `paid`, `in_progress`, `completed`, `cancelled`.
  - `snapshot` JSONB stores the order-time profile, selection, selected codes, details, and remark.
  - Cloud function order creation uses a deposit ratio of `0.31`.
- `advisor_bookings`: Advisor appointment records.
  - `user_id` and `order_id` are nullable references.
  - `booking_type`: `offline_fitting`, `online_consultation`, `showroom_visit`.
  - `status`: `pending`, `confirmed`, `completed`, `cancelled`.

## Common Joins

User detail:

```sql
SELECT u.*, bp.*, sp.*, cs.*
FROM users u
LEFT JOIN LATERAL (
  SELECT * FROM body_profiles WHERE user_id = u.id AND is_default = true ORDER BY id DESC LIMIT 1
) bp ON true
LEFT JOIN LATERAL (
  SELECT * FROM style_preferences WHERE user_id = u.id ORDER BY id DESC LIMIT 1
) sp ON true
LEFT JOIN LATERAL (
  SELECT * FROM custom_selections WHERE user_id = u.id ORDER BY id DESC LIMIT 1
) cs ON true
WHERE u.id = $1;
```

Order detail:

```sql
SELECT o.*, u.nickname, u.phone, u.openid, cs.*
FROM orders o
LEFT JOIN users u ON u.id = o.user_id
LEFT JOIN custom_selections cs ON cs.id = o.custom_selection_id
WHERE o.order_no = $1;
```
