/**
 * Backend Server with Socket.IO + React SPA Support
 * Industry-best-practice fixes:
 *  - Safe entityName -> table resolution (SponsorPayment -> sponsor_payments, TeamPlayer -> team_players, etc.)
 *  - Safe sorting + limit/offset (validated against information_schema)
 *  - Adds missing /api/entities/:entityName/filter endpoint
 *  - Prevents SQL injection by never interpolating untrusted identifiers
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
const JWT_SECRET =
  process.env.JWT_SECRET || "your-secret-key-change-in-production";

// Database connection
const pool = new Pool({
  host: process.env.DB_HOST || "localhost",
  port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 5432,
  database: process.env.DB_NAME || "cricket_club",
  user: process.env.DB_USER || "postgres",
  password: process.env.DB_PASSWORD || "password",
});

// ----------------------------
// DB metadata cache (best practice)
// ----------------------------
let DB_TABLES = new Set(); // e.g. sponsor_payments, team_players
let DB_COLUMNS = new Map(); // table -> Set(columns)

function pascalToSnake(str = "") {
  return String(str)
    .replace(/([a-z0-9])([A-Z])/g, "$1_$2")
    .replace(/[-\s]+/g, "_")
    .toLowerCase();
}

function pluralizeSnake(snake = "") {
  if (snake.endsWith("y")) return snake.slice(0, -1) + "ies";
  if (snake.endsWith("s")) return snake + "es";
  return snake + "s";
}

// Identifiers cannot be parameterized; we validate against DB metadata, then quote.
function quoteIdent(name) {
  return `"${String(name).replace(/"/g, '""')}"`;
}

async function loadDbMetadata() {
  // Tables
  const tRes = await pool.query(`
    SELECT tablename
    FROM pg_tables
    WHERE schemaname = 'public'
  `);
  DB_TABLES = new Set(tRes.rows.map((r) => r.tablename));

  // Columns
  const cRes = await pool.query(`
    SELECT table_name, column_name
    FROM information_schema.columns
    WHERE table_schema = 'public'
  `);

  DB_COLUMNS = new Map();
  for (const row of cRes.rows) {
    if (!DB_COLUMNS.has(row.table_name)) {
      DB_COLUMNS.set(row.table_name, new Set());
    }
    DB_COLUMNS.get(row.table_name).add(row.column_name);
  }

  console.log(`✅ Loaded DB metadata: ${DB_TABLES.size} public tables`);
}

function resolveTable(entityName) {
  // Your schema uses snake_case plural tables like sponsor_payments, team_players, tournaments, etc. :contentReference[oaicite:3]{index=3} :contentReference[oaicite:4]{index=4} :contentReference[oaicite:5]{index=5}
  const snake = pascalToSnake(entityName);      // SponsorPayment -> sponsor_payment
  const snakePlural = pluralizeSnake(snake);    // sponsor_payment -> sponsor_payments

  // Prefer plural (matches schema.sql style)
  if (DB_TABLES.has(snakePlural)) return snakePlural;
  if (DB_TABLES.has(snake)) return snake;

  // If frontend ever sends the raw table name
  const rawLower = String(entityName || "").toLowerCase();
  if (DB_TABLES.has(rawLower)) return rawLower;

  return null;
}

function resolveOrderBy(tableName, sortParam) {
  if (!sortParam) return null;

  const cols = DB_COLUMNS.get(tableName);
  if (!cols) return null;

  const s = String(sortParam);
  const desc = s.startsWith("-");
  const col = desc ? s.slice(1) : s;

  if (!cols.has(col)) return null;

  return { col, desc };
}

// ----------------------------
// Test DB connection + load metadata
// ----------------------------
pool
  .query("SELECT NOW()")
  .then((res) => {
    console.log("✅ Database connected:", res.rows[0].now);
    return loadDbMetadata();
  })
  .catch((err) => {
    console.error("❌ Database connection/metadata failed:", err.message);
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

    if (!email || !password) {
      return res
        .status(400)
        .json({ error: "Email and password are required" });
    }

    const existingUser = await pool.query(
      "SELECT * FROM users WHERE email = $1",
      [email]
    );
    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: "User already exists" });
    }

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

    if (!email || !password) {
      return res
        .status(400)
        .json({ error: "Email and password are required" });
    }

    const result = await pool.query("SELECT * FROM users WHERE email = $1", [
      email,
    ]);

    if (result.rows.length === 0) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const user = result.rows[0];
    const validPassword = await bcrypt.compare(password, user.password);

    if (!validPassword) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    const { password: _pw, ...userWithoutPassword } = user;
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

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Get user error:", error);
    res.status(500).json({ error: error.message });
  }
});

/* ===========================
   GENERIC ENTITY CRUD (SAFE)
=========================== */

/**
 * GET /api/entities/:entityName
 * Supports:
 *   - ?limit=500
 *   - ?offset=0
 *   - ?sort=player_name OR ?sort=-player_name
 */
app.get("/api/entities/:entityName", authenticateToken, async (req, res) => {
  try {
    const entityName = req.params.entityName;
    const tableName = resolveTable(entityName);

    if (!tableName) {
      return res
        .status(400)
        .json({ error: `Unknown entity/table: ${entityName}` });
    }

    const limit = Math.min(parseInt(req.query.limit || "100", 10) || 100, 1000);
    const offset = Math.max(parseInt(req.query.offset || "0", 10) || 0, 0);

    const order = resolveOrderBy(tableName, req.query.sort);
    let orderSql = "";

    if (order) {
      orderSql = `ORDER BY ${quoteIdent(order.col)} ${
        order.desc ? "DESC" : "ASC"
      }`;
    } else if (DB_COLUMNS.get(tableName)?.has("created_date")) {
      // Many tables in schema include created_date; use it when available. :contentReference[oaicite:6]{index=6} :contentReference[oaicite:7]{index=7}
      orderSql = `ORDER BY ${quoteIdent("created_date")} DESC`;
    }

    const sql = `
      SELECT *
      FROM ${quoteIdent(tableName)}
      ${orderSql}
      LIMIT $1 OFFSET $2
    `;

    const result = await pool.query(sql, [limit, offset]);
    res.json(result.rows);
  } catch (error) {
    console.error(`Error fetching ${req.params.entityName}:`, error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/entities/:entityName/filter
 * Your frontend calls this endpoint (e.g. /entities/TeamPlayer/filter).
 * Currently implements: limit/offset/sort.
 * (Add where-clauses later only with whitelisted columns + parameterized values.)
 */
app.post(
  "/api/entities/:entityName/filter",
  authenticateToken,
  async (req, res) => {
    try {
      const entityName = req.params.entityName;
      const tableName = resolveTable(entityName);

      if (!tableName) {
        return res
          .status(400)
          .json({ error: `Unknown entity/table: ${entityName}` });
      }

      const options = req.body?.options || {};
      const limit = Math.min(parseInt(options.limit || "100", 10) || 100, 1000);
      const offset = Math.max(parseInt(options.offset || "0", 10) || 0, 0);

      const order = resolveOrderBy(tableName, options.sort);
      let orderSql = "";

      if (order) {
        orderSql = `ORDER BY ${quoteIdent(order.col)} ${
          order.desc ? "DESC" : "ASC"
        }`;
      } else if (DB_COLUMNS.get(tableName)?.has("created_date")) {
        orderSql = `ORDER BY ${quoteIdent("created_date")} DESC`;
      }

      const sql = `
        SELECT *
        FROM ${quoteIdent(tableName)}
        ${orderSql}
        LIMIT $1 OFFSET $2
      `;

      const result = await pool.query(sql, [limit, offset]);
      res.json(result.rows);
    } catch (error) {
      console.error(`Error filtering ${req.params.entityName}:`, error);
      res.status(500).json({ error: error.message });
    }
  }
);

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
