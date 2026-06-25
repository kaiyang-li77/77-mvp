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
