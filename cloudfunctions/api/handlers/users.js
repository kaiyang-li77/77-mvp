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
    if (!/^1[3-9]\d{9}$/.test(phone)) {
      return response.error('手机号格式不正确', 400);
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
