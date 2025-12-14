/**
 * Backend Server with Socket.IO + React SPA Support
 */

const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");
require("dotenv").config();

const app = express();
const server = http.createServer(app);

// Socket.IO setup
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true,
  },
});

const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-in-production";

// Database connection
const pool = new Pool({
  host: process.env.DB_HOST || "localhost",
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || "cricket_club",
  user: process.env.DB_USER || "postgres",
  password: process.env.DB_PASSWORD || "password",
});

// Test DB connection
pool.query("SELECT NOW()", (err, res) => {
  if (err) {
    console.error("❌ Database connection failed:", err.message);
  } else {
    console.log("✅ Database connected:", res.rows[0].now);
  }
});

// Middleware
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
  })
);
app.use(express.json());

// Auth middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) return res.status(401).json({ error: "Access token required" });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: "Invalid token" });
    req.user = user;
    next();
  });
};

// Socket.IO
io.on("connection", (socket) => {
  console.log("Client connected:", socket.id);

  socket.on("join_room", (room) => {
    socket.join(room);
    console.log(`Socket ${socket.id} joined room: ${room}`);
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);
  });
});

app.set("io", io);

/* ===========================
   AUTH ROUTES
=========================== */

app.post("/api/auth/register", async (req, res) => {
  try {
    const { email, password, full_name } = req.body;

    if (!email || !password)
      return res.status(400).json({ error: "Email and password are required" });

    const existingUser = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
    if (existingUser.rows.length > 0)
      return res.status(400).json({ error: "User already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await pool.query(
      "INSERT INTO users (email, password, full_name, role) VALUES ($1, $2, $3, $4) RETURNING id, email, full_name, role, created_date",
      [email, hashedPassword, full_name || "", "user"]
    );

    const user = result.rows[0];
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({ access_token: token, user });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password)
      return res.status(400).json({ error: "Email and password are required" });

    const result = await pool.query("SELECT * FROM users WHERE email = $1", [email]);

    if (result.rows.length === 0)
      return res.status(401).json({ error: "Invalid credentials" });

    const user = result.rows[0];
    const validPassword = await bcrypt.compare(password, user.password);

    if (!validPassword)
      return res.status(401).json({ error: "Invalid credentials" });

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    const { password: _, ...userWithoutPassword } = user;
    res.json({ access_token: token, user: userWithoutPassword });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/auth/me", authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      // Expose both `role` and `club_role` for frontend compatibility
      "SELECT id, email, full_name, role, role AS club_role, created_date, updated_date FROM users WHERE id = $1",
      [req.user.id]
    );

    if (result.rows.length === 0)
      return res.status(404).json({ error: "User not found" });

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Get user error:", error);
    res.status(500).json({ error: error.message });
  }
});

/* ===========================
   GENERIC ENTITY CRUD
=========================== */

app.get("/api/entities/:entityName", authenticateToken, async (req, res) => {
  try {
    const tableName = req.params.entityName.toLowerCase();
    const result = await pool.query(`SELECT * FROM ${tableName} ORDER BY created_date DESC`);
    res.json(result.rows);
  } catch (error) {
    console.error(`Error fetching ${req.params.entityName}:`, error);
    res.status(500).json({ error: error.message });
  }
});

/* ... your CRUD routes remain unchanged ... */

/* ===========================
   HEALTH CHECK
=========================== */

app.get("/api/health", async (req, res) => {
  try {
    await pool.query("SELECT 1");
    res.json({
      status: "ok",
      message: "Backend and database connected",
      socketio: "enabled",
    });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
});

/* ===========================
   SERVE FRONTEND (IMPORTANT!)
=========================== */

// Serve static frontend build
app.use(express.static(path.join(__dirname, "dist"))); // or "build"

// SPA fallback for React Router
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "dist", "index.html"));
});

/* ===========================
   START SERVER
=========================== */

server.listen(PORT, () => {
  console.log(`
🚀 Server running on http://localhost:${PORT}
🔌 Socket.IO enabled
📊 API Health: http://localhost:${PORT}/api/health
  `);
});
