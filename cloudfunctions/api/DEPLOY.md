# Cloud Function Deployment Guide

## Overview

This document describes how to deploy the `api` cloud function to WeChat Cloud Development.

**Important:** Actual deployment requires the WeChat Developer Tools GUI. Command-line deployment is not supported.

---

## Prerequisites

- WeChat Developer Tools installed and logged in
- A WeChat Mini Program project with Cloud Development enabled
- The `cloudfunctions/api` directory present in the project

---

## Step 1: Set Environment Variables in Cloud Console

1. Open **WeChat Developer Tools**
2. Click the **Cloud Development** button in the toolbar
3. In the Cloud Development console, go to **Environment Variables** (环境变量)
4. Add the following variables:

| Variable | Value | Notes |
|----------|-------|-------|
| `PG_HOST` | `your-db-host.sql.tencentcdb.com` | PostgreSQL host |
| `PG_PORT` | `22652` | PostgreSQL port |
| `PG_USER` | `your_db_user` | Database username |
| `PG_PASSWORD` | `your_db_password` | Database password |
| `PG_DATABASE` | `your_database` | Database name |
| `PG_SSL` | `false` | **Must be `false` for this host** — the remote PostgreSQL instance does not support SSL |

> **Security:** Do not commit real credentials to git. Use the WeChat Cloud Development console to set these values securely.

**Critical:** Set `PG_SSL=false`. The database host does not support SSL connections. Setting this to `true` will cause connection failures.

---

## Step 2: Deploy the Cloud Function

1. In **WeChat Developer Tools**, open the **Project** panel (left sidebar)
2. Expand the `cloudfunctions` folder
3. Right-click on the `api` folder
4. Select **Create and Deploy: Install Dependencies on Cloud** (创建并部署：云端安装依赖)
5. Wait for the deployment to complete

**Expected result:** Console shows "部署成功" (deployment successful).

---

## Step 3: Verify the Deployment

### Method A: Cloud Function Testing in Developer Tools

1. In WeChat Developer Tools, right-click `cloudfunctions/api`
2. Select **Test Cloud Function** (测试云函数)
3. Use the following test parameters:

```json
{
  "method": "GET",
  "path": "/config"
}
```

**Expected response:**

```json
{
  "success": true,
  "data": {
    "garments": [...],
    "fabrics": [...],
    "details": [...],
    "colors": [...],
    "styles": [...],
    "scenes": [...]
  }
}
```

### Method B: Call from Mini Program

Add this snippet to any page in the mini program (e.g., in `onLoad`):

```js
wx.cloud.callFunction({
  name: 'api',
  data: { method: 'GET', path: '/config' }
}).then(res => {
  console.log('Cloud function response:', res.result);
  if (res.result && res.result.success) {
    console.log('Deployment verified: config loaded successfully');
  } else {
    console.error('Deployment issue:', res.result);
  }
}).catch(err => {
  console.error('Cloud function call failed:', err);
});
```

**Expected:** Console logs the config data with `success: true`.

### Method C: Test Other Endpoints

Test additional endpoints to verify full functionality:

```js
// Test user endpoint
wx.cloud.callFunction({
  name: 'api',
  data: { method: 'GET', path: '/users/me' }
});

// Test body profile
wx.cloud.callFunction({
  name: 'api',
  data: { method: 'GET', path: '/body-profile' }
});
```

---

## Troubleshooting

| Issue | Cause | Solution |
|-------|-------|----------|
| `ECONNREFUSED` or connection timeout | Wrong host/port or firewall | Verify `PG_HOST` and `PG_PORT` values |
| `password authentication failed` | Wrong credentials | Verify `PG_USER` and `PG_PASSWORD` |
| `database "xxx" does not exist` | Wrong database name | Verify `PG_DATABASE` |
| SSL connection error | `PG_SSL` is `true` | Set `PG_SSL=false` — this host does not support SSL |
| `404 Not found` | Wrong path in request | Check the `path` value matches a registered handler |

---

## Environment Variables Reference

For local development, create a `.env` file (see `.env.example`).

In production (WeChat Cloud Development), environment variables are managed through the cloud console as described in Step 1.

---

## Files Included in Deployment

The `api` cloud function includes:

- `index.js` — Entry point and request router
- `package.json` — Dependencies (`pg`, `wx-server-sdk`)
- `config/db.js` — PostgreSQL connection pool
- `handlers/` — Route handlers for all API endpoints
- `middleware/auth.js` — Authentication middleware
- `utils/response.js` — Response formatting utilities
- `utils/price.js` — Price calculation utility

---

## Post-Deployment Checklist

- [ ] Environment variables set in Cloud Development console
- [ ] `PG_SSL` is set to `false`
- [ ] Cloud function deployed successfully
- [ ] `/config` endpoint returns data
- [ ] `/users/me` endpoint returns user data
- [ ] No connection errors in logs
