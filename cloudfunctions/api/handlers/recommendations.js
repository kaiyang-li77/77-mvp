const { query } = require('../config/db');
const response = require('../utils/response');

async function handle(event, context, user) {
  const { rows: recommendations } = await query(
    `SELECT r.*, s.name as style_name
     FROM recommendations r
     LEFT JOIN styles s ON r.style_code = s.code
     WHERE r.is_active = true
     ORDER BY r.match_score DESC`
  );

  for (const rec of recommendations) {
    const { rows: items } = await query(
      `SELECT ri.*, g.name as garment_name, f.name as fabric_name, c.name as color_name, c.hex_value
       FROM recommendation_items ri
       LEFT JOIN garments g ON ri.garment_code = g.code
       LEFT JOIN fabrics f ON ri.fabric_code = f.code
       LEFT JOIN colors c ON ri.color_code = c.code
       WHERE ri.recommendation_id = $1
       ORDER BY ri.display_order`,
      [rec.id]
    );
    rec.items = items;
  }

  return response.success(recommendations);
}

module.exports = { handle };
