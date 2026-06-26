# 云函数端到端验证清单

> 生成日期：2026-06-26
> 对应计划：`docs/superpowers/plans/2026-06-26-cloud-functions.md`
> 状态：自动化测试通过，待 GUI 部署后执行真机验证

---

## 一、自动化测试验证结果

### 1.1 云函数测试套件

```bash
cd cloudfunctions/api && npm test
```

**结果：** 12 个测试套件全部通过，74 个测试用例全部通过，耗时 0.644s。

| 测试文件 | 覆盖内容 | 状态 |
|---------|---------|------|
| `index.test.js` | 入口路由分发（10 个路由 + 边界用例） | 通过 |
| `handlers/config.test.js` | /config 配置查询 | 通过 |
| `handlers/users.test.js` | /users/me 读取、/users/me/phone 更新 | 通过 |
| `handlers/bodyProfile.test.js` | /body-profile GET/PUT，upsert 逻辑 | 通过 |
| `handlers/stylePreference.test.js` | /style-preference GET/PUT，upsert 逻辑 | 通过 |
| `handlers/recommendations.test.js` | /recommendations 多表 JOIN 与聚合 | 通过 |
| `handlers/customSelection.test.js` | /custom-selection GET/PUT/POST，价格计算 | 通过 |
| `handlers/orders.test.js` | /orders GET/GET:id/POST，快照生成、订单号 | 通过 |
| `handlers/advisorBookings.test.js` | /advisor-bookings POST，类型校验 | 通过 |
| `utils/response.test.js` | success/error 响应格式 | 通过 |
| `utils/price.test.js` | 价格计算（基础 + 面料 + 细节） | 通过 |
| `middleware/auth.test.js` | OPENID 自动获取/用户自动创建 | 通过 |

### 1.2 小程序端代码审查

| 文件 | 检查项 | 结果 |
|------|--------|------|
| `app.ts` | `wx.cloud.init` 调用，环境 ID 占位符 | 通过（TODO 标记已存在） |
| `data/app-state.ts` | 所有接口函数使用 `call` 封装，字段名与 handler 一致 | 通过 |
| `utils/cloud-api.ts` | `call` 函数统一错误处理，返回 `result.data` | 通过 |
| `pages/home/home.ts` | 并发加载 profile/style/recommendations，降级到 mock | 通过 |
| `pages/profile/profile.ts` | 加载/保存 body-profile，错误处理 | 通过 |
| `pages/style-test/style.ts` | 加载/保存 style-preference，多选逻辑 | 通过 |
| `pages/customizer/customizer.ts` | 加载/保存 custom-selection，同步价格计算 | 通过 |
| `pages/order-confirm/order-confirm.ts` | 加载 selection，调用 createOrder + bookAdvisor | 通过 |
| `pages/recommendations/recommendations.ts` | 加载 recommendations，降级到 mock | 通过 |

**注意：** 小程序端使用 `calculatePriceSync` 进行本地价格预览，云函数端在 `customSelection` 和 `orders` handler 中独立计算价格作为权威值。两端算法一致（均基于 `base_price + extra_price`），但数据来源不同（本地 mock vs 数据库 config）。

---

## 二、部署前检查项

### 2.1 环境变量配置

在 WeChat Cloud Development 控制台中设置以下环境变量：

| 变量 | 示例值 | 必填 |
|------|--------|------|
| `PG_HOST` | `your-db-host.sql.tencentcdb.com` | 是 |
| `PG_PORT` | `22652` | 是 |
| `PG_USER` | `db_user` | 是 |
| `PG_PASSWORD` | `db_password` | 是 |
| `PG_DATABASE` | `tailor_db` | 是 |
| `PG_SSL` | `false` | 是（必须为 false） |

> **注意：** `PG_SSL=false` 是当前 Tencent Cloud PostgreSQL 实例不支持 SSL 连接的临时配置。生产环境应迁移到支持 SSL 的数据库实例，并将此值改为 `true`。 

### 2.2 小程序端配置

- [ ] `app.ts` 中 `env: '你的云环境ID'` 替换为真实云环境 ID
- [ ] 确认 `project.config.json` 中 `cloudfunctionRoot` 指向 `cloudfunctions/`

---

## 三、部署后端到端验证步骤

### Step 1: 验证配置接口

**操作：** 进入小程序首页或定制页

**预期：** 衣型、面料、颜色、细节正常加载

**测试代码：**
```js
wx.cloud.callFunction({
  name: 'api',
  data: { method: 'GET', path: '/config' }
}).then(res => {
  console.log('Config:', res.result);
  // 应返回 { success: true, data: { garments, fabrics, details, colors, styles, scenes } }
});
```

**数据库验证：**
```sql
SELECT COUNT(*) FROM garments WHERE is_active = true;
SELECT COUNT(*) FROM fabrics WHERE is_active = true;
SELECT COUNT(*) FROM details WHERE is_active = true;
SELECT COUNT(*) FROM colors WHERE is_active = true;
```

---

### Step 2: 验证用户与档案链路

#### 2.1 用户自动创建

**操作：** 首次打开小程序

**预期：** 云函数自动根据 OPENID 创建用户记录

**数据库验证：**
```sql
SELECT id, openid, status, created_at FROM users ORDER BY created_at DESC LIMIT 1;
```

#### 2.2 身材档案

**操作：** 进入 "我的" 页 → 填写身高/体重/肩宽等 → 保存

**预期：** 保存成功，页面跳转到风格测试

**测试代码：**
```js
// 保存
wx.cloud.callFunction({
  name: 'api',
  data: {
    method: 'PUT',
    path: '/body-profile',
    body: {
      height: 175, weight: 70, shoulder: 45, chest: 96,
      waist: 82, hip: 95, sleeve: 60, pants_length: 105, body_type: '标准'
    }
  }
});

// 查询
wx.cloud.callFunction({
  name: 'api',
  data: { method: 'GET', path: '/body-profile' }
});
```

**数据库验证：**
```sql
SELECT * FROM body_profiles WHERE user_id = (SELECT id FROM users ORDER BY created_at DESC LIMIT 1);
-- 确认 is_default = true
```

#### 2.3 风格偏好

**操作：** 完成风格测试 → 选择风格/颜色/场景/版型 → 生成推荐

**预期：** 保存成功，跳转到推荐页

**测试代码：**
```js
wx.cloud.callFunction({
  name: 'api',
  data: {
    method: 'PUT',
    path: '/style-preference',
    body: {
      preferred_styles: ['商务正装', '休闲绅士'],
      preferred_colors: ['藏青', '深灰'],
      fit: '合体',
      preferred_scenes: ['日常通勤', '商务会议']
    }
  }
});
```

**数据库验证：**
```sql
SELECT * FROM style_preferences WHERE user_id = (SELECT id FROM users ORDER BY created_at DESC LIMIT 1);
```

---

### Step 3: 验证推荐链路

**操作：** 完成风格测试后进入推荐页

**预期：** 显示推荐方案列表，包含 garment/fabric/color 详情

**测试代码：**
```js
wx.cloud.callFunction({
  name: 'api',
  data: { method: 'GET', path: '/recommendations' }
}).then(res => {
  console.log('Recommendations:', res.result.data);
  // 每个推荐应包含 items 数组，item 包含 garment_name, fabric_name, color_name, hex_value
});
```

---

### Step 4: 验证定制与价格计算链路

#### 4.1 定制选择保存

**操作：** 进入定制页 → 选择品类/面料/颜色/版型/细节

**预期：** 每次选择后价格实时更新，保存到后端

**测试代码：**
```js
// 保存选择
wx.cloud.callFunction({
  name: 'api',
  data: {
    method: 'PUT',
    path: '/custom-selection',
    body: {
      garment_code: 'suit',
      fabric_code: 'wool_100',
      color_code: 'navy',
      fit: 'slim',
      detail_codes: ['horn_button', 'half_canvas']
    }
  }
});

// 价格计算
wx.cloud.callFunction({
  name: 'api',
  data: {
    method: 'POST',
    path: '/custom-selection/price',
    body: {
      garment_code: 'suit',
      fabric_code: 'wool_100',
      detail_codes: ['horn_button', 'half_canvas']
    }
  }
});
```

**数据库验证：**
```sql
SELECT * FROM custom_selections WHERE user_id = (SELECT id FROM users ORDER BY created_at DESC LIMIT 1);
-- 确认 calculated_price 字段有值
```

---

### Step 5: 验证下单链路

**操作：** 进入订单确认页 → 点击模拟下单

**预期：** 下单成功，显示成功弹窗，跳转到首页

**测试代码：**
```js
wx.cloud.callFunction({
  name: 'api',
  data: {
    method: 'POST',
    path: '/orders',
    body: {
      garment_code: 'suit',
      fabric_code: 'wool_100',
      color_code: 'navy',
      fit: 'slim',
      detail_codes: ['horn_button', 'half_canvas'],
      estimated_days: 30
    }
  }
}).then(res => {
  console.log('Order created:', res.result.data);
  // 应包含 order_no, total_price, deposit, status='pending', snapshot
});
```

**数据库验证：**
```sql
SELECT * FROM orders WHERE user_id = (SELECT id FROM users ORDER BY created_at DESC LIMIT 1) ORDER BY created_at DESC LIMIT 1;
-- 确认：
-- 1. order_no 格式为 OYYYYMMDD...（18位）
-- 2. total_price > 0
-- 3. deposit = ROUND(total_price * 0.31)
-- 4. status = 'pending'
-- 5. snapshot 包含 profile 和 selection 的 JSON
-- 6. custom_selection_id 指向 custom_selections 表
```

---

### Step 6: 验证预约链路

**操作：** 在订单确认页点击 "预约顾问"

**预期：** 预约成功，显示成功提示

**测试代码：**
```js
wx.cloud.callFunction({
  name: 'api',
  data: {
    method: 'POST',
    path: '/advisor-bookings',
    body: { order_id: 1, booking_type: 'offline_fitting', booking_date: '2026-07-01', remark: '希望周末' }
  }
});
```

**数据库验证：**
```sql
SELECT * FROM advisor_bookings WHERE user_id = (SELECT id FROM users ORDER BY created_at DESC LIMIT 1) ORDER BY created_at DESC LIMIT 1;
-- 确认 status = 'pending', booking_type 在允许范围内
```

---

### Step 7: 验证订单查询

**操作：** 后续查看订单列表和订单详情

**测试代码：**
```js
// 列表
wx.cloud.callFunction({
  name: 'api',
  data: { method: 'GET', path: '/orders' }
});

// 详情（替换为真实订单 ID）
wx.cloud.callFunction({
  name: 'api',
  data: { method: 'GET', path: '/orders/1' }
});
```

---

## 四、边界情况验证

| 场景 | 测试步骤 | 预期结果 |
|------|---------|---------|
| 未登录用户 | 清除缓存后首次进入 | 自动创建用户，所有接口正常 |
| 无档案下单 | 不保存 body-profile 直接下单 | snapshot.profile 为 null，订单正常创建 |
| 重复保存档案 | 多次点击保存 | 更新同一条记录（is_default=true），不重复插入 |
| 空细节码 | 下单时不选细节 | detail_codes = [], 价格 = base + fabric |
| 无效订单 ID | 查询 /orders/99999 | 返回 404，message = "订单不存在" |
| 无效路径 | 调用 /nonexistent | 返回 404，message = "Not found: GET /nonexistent" |

---

## 五、性能与监控检查

- [ ] 首页并发请求（/body-profile + /style-preference + /recommendations）响应时间 < 2s
- [ ] 定制页价格计算响应时间 < 500ms
- [ ] 下单接口响应时间 < 1s
- [ ] 云函数日志无 ERROR 级别输出
- [ ] PostgreSQL 连接池未出现连接耗尽（max=5）

---

## 六、已知限制与注意事项

1. **部署依赖 GUI：** 云函数部署必须通过 WeChat Developer Tools 图形界面完成，无法命令行自动化
2. **环境 ID 占位符：** `app.ts` 中 `env: '你的云环境ID'` 必须在部署前替换为真实值
3. **PG_SSL：** 当前数据库主机不支持 SSL，必须设置为 `false`。生产环境建议迁移到支持 SSL 的实例。
4. **价格一致性：** 小程序端 `calculatePriceSync` 使用本地 mock 数据，云函数端使用数据库 config 数据。若两端数据不同步，价格预览可能与最终订单价格有差异。建议统一从 `/config` 接口获取配置后本地缓存。
5. **订单号唯一性：** `generateOrderNo` 使用 `Math.random()` 辅助生成，极端并发场景下存在极小碰撞概率。生产环境建议使用数据库序列或 UUID。

---

## 七、验证结论

- [x] 所有 74 个自动化测试通过
- [x] 所有 10 个 API 端点有对应的 handler 和测试覆盖
- [x] 小程序端 6 个页面已完成异步数据适配
- [x] 类型定义（BodyProfile、StylePreference、CustomSelection）在两端一致
- [ ] 待 GUI 部署后执行上述端到端验证步骤
