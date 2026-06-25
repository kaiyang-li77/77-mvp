const { query } = require('../config/db');
const response = require('../utils/response');

async function handle(event, context, user) {
  const tables = ['garments', 'fabrics', 'details', 'colors', 'styles', 'scenes'];
  const result = {};
  for (const table of tables) {
    const { rows } = await query(`SELECT * FROM ${table} WHERE is_active = true ORDER BY display_order, id`);
    result[table] = rows;
  }
  return response.success(result);
}

module.exports = { handle };
