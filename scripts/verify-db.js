const { Client } = require('pg');

const requiredEnv = ['PG_HOST', 'PG_PORT', 'PG_USER', 'PG_PASSWORD', 'PG_DATABASE'];
for (const key of requiredEnv) {
  if (!process.env[key]) {
    console.error(`Error: environment variable ${key} is required`);
    process.exit(1);
  }
}

const client = new Client({
  host: process.env.PG_HOST,
  port: parseInt(process.env.PG_PORT, 10),
  user: process.env.PG_USER,
  password: process.env.PG_PASSWORD,
  database: process.env.PG_DATABASE
});

const sql = `
  SELECT 'garments' as t, count(*) as c FROM garments
  UNION ALL SELECT 'fabrics', count(*) FROM fabrics
  UNION ALL SELECT 'details', count(*) FROM details
  UNION ALL SELECT 'colors', count(*) FROM colors
  UNION ALL SELECT 'styles', count(*) FROM styles
  UNION ALL SELECT 'scenes', count(*) FROM scenes
  UNION ALL SELECT 'recommendations', count(*) FROM recommendations
  UNION ALL SELECT 'recommendation_items', count(*) FROM recommendation_items
  UNION ALL SELECT 'users', count(*) FROM users
  UNION ALL SELECT 'body_profiles', count(*) FROM body_profiles
  UNION ALL SELECT 'style_preferences', count(*) FROM style_preferences
  UNION ALL SELECT 'custom_selections', count(*) FROM custom_selections
  UNION ALL SELECT 'orders', count(*) FROM orders
  UNION ALL SELECT 'advisor_bookings', count(*) FROM advisor_bookings
`;

client.connect()
  .then(() => client.query(sql))
  .then(res => { console.table(res.rows); return client.end(); })
  .catch(err => { console.error(err.message); process.exit(1); });
