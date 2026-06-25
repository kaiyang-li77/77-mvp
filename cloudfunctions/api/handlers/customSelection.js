const { query } = require('../config/db');
const response = require('../utils/response');
const { calculatePrice } = require('../utils/price');
const configHandler = require('./config');

async function handle(event, context, user) {
  const { method, body = {} } = event;

  if (method === 'GET') {
    const { rows } = await query(
      'SELECT * FROM custom_selections WHERE user_id = $1 ORDER BY id DESC LIMIT 1',
      [user.id]
    );
    return response.success(rows[0] || null);
  }

  if (method === 'PUT') {
    const { garment_code, fabric_code, color_code, fit, detail_codes } = body;

    const configRes = await configHandler.handle(event, context, user);
    const config = configRes.data;
    const calculatedPrice = calculatePrice(garment_code, fabric_code, detail_codes, config);

    const { rows: existing } = await query(
      'SELECT id FROM custom_selections WHERE user_id = $1',
      [user.id]
    );

    if (existing.length > 0) {
      const { rows } = await query(
        `UPDATE custom_selections
         SET garment_code = $1, fabric_code = $2, color_code = $3, fit = $4, detail_codes = $5, calculated_price = $6, updated_at = now()
         WHERE id = $7 RETURNING *`,
        [garment_code, fabric_code, color_code, fit, detail_codes || [], calculatedPrice, existing[0].id]
      );
      return response.success(rows[0]);
    }

    const { rows } = await query(
      `INSERT INTO custom_selections (user_id, garment_code, fabric_code, color_code, fit, detail_codes, calculated_price)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [user.id, garment_code, fabric_code, color_code, fit, detail_codes || [], calculatedPrice]
    );
    return response.success(rows[0]);
  }

  if (method === 'POST' && event.path === '/custom-selection/price') {
    const { garment_code, fabric_code, detail_codes } = body;
    const configRes = await configHandler.handle(event, context, user);
    const config = configRes.data;
    const price = calculatePrice(garment_code, fabric_code, detail_codes, config);
    return response.success({ price });
  }

  return response.error('Method not allowed', 405);
}

module.exports = { handle };
