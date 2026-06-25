const cloud = require('wx-server-sdk');
const { query } = require('../config/db');

async function getUser(context) {
  const { OPENID } = cloud.getWXContext({ env: context.env });
  if (!OPENID) {
    throw new Error('Unauthorized: missing OPENID');
  }

  let result = await query('SELECT id, openid, phone, status, created_at, updated_at FROM users WHERE openid = $1', [OPENID]);
  if (result.rows.length === 0) {
    result = await query(
      'INSERT INTO users (openid, status) VALUES ($1, $2) RETURNING id, openid, phone, status, created_at, updated_at',
      [OPENID, 'active']
    );
  }
  return result.rows[0];
}

module.exports = { getUser };
