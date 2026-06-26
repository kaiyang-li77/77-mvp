const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

const requiredEnv = ['PG_HOST', 'PG_PORT', 'PG_USER', 'PG_PASSWORD', 'PG_DATABASE'];
for (const key of requiredEnv) {
  if (!process.env[key]) {
    console.error(`Error: environment variable ${key} is required`);
    process.exit(1);
  }
}

const host = process.env.PG_HOST;
const port = parseInt(process.env.PG_PORT, 10);
const user = process.env.PG_USER;
const password = process.env.PG_PASSWORD;
const database = process.env.PG_DATABASE;
const sqlFile = process.argv[2] || path.join(__dirname, '..', 'db', 'init.sql');

async function main() {
  const sql = fs.readFileSync(sqlFile, 'utf8');
  const client = new Client({ host, port, user, password, database });

  try {
    await client.connect();
    console.log(`Connected to ${host}:${port}/${database}`);
    await client.query(sql);
    console.log(`Executed ${sqlFile} successfully`);

    const res = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);
    console.log('\nTables in public schema:');
    res.rows.forEach(row => console.log(' - ' + row.table_name));
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

main();
