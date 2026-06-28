# 云函数端到端测试计划

本文用于交给 AI 测试执行者，在微信开发者工具中验证小程序云函数与 PostgreSQL 数据库链路。

## 1. 测试目标

验证以下链路可用：

- 小程序已连接 CloudBase 环境
- 小程序能通过 `wx.cloud.callFunction` 调用云函数 `api`
- 云函数能拿到微信运行时 `OPENID`
- 云函数能连接 PostgreSQL
- 配置、用户、档案、偏好、定制、订单、预约等核心接口可读写
- 数据库中能看到对应记录

## 2. 测试环境

项目路径：

```text
/Users/kycloud/WeChatProjects/77-mvp
```

CloudBase 环境：

```text
kycloud-cloudbase-d8dy5236df1413
```

云函数：

```text
api
```

小程序 AppID：

```text
wx46ed910b825bbfa8
```

小程序云环境配置位置：

```text
miniprogram/app.ts
```

期望配置：

```ts
wx.cloud.init({
  env: 'kycloud-cloudbase-d8dy5236df1413',
  traceUser: true
});
```

## 3. 前置检查

### 3.1 本地测试

在项目根目录执行：

```bash
cd /Users/kycloud/WeChatProjects/77-mvp/cloudfunctions/api
npm test
```

期望：

```text
Test Suites: 12 passed
Tests: 74 passed
```

### 3.2 云端函数状态

执行：

```bash
tcb fn detail api -e kycloud-cloudbase-d8dy5236df1413 --json
```

检查：

- `Status` 为 `Active`
- `AvailableStatus` 为 `Available`
- `Runtime` 为 `Nodejs18.15`
- `Handler` 为 `index.main`
- `Environment.Variables` 包含：
  - `PG_HOST`
  - `PG_PORT`
  - `PG_USER`
  - `PG_PASSWORD`
  - `PG_DATABASE`
  - `PG_SSL=false`

不要把 `PG_PASSWORD` 输出到公开报告中。

### 3.3 数据库迁移状态

确认以下迁移已经执行：

```text
db/migrations/20260626_update_users_openid.sql
db/migrations/20260626_align_config_columns.sql
```

如果 `/config` 报 `display_order does not exist`，或 `/recommendations` 报 `r.updated_at does not exist`，说明第二个迁移未执行。

## 4. 日志采集方式

测试过程中同时观察两个位置：

- 微信开发者工具 Console
- CloudBase 云函数日志

云函数日志命令：

```bash
tcb fn log api -e kycloud-cloudbase-d8dy5236df1413 --limit 50
```

报告时记录：

- 测试时间
- 页面路径
- 操作步骤
- Console 输出
- 云函数返回结果
- 数据库验证结果
- 异常堆栈或错误信息

## 5. 临时测试代码策略

优先通过真实页面操作验证。

如果需要直接调用接口，可在任意页面 `onLoad` 中临时加入：

```ts
wx.cloud.callFunction({
  name: 'api',
  data: { method: 'GET', path: '/config' }
}).then(res => {
  console.log('/config 结果:', res.result);
}).catch(err => {
  console.error('/config 调用失败:', err);
});
```

验证完成后必须删除临时代码。

## 6. 核心接口测试

### TC-01 配置接口 `/config`

目的：验证小程序到云函数、云函数到数据库的基础链路。

操作：

1. 打开微信开发者工具
2. 进入首页 `pages/home/home`
3. 刷新页面或重新编译
4. 如页面没有直接打印配置，可用第 5 节临时代码调用

调用参数：

```js
{
  name: 'api',
  data: { method: 'GET', path: '/config' }
}
```

期望：

```json
{
  "success": true,
  "data": {
    "garments": [],
    "fabrics": [],
    "details": [],
    "colors": [],
    "styles": [],
    "scenes": []
  }
}
```

判定：

- 以上 6 个数组都存在
- `garments` 至少包含 `大衣`
- `fabrics` 至少包含 `精纺羊毛`
- `colors` 至少包含 `深石墨黑`

失败排查：

- `Unauthorized: missing OPENID`：调用不是从小程序运行时发起
- `connect ECONNREFUSED 127.0.0.1:5432`：云端数据库变量未配置
- `display_order does not exist`：数据库迁移未执行

### TC-02 用户接口 `/users/me`

目的：验证 `OPENID` 自动识别和用户自动创建。

调用参数：

```js
{
  name: 'api',
  data: { method: 'GET', path: '/users/me' }
}
```

期望：

```json
{
  "success": true,
  "data": {
    "id": "...",
    "openid": "...",
    "status": "active"
  }
}
```

数据库验证：

```sql
SELECT id, openid, status, created_at
FROM users
ORDER BY created_at DESC
LIMIT 5;
```

判定：

- 返回 `success=true`
- `openid` 非空
- 数据库中有对应用户

### TC-03 身材档案 `/body-profile`

目的：验证身材档案保存和读取。

保存调用：

```js
{
  name: 'api',
  data: {
    method: 'PUT',
    path: '/body-profile',
    body: {
      height: 175,
      weight: 70,
      shoulder: 45,
      chest: 96,
      waist: 82,
      hip: 95,
      sleeve: 60,
      pants_length: 105,
      body_type: '直筒'
    }
  }
}
```

读取调用：

```js
{
  name: 'api',
  data: { method: 'GET', path: '/body-profile' }
}
```

期望：

- 保存返回 `success=true`
- 读取返回刚保存的尺寸
- 再次保存同一用户应更新原记录，而不是创建多条默认档案

数据库验证：

```sql
SELECT *
FROM body_profiles
ORDER BY updated_at DESC
LIMIT 5;
```

### TC-04 风格偏好 `/style-preference`

目的：验证风格偏好保存和读取。

保存调用：

```js
{
  name: 'api',
  data: {
    method: 'PUT',
    path: '/style-preference',
    body: {
      preferred_styles: ['老钱风', '轻奢休闲风'],
      preferred_colors: ['藏蓝', '深石墨黑'],
      fit: '合体',
      preferred_scenes: ['通勤', '会议']
    }
  }
}
```

读取调用：

```js
{
  name: 'api',
  data: { method: 'GET', path: '/style-preference' }
}
```

期望：

- 保存返回 `success=true`
- 读取返回数组字段
- `fit` 为 `合体`

数据库验证：

```sql
SELECT *
FROM style_preferences
ORDER BY updated_at DESC
LIMIT 5;
```

### TC-05 推荐接口 `/recommendations`

目的：验证推荐方案 JOIN 查询。

调用参数：

```js
{
  name: 'api',
  data: { method: 'GET', path: '/recommendations' }
}
```

期望：

- 返回 `success=true`
- `data` 为数组
- 每个推荐包含：
  - `style_code`
  - `match_score`
  - `style_name`
  - `items`
- `items` 中包含：
  - `garment_name`
  - `fabric_name`
  - `color_name`
  - `hex_value`

失败排查：

- `r.updated_at does not exist`：执行 `20260626_align_config_columns.sql`

### TC-06 定制选择 `/custom-selection`

目的：验证定制选择保存、读取和云端价格计算。

保存调用：

```js
{
  name: 'api',
  data: {
    method: 'PUT',
    path: '/custom-selection',
    body: {
      garment_code: 'coat',
      fabric_code: 'cashmere_blend',
      color_code: 'navy',
      fit: '合体',
      detail_codes: ['gold_button', 'half_lining']
    }
  }
}
```

读取调用：

```js
{
  name: 'api',
  data: { method: 'GET', path: '/custom-selection' }
}
```

价格调用：

```js
{
  name: 'api',
  data: {
    method: 'POST',
    path: '/custom-selection/price',
    body: {
      garment_code: 'coat',
      fabric_code: 'cashmere_blend',
      detail_codes: ['gold_button', 'half_lining']
    }
  }
}
```

期望：

- 保存返回 `success=true`
- `calculated_price` 为正数
- 读取返回最新定制选择
- 价格接口返回与保存结果一致的价格

数据库验证：

```sql
SELECT *
FROM custom_selections
ORDER BY updated_at DESC
LIMIT 5;
```

### TC-07 订单 `/orders`

目的：验证订单创建、列表和详情。

创建前置：

- 已通过 TC-01 确认配置数据可读取
- 建议先完成 TC-03 和 TC-04，使订单快照中包含身材档案

创建调用：

```js
{
  name: 'api',
  data: {
    method: 'POST',
    path: '/orders',
    body: {
      garment_code: 'coat',
      fabric_code: 'cashmere_blend',
      color_code: 'navy',
      fit: '合体',
      detail_codes: ['gold_button', 'half_lining'],
      estimated_days: 30
    }
  }
}
```

列表调用：

```js
{
  name: 'api',
  data: { method: 'GET', path: '/orders' }
}
```

详情调用：

```js
{
  name: 'api',
  data: { method: 'GET', path: '/orders/{订单ID}' }
}
```

期望：

- 创建返回 `success=true`
- 返回 `order_no`
- `status` 初始为 `pending`
- 返回 `custom_selection_id`
- 列表能看到新订单
- 详情能按 ID 查询到新订单

数据库验证：

```sql
SELECT id, order_no, user_id, total_price, deposit, status, created_at
FROM orders
ORDER BY created_at DESC
LIMIT 5;
```

### TC-08 预约顾问 `/advisor-bookings`

目的：验证订单后预约。

调用参数：

```js
{
  name: 'api',
  data: {
    method: 'POST',
    path: '/advisor-bookings',
    body: {
      order_id: 1,
      booking_type: 'offline_fitting',
      booking_date: '2026-07-01',
      remark: 'E2E 测试预约'
    }
  }
}
```

注意：`order_id` 应替换为 TC-07 实际创建的订单 ID。

期望：

- 返回 `success=true`
- `status` 初始为 `pending`
- `booking_type` 为 `offline_fitting`

数据库验证：

```sql
SELECT *
FROM advisor_bookings
ORDER BY created_at DESC
LIMIT 5;
```

## 7. 页面流程测试

除直接接口调用外，还要验证真实页面流程：

1. 首页
   - 预期：页面正常加载，无云函数错误 toast
2. 我的页
   - 操作：填写身材档案并保存
   - 预期：保存成功
3. 风格测试页
   - 操作：选择风格、颜色、版型、场景并提交
   - 预期：跳转推荐页或推荐数据刷新
4. 推荐页
   - 预期：展示推荐方案，不为空
5. 定制页
   - 操作：切换衣型、面料、颜色、细节
   - 预期：价格更新，刷新页面后选择仍可读取
6. 订单确认页
   - 操作：创建订单
   - 预期：订单创建成功，并能在数据库查到

## 8. 回归检查

完成测试后执行：

```bash
cd /Users/kycloud/WeChatProjects/77-mvp/cloudfunctions/api
npm test
```

并确认：

- 没有临时代码留在页面 `onLoad`
- 没有真实密码写入 Git 文件
- `cloudbaserc.json` 没有 `envVariables` 中的敏感值
- 云函数日志最近没有新增 500 错误

## 9. 测试报告模板

```markdown
# E2E 测试报告

测试时间：
执行者：
环境：kycloud-cloudbase-d8dy5236df1413
小程序 AppID：wx46ed910b825bbfa8

## 结果汇总

| 用例 | 结果 | 备注 |
|------|------|------|
| TC-01 /config | PASS/FAIL | |
| TC-02 /users/me | PASS/FAIL | |
| TC-03 /body-profile | PASS/FAIL | |
| TC-04 /style-preference | PASS/FAIL | |
| TC-05 /recommendations | PASS/FAIL | |
| TC-06 /custom-selection | PASS/FAIL | |
| TC-07 /orders | PASS/FAIL | |
| TC-08 /advisor-bookings | PASS/FAIL | |
| 页面流程 | PASS/FAIL | |

## 关键日志

微信开发者工具 Console：

云函数日志：

数据库验证：

## 问题列表

1.

## 结论

是否可进入下一阶段：
```
