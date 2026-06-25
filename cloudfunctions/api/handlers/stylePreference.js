const { query } = require('../config/db');
const response = require('../utils/response');

async function handle(event, context, user) {
  const { method, body = {} } = event;

  if (method === 'GET') {
    const { rows } = await query(
      'SELECT * FROM style_preferences WHERE user_id = $1 ORDER BY id DESC LIMIT 1',
      [user.id]
    );
    return response.success(rows[0] || null);
  }

  if (method === 'PUT') {
    const { preferred_styles, preferred_colors, fit, preferred_scenes } = body;
    const { rows: existing } = await query(
      'SELECT id FROM style_preferences WHERE user_id = $1',
      [user.id]
    );

    if (existing.length > 0) {
      const { rows } = await query(
        `UPDATE style_preferences
         SET preferred_styles = $1, preferred_colors = $2, fit = $3, preferred_scenes = $4, updated_at = now()
         WHERE id = $5 RETURNING *`,
        [JSON.stringify(preferred_styles || []), JSON.stringify(preferred_colors || []), fit, JSON.stringify(preferred_scenes || []), existing[0].id]
      );
      return response.success(rows[0]);
    }

    const { rows } = await query(
      `INSERT INTO style_preferences (user_id, preferred_styles, preferred_colors, fit, preferred_scenes)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [user.id, JSON.stringify(preferred_styles || []), JSON.stringify(preferred_colors || []), fit, JSON.stringify(preferred_scenes || [])]
    );
    return response.success(rows[0]);
  }

  return response.error('Method not allowed', 405);
}

module.exports = { handle };
