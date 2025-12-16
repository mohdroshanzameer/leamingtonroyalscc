// backend/routes/entities.js

const express = require("express");
const { pool, DB_COLUMNS } = require("../db/pool");
const { authenticateToken } = require("../middleware/auth");
const { quoteIdent, resolveTable, resolveOrderBy } = require("../utils/sqlSafe");

const router = express.Router();

const BLOCKED_FIELDS = new Set(["created_date", "updated_date"]); // keep id blocked for inserts

// Cache PK column lookup
const PK_CACHE = new Map();

async function getPrimaryKeyColumn(table) {
  if (PK_CACHE.has(table)) return PK_CACHE.get(table);

  const sql = `
    SELECT a.attname AS pk
    FROM pg_index i
    JOIN pg_attribute a ON a.attrelid = i.indrelid AND a.attnum = ANY(i.indkey)
    JOIN pg_class c ON c.oid = i.indrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE i.indisprimary = true
      AND n.nspname = 'public'
      AND c.relname = $1
    LIMIT 1
  `;
  const r = await pool.query(sql, [table]);
  let pk = r.rows[0]?.pk || null;

  // fallback if table has id column
  const cols = DB_COLUMNS.get(table);
  if (!pk && cols?.has("id")) pk = "id";

  PK_CACHE.set(table, pk);
  return pk;
}

function getPayload(req) {
  return req.body?.data && typeof req.body.data === "object" ? req.body.data : req.body;
}

function validatePayloadObject(payload) {
  return payload && typeof payload === "object" && !Array.isArray(payload);
}

/**
 * GET /api/entities/:entityName?sort&limit&offset
 */
router.get("/:entityName", authenticateToken, async (req, res) => {
  try {
    const entity = req.params.entityName;
    const table = resolveTable(entity);
    if (!table) return res.status(400).json({ error: `Unknown entity: ${entity}` });

    const limit = Math.min(parseInt(req.query.limit || "100", 10) || 100, 1000);
    const offset = Math.max(parseInt(req.query.offset || "0", 10) || 0, 0);

    const order = resolveOrderBy(table, req.query.sort);
    const orderSql = order
      ? `ORDER BY ${quoteIdent(order.col)} ${order.desc ? "DESC" : "ASC"}`
      : "";

    const sql = `SELECT * FROM ${quoteIdent(table)} ${orderSql} LIMIT $1 OFFSET $2`;
    const rows = (await pool.query(sql, [limit, offset])).rows;

    res.json(rows);
  } catch (err) {
    console.error("Entities LIST error:", err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/entities/:entityName/:id
 */
router.get("/:entityName/:id", authenticateToken, async (req, res) => {
  try {
    const entity = req.params.entityName;
    const table = resolveTable(entity);
    if (!table) return res.status(400).json({ error: `Unknown entity: ${entity}` });

    const pk = await getPrimaryKeyColumn(table);
    if (!pk) return res.status(400).json({ error: `No primary key found for table: ${table}` });

    const sql = `SELECT * FROM ${quoteIdent(table)} WHERE ${quoteIdent(pk)} = $1 LIMIT 1`;
    const r = await pool.query(sql, [req.params.id]);

    if (r.rows.length === 0) return res.status(404).json({ error: "Not found" });
    res.json(r.rows[0]);
  } catch (err) {
    console.error("Entities GET ONE error:", err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/entities/:entityName/filter
 * Body: { options: { sort, limit, offset } }
 */
router.post("/:entityName/filter", authenticateToken, async (req, res) => {
  try {
    const entity = req.params.entityName;
    const table = resolveTable(entity);
    if (!table) return res.status(400).json({ error: `Unknown entity: ${entity}` });

    const opts = req.body?.options || {};
    const limit = Math.min(parseInt(opts.limit || "100", 10) || 100, 1000);
    const offset = Math.max(parseInt(opts.offset || "0", 10) || 0, 0);

    const order = resolveOrderBy(table, opts.sort);
    const orderSql = order
      ? `ORDER BY ${quoteIdent(order.col)} ${order.desc ? "DESC" : "ASC"}`
      : "";

    const sql = `SELECT * FROM ${quoteIdent(table)} ${orderSql} LIMIT $1 OFFSET $2`;
    const rows = (await pool.query(sql, [limit, offset])).rows;

    res.json(rows);
  } catch (err) {
    console.error("Entities FILTER error:", err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/entities/:entityName
 * Create row safely.
 */
router.post("/:entityName", authenticateToken, async (req, res) => {
  try {
    const entity = req.params.entityName;
    const table = resolveTable(entity);
    if (!table) return res.status(400).json({ error: `Unknown entity: ${entity}` });

    const payload = getPayload(req);
    if (!validatePayloadObject(payload)) {
      return res.status(400).json({ error: "Invalid request body. Expected an object." });
    }

    const tableCols = DB_COLUMNS.get(table);
    if (!tableCols) {
      return res.status(500).json({ error: `Column metadata not loaded for table: ${table}` });
    }

    const blocked = new Set(["id", ...BLOCKED_FIELDS]);
    const insertKeys = Object.keys(payload).filter((k) => tableCols.has(k) && !blocked.has(k));

    if (insertKeys.length === 0) {
      return res.status(400).json({
        error: `No valid insertable fields for ${entity}.`,
        hint: `Allowed columns: ${[...tableCols].join(", ")}`,
      });
    }

    const values = insertKeys.map((k) => payload[k]);
    const colsSql = insertKeys.map((c) => quoteIdent(c)).join(", ");
    const paramsSql = insertKeys.map((_, i) => `$${i + 1}`).join(", ");

    const sql = `
      INSERT INTO ${quoteIdent(table)} (${colsSql})
      VALUES (${paramsSql})
      RETURNING *
    `;

    const result = await pool.query(sql, values);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("Entities CREATE error:", err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * PUT /api/entities/:entityName/:id
 * Update row safely.
 */
router.put("/:entityName/:id", authenticateToken, async (req, res) => {
  try {
    const entity = req.params.entityName;
    const table = resolveTable(entity);
    
    console.log('=== UPDATE REQUEST ===');
    console.log('Entity:', entity);
    console.log('Data:', JSON.stringify(table, null, 2));
    
    if (!table) return res.status(400).json({ error: `Unknown entity: ${entity}` });

    const pk = await getPrimaryKeyColumn(table);
    if (!pk) return res.status(400).json({ error: `No primary key found for table: ${table}` });

    const payload = getPayload(req);
    if (!validatePayloadObject(payload)) {
      return res.status(400).json({ error: "Invalid request body. Expected an object." });
    }

    const tableCols = DB_COLUMNS.get(table);
    if (!tableCols) {
      return res.status(500).json({ error: `Column metadata not loaded for table: ${table}` });
    }

    // Disallow updating PK and audit fields
    const blocked = new Set([pk, ...BLOCKED_FIELDS]);
    const updateKeys = Object.keys(payload).filter((k) => tableCols.has(k) && !blocked.has(k));

    if (updateKeys.length === 0) {
      return res.status(400).json({
        error: `No valid updatable fields for ${entity}.`,
        hint: `Allowed columns: ${[...tableCols].join(", ")}`,
      });
    }

    const setSql = updateKeys.map((k, i) => `${quoteIdent(k)} = $${i + 1}`).join(", ");
    const values = updateKeys.map((k) => payload[k]);

    const sql = `
      UPDATE ${quoteIdent(table)}
      SET ${setSql}
      WHERE ${quoteIdent(pk)} = $${updateKeys.length + 1}
      RETURNING *
    `;
    
    console.log('SQL Query:', sql);
    console.log('Values:', values);
    
    const result = await pool.query(sql, [...values, req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: "Not found" });

    console.log('Result:', JSON.stringify(result.rows[0], null, 2));
    
    res.json(result.rows[0]);
  } catch (err) {
    console.error("Entities UPDATE error:", err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * DELETE /api/entities/:entityName/:id
 */
router.delete("/:entityName/:id", authenticateToken, async (req, res) => {
  try {
    const entity = req.params.entityName;
    const table = resolveTable(entity);
    if (!table) return res.status(400).json({ error: `Unknown entity: ${entity}` });

    const pk = await getPrimaryKeyColumn(table);
    if (!pk) return res.status(400).json({ error: `No primary key found for table: ${table}` });

    const sql = `
      DELETE FROM ${quoteIdent(table)}
      WHERE ${quoteIdent(pk)} = $1
      RETURNING *
    `;

    const result = await pool.query(sql, [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: "Not found" });

    res.json({ deleted: true, row: result.rows[0] });
  } catch (err) {
    console.error("Entities DELETE error:", err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
