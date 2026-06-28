const { Client } = require('pg');

const ACTIONS = Object.fromEntries([
  ['health', 'Verify connection and table counts'],
  ['user-profile', 'Find a user with profile, preference, and latest selection'],
  ['user-orders', 'List orders for a user'],
  ['order-detail', 'Show one order with user, selection, and bookings'],
  ['recent-orders', 'List recent orders'],
  ['order-status-summary', 'Aggregate order statuses'],
  ['incomplete-user-profiles', 'Find active users missing profile data'],
  ['config-summary', 'Summarize active catalog configuration'],
  ['update-order-status', 'Dry-run or execute a bounded order status update'],
  ['update-booking-status', 'Dry-run or execute a bounded booking status update'],
  ['list-actions', 'List available actions']
]);
const ORDER_STATUSES = ['pending', 'confirmed', 'paid', 'in_progress', 'completed', 'cancelled'];
const BOOKING_STATUSES = ['pending', 'confirmed', 'completed', 'cancelled'];
const TABLES = ['users', 'body_profiles', 'style_preferences', 'garments', 'fabrics', 'details',
  'colors', 'styles', 'scenes', 'recommendations', 'recommendation_items', 'custom_selections',
  'orders', 'advisor_bookings'];

function parseArgs(argv) {
  const args = { _: [] };
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (!token.startsWith('--')) {
      args._.push(token);
      continue;
    }
    const key = token.slice(2);
    if (['execute', 'json', 'reveal-private', 'mask-private'].includes(key)) {
      args[key] = true;
    } else { args[key] = argv[i + 1]; i += 1; }
  }
  return args;
}

function requireEnv() {
  const required = ['PG_HOST', 'PG_PORT', 'PG_USER', 'PG_PASSWORD', 'PG_DATABASE'];
  const missing = required.filter((key) => !process.env[key]);
  if (missing.length) throw new Error(`Missing env: ${missing.join(', ')}`);
}

function createClient() {
  requireEnv();
  const env = process.env;
  return new Client({
    host: env.PG_HOST,
    port: parseInt(env.PG_PORT, 10),
    user: env.PG_USER,
    password: env.PG_PASSWORD,
    database: env.PG_DATABASE,
    ssl: env.PG_SSL === 'true' ? { rejectUnauthorized: false } : false
  });
}

function mask(value, type) {
  if (!value) return value;
  const text = String(value);
  if (type === 'phone') return text.replace(/^(\d{3})\d{4}(\d{4})$/, '$1****$2');
  if (type === 'openid') return text.length <= 10 ? '***' : `${text.slice(0, 6)}...${text.slice(-4)}`;
  return '[redacted]';
}

function sanitize(value, maskPrivate = false) {
  if (value === null || value === undefined) return value;
  if (Array.isArray(value)) return value.map((item) => sanitize(item, maskPrivate));
  if (value instanceof Date) return value.toISOString();
  if (typeof value !== 'object') return value;
  const out = {};
  for (const [key, val] of Object.entries(value)) {
    if (maskPrivate && key === 'phone') out[key] = mask(val, 'phone');
    else if (maskPrivate && key === 'openid') out[key] = mask(val, 'openid');
    else if (maskPrivate && key === 'avatar_url') out[key] = mask(val, 'avatar');
    else out[key] = sanitize(val, maskPrivate);
  }
  return out;
}

function moneyYuan(cents) {
  if (cents === null || cents === undefined) return null;
  return (Number(cents) / 100).toFixed(2);
}

function customerSummary(row) {
  const parts = [];
  if (row.user_id !== null && row.user_id !== undefined) parts.push(`用户#${row.user_id}`);
  if (row.nickname) parts.push(`昵称 ${row.nickname}`);
  if (row.phone) parts.push(`手机号 ${row.phone}`);
  if (row.openid) parts.push(`openid ${row.openid}`);
  return parts.length ? parts.join(' / ') : '未关联用户';
}

function formatOrderRow(row) {
  const customer = customerSummary(row);
  const totalYuan = moneyYuan(row.total_price);
  const depositYuan = moneyYuan(row.deposit);
  const amountParts = [];
  if (totalYuan !== null) amountParts.push(`总价 ¥${totalYuan}`);
  if (depositYuan !== null) amountParts.push(`定金 ¥${depositYuan}`);
  const amountText = amountParts.length ? `，${amountParts.join('，')}` : '';
  return {
    ...row,
    total_price_yuan: totalYuan,
    deposit_yuan: depositYuan,
    created_at: sanitize(row.created_at, false),
    customer_summary: customer,
    order_summary: `${customer} 下单 ${row.order_no}，状态 ${row.status}${amountText}`
  };
}

function print(data, args) {
  const body = sanitize(data, args['mask-private'] && !args['reveal-private']);
  if (args.json) console.log(JSON.stringify(body, null, 2));
  else console.dir(body, { depth: null, colors: true });
}

function intArg(args, key, fallback, max) {
  const raw = args[key];
  if (raw === undefined) return fallback;
  const n = Number.parseInt(raw, 10);
  if (!Number.isFinite(n) || n < 1) throw new Error(`--${key} must be a positive integer`);
  return Math.min(n, max);
}

function userFilter(args) {
  if (args['user-id']) return { where: 'u.id = $1', values: [parseId(args['user-id'], 'user-id')] };
  if (args.openid) return { where: 'u.openid = $1', values: [args.openid] };
  if (args.phone) return { where: 'u.phone = $1', values: [args.phone] };
  throw new Error('Provide one of --user-id, --openid, or --phone');
}

function parseId(value, name) {
  const id = Number.parseInt(value, 10);
  if (!Number.isSafeInteger(id) || id < 1) throw new Error(`--${name} must be a positive integer`);
  return id;
}

async function findUser(client, args) {
  const filter = userFilter(args);
  const { rows } = await client.query(`SELECT u.* FROM users u WHERE ${filter.where}`, filter.values);
  if (!rows[0]) throw new Error('User not found');
  return rows[0];
}

async function health(client) {
  const parts = TABLES.map((name, i) => `SELECT '${name}' AS table_name, count(*)::int AS row_count FROM ${name}`);
  const { rows } = await client.query(parts.join(' UNION ALL '));
  return { connected: true, tables: rows };
}

async function userProfile(client, args) {
  const filter = userFilter(args);
  const { rows } = await client.query(`
    SELECT u.*,
      row_to_json(bp) AS default_body_profile,
      row_to_json(sp) AS style_preference,
      row_to_json(cs) AS latest_custom_selection
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
    WHERE ${filter.where}
  `, filter.values);
  return rows[0] || null;
}

async function userOrders(client, args) {
  const user = await findUser(client, args);
  const limit = intArg(args, 'limit', 20, 100);
  const { rows } = await client.query(`
    SELECT id, order_no, user_id, total_price, deposit, status, estimated_days, remark, created_at, updated_at
    FROM orders WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2
  `, [user.id, limit]);
  return { user, orders: rows };
}

async function orderDetail(client, args) {
  const filters = [];
  const values = [];
  if (args['order-id']) {
    values.push(parseId(args['order-id'], 'order-id'));
    filters.push(`o.id = $${values.length}`);
  }
  if (args['order-no']) {
    values.push(args['order-no']);
    filters.push(`o.order_no = $${values.length}`);
  }
  if (!filters.length) throw new Error('Provide --order-id or --order-no');
  const { rows } = await client.query(`
    SELECT o.*, row_to_json(u) AS user, row_to_json(cs) AS custom_selection
    FROM orders o
    LEFT JOIN users u ON u.id = o.user_id
    LEFT JOIN custom_selections cs ON cs.id = o.custom_selection_id
    WHERE ${filters.join(' AND ')}
  `, values);
  const order = rows[0];
  if (!order) return null;
  const bookings = await client.query(
    'SELECT * FROM advisor_bookings WHERE order_id = $1 ORDER BY created_at DESC',
    [order.id]
  );
  return { order, advisor_bookings: bookings.rows };
}

async function recentOrders(client, args) {
  const limit = intArg(args, 'limit', 20, 100);
  const values = [];
  let statusClause = '';
  if (args.status) {
    if (!ORDER_STATUSES.includes(args.status)) throw new Error(`Invalid order status: ${args.status}`);
    values.push(args.status);
    statusClause = `WHERE o.status = $${values.length}`;
  }
  values.push(limit);
  const limitParam = `$${values.length}`;
  const { rows } = await client.query(`
    SELECT o.id, o.order_no, o.status, o.total_price, o.deposit, o.created_at,
           u.id AS user_id, u.nickname, u.phone, u.openid
    FROM orders o
    LEFT JOIN users u ON u.id = o.user_id
    ${statusClause}
    ORDER BY o.created_at DESC
    LIMIT ${limitParam}
  `, values);
  return rows.map(formatOrderRow);
}

async function orderStatusSummary(client, args) {
  const days = intArg(args, 'days', 30, 3660);
  const { rows } = await client.query(`
    SELECT status, count(*)::int AS count, coalesce(sum(total_price), 0)::int AS total_price
    FROM orders
    WHERE created_at >= now() - ($1::int * interval '1 day')
    GROUP BY status ORDER BY status
  `, [days]);
  return { days, statuses: rows };
}

async function incompleteUserProfiles(client, args) {
  const limit = intArg(args, 'limit', 50, 200);
  const { rows } = await client.query(`
    SELECT u.id, u.openid, u.phone, u.nickname, u.status,
      bp.id IS NULL AS missing_body_profile,
      sp.id IS NULL AS missing_style_preference,
      cs.id IS NULL AS missing_custom_selection
    FROM users u
    LEFT JOIN LATERAL (SELECT id FROM body_profiles WHERE user_id = u.id AND is_default = true LIMIT 1) bp ON true
    LEFT JOIN LATERAL (SELECT id FROM style_preferences WHERE user_id = u.id LIMIT 1) sp ON true
    LEFT JOIN LATERAL (SELECT id FROM custom_selections WHERE user_id = u.id LIMIT 1) cs ON true
    WHERE u.status = 'active' AND (bp.id IS NULL OR sp.id IS NULL OR cs.id IS NULL)
    ORDER BY u.created_at DESC LIMIT $1
  `, [limit]);
  return rows;
}

async function configSummary(client) {
  const tables = ['garments', 'fabrics', 'details', 'colors', 'styles', 'scenes'];
  const result = {};
  for (const table of tables) {
    const { rows } = await client.query(
      `SELECT code, name, display_order, is_active FROM ${table} ORDER BY display_order, id`
    );
    result[table] = { total: rows.length, active: rows.filter((r) => r.is_active).length, rows };
  }
  return result;
}

async function boundedStatusUpdate(client, args, config) {
  const keyValue = config.parseKey(args);
  if (!config.statuses.includes(args.status)) throw new Error(`Invalid ${config.label} status: ${args.status}`);
  const before = await client.query(config.selectSql, [keyValue]);
  if (!before.rows[0]) return { execute: Boolean(args.execute), target_count: 0, rows: [] };
  if (!args.execute) return { execute: false, target_count: 1, proposed_status: args.status, rows: before.rows };
  const after = await client.query(config.updateSql, [args.status, keyValue]);
  return { execute: true, updated_count: after.rowCount, rows: after.rows };
}

const updateOrderStatus = (client, args) => boundedStatusUpdate(client, args, {
  label: 'order',
  statuses: ORDER_STATUSES,
  parseKey: (a) => {
    if (!a['order-no']) throw new Error('Provide --order-no');
    return a['order-no'];
  },
  selectSql: 'SELECT id, order_no, status FROM orders WHERE order_no = $1',
  updateSql: `UPDATE orders SET status = $1, updated_at = now()
    WHERE order_no = $2 RETURNING id, order_no, status, updated_at`
});

const updateBookingStatus = (client, args) => boundedStatusUpdate(client, args, {
  label: 'booking',
  statuses: BOOKING_STATUSES,
  parseKey: (a) => {
    if (!a['booking-id']) throw new Error('Provide --booking-id');
    return parseId(a['booking-id'], 'booking-id');
  },
  selectSql: 'SELECT id, order_id, user_id, status FROM advisor_bookings WHERE id = $1',
  updateSql: `UPDATE advisor_bookings SET status = $1, updated_at = now()
    WHERE id = $2 RETURNING id, order_id, user_id, status, updated_at`
});

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const action = args._[0] || 'list-actions';
  if (action === 'list-actions' || args.help) return print(ACTIONS, args);
  if (!ACTIONS[action]) throw new Error(`Unknown action: ${action}`);

  const client = createClient();
  await client.connect();
  try {
    const handlers = {
      health, 'user-profile': userProfile, 'user-orders': userOrders,
      'order-detail': orderDetail, 'recent-orders': recentOrders,
      'order-status-summary': orderStatusSummary,
      'incomplete-user-profiles': incompleteUserProfiles,
      'config-summary': configSummary,
      'update-order-status': updateOrderStatus,
      'update-booking-status': updateBookingStatus
    };
    print(await handlers[action](client, args), args);
  } finally {
    await client.end();
  }
}

if (require.main === module) {
  main().catch((err) => { console.error(`Error: ${err.message}`); process.exit(1); });
}

module.exports = {
  sanitize,
  recentOrders,
  formatOrderRow,
  customerSummary,
  moneyYuan
};
