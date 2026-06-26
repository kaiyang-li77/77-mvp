const { query } = require('../config/db');
const response = require('../utils/response');

async function handle(event, context, user) {
  const { method } = event;

  if (method !== 'GET') {
    return response.error('Method not allowed', 405);
  }

  const { rows: items } = await query(
    `SELECT
       r.id, r.style_code, r.match_score, r.is_active, r.created_at, r.updated_at,
       s.name as style_name,
       ri.id as item_id, ri.garment_code, ri.fabric_code, ri.color_code, ri.display_order,
       g.name as garment_name, f.name as fabric_name, c.name as color_name, c.hex_value
     FROM recommendations r
     LEFT JOIN styles s ON r.style_code = s.code
     LEFT JOIN recommendation_items ri ON r.id = ri.recommendation_id
     LEFT JOIN garments g ON ri.garment_code = g.code AND g.is_active = true
     LEFT JOIN fabrics f ON ri.fabric_code = f.code AND f.is_active = true
     LEFT JOIN colors c ON ri.color_code = c.code AND c.is_active = true
     WHERE r.is_active = true
     ORDER BY r.match_score DESC, ri.display_order`
  );

  const recMap = new Map();
  for (const row of items) {
    if (!recMap.has(row.id)) {
      recMap.set(row.id, {
        id: row.id,
        style_code: row.style_code,
        match_score: row.match_score,
        is_active: row.is_active,
        created_at: row.created_at,
        updated_at: row.updated_at,
        style_name: row.style_name,
        items: [],
      });
    }
    if (row.item_id) {
      recMap.get(row.id).items.push({
        id: row.item_id,
        garment_code: row.garment_code,
        fabric_code: row.fabric_code,
        color_code: row.color_code,
        display_order: row.display_order,
        garment_name: row.garment_name,
        fabric_name: row.fabric_name,
        color_name: row.color_name,
        hex_value: row.hex_value,
      });
    }
  }

  return response.success(Array.from(recMap.values()));
}

module.exports = { handle };
