const express = require("express");
const { pool } = require("../db/pool");
const router = express.Router();

router.get("/", async (req, res) => {
  try {
    await pool.query("SELECT 1");
    res.json({ status: "ok", message: "Backend and DB connected" });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
});

module.exports = router;