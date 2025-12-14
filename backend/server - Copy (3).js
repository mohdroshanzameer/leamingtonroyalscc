/**
 * Backend Server with Socket.IO
 * Enhanced with real-time capabilities
 */

const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const http = require('http');
const { Server } = require('socket.io');
require('dotenv').config();

const app = express();
const server = http.createServer(app);

// Socket.IO setup with CORS
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true
  }
});

const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Database connection
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'cricket_club',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'password',
});

// Test database connection
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('❌ Database connection failed:', err.message);
  } else {
    console.log('✅ Database connected:', res.rows[0].now);
  }
});

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:3000",
  credentials: true
}));
app.use(express.json());

// Auth middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid token' });
    req.user = user;
    next();
  });
};

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.on('join_room', (room) => {
    socket.join(room);
    console.log(`Socket ${socket.id} joined room: ${room}`);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Make io available to routes
app.set('io', io);

// ========== AUTH ROUTES ==========

app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, full_name } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const existingUser = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await pool.query(
      'INSERT INTO users (email, password, full_name, role) VALUES ($1, $2, $3, $4) RETURNING id, email, full_name, role, created_date',
      [email, hashedPassword, full_name || '', 'user']
    );

    const user = result.rows[0];
    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '7d' });

    res.json({ access_token: token, user });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = result.rows[0];
    const validPassword = await bcrypt.compare(password, user.password);

    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '7d' });

    const { password: _, ...userWithoutPassword } = user;
    res.json({ access_token: token, user: userWithoutPassword });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/auth/me', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, email, full_name, role, created_date, updated_date FROM users WHERE id = $1',
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/auth/me', authenticateToken, async (req, res) => {
  try {
    const { full_name, ...otherFields } = req.body;

    const result = await pool.query(
      'UPDATE users SET full_name = $1, updated_date = NOW() WHERE id = $2 RETURNING id, email, full_name, role, created_date, updated_date',
      [full_name, req.user.id]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ========== GENERIC ENTITY CRUD ==========

// Entity name to table name mapping
const ENTITY_TABLE_MAP = {
  'Team': 'teams',
  'TeamPlayer': 'team_players',
  'Season': 'seasons',
  'Competition': 'competitions',
  'MatchProfile': 'match_profiles',
  'Tournament': 'tournaments',
  'TournamentTeam': 'tournament_teams',
  'TournamentMatch': 'tournament_matches',
  'TournamentPlayer': 'tournament_players',
  'Membership': 'memberships',
  'PlayerCharge': 'player_charges',
  'PlayerPayment': 'player_payments',
  'PaymentAllocation': 'payment_allocations',
  'FinanceCategory': 'finance_categories',
  'Transaction': 'transactions',
  'Sponsor': 'sponsors',
  'SponsorPayment': 'sponsor_payments',
  'Invoice': 'invoices',
  'News': 'news',
  'Event': 'events',
  'EventRSVP': 'event_rsvp',
  'GalleryImage': 'gallery_images',
  'ContactMessage': 'contact_messages',
  'Notification': 'notifications',
  'UserNotification': 'user_notifications',
  'ClubStats': 'club_stats',
  'CustomStreamOverlay': 'custom_stream_overlays',
  'PaymentSettings': 'payment_settings',
  'SystemLog': 'system_logs',
  'UserActivityLog': 'user_activity_logs',
  'PaymentAuditLog': 'payment_audit_logs',
  'MatchState': 'match_state',
  'InningsScore': 'innings_score',
  'BallByBall': 'ball_by_ball',
  'MatchAvailability': 'match_availability',
  'AuthLog': 'auth_audit_log',
  'User': 'users'
};

// Helper function to convert entity name to table name
function getTableName(entityName) {
  return ENTITY_TABLE_MAP[entityName] || entityName.toLowerCase();
}

app.get('/api/entities/:entityName', authenticateToken, async (req, res) => {
  try {
    const { entityName } = req.params;
    const tableName = getTableName(entityName);
    
    const result = await pool.query(`SELECT * FROM ${tableName} ORDER BY created_date DESC`);
    res.json(result.rows);
  } catch (error) {
    console.error(`Error fetching ${req.params.entityName}:`, error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/entities/:entityName/filter', authenticateToken, async (req, res) => {
  try {
    const { entityName } = req.params;
    const tableName = getTableName(entityName);
    const { query = {}, sort = '-created_date', limit = 50 } = req.body;

    // Build WHERE clause from query object
    const conditions = [];
    const values = [];
    let paramIndex = 1;

    Object.entries(query).forEach(([key, value]) => {
      conditions.push(`${key} = $${paramIndex}`);
      values.push(value);
      paramIndex++;
    });

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    
    // Parse sort (e.g., '-created_date' becomes 'created_date DESC')
    let orderBy = 'created_date DESC';
    if (sort) {
      const isDesc = sort.startsWith('-');
      const sortField = isDesc ? sort.substring(1) : sort;
      orderBy = `${sortField} ${isDesc ? 'DESC' : 'ASC'}`;
    }

    const sqlQuery = `SELECT * FROM ${tableName} ${whereClause} ORDER BY ${orderBy} LIMIT $${paramIndex}`;
    values.push(limit);

    const result = await pool.query(sqlQuery, values);
    res.json(result.rows);
  } catch (error) {
    console.error(`Error filtering ${req.params.entityName}:`, error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/entities/:entityName', authenticateToken, async (req, res) => {
  try {
    const { entityName } = req.params;
    const tableName = getTableName(entityName);
    const data = req.body;

    const columns = Object.keys(data);
    const values = Object.values(data);
    const placeholders = values.map((_, i) => `$${i + 1}`).join(', ');

    const query = `
      INSERT INTO ${tableName} (${columns.join(', ')}, created_by)
      VALUES (${placeholders}, $${values.length + 1})
      RETURNING *
    `;

    const result = await pool.query(query, [...values, req.user.email]);
    
    // Emit real-time update
    io.emit(`${entityName}_created`, result.rows[0]);
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error(`Error creating ${req.params.entityName}:`, error);
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/entities/:entityName/:id', authenticateToken, async (req, res) => {
  try {
    const { entityName, id } = req.params;
    const tableName = getTableName(entityName);
    const data = req.body;

    const columns = Object.keys(data);
    const values = Object.values(data);
    const setClause = columns.map((col, i) => `${col} = $${i + 1}`).join(', ');

    const query = `
      UPDATE ${tableName}
      SET ${setClause}, updated_date = NOW()
      WHERE id = $${values.length + 1}
      RETURNING *
    `;

    const result = await pool.query(query, [...values, id]);
    
    // Emit real-time update
    io.emit(`${entityName}_updated`, result.rows[0]);
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error(`Error updating ${req.params.entityName}:`, error);
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/entities/:entityName/:id', authenticateToken, async (req, res) => {
  try {
    const { entityName, id } = req.params;
    const tableName = getTableName(entityName);

    await pool.query(`DELETE FROM ${tableName} WHERE id = $1`, [id]);
    
    // Emit real-time update
    io.emit(`${entityName}_deleted`, { id });
    
    res.json({ success: true });
  } catch (error) {
    console.error(`Error deleting ${req.params.entityName}:`, error);
    res.status(500).json({ error: error.message });
  }
});

// Get single entity by ID
app.get('/api/entities/:entityName/:id', authenticateToken, async (req, res) => {
  try {
    const { entityName, id } = req.params;
    const tableName = getTableName(entityName);
    
    const result = await pool.query(`SELECT * FROM ${tableName} WHERE id = $1`, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Record not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error(`Error fetching ${req.params.entityName}:`, error);
    res.status(500).json({ error: error.message });
  }
});

// Bulk create entities
app.post('/api/entities/:entityName/bulk', authenticateToken, async (req, res) => {
  try {
    const { entityName } = req.params;
    const tableName = getTableName(entityName);
    const items = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Request body must be a non-empty array' });
    }

    const results = [];
    
    // Process each item
    for (const data of items) {
      const columns = Object.keys(data);
      const values = Object.values(data);
      const placeholders = values.map((_, i) => `$${i + 1}`).join(', ');

      const query = `
        INSERT INTO ${tableName} (${columns.join(', ')}, created_by)
        VALUES (${placeholders}, $${values.length + 1})
        RETURNING *
      `;

      const result = await pool.query(query, [...values, req.user.email]);
      results.push(result.rows[0]);
    }
    
    // Emit real-time update
    io.emit(`${entityName}_bulk_created`, results);
    
    res.json(results);
  } catch (error) {
    console.error(`Error bulk creating ${req.params.entityName}:`, error);
    res.status(500).json({ error: error.message });
  }
});

// Get entity schema
app.get('/api/entities/:entityName/schema', authenticateToken, async (req, res) => {
  try {
    const { entityName } = req.params;
    const tableName = getTableName(entityName);
    
    // Query the table structure from PostgreSQL
    const result = await pool.query(`
      SELECT 
        column_name, 
        data_type, 
        is_nullable,
        column_default
      FROM information_schema.columns 
      WHERE table_name = $1
      AND column_name NOT IN ('id', 'created_date', 'updated_date', 'created_by')
      ORDER BY ordinal_position
    `, [tableName]);
    
    // Convert to JSON schema format
    const schema = {
      type: 'object',
      properties: {},
      required: []
    };
    
    result.rows.forEach(col => {
      const property = {
        type: col.data_type.includes('char') || col.data_type.includes('text') ? 'string' : 
              col.data_type.includes('int') || col.data_type.includes('numeric') ? 'number' :
              col.data_type.includes('bool') ? 'boolean' : 'string'
      };
      
      schema.properties[col.column_name] = property;
      
      if (col.is_nullable === 'NO' && !col.column_default) {
        schema.required.push(col.column_name);
      }
    });
    
    res.json(schema);
  } catch (error) {
    console.error(`Error fetching schema for ${req.params.entityName}:`, error);
    res.status(500).json({ error: error.message });
  }
});

// Health check
app.get('/api/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ 
      status: 'ok', 
      message: 'Backend and database connected',
      socketio: 'enabled'
    });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

// Start server
server.listen(PORT, () => {
  console.log(`
🚀 Server running on http://localhost:${PORT}
🔌 Socket.IO enabled
📊 API Health: http://localhost:${PORT}/api/health
  `);
});