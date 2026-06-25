const { query } = require('../config/db');
const response = require('../utils/response');

async function handle(event, context, user) {
  const { method, body = {} } = event;

  if (method === 'POST') {
    const { order_id, booking_date, remark, booking_type } = body;
    const allowedTypes = ['offline_fitting', 'online_consultation', 'showroom_visit'];
    const resolvedType = allowedTypes.includes(booking_type) ? booking_type : 'offline_fitting';

    const { rows } = await query(
      `INSERT INTO advisor_bookings (user_id, order_id, booking_type, status, booking_date, remark)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [user.id, order_id || null, resolvedType, 'pending', booking_date || null, remark || '']
    );
    return response.success(rows[0]);
  }

  return response.error('Method not allowed', 405);
}

module.exports = { handle };
