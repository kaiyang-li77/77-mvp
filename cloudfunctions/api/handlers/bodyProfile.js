const { query } = require('../config/db');
const response = require('../utils/response');

const FIELDS = ['height', 'weight', 'shoulder', 'chest', 'waist', 'hip', 'sleeve', 'pants_length', 'body_type'];

async function handle(event, context, user) {
  const { method, body = {} } = event;

  if (method === 'GET') {
    const { rows } = await query(
      'SELECT * FROM body_profiles WHERE user_id = $1 AND is_default = true ORDER BY id DESC LIMIT 1',
      [user.id]
    );
    return response.success(rows[0] || null);
  }

  if (method === 'PUT') {
    const values = FIELDS.map(f => body[f]);

    const { rows: existing } = await query(
      'SELECT id FROM body_profiles WHERE user_id = $1 AND is_default = true',
      [user.id]
    );

    if (existing.length > 0) {
      const { rows } = await query(
        `UPDATE body_profiles SET ${FIELDS.map((f, i) => `${f} = $${i + 1}`).join(', ')}, updated_at = now()
         WHERE id = $${FIELDS.length + 1} RETURNING *`,
        [...values, existing[0].id]
      );
      return response.success(rows[0]);
    }

    const { rows } = await query(
      `INSERT INTO body_profiles (user_id, is_default, ${FIELDS.join(', ')})
       VALUES ($1, true, ${FIELDS.map((_, i) => `$${i + 2}`).join(', ')})
       RETURNING *`,
      [user.id, ...values]
    );
    return response.success(rows[0]);
  }

  return response.error('Method not allowed', 405);
}

module.exports = { handle };
