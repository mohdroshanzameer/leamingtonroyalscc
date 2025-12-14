const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { pool } = require("../db/pool");
const { authenticateToken } = require("../middleware/auth");

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || "change-this-secret";

router.post("/register", async (req, res) => {
  try {
    const { email, password, full_name } = req.body;
    if (!email || !password)
      return res.status(400).json({ error: "Email and password are required" });

    if (password.length < 8)
      return res.status(400).json({ error: "Password must be at least 8 characters." });

    const existing = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
    if (existing.rows.length > 0)
      return res.status(400).json({ error: "User already exists" });

    const hash = await bcrypt.hash(password, 10);
    const result = await pool.query(
      "INSERT INTO users (email, password, full_name, role) VALUES ($1,$2,$3,$4) RETURNING id,email,full_name,role,created_date",
      [email, hash, full_name || "", "user"]
    );

    const user = result.rows[0];
    const token = jwt.sign({ id: user.id, email, role: user.role }, JWT_SECRET, { expiresIn: "7d" });
    res.json({ access_token: token, user });
  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({ error: err.message });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ error: "Email and password are required" });

    const result = await pool.query("SELECT * FROM users WHERE email=$1", [email]);
    if (result.rows.length === 0)
      return res.status(401).json({ error: "Invalid credentials" });

    const user = result.rows[0];
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ error: "Invalid credentials" });

    const token = jwt.sign({ id: user.id, email, role: user.role }, JWT_SECRET, { expiresIn: "7d" });
    delete user.password;
    res.json({ access_token: token, user });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: err.message });
  }
});

router.get("/me", authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT id, email, full_name, role, role AS club_role, created_date, updated_date FROM users WHERE id=$1",
      [req.user.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: "User not found" });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;