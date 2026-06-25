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
