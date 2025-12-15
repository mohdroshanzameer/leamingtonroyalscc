const { Pool } = require("pg");

const pool = new Pool({
  host: process.env.DB_HOST || "localhost",
  port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 5432,
  database: process.env.DB_NAME || "cricket_club",
  user: process.env.DB_USER || "postgres",
  password: process.env.DB_PASSWORD || "password",
});

// Keep same object references forever
const DB_TABLES = new Set();
const DB_COLUMNS = new Map();

async function loadDbMetadata() {
  const tRes = await pool.query(`
    SELECT tablename
    FROM pg_tables
    WHERE schemaname = 'public'
  `);

  DB_TABLES.clear();
  for (const r of tRes.rows) DB_TABLES.add(r.tablename);

  const cRes = await pool.query(`
    SELECT table_name, column_name
    FROM information_schema.columns
    WHERE table_schema = 'public'
  `);

  DB_COLUMNS.clear();
  for (const row of cRes.rows) {
    if (!DB_COLUMNS.has(row.table_name)) DB_COLUMNS.set(row.table_name, new Set());
    DB_COLUMNS.get(row.table_name).add(row.column_name);
  }

  console.log(`✅ Loaded DB metadata: ${DB_TABLES.size} public tables`);
}

async function initDb() {
  await pool.query("SELECT NOW()");
  await loadDbMetadata();
}

module.exports = { pool, DB_TABLES, DB_COLUMNS, loadDbMetadata, initDb };
