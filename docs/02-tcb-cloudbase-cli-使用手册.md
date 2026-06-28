# TCB CloudBase CLI 使用手册

本文记录本项目使用腾讯云 CloudBase CLI（`tcb`）部署云函数的方式，方便后续继续发版和排查问题。

## 1. 当前项目配置

当前 CloudBase 环境：

```text
kycloud-cloudbase-d8dy5236df1413
```

当前云函数：

```text
api
```

当前本机 CLI 版本：

```bash
tcb --version
```

当前验证版本：

```text
CloudBase CLI 3.5.8
```

项目根目录已有配置文件：

```text
cloudbaserc.json
```

关键配置：

```json
{
  "envId": "kycloud-cloudbase-d8dy5236df1413",
  "functionRoot": "cloudfunctions",
  "functions": [
    {
      "name": "api",
      "dir": "cloudfunctions/api",
      "handler": "index.main",
      "runtime": "Nodejs18.15",
      "timeout": 65,
      "memorySize": 256
    }
  ]
}
```

注意：当前 CLI 版本会把 `functions[].dir` 按项目根目录解析，所以这里必须写 `cloudfunctions/api`，不能只写 `api`。

注意：`cloudbaserc.json` 不管理数据库环境变量，避免未来发版时误覆盖云端敏感配置。

## 2. 安装和登录

首次使用需要安装 CLI：

```bash
npm install -g @cloudbase/cli
```

确认安装：

```bash
tcb --version
```

登录腾讯云账号：

```bash
tcb login
```

登录时 CLI 会输出授权链接和用户码。打开链接后按页面提示完成授权即可。

如果 CLI 询问是否收集 usage data，可以选择 `n`。

确认登录后可访问目标环境：

```bash
tcb env list --json
```

期望能看到：

```json
{
  "envId": "kycloud-cloudbase-d8dy5236df1413",
  "status": "NORMAL"
}
```

## 3. 发版流程

### 3.1 修改代码

云函数代码位于：

```text
cloudfunctions/api
```

主要入口：

```text
cloudfunctions/api/index.js
```

入口方法：

```text
index.main
```

### 3.2 本地测试

每次部署前先运行：

```bash
cd /Users/kycloud/WeChatProjects/77-mvp/cloudfunctions/api
npm test
```

当前基线：

```text
Test Suites: 12 passed, 12 total
Tests: 74 passed, 74 total
```

### 3.3 部署云函数

从项目根目录执行：

```bash
cd /Users/kycloud/WeChatProjects/77-mvp
tcb fn deploy api --force
```

成功时会看到类似输出：

```text
[api] Cloud function deployed successfully!
```

这个命令等价于在微信开发者工具里对 `cloudfunctions/api` 执行“创建并部署：云端安装依赖”。

## 4. 部署后验证

查看函数列表：

```bash
tcb fn list -e kycloud-cloudbase-d8dy5236df1413 --json
```

期望看到：

```text
api
runtime: Nodejs18.15
status: Deployment completed
```

查看函数详情：

```bash
tcb fn detail api -e kycloud-cloudbase-d8dy5236df1413 --json
```

重点检查：

- `Handler` 是 `index.main`
- `Runtime` 是 `Nodejs18.15`
- `InstallDependency` 是 `TRUE`
- `Status` 是 `Active`
- `AvailableStatus` 是 `Available`
- `Environment.Variables` 包含数据库连接变量

查看最近日志：

```bash
tcb fn log api -e kycloud-cloudbase-d8dy5236df1413 --limit 20
```

CLI 直接调用示例：

```bash
tcb fn invoke api \
  -e kycloud-cloudbase-d8dy5236df1413 \
  --params '{"method":"GET","path":"/config"}' \
  --json
```

注意：CLI 直接调用普通事件函数时没有小程序运行时的 `OPENID` 上下文。如果返回：

```text
Unauthorized: missing OPENID
```

这只能说明函数已经被触发，不能说明业务接口失败。真实业务验证应从微信开发者工具的小程序端发起 `wx.cloud.callFunction`。

## 5. 小程序端配置

小程序云环境 ID 位于：

```text
miniprogram/app.ts
```

当前配置：

```ts
wx.cloud.init({
  env: 'kycloud-cloudbase-d8dy5236df1413',
  traceUser: true
});
```

如果更换 CloudBase 环境，需要同步修改：

- `miniprogram/app.ts` 中的 `env`
- `cloudbaserc.json` 中的 `envId`
- 部署命令中的 `-e` 参数

## 6. 环境变量

数据库连接相关敏感信息不要提交到仓库，应只在 CloudBase 云端函数环境变量中配置：

```text
PG_HOST=sh-postgres-67q2skv6.sql.tencentcdb.com
PG_PORT=22652
PG_USER=kycloud2
PG_PASSWORD=在云端环境变量中查看或重置
PG_DATABASE=postgres
PG_SSL=false
```

当前云端 `api` 函数已经配置了上述 6 个变量。不要把真实密码、Secret、API Key 写入 Git，也不要在 `cloudbaserc.json` 里配置不完整的 `envVariables`，否则执行 `tcb config update fn api` 时可能覆盖云端变量。

如必须通过 CLI 更新云端函数环境变量，优先使用腾讯云 API 直接更新云端配置，不要把密码落盘到仓库文件。

## 7. 数据库迁移

当前数据库名：

```text
postgres
```

当前项目已有迁移：

```text
db/migrations/20260626_update_users_openid.sql
db/migrations/20260626_align_config_columns.sql
```

执行迁移示例：

```bash
PG_HOST=sh-postgres-67q2skv6.sql.tencentcdb.com \
PG_PORT=22652 \
PG_USER=kycloud2 \
PG_PASSWORD='从安全位置读取' \
PG_DATABASE=postgres \
node scripts/run-sql.js db/migrations/20260626_align_config_columns.sql
```

`20260626_align_config_columns.sql` 用于补齐云函数查询依赖的列：

- `fabrics/details/colors/styles/scenes.display_order`
- `recommendations.updated_at`

## 8. 常见问题

### 8.1 找不到函数目录

错误示例：

```text
Directory for function [api] not found: /Users/kycloud/WeChatProjects/77-mvp/api
```

原因：`functions[].dir` 被 CLI 按项目根目录解析。

正确配置：

```json
"dir": "cloudfunctions/api"
```

### 8.2 CLI 未登录

错误示例：

```text
No valid identity information, please use cloudbase login to login
```

解决：

```bash
tcb login
```

### 8.3 CLI 调用缺少 OPENID

错误示例：

```text
Unauthorized: missing OPENID
```

原因：CLI 直接调用没有微信小程序用户上下文。

解决：用微信开发者工具运行小程序，通过 `wx.cloud.callFunction` 验证。

### 8.4 数据库连接失败

常见原因：

- `PG_HOST`、`PG_PORT`、`PG_USER`、`PG_PASSWORD`、`PG_DATABASE` 缺失或错误
- `PG_SSL` 不是 `false`
- 数据库白名单、防火墙或网络访问限制

先检查云函数环境变量，再看云函数日志：

```bash
tcb fn log api -e kycloud-cloudbase-d8dy5236df1413 --limit 50
```

### 8.5 数据库字段不存在

错误示例：

```text
column "display_order" does not exist
column r.updated_at does not exist
```

原因：数据库表结构和云函数 SQL 预期不一致。

解决：

```bash
node scripts/run-sql.js db/migrations/20260626_align_config_columns.sql
```

执行前需要按上文设置 `PG_HOST/PG_PORT/PG_USER/PG_PASSWORD/PG_DATABASE`。

## 9. 推荐发布检查清单

每次发布前：

- [ ] 确认代码修改只包含本次需要发布的内容
- [ ] 运行 `cloudfunctions/api` 的 `npm test`
- [ ] 确认 `cloudbaserc.json` 的 `envId` 和目标环境一致
- [ ] 确认 `miniprogram/app.ts` 的 `env` 和目标环境一致
- [ ] 确认没有在 `cloudbaserc.json` 里写入真实数据库密码
- [ ] 执行 `tcb fn deploy api --force`

每次发布后：

- [ ] 执行 `tcb fn list -e kycloud-cloudbase-d8dy5236df1413 --json`
- [ ] 执行 `tcb fn detail api -e kycloud-cloudbase-d8dy5236df1413 --json`
- [ ] 检查云端环境变量包含 `PG_HOST/PG_PORT/PG_USER/PG_PASSWORD/PG_DATABASE/PG_SSL`
- [ ] 用微信开发者工具从小程序端调用接口验证
- [ ] 如失败，执行 `tcb fn log api -e kycloud-cloudbase-d8dy5236df1413 --limit 50`
