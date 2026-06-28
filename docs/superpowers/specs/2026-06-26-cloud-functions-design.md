# 微信云开发云函数后端设计

## 1. 设计目标

为高端私人定制小程序搭建基于**微信云开发云函数**的后端层，统一通过单一云函数 `api` 提供 REST 风格接口，连接已有的 TencentDB PostgreSQL，并实现小程序端数据层改造。

---

## 2. 数据模型调整

因云函数可自动获取微信 `OPENID`，用户识别方式从“手机号为主键”调整为：

- `openid`：非空唯一，由微信云开发自动提供，**主标识**
- `phone`：可空唯一，用户通过 `wx.getPhoneNumber` 授权后写入
- 新增 `phone_verified` 字段标记手机号是否已验证

调整后的 `users` 表：

```sql
CREATE TABLE users (
  id            BIGSERIAL PRIMARY KEY,
  openid        VARCHAR(64) UNIQUE NOT NULL,
  phone         VARCHAR(20) UNIQUE,
  nickname      VARCHAR(64),
  avatar_url    TEXT,
  phone_verified BOOLEAN DEFAULT false,
  status        VARCHAR(20) DEFAULT 'active',
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now()
);
```

> 对应 `db/init.sql` 与 `docs/superpowers/specs/2026-06-25-backend-data-design.md` 需同步更新。

---

## 3. 整体架构

```text
小程序 pages
  ↓ wx.cloud.callFunction({ name: 'api', data: { method, path, body } })
云函数 cloudfunctions/api/index.js
  ↓ 路由分发到 handlers/
  ↓ 用 node pg 连接 TencentDB PostgreSQL
PostgreSQL
```

设计要点：
- 只部署一个云函数 `api`
- 云函数内部按 REST 资源拆 handler
- 每个请求自动从 `cloud.getWXContext()` 拿 `OPENID`，保证用户身份不可伪造
- 数据库连接串放在云函数环境变量里

---

## 4. 项目结构

```text
cloudfunctions/
  api/
    index.js              # 入口：解析 event，路由分发
    package.json          # 依赖：pg、wx-server-sdk
    config/
      db.js               # PostgreSQL 连接池
    middleware/
      auth.js             # OPENID 获取 + 自动创建用户
    handlers/
      users.js            # /users/me
      bodyProfile.js      # /body-profile
      stylePreference.js
      config.js
      recommendations.js
      customSelection.js
      orders.js
      advisorBookings.js
    utils/
      response.js         # 统一响应封装
      price.js            # 价格计算
```

---

## 5. API 端点

### 5.1 用户与档案

| 方法 | 路径 | 说明 |
|---|---|---|
| GET | `/users/me` | 获取当前用户信息，openid 自动识别 |
| POST | `/users/me/phone` | 更新手机号 |
| GET | `/body-profile` | 获取当前用户身材档案 |
| PUT | `/body-profile` | 保存/更新身材档案 |
| GET | `/style-preference` | 获取风格偏好 |
| PUT | `/style-preference` | 保存风格偏好 |

### 5.2 配置数据

| 方法 | 路径 | 说明 |
|---|---|---|
| GET | `/config` | 一次性返回衣型、面料、颜色、风格、场景等全部配置 |

### 5.3 推荐与定制

| 方法 | 路径 | 说明 |
|---|---|---|
| GET | `/recommendations` | 获取推荐方案列表 |
| GET | `/custom-selection` | 获取当前用户的定制选择 |
| PUT | `/custom-selection` | 保存定制选择 |
| POST | `/custom-selection/price` | 计算当前选择的价格 |

### 5.4 订单与预约

| 方法 | 路径 | 说明 |
|---|---|---|
| POST | `/orders` | 创建订单 |
| GET | `/orders` | 获取当前用户订单列表 |
| GET | `/orders/:id` | 获取订单详情 |
| POST | `/advisor-bookings` | 创建顾问预约 |

---

## 6. 请求与响应约定

### 6.1 小程序调用示例

```js
wx.cloud.callFunction({
  name: 'api',
  data: {
    method: 'PUT',
    path: '/body-profile',
    body: {
      height: 172,
      weight: 61,
      shoulder: 42,
      chest: 88,
      waist: 71,
      hip: 92,
      sleeve: 58,
      pants_length: 99,
      body_type: '直筒'
    }
  }
});
```

### 6.2 统一响应格式

```json
{
  "success": true,
  "data": { ... },
  "message": ""
}
```

错误时：

```json
{
  "success": false,
  "data": null,
  "message": "错误描述"
}
```

---

## 7. 认证中间件

每个请求进入 handler 前执行：

1. 从 `cloud.getWXContext()` 读取 `OPENID`
2. 在 `users` 表中查找该 `OPENID`
3. 不存在则自动创建一条用户记录（仅有 openid）
4. 将 `user` 对象注入到请求上下文中

这样前端无需显式传用户 ID，也防止伪造。

---

## 8. 环境变量

在云函数 `api` 的版本配置/环境变量中设置：

```env
PG_HOST=sh-postgres-67q2skv6.sql.tencentcdb.com
PG_PORT=22652
PG_USER=kycloud2
PG_PASSWORD=从安全位置读取
PG_DATABASE=postgres
PG_SSL=true
```

---

## 9. 小程序端改造点

### 9.1 改造文件清单

1. **`miniprogram/data/app-state.ts`**
   - 所有 `wx.getStorageSync/setStorageSync` 改为异步云函数调用
   - 保留本地 fallback，网络失败时先读缓存

2. **新增 `miniprogram/utils/cloud-api.ts`**
   - 统一封装 `wx.cloud.callFunction`
   - 统一处理 loading、错误提示

3. **`miniprogram/app.ts`**
   - `onLaunch` 中初始化云开发环境

4. **各页面 `*.ts`**
   - `onLoad` 改为 `async/await` 调云函数
   - 保存按钮加 loading 状态

### 9.2 app.ts 初始化示例

```ts
App({
  onLaunch() {
    wx.cloud.init({
      env: '你的云环境ID',
      traceUser: true
    });
  }
});
```

---

## 10. 安全与部署

### 10.1 安全

- 数据库密码只放在云函数环境变量，不进入前端代码
- `OPENID` 由微信服务端签发，云函数内获取，前端无法伪造
- 手机号需要调用 `wx.getPhoneNumber` 获取后再传给云函数
- 腾讯云 PostgreSQL 需将云函数出口 IP 加入白名单，或放宽安全组限制

### 10.2 部署步骤

1. 在微信开发者工具中开通云开发并创建环境
2. 创建云函数 `api`
3. 在云函数目录中安装依赖：`npm install pg wx-server-sdk`
4. 配置环境变量
5. 上传并部署云函数
6. 在小程序 `app.ts` 中初始化 `wx.cloud.init`

---

## 11. 不做范围

本方案聚焦云函数 API 与小程序数据层改造，不包含：
- 微信支付接入
- 短信验证码
- 后台管理系统
- 真实 AI 推荐算法
- 订单状态机复杂流转
- 图片上传与 CDN

---

## 12. 预期结果

实现后，完整数据链路如下：

1. 用户打开小程序 → 云函数自动用 `OPENID` 创建/识别用户
2. 填写身材档案、风格测试 → 数据写入 PostgreSQL
3. 进入定制页 → 从数据库读取配置项和当前选择
4. 下单/预约 → 生成 `orders` / `advisor_bookings` 记录
5. 后台可直接查 PostgreSQL 看用户数据和订单
