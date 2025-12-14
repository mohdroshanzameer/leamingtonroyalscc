const express = require("express");
const { pool } = require("../db/pool");
const { authenticateToken } = require("../middleware/auth");
const { quoteIdent, resolveTable, resolveOrderBy } = require("../utils/sqlSafe");

const router = express.Router();

router.get("/:entityName", authenticateToken, async (req, res) => {
  try {
    const entity = req.params.entityName;
    const table = resolveTable(entity);
    if (!table) return res.status(400).json({ error: `Unknown entity: ${entity}` });

    const limit = Math.min(parseInt(req.query.limit || "100", 10), 1000);
    const offset = Math.max(parseInt(req.query.offset || "0", 10), 0);
    const order = resolveOrderBy(table, req.query.sort);

    const orderSql = order
      ? `ORDER BY ${quoteIdent(order.col)} ${order.desc ? "DESC" : "ASC"}`
      : "";

    const sql = `SELECT * FROM ${quoteIdent(table)} ${orderSql} LIMIT $1 OFFSET $2`;
    const rows = (await pool.query(sql, [limit, offset])).rows;
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

router.post("/:entityName/filter", authenticateToken, async (req, res) => {
  try {
    const entity = req.params.entityName;
    const table = resolveTable(entity);
    if (!table) return res.status(400).json({ error: `Unknown entity: ${entity}` });

    const opts = req.body?.options || {};
    const limit = Math.min(parseInt(opts.limit || "100", 10), 1000);
    const offset = Math.max(parseInt(opts.offset || "0", 10), 0);
    const order = resolveOrderBy(table, opts.sort);

    const orderSql = order
      ? `ORDER BY ${quoteIdent(order.col)} ${order.desc ? "DESC" : "ASC"}`
      : "";

    const sql = `SELECT * FROM ${quoteIdent(table)} ${orderSql} LIMIT $1 OFFSET $2`;
    const rows = (await pool.query(sql, [limit, offset])).rows;
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;