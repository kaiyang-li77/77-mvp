# 小程序后端数据结构与 PostgreSQL 持久化方案

## 1. 设计目标

将当前微信小程序 MVP 的本地 mock 数据与 `wx.storage` 状态，迁移到已有的 PostgreSQL 数据库中，实现用户、身材档案、风格偏好、定制选项、推荐方案、订单与顾问预约的持久化。

设计原则：
- 覆盖范围仅限当前 MVP 6 个页面已有的业务功能。
- 用户识别以**微信 OPENID**为主键入口，手机号授权后补充。
- 配置类数据（衣型、面料、颜色等）全部入表，支持后台上下架。
- 偏好多选字段与订单快照使用 `jsonb`，平衡规范性与 MVP 迭代速度。
- 金额统一使用**整数分**，时间统一使用 `TIMESTAMPTZ`。

---

## 2. 功能列表与持久化映射

| 模块 | 功能点 | 对应数据库实体 |
|---|---|---|
| 用户识别 | 微信 OPENID 作为用户唯一标识 | `users` |
| 身材档案 | 身高、体重、肩宽、胸围、腰围、臀围、袖长、裤长、身型 | `body_profiles` |
| 风格偏好 | 喜好的风格、颜色、版型、穿着场景 | `style_preferences` |
| 定制选项配置 | 衣型、面料、工艺细节、颜色、风格标签、场景标签 | `garments`、`fabrics`、`details`、`colors`、`styles`、`scenes` |
| AI 推荐方案 | 系统预置的推荐方案及明细 | `recommendations`、`recommendation_items` |
| 定制与下单 | 用户选择的衣型/面料/颜色/细节/版型，生成订单 | `custom_selections`、`orders` |
| 顾问预约 | 用户预约线下量体/顾问复核 | `advisor_bookings` |

---

## 3. 核心实体

### 3.1 users（用户）

```sql
CREATE TABLE users (
  id            BIGSERIAL PRIMARY KEY,
  openid        VARCHAR(64) UNIQUE NOT NULL,    -- 微信云函数自动获取，主标识
  phone         VARCHAR(20) UNIQUE,             -- 用户授权手机号后写入
  nickname      VARCHAR(64),
  avatar_url    TEXT,
  phone_verified BOOLEAN DEFAULT false,
  status        VARCHAR(20) DEFAULT 'active',
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now()
);
```

### 3.2 body_profiles（身材档案）

```sql
CREATE TABLE body_profiles (
  id              BIGSERIAL PRIMARY KEY,
  user_id         BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  height          INT,
  weight          INT,
  shoulder        INT,
  chest           INT,
  waist           INT,
  hip             INT,
  sleeve          INT,
  pants_length    INT,
  body_type       VARCHAR(20),
  is_default      BOOLEAN DEFAULT true,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);
```

### 3.3 style_preferences（风格偏好）

```sql
CREATE TABLE style_preferences (
  id                  BIGSERIAL PRIMARY KEY,
  user_id             BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  preferred_styles    JSONB,
  preferred_colors    JSONB,
  fit                 VARCHAR(20),
  preferred_scenes    JSONB,
  created_at          TIMESTAMPTZ DEFAULT now(),
  updated_at          TIMESTAMPTZ DEFAULT now()
);
```

---

## 4. 配置实体

### 4.1 garments（衣型）

```sql
CREATE TABLE garments (
  id              BIGSERIAL PRIMARY KEY,
  code            VARCHAR(32) UNIQUE NOT NULL,
  name            VARCHAR(64) NOT NULL,
  base_price      INT NOT NULL,
  display_order   INT DEFAULT 0,
  is_active       BOOLEAN DEFAULT true,
  created_at      TIMESTAMPTZ DEFAULT now()
);
```

### 4.2 fabrics（面料）

```sql
CREATE TABLE fabrics (
  id              BIGSERIAL PRIMARY KEY,
  code            VARCHAR(32) UNIQUE NOT NULL,
  name            VARCHAR(64) NOT NULL,
  extra_price     INT DEFAULT 0,
  description     TEXT,
  is_active       BOOLEAN DEFAULT true,
  created_at      TIMESTAMPTZ DEFAULT now()
);
```

### 4.3 details（工艺细节）

```sql
CREATE TABLE details (
  id              BIGSERIAL PRIMARY KEY,
  code            VARCHAR(32) UNIQUE NOT NULL,
  name            VARCHAR(64) NOT NULL,
  extra_price     INT DEFAULT 0,
  description     TEXT,
  is_active       BOOLEAN DEFAULT true,
  created_at      TIMESTAMPTZ DEFAULT now()
);
```

### 4.4 colors（颜色）

```sql
CREATE TABLE colors (
  id              BIGSERIAL PRIMARY KEY,
  code            VARCHAR(32) UNIQUE NOT NULL,
  name            VARCHAR(64) NOT NULL,
  hex_value       VARCHAR(7),
  is_active       BOOLEAN DEFAULT true,
  created_at      TIMESTAMPTZ DEFAULT now()
);
```

### 4.5 styles（风格标签）

```sql
CREATE TABLE styles (
  id              BIGSERIAL PRIMARY KEY,
  code            VARCHAR(32) UNIQUE NOT NULL,
  name            VARCHAR(64) NOT NULL,
  is_active       BOOLEAN DEFAULT true,
  created_at      TIMESTAMPTZ DEFAULT now()
);
```

### 4.6 scenes（场景标签）

```sql
CREATE TABLE scenes (
  id              BIGSERIAL PRIMARY KEY,
  code            VARCHAR(32) UNIQUE NOT NULL,
  name            VARCHAR(64) NOT NULL,
  is_active       BOOLEAN DEFAULT true,
  created_at      TIMESTAMPTZ DEFAULT now()
);
```

---

## 5. 推荐、订单与预约实体

### 5.1 recommendations（推荐方案）

```sql
CREATE TABLE recommendations (
  id                  BIGSERIAL PRIMARY KEY,
  code                VARCHAR(32) UNIQUE NOT NULL,
  name                VARCHAR(128) NOT NULL,
  match_score         INT,
  base_price          INT,
  scene_description   VARCHAR(255),
  reason              TEXT,
  style_code          VARCHAR(32) REFERENCES styles(code),
  is_active           BOOLEAN DEFAULT true,
  created_at          TIMESTAMPTZ DEFAULT now()
);
```

### 5.2 recommendation_items（推荐方案明细）

```sql
CREATE TABLE recommendation_items (
  id                  BIGSERIAL PRIMARY KEY,
  recommendation_id   BIGINT NOT NULL REFERENCES recommendations(id) ON DELETE CASCADE,
  garment_code        VARCHAR(32) REFERENCES garments(code),
  fabric_code         VARCHAR(32) REFERENCES fabrics(code),
  color_code          VARCHAR(32) REFERENCES colors(code),
  detail_codes        JSONB,
  display_order       INT DEFAULT 0
);
```

### 5.3 custom_selections（用户定制选择）

```sql
CREATE TABLE custom_selections (
  id                  BIGSERIAL PRIMARY KEY,
  user_id             BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  garment_code        VARCHAR(32) REFERENCES garments(code),
  fabric_code         VARCHAR(32) REFERENCES fabrics(code),
  color_code          VARCHAR(32) REFERENCES colors(code),
  fit                 VARCHAR(20),
  detail_codes        JSONB,
  calculated_price    INT,
  created_at          TIMESTAMPTZ DEFAULT now(),
  updated_at          TIMESTAMPTZ DEFAULT now()
);
```

### 5.4 orders（订单）

```sql
CREATE TABLE orders (
  id                  BIGSERIAL PRIMARY KEY,
  order_no            VARCHAR(32) UNIQUE NOT NULL,
  user_id             BIGINT REFERENCES users(id),
  custom_selection_id BIGINT REFERENCES custom_selections(id),
  total_price         INT NOT NULL,
  deposit             INT,
  status              VARCHAR(32) DEFAULT 'pending',
  snapshot            JSONB,
  estimated_days      INT,
  remark              TEXT,
  created_at          TIMESTAMPTZ DEFAULT now(),
  updated_at          TIMESTAMPTZ DEFAULT now()
);
```

### 5.5 advisor_bookings（顾问预约）

```sql
CREATE TABLE advisor_bookings (
  id              BIGSERIAL PRIMARY KEY,
  user_id         BIGINT REFERENCES users(id) ON DELETE SET NULL,
  order_id        BIGINT REFERENCES orders(id),
  booking_type    VARCHAR(32) DEFAULT 'offline_fitting',
  status          VARCHAR(32) DEFAULT 'pending',
  booking_date    DATE,
  remark          TEXT,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);
```

---

## 6. 索引

```sql
-- 用户查询
CREATE INDEX idx_users_phone ON users(phone);
CREATE INDEX idx_users_openid ON users(openid) WHERE openid IS NOT NULL;

-- 用户关联查询
CREATE INDEX idx_body_profiles_user_id ON body_profiles(user_id);
CREATE INDEX idx_style_preferences_user_id ON style_preferences(user_id);
CREATE INDEX idx_custom_selections_user_id ON custom_selections(user_id);
CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_advisor_bookings_user_id ON advisor_bookings(user_id);

-- jsonb 查询
CREATE INDEX idx_style_preferences_styles ON style_preferences USING GIN (preferred_styles);
CREATE INDEX idx_style_preferences_colors ON style_preferences USING GIN (preferred_colors);
CREATE INDEX idx_orders_snapshot ON orders USING GIN (snapshot);
```

---

## 7. 持久化数据流

1. 小程序首次使用，通过微信 OPENID 自动创建 `users` 记录，手机号授权后补充。
2. 用户填写/修改身材档案 → 写入 `body_profiles`。
3. 用户完成风格测试 → 写入 `style_preferences`。
4. 进入定制工作台时，从配置表读取衣型/面料/颜色/细节/风格/场景。
5. 用户调整选择 → 实时计算价格，写入 `custom_selections`。
6. 点击“模拟下单” → 生成 `orders` 记录，并把当前身材档案和选择写入 `snapshot`。
7. 点击“预约顾问” → 生成 `advisor_bookings` 记录。

---

## 8. 关键约定

- 金额字段统一使用整数分，避免浮点误差。
- 配置表统一使用 `code` 作为业务键，便于重命名和国际化。
- `orders.snapshot` 保存下单瞬间快照，避免配置后续改价影响历史订单。
- `custom_selections` 与 `orders` 分离，方便用户反复调整选择后再下单。
- `advisor_bookings.order_id` 可为空，支持首页直接预约场景。
- 删除用户时级联删除 `body_profiles`、`style_preferences`、`custom_selections`；订单保留用于审计。

---

## 9. 初始化 seed 数据映射

将当前 `miniprogram/data/mock-data.ts` 中的常量迁移为配置表 seed：

| mock-data 常量 | 目标表 |
|---|---|
| `bodyTypeOptions` | `body_profiles.body_type` 的合法值约束 |
| `styleOptions.styles` | `styles` |
| `styleOptions.colors` | `colors` |
| `styleOptions.fits` | 应用层枚举，可后续建表 |
| `styleOptions.scenes` | `scenes` |
| `customOptions.garmentTypes` | `garments` |
| `customOptions.fabrics` | `fabrics` |
| `customOptions.details` | `details` |
| `garmentBasePrice` | `garments.base_price` |
| `recommendations` | `recommendations` + `recommendation_items` |
| `brandProfile` | 建议入 `brand_settings` 表或保留为小程序配置 |

---

## 10. 不做范围

本方案仅做数据结构设计与持久化方案，不包含以下内容：
- 后端 API 接口设计
- 小程序端数据层改造
- 微信登录/支付接入
- 后台管理系统
- 真实 AI 推荐算法
- 库存、物流、会员、优惠券等扩展模块
