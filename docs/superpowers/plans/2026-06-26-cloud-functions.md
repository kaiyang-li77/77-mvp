# 微信云开发云函数后端实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为高端私人定制小程序搭建微信云开发云函数后端，通过单一 `api` 云函数提供 REST 接口访问 PostgreSQL，并改造小程序数据层从 `wx.storage` 迁移到云函数。

**Architecture:** 单一云函数 `cloudfunctions/api/index.js` 作为入口，内部按 `event.method` + `event.path` 路由到 `handlers/` 下各资源 handler；`middleware/auth.js` 自动从 `cloud.getWXContext()` 获取 OPENID 并创建/查询用户；`config/db.js` 用 `pg.Pool` 连接 TencentDB PostgreSQL；小程序端新增 `utils/cloud-api.ts` 统一封装调用，并改造 `data/app-state.ts`。

**Tech Stack:** 微信云开发、Node.js、pg、TypeScript（小程序端）、TencentDB PostgreSQL

## Global Constraints

- 云函数运行环境：Node.js 18+（微信云开发默认支持）
- 数据库：PostgreSQL 14+，已存在库 `postgres`
- 用户主标识：微信 `OPENID`，手机号可空
- 金额单位：整数分
- 时间字段：`TIMESTAMPTZ`
- 业务键：配置表统一使用 `code`
- 云函数环境变量存放数据库连接信息
- 小程序 `app.ts` 中调用 `wx.cloud.init` 初始化云开发

---

## File Structure

### 新增文件

| 文件 | 职责 |
|---|---|
| `cloudfunctions/api/index.js` | 云函数入口，路由分发 |
| `cloudfunctions/api/package.json` | 云函数依赖 |
| `cloudfunctions/api/config/db.js` | PostgreSQL 连接池 |
| `cloudfunctions/api/middleware/auth.js` | OPENID 获取与用户自动创建 |
| `cloudfunctions/api/utils/response.js` | 统一响应封装 |
| `cloudfunctions/api/utils/price.js` | 价格计算 |
| `cloudfunctions/api/handlers/users.js` | `/users/me` 接口 |
| `cloudfunctions/api/handlers/bodyProfile.js` | `/body-profile` 接口 |
| `cloudfunctions/api/handlers/stylePreference.js` | `/style-preference` 接口 |
| `cloudfunctions/api/handlers/config.js` | `/config` 接口 |
| `cloudfunctions/api/handlers/recommendations.js` | `/recommendations` 接口 |
| `cloudfunctions/api/handlers/customSelection.js` | `/custom-selection` 接口 |
| `cloudfunctions/api/handlers/orders.js` | `/orders` 接口 |
| `cloudfunctions/api/handlers/advisorBookings.js` | `/advisor-bookings` 接口 |
| `miniprogram/utils/cloud-api.ts` | 小程序端统一调用封装 |
| `db/migrations/20260626_update_users_openid.sql` | 更新 users 表结构 |

### 修改文件

| 文件 | 修改内容 |
|---|---|
| `miniprogram/app.ts` | 初始化 wx.cloud |
| `miniprogram/data/app-state.ts` | 改为异步云函数调用 |
| `miniprogram/pages/home/home.ts` | 异步加载首页数据 |
| `miniprogram/pages/profile/profile.ts` | 异步保存/读取身材档案 |
| `miniprogram/pages/style-test/style-test.ts` | 异步保存/读取风格偏好 |
| `miniprogram/pages/recommendations/recommendations.ts` | 异步读取推荐方案 |
| `miniprogram/pages/customizer/customizer.ts` | 异步读取配置和选择 |
| `miniprogram/pages/order-confirm/order-confirm.ts` | 异步生成订单/预约 |

---

## Task 1: 更新数据库 users 表结构

**Files:**
- Create: `db/migrations/20260626_update_users_openid.sql`
- Test: 用 `scripts/verify-db.js` 验证结构

**Interfaces:**
- Consumes: 现有 `users` 表
- Produces: `users.openid` 非空唯一、`users.phone` 可空

- [ ] **Step 1: 编写迁移 SQL**

创建 `db/migrations/20260626_update_users_openid.sql`：

```sql
-- 更新 users 表：openid 为主标识，phone 可空
ALTER TABLE users
  ALTER COLUMN openid SET NOT NULL,
  ALTER COLUMN phone DROP NOT NULL,
  ADD COLUMN IF NOT EXISTS phone_verified BOOLEAN DEFAULT false;

-- 为现有示例数据填充一个 mock openid（如已有数据且 openid 为空）
UPDATE users SET openid = 'mock_openid_' || id WHERE openid IS NULL;
```

- [ ] **Step 2: 执行迁移**

Run: `PGPASSWORD='从安全位置读取' psql -h sh-postgres-67q2skv6.sql.tencentcdb.com -p 22652 -U kycloud2 -d postgres -f db/migrations/20260626_update_users_openid.sql`

Expected: 无报错，返回 `ALTER TABLE` / `UPDATE` 成功提示

> 如果本地无 `psql`，可用 `node scripts/run-sql.js db/migrations/20260626_update_users_openid.sql`

- [ ] **Step 3: 验证表结构**

Run: `node scripts/verify-db.js`

Expected: `users` 表数据正常，无报错

- [ ] **Step 4: Commit**

```bash
git add db/migrations/20260626_update_users_openid.sql db/init.sql docs/superpowers/specs/2026-06-25-backend-data-design.md
git commit -m "refactor(db): 调整 users 表主标识为 openid，手机号改为可空"
```

---

## Task 2: 初始化云函数目录与依赖

**Files:**
- Create: `cloudfunctions/api/package.json`
- Create: `cloudfunctions/api/config/db.js`

**Interfaces:**
- Consumes: 无
- Produces: `db.getClient()` / `db.query()` 用于后续 handler

- [ ] **Step 1: 创建云函数 package.json**

创建 `cloudfunctions/api/package.json`：

```json
{
  "name": "api",
  "version": "1.0.0",
  "description": "Tailor miniapp REST API cloud function",
  "main": "index.js",
  "dependencies": {
    "pg": "^8.12.0",
    "wx-server-sdk": "~3.0.1"
  }
}
```

- [ ] **Step 2: 安装依赖**

Run: `cd cloudfunctions/api && npm install`

Expected: 生成 `cloudfunctions/api/node_modules` 和 `package-lock.json`

- [ ] **Step 3: 创建数据库连接池**

创建 `cloudfunctions/api/config/db.js`：

```js
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.PG_HOST,
  port: parseInt(process.env.PG_PORT || '5432', 10),
  user: process.env.PG_USER,
  password: process.env.PG_PASSWORD,
  database: process.env.PG_DATABASE,
  ssl: process.env.PG_SSL === 'true' ? { rejectUnauthorized: false } : false,
  max: 5,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000
});

async function query(text, params) {
  const client = await pool.connect();
  try {
    const result = await client.query(text, params);
    return result;
  } finally {
    client.release();
  }
}

module.exports = { pool, query };
```

- [ ] **Step 4: Commit**

```bash
git add cloudfunctions/api/package.json cloudfunctions/api/config/db.js
git commit -m "chore(cloud): 初始化 api 云函数依赖与数据库连接池"
```

---

## Task 3: 创建认证中间件与响应工具

**Files:**
- Create: `cloudfunctions/api/middleware/auth.js`
- Create: `cloudfunctions/api/utils/response.js`

**Interfaces:**
- Consumes: `config/db.js` 的 `query`
- Produces: `auth.getUser(context)` 返回 `{ id, openid, phone }`；`response.success(data)` / `response.error(message, code)`

- [ ] **Step 1: 编写响应工具**

创建 `cloudfunctions/api/utils/response.js`：

```js
function success(data = null, message = '') {
  return { success: true, data, message };
}

function error(message = 'Internal error', code = 500, data = null) {
  return { success: false, data, message, code };
}

module.exports = { success, error };
```

- [ ] **Step 2: 编写认证中间件**

创建 `cloudfunctions/api/middleware/auth.js`：

```js
const cloud = require('wx-server-sdk');
const { query } = require('../config/db');

async function getUser(context) {
  const { OPENID } = cloud.getWXContext({ env: context.env });
  if (!OPENID) {
    throw new Error('Unauthorized: missing OPENID');
  }

  let result = await query('SELECT * FROM users WHERE openid = $1', [OPENID]);
  if (result.rows.length === 0) {
    result = await query(
      'INSERT INTO users (openid, status) VALUES ($1, $2) RETURNING *',
      [OPENID, 'active']
    );
  }
  return result.rows[0];
}

module.exports = { getUser };
```

- [ ] **Step 3: Commit**

```bash
git add cloudfunctions/api/utils/response.js cloudfunctions/api/middleware/auth.js
git commit -m "feat(cloud): 添加认证中间件与统一响应工具"
```

---

## Task 4: 创建价格计算工具

**Files:**
- Create: `cloudfunctions/api/utils/price.js`

**Interfaces:**
- Consumes: `garments`、`fabrics`、`details` 配置数据
- Produces: `calculatePrice(garmentCode, fabricCode, detailCodes, config)` 返回整数分

- [ ] **Step 1: 编写价格计算函数**

创建 `cloudfunctions/api/utils/price.js`：

```js
function calculatePrice(garmentCode, fabricCode, detailCodes, config) {
  const garment = config.garments.find(g => g.code === garmentCode);
  const fabric = config.fabrics.find(f => f.code === fabricCode);

  const base = garment ? garment.base_price : 0;
  const fabricPrice = fabric ? fabric.extra_price : 0;
  const detailsPrice = (detailCodes || []).reduce((sum, code) => {
    const item = config.details.find(d => d.code === code);
    return sum + (item ? item.extra_price : 0);
  }, 0);

  return base + fabricPrice + detailsPrice;
}

module.exports = { calculatePrice };
```

- [ ] **Step 2: Commit**

```bash
git add cloudfunctions/api/utils/price.js
git commit -m "feat(cloud): 添加服务端价格计算工具"
```

---

## Task 5: 实现配置接口 /config

**Files:**
- Create: `cloudfunctions/api/handlers/config.js`

**Interfaces:**
- Consumes: `config/db.query`
- Produces: `handle(event, context, user)` 返回 `{ garments, fabrics, details, colors, styles, scenes }`

- [ ] **Step 1: 编写 config handler**

创建 `cloudfunctions/api/handlers/config.js`：

```js
const { query } = require('../config/db');
const response = require('../utils/response');

async function handle(event, context, user) {
  const tables = ['garments', 'fabrics', 'details', 'colors', 'styles', 'scenes'];
  const result = {};
  for (const table of tables) {
    const { rows } = await query(`SELECT * FROM ${table} WHERE is_active = true ORDER BY display_order, id`);
    result[table] = rows;
  }
  return response.success(result);
}

module.exports = { handle };
```

- [ ] **Step 2: Commit**

```bash
git add cloudfunctions/api/handlers/config.js
git commit -m "feat(cloud): 添加 /config 接口"
```

---

## Task 6: 实现用户接口 /users/me

**Files:**
- Create: `cloudfunctions/api/handlers/users.js`

**Interfaces:**
- Consumes: `config/db.query`、已解析的 `user`
- Produces: `GET /users/me` 返回用户信息；`POST /users/me/phone` 更新手机号

- [ ] **Step 1: 编写 users handler**

创建 `cloudfunctions/api/handlers/users.js`：

```js
const { query } = require('../config/db');
const response = require('../utils/response');

async function handle(event, context, user) {
  const { method, body = {} } = event;

  if (method === 'GET') {
    return response.success(user);
  }

  if (method === 'POST' && event.path === '/users/me/phone') {
    const { phone } = body;
    if (!phone) {
      return response.error('手机号不能为空', 400);
    }
    const { rows } = await query(
      'UPDATE users SET phone = $1, phone_verified = true, updated_at = now() WHERE id = $2 RETURNING *',
      [phone, user.id]
    );
    return response.success(rows[0]);
  }

  return response.error('Method not allowed', 405);
}

module.exports = { handle };
```

- [ ] **Step 2: Commit**

```bash
git add cloudfunctions/api/handlers/users.js
git commit -m "feat(cloud): 添加 /users/me 接口"
```

---

## Task 7: 实现身材档案接口 /body-profile

**Files:**
- Create: `cloudfunctions/api/handlers/bodyProfile.js`

**Interfaces:**
- Consumes: `config/db.query`
- Produces: `GET /body-profile` / `PUT /body-profile`

- [ ] **Step 1: 编写 bodyProfile handler**

创建 `cloudfunctions/api/handlers/bodyProfile.js`：

```js
const { query } = require('../config/db');
const response = require('../utils/response');

const FIELDS = ['height', 'weight', 'shoulder', 'chest', 'waist', 'hip', 'sleeve', 'pants_length', 'body_type'];

async function handle(event, context, user) {
  const { method, body = {} } = event;

  if (method === 'GET') {
    const { rows } = await query(
      'SELECT * FROM body_profiles WHERE user_id = $1 AND is_default = true ORDER BY id DESC LIMIT 1',
      [user.id]
    );
    return response.success(rows[0] || null);
  }

  if (method === 'PUT') {
    const values = FIELDS.map(f => body[f]);

    const { rows: existing } = await query(
      'SELECT id FROM body_profiles WHERE user_id = $1 AND is_default = true',
      [user.id]
    );

    if (existing.length > 0) {
      const { rows } = await query(
        `UPDATE body_profiles SET ${FIELDS.map((f, i) => `${f} = $${i + 1}`).join(', ')}, updated_at = now()
         WHERE id = $${FIELDS.length + 1} RETURNING *`,
        [...values, existing[0].id]
      );
      return response.success(rows[0]);
    }

    const { rows } = await query(
      `INSERT INTO body_profiles (user_id, ${FIELDS.join(', ')})
       VALUES ($1, ${FIELDS.map((_, i) => `$${i + 2}`).join(', ')})
       RETURNING *`,
      [user.id, ...values]
    );
    return response.success(rows[0]);
  }

  return response.error('Method not allowed', 405);
}

module.exports = { handle };
```

- [ ] **Step 2: Commit**

```bash
git add cloudfunctions/api/handlers/bodyProfile.js
git commit -m "feat(cloud): 添加 /body-profile 接口"
```

---

## Task 8: 实现风格偏好接口 /style-preference

**Files:**
- Create: `cloudfunctions/api/handlers/stylePreference.js`

**Interfaces:**
- Consumes: `config/db.query`
- Produces: `GET /style-preference` / `PUT /style-preference`

- [ ] **Step 1: 编写 stylePreference handler**

创建 `cloudfunctions/api/handlers/stylePreference.js`：

```js
const { query } = require('../config/db');
const response = require('../utils/response');

async function handle(event, context, user) {
  const { method, body = {} } = event;

  if (method === 'GET') {
    const { rows } = await query(
      'SELECT * FROM style_preferences WHERE user_id = $1 ORDER BY id DESC LIMIT 1',
      [user.id]
    );
    return response.success(rows[0] || null);
  }

  if (method === 'PUT') {
    const { preferred_styles, preferred_colors, fit, preferred_scenes } = body;
    const { rows: existing } = await query(
      'SELECT id FROM style_preferences WHERE user_id = $1',
      [user.id]
    );

    if (existing.length > 0) {
      const { rows } = await query(
        `UPDATE style_preferences
         SET preferred_styles = $1, preferred_colors = $2, fit = $3, preferred_scenes = $4, updated_at = now()
         WHERE id = $5 RETURNING *`,
        [JSON.stringify(preferred_styles || []), JSON.stringify(preferred_colors || []), fit, JSON.stringify(preferred_scenes || []), existing[0].id]
      );
      return response.success(rows[0]);
    }

    const { rows } = await query(
      `INSERT INTO style_preferences (user_id, preferred_styles, preferred_colors, fit, preferred_scenes)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [user.id, JSON.stringify(preferred_styles || []), JSON.stringify(preferred_colors || []), fit, JSON.stringify(preferred_scenes || [])]
    );
    return response.success(rows[0]);
  }

  return response.error('Method not allowed', 405);
}

module.exports = { handle };
```

- [ ] **Step 2: Commit**

```bash
git add cloudfunctions/api/handlers/stylePreference.js
git commit -m "feat(cloud): 添加 /style-preference 接口"
```

---

## Task 9: 实现推荐方案接口 /recommendations

**Files:**
- Create: `cloudfunctions/api/handlers/recommendations.js`

**Interfaces:**
- Consumes: `config/db.query`
- Produces: `GET /recommendations` 返回推荐列表及明细

- [ ] **Step 1: 编写 recommendations handler**

创建 `cloudfunctions/api/handlers/recommendations.js`：

```js
const { query } = require('../config/db');
const response = require('../utils/response');

async function handle(event, context, user) {
  const { rows: recommendations } = await query(
    `SELECT r.*, s.name as style_name
     FROM recommendations r
     LEFT JOIN styles s ON r.style_code = s.code
     WHERE r.is_active = true
     ORDER BY r.match_score DESC`
  );

  for (const rec of recommendations) {
    const { rows: items } = await query(
      `SELECT ri.*, g.name as garment_name, f.name as fabric_name, c.name as color_name, c.hex_value
       FROM recommendation_items ri
       LEFT JOIN garments g ON ri.garment_code = g.code
       LEFT JOIN fabrics f ON ri.fabric_code = f.code
       LEFT JOIN colors c ON ri.color_code = c.code
       WHERE ri.recommendation_id = $1
       ORDER BY ri.display_order`,
      [rec.id]
    );
    rec.items = items;
  }

  return response.success(recommendations);
}

module.exports = { handle };
```

- [ ] **Step 2: Commit**

```bash
git add cloudfunctions/api/handlers/recommendations.js
git commit -m "feat(cloud): 添加 /recommendations 接口"
```

---

## Task 10: 实现定制选择接口 /custom-selection

**Files:**
- Create: `cloudfunctions/api/handlers/customSelection.js`

**Interfaces:**
- Consumes: `config/db.query`、price.calculatePrice、config.handle
- Produces: `GET /custom-selection` / `PUT /custom-selection` / `POST /custom-selection/price`

- [ ] **Step 1: 编写 customSelection handler**

创建 `cloudfunctions/api/handlers/customSelection.js`：

```js
const { query } = require('../config/db');
const response = require('../utils/response');
const { calculatePrice } = require('../utils/price');
const configHandler = require('./config');

async function handle(event, context, user) {
  const { method, body = {} } = event;

  if (method === 'GET') {
    const { rows } = await query(
      'SELECT * FROM custom_selections WHERE user_id = $1 ORDER BY id DESC LIMIT 1',
      [user.id]
    );
    return response.success(rows[0] || null);
  }

  if (method === 'PUT') {
    const { garment_code, fabric_code, color_code, fit, detail_codes } = body;

    const configRes = await configHandler.handle(event, context, user);
    const config = configRes.data;
    const calculatedPrice = calculatePrice(garment_code, fabric_code, detail_codes, config);

    const { rows: existing } = await query(
      'SELECT id FROM custom_selections WHERE user_id = $1',
      [user.id]
    );

    if (existing.length > 0) {
      const { rows } = await query(
        `UPDATE custom_selections
         SET garment_code = $1, fabric_code = $2, color_code = $3, fit = $4, detail_codes = $5, calculated_price = $6, updated_at = now()
         WHERE id = $7 RETURNING *`,
        [garment_code, fabric_code, color_code, fit, JSON.stringify(detail_codes || []), calculatedPrice, existing[0].id]
      );
      return response.success(rows[0]);
    }

    const { rows } = await query(
      `INSERT INTO custom_selections (user_id, garment_code, fabric_code, color_code, fit, detail_codes, calculated_price)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [user.id, garment_code, fabric_code, color_code, fit, JSON.stringify(detail_codes || []), calculatedPrice]
    );
    return response.success(rows[0]);
  }

  if (method === 'POST' && event.path === '/custom-selection/price') {
    const { garment_code, fabric_code, detail_codes } = body;
    const configRes = await configHandler.handle(event, context, user);
    const config = configRes.data;
    const price = calculatePrice(garment_code, fabric_code, detail_codes, config);
    return response.success({ price });
  }

  return response.error('Method not allowed', 405);
}

module.exports = { handle };
```

- [ ] **Step 2: Commit**

```bash
git add cloudfunctions/api/handlers/customSelection.js
git commit -m "feat(cloud): 添加 /custom-selection 接口"
```

---

## Task 11: 实现订单接口 /orders

**Files:**
- Create: `cloudfunctions/api/handlers/orders.js`

**Interfaces:**
- Consumes: `config/db.query`、customSelection.handle、config.handle、price.calculatePrice
- Produces: `GET /orders` / `GET /orders/:id` / `POST /orders`

- [ ] **Step 1: 编写 orders handler**

创建 `cloudfunctions/api/handlers/orders.js`：

```js
const { query } = require('../config/db');
const response = require('../utils/response');
const { calculatePrice } = require('../utils/price');
const configHandler = require('./config');

function generateOrderNo() {
  const now = new Date();
  const date = now.toISOString().slice(0, 10).replace(/-/g, '');
  const random = Math.floor(1000 + Math.random() * 9000);
  return `O${date}${random}`;
}

async function handle(event, context, user) {
  const { method, body = {}, pathParams = {} } = event;

  if (method === 'GET') {
    if (pathParams.id) {
      const { rows } = await query(
        'SELECT * FROM orders WHERE id = $1 AND user_id = $2',
        [pathParams.id, user.id]
      );
      if (rows.length === 0) return response.error('订单不存在', 404);
      return response.success(rows[0]);
    }

    const { rows } = await query(
      'SELECT * FROM orders WHERE user_id = $1 ORDER BY created_at DESC',
      [user.id]
    );
    return response.success(rows);
  }

  if (method === 'POST') {
    const { garment_code, fabric_code, color_code, fit, detail_codes, estimated_days = 30 } = body;

    const configRes = await configHandler.handle(event, context, user);
    const config = configRes.data;
    const totalPrice = calculatePrice(garment_code, fabric_code, detail_codes, config);
    const deposit = Math.round(totalPrice * 0.31);

    const { rows: profileRows } = await query(
      'SELECT * FROM body_profiles WHERE user_id = $1 AND is_default = true ORDER BY id DESC LIMIT 1',
      [user.id]
    );
    const { rows: selectionRows } = await query(
      'SELECT * FROM custom_selections WHERE user_id = $1 ORDER BY id DESC LIMIT 1',
      [user.id]
    );

    const snapshot = {
      profile: profileRows[0] || null,
      selection: selectionRows[0] || null,
      garment_code,
      fabric_code,
      color_code,
      fit,
      detail_codes: detail_codes || []
    };

    const orderNo = generateOrderNo();
    const { rows } = await query(
      `INSERT INTO orders (order_no, user_id, custom_selection_id, total_price, deposit, status, snapshot, estimated_days)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [orderNo, user.id, selectionRows[0]?.id || null, totalPrice, deposit, 'pending', JSON.stringify(snapshot), estimated_days]
    );
    return response.success(rows[0]);
  }

  return response.error('Method not allowed', 405);
}

module.exports = { handle };
```

- [ ] **Step 2: Commit**

```bash
git add cloudfunctions/api/handlers/orders.js
git commit -m "feat(cloud): 添加 /orders 接口"
```

---

## Task 12: 实现顾问预约接口 /advisor-bookings

**Files:**
- Create: `cloudfunctions/api/handlers/advisorBookings.js`

**Interfaces:**
- Consumes: `config/db.query`
- Produces: `POST /advisor-bookings`

- [ ] **Step 1: 编写 advisorBookings handler**

创建 `cloudfunctions/api/handlers/advisorBookings.js`：

```js
const { query } = require('../config/db');
const response = require('../utils/response');

async function handle(event, context, user) {
  const { method, body = {} } = event;

  if (method === 'POST') {
    const { order_id, booking_date, remark } = body;
    const { rows } = await query(
      `INSERT INTO advisor_bookings (user_id, order_id, booking_type, status, booking_date, remark)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [user.id, order_id || null, 'offline_fitting', 'pending', booking_date || null, remark || '']
    );
    return response.success(rows[0]);
  }

  return response.error('Method not allowed', 405);
}

module.exports = { handle };
```

- [ ] **Step 2: Commit**

```bash
git add cloudfunctions/api/handlers/advisorBookings.js
git commit -m "feat(cloud): 添加 /advisor-bookings 接口"
```

---

## Task 13: 实现云函数入口路由

**Files:**
- Create: `cloudfunctions/api/index.js`

**Interfaces:**
- Consumes: 所有 handlers、auth.getUser、response.error
- Produces: 云函数输出

- [ ] **Step 1: 编写入口路由**

创建 `cloudfunctions/api/index.js`：

```js
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

const { getUser } = require('./middleware/auth');
const response = require('./utils/response');

const handlers = {
  '/config': require('./handlers/config'),
  '/users/me': require('./handlers/users'),
  '/users/me/phone': require('./handlers/users'),
  '/body-profile': require('./handlers/bodyProfile'),
  '/style-preference': require('./handlers/stylePreference'),
  '/recommendations': require('./handlers/recommendations'),
  '/custom-selection': require('./handlers/customSelection'),
  '/custom-selection/price': require('./handlers/customSelection'),
  '/orders': require('./handlers/orders'),
  '/advisor-bookings': require('./handlers/advisorBookings')
};

function parsePath(rawPath) {
  const path = rawPath || '/';
  const parts = path.split('/').filter(Boolean);
  if (parts.length >= 2 && /^\d+$/.test(parts[parts.length - 1])) {
    return {
      basePath: '/' + parts.slice(0, -1).join('/'),
      pathParams: { id: parseInt(parts[parts.length - 1], 10) }
    };
  }
  return { basePath: path, pathParams: {} };
}

exports.main = async (event, context) => {
  try {
    const method = (event.method || 'GET').toUpperCase();
    const path = event.path || '/';
    const { basePath, pathParams } = parsePath(path);

    const handler = handlers[basePath] || handlers[path];
    if (!handler) {
      return response.error(`Not found: ${method} ${path}`, 404);
    }

    const user = await getUser(context);
    return await handler.handle({ ...event, method, path, pathParams }, context, user);
  } catch (err) {
    console.error(err);
    return response.error(err.message || 'Internal error', 500);
  }
};
```

- [ ] **Step 2: Commit**

```bash
git add cloudfunctions/api/index.js
git commit -m "feat(cloud): 添加 api 云函数入口路由"
```

---

## Task 14: 配置云函数环境变量并部署

**Files:**
- Modify: 微信开发者工具 / 云开发控制台

**Interfaces:**
- Consumes: 无
- Produces: 可在线访问的云函数 `api`

- [ ] **Step 1: 在云开发控制台设置环境变量**

变量名与值：

```
PG_HOST=sh-postgres-67q2skv6.sql.tencentcdb.com
PG_PORT=22652
PG_USER=kycloud2
PG_PASSWORD=从安全位置读取
PG_DATABASE=postgres
PG_SSL=true
```

- [ ] **Step 2: 在微信开发者工具中上传并部署云函数**

操作：
1. 右键 `cloudfunctions/api` → 创建并部署：云端安装依赖
2. 等待部署完成

Expected: 控制台提示部署成功

- [ ] **Step 3: 测试云函数**

在微信开发者工具中新建「云函数测试」或直接用小程序调用测试：

```js
wx.cloud.callFunction({
  name: 'api',
  data: { method: 'GET', path: '/config' }
}).then(res => {
  console.log(res.result);
});
```

Expected: 返回 `{ success: true, data: { garments: [...], fabrics: [...], ... } }`

- [ ] **Step 4: Commit（仅文档记录）**

```bash
git commit --allow-empty -m "deploy(cloud): 部署 api 云函数到微信云开发环境"
```

---

## Task 15: 小程序端初始化云开发

**Files:**
- Modify: `miniprogram/app.ts`

**Interfaces:**
- Consumes: 无
- Produces: `wx.cloud.init` 在启动时执行

- [ ] **Step 1: 修改 app.ts**

在 `App({ onLaunch() { ... } })` 中加入：

```ts
onLaunch() {
  wx.cloud.init({
    env: '你的云环境ID', // 替换为实际云环境 ID
    traceUser: true
  });
}
```

- [ ] **Step 2: Commit**

```bash
git add miniprogram/app.ts
git commit -m "feat(app): 初始化微信云开发"
```

---

## Task 16: 创建小程序端云函数调用封装

**Files:**
- Create: `miniprogram/utils/cloud-api.ts`

**Interfaces:**
- Consumes: `wx.cloud.callFunction`
- Produces: `cloudApi.call(method, path, body)`

- [ ] **Step 1: 编写 cloud-api.ts**

创建 `miniprogram/utils/cloud-api.ts`：

```ts
export interface CloudApiResponse<T = any> {
  success: boolean;
  data: T;
  message: string;
  code?: number;
}

export async function call<T = any>(
  method: string,
  path: string,
  body?: Record<string, any>
): Promise<T> {
  const res = await wx.cloud.callFunction({
    name: 'api',
    data: { method, path, body }
  });

  const result = res.result as CloudApiResponse<T>;
  if (!result.success) {
    throw new Error(result.message || '请求失败');
  }
  return result.data;
}
```

- [ ] **Step 2: Commit**

```bash
git add miniprogram/utils/cloud-api.ts
git commit -m "feat(utils): 添加云函数统一调用封装"
```

---

## Task 17: 改造 app-state.ts 为异步云函数调用

**Files:**
- Modify: `miniprogram/data/app-state.ts`

**Interfaces:**
- Consumes: `utils/cloud-api.call`
- Produces: 异步 getter/setter

- [ ] **Step 1: 重写 app-state.ts**

```ts
import { call } from '../utils/cloud-api';

export interface BodyProfile {
  height: number;
  weight: number;
  shoulder: number;
  chest: number;
  waist: number;
  hip: number;
  sleeve: number;
  pants_length: number;
  body_type: string;
}

export interface StylePreference {
  preferred_styles: string[];
  preferred_colors: string[];
  fit: string;
  preferred_scenes: string[];
}

export interface CustomSelection {
  garment_code: string;
  fabric_code: string;
  color_code: string;
  fit: string;
  detail_codes: string[];
  calculated_price: number;
}

export async function getBodyProfile(): Promise<BodyProfile | null> {
  return call('GET', '/body-profile');
}

export async function setBodyProfile(profile: BodyProfile): Promise<BodyProfile> {
  return call('PUT', '/body-profile', profile);
}

export async function getStylePreference(): Promise<StylePreference | null> {
  return call('GET', '/style-preference');
}

export async function setStylePreference(pref: StylePreference): Promise<StylePreference> {
  return call('PUT', '/style-preference', pref);
}

export async function getCustomSelection(): Promise<CustomSelection | null> {
  return call('GET', '/custom-selection');
}

export async function setCustomSelection(sel: CustomSelection): Promise<CustomSelection> {
  return call('PUT', '/custom-selection', sel);
}

export async function getConfig(): Promise<any> {
  return call('GET', '/config');
}

export async function getRecommendations(): Promise<any[]> {
  return call('GET', '/recommendations');
}

export async function calculatePrice(garment: string, fabric: string, details: string[]): Promise<number> {
  const res = await call<{ price: number }>('POST', '/custom-selection/price', {
    garment_code: garment,
    fabric_code: fabric,
    detail_codes: details
  });
  return res.price;
}

export async function createOrder(selection: CustomSelection): Promise<any> {
  return call('POST', '/orders', selection);
}

export async function bookAdvisor(orderId?: number): Promise<any> {
  return call('POST', '/advisor-bookings', { order_id: orderId });
}
```

- [ ] **Step 2: Commit**

```bash
git add miniprogram/data/app-state.ts
git commit -m "refactor(data): app-state 改为异步云函数调用"
```

---

## Task 18: 改造小程序页面适配异步数据

**Files:**
- Modify: `miniprogram/pages/profile/profile.ts`
- Modify: `miniprogram/pages/style-test/style-test.ts`
- Modify: `miniprogram/pages/recommendations/recommendations.ts`
- Modify: `miniprogram/pages/customizer/customizer.ts`
- Modify: `miniprogram/pages/order-confirm/order-confirm.ts`
- Modify: `miniprogram/pages/home/home.ts`

**Interfaces:**
- Consumes: `data/app-state.ts` 的异步方法
- Produces: 页面逻辑适配 async/await

- [ ] **Step 1: 以 profile.ts 为例改造**

将 `onLoad` 和保存方法改为 async：

```ts
import { getBodyProfile, setBodyProfile, BodyProfile } from '../../data/app-state';

Page({
  data: { profile: {} as BodyProfile },
  async onLoad() {
    const profile = await getBodyProfile();
    this.setData({ profile: profile || { height: 172, weight: 61, ... } });
  },
  async save() {
    wx.showLoading({ title: '保存中' });
    try {
      await setBodyProfile(this.data.profile);
      wx.navigateTo({ url: '/pages/style-test/style-test' });
    } catch (e) {
      wx.showToast({ title: (e as Error).message, icon: 'none' });
    } finally {
      wx.hideLoading();
    }
  }
});
```

- [ ] **Step 2: 其他页面同理改造**

原则：
- `onLoad` 加 `async`，调用 `await getXxx()`
- 保存/提交按钮加 `wx.showLoading`
- 错误用 `wx.showToast({ icon: 'none' })`
- 跳转前等待保存完成

- [ ] **Step 3: Commit**

```bash
git add miniprogram/pages/**/*.ts
git commit -m "feat(pages): 各页面适配异步云函数数据加载"
```

---

## Task 19: 端到端验证

**Files:**
- 使用微信开发者工具真机/模拟器预览

- [ ] **Step 1: 验证配置接口**

进入定制页，确认衣型、面料、颜色、细节正常加载。

- [ ] **Step 2: 验证用户与档案链路**

1. 填写身材档案 → 保存
2. 查询 PostgreSQL 确认 `body_profiles` 有记录
3. 完成风格测试 → 保存
4. 查询 `style_preferences` 有记录

- [ ] **Step 3: 验证下单链路**

1. 进入定制工作台，选择面料/细节，确认价格计算正确
2. 进入订单确认页，点击模拟下单
3. 查询 `orders` 表有记录，且 `snapshot` 字段包含身材档案和选择

- [ ] **Step 4: 验证预约链路**

1. 点击预约顾问
2. 查询 `advisor_bookings` 表有记录

- [ ] **Step 5: Commit 验证结果文档**

```bash
git add docs/superpowers/plans/2026-06-26-cloud-functions.md
git commit -m "docs: 记录云函数实现计划"
```

---

## Self-Review

### Spec Coverage

| 设计点 | 对应 Task |
|---|---|
| 单一云函数 + REST 路由 | Task 13 |
| OPENID 自动获取/创建用户 | Task 3、所有 handler |
| 环境变量管理 | Task 2、Task 14 |
| `/config` 配置接口 | Task 5 |
| `/users/me`、`/body-profile`、`/style-preference` | Task 6、7、8 |
| `/recommendations` | Task 9 |
| `/custom-selection` 及价格计算 | Task 4、10 |
| `/orders` | Task 11 |
| `/advisor-bookings` | Task 12 |
| 小程序端 `wx.cloud.init` | Task 15 |
| 小程序端统一调用封装 | Task 16 |
| `app-state.ts` 改造 | Task 17 |
| 各页面异步适配 | Task 18 |

### Placeholder Scan

- 无 `TBD`、`TODO`
- 环境变量 `你的云环境ID` 是真实需要用户替换的值，已在 Task 15 标注
- 所有 handler 包含完整代码

### Type Consistency

- `BodyProfile`、`StylePreference`、`CustomSelection` 接口与 handler 字段一致
- `calculatePrice` 参数在云函数端和小程序端均使用 `garment_code`、`fabric_code`、`detail_codes`

---

## Execution Handoff

**Plan complete and saved to `docs/superpowers/plans/2026-06-26-cloud-functions.md`.**

Two execution options:

**1. Subagent-Driven (recommended)** - I dispatch a fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** - Execute tasks in this session using executing-plans, batch execution with checkpoints

Which approach?
