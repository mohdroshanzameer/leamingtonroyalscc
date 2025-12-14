/**
 * Complete Production Backend Server
 * Replicates Base44 Backend-as-a-Service functionality
 * 
 * Features:
 * - JWT Authentication with bcrypt
 * - PostgreSQL database with proper connection pooling
 * - Generic CRUD for all entities
 * - Socket.IO for real-time updates
 * - File upload (public & private)
 * - Error handling & logging
 * - CORS configuration
 * - Health checks
 */

const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const http = require('http');
const { Server } = require('socket.io');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

// ============================================================================
// CONFIGURATION
// ============================================================================

const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

// ============================================================================
// EXPRESS & HTTP SERVER SETUP
// ============================================================================

const app = express();
const server = http.createServer(app);

// ============================================================================
// SOCKET.IO SETUP
// ============================================================================

const io = new Server(server, {
  cors: {
    origin: FRONTEND_URL,
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Make io available to routes
app.set('io', io);

// ============================================================================
// DATABASE CONNECTION POOL
// ============================================================================

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'cricket_club',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Test database connection
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('❌ Database connection failed:', err.message);
    console.error('Please check your database credentials in .env file');
  } else {
    console.log('✅ Database connected successfully');
  }
});

// Handle pool errors
pool.on('error', (err) => {
  console.error('Unexpected database error:', err);
});

// ============================================================================
// MIDDLEWARE
// ============================================================================

app.use(cors({
  origin: FRONTEND_URL,
  credentials: true
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// ============================================================================
// FILE UPLOAD CONFIGURATION
// ============================================================================

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${Math.random().toString(36).substring(7)}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx|xls|xlsx/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('Invalid file type'));
  }
});

// ============================================================================
// AUTH MIDDLEWARE
// ============================================================================

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

// ============================================================================
// ENTITY TABLE MAPPING
// ============================================================================

const ENTITY_TABLE_MAP = {
  // Plural tables
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
  // Singular tables
  'MatchState': 'match_state',
  'InningsScore': 'innings_score',
  'BallByBall': 'ball_by_ball',
  'MatchAvailability': 'match_availability',
  'AuthLog': 'auth_audit_log',
  'User': 'users'
};

function getTableName(entityName) {
  return ENTITY_TABLE_MAP[entityName] || entityName.toLowerCase() + 's';
}

// ============================================================================
// SOCKET.IO EVENT HANDLERS
// ============================================================================

io.on('connection', (socket) => {
  console.log(`✅ Client connected: ${socket.id}`);

  socket.on('join_room', (room) => {
    socket.join(room);
    console.log(`Socket ${socket.id} joined room: ${room}`);
  });

  socket.on('leave_room', (room) => {
    socket.leave(room);
    console.log(`Socket ${socket.id} left room: ${room}`);
  });

  socket.on('disconnect', () => {
    console.log(`❌ Client disconnected: ${socket.id}`);
  });
});

// ============================================================================
// ERROR HANDLER UTILITY
// ============================================================================

function handleError(res, error, message = 'An error occurred') {
  console.error(`Error: ${message}`, error);
  res.status(500).json({ 
    error: message,
    details: process.env.NODE_ENV === 'development' ? error.message : undefined
  });
}

// ============================================================================
// AUTHENTICATION ROUTES
// ============================================================================

// Register new user
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, full_name } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    // Check if user exists
    const existingUser = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email.toLowerCase()]
    );

    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: 'User already exists with this email' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const result = await pool.query(
      `INSERT INTO users (email, password, full_name, role) 
       VALUES ($1, $2, $3, $4) 
       RETURNING id, email, full_name, role, created_date`,
      [email.toLowerCase(), hashedPassword, full_name || '', 'user']
    );

    const user = result.rows[0];

    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    res.json({
      access_token: token,
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        role: user.role,
        created_date: user.created_date
      }
    });
  } catch (error) {
    handleError(res, error, 'Registration failed');
  }
});

// Login user
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Find user
    const result = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email.toLowerCase()]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const user = result.rows[0];

    // Verify password
    const validPassword = await bcrypt.compare(password, user.password);

    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Update last login
    await pool.query(
      'UPDATE users SET last_login = NOW() WHERE id = $1',
      [user.id]
    );

    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    // Remove password from response
    delete user.password;

    res.json({
      access_token: token,
      user
    });
  } catch (error) {
    handleError(res, error, 'Login failed');
  }
});

// Get current user
app.get('/api/auth/me', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, email, full_name, role, phone, photo_url, 
              created_date, updated_date, last_login
       FROM users WHERE id = $1`,
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    handleError(res, error, 'Failed to get user');
  }
});

// Update current user
app.put('/api/auth/me', authenticateToken, async (req, res) => {
  try {
    const { full_name, phone, photo_url } = req.body;

    const result = await pool.query(
      `UPDATE users 
       SET full_name = COALESCE($1, full_name),
           phone = COALESCE($2, phone),
           photo_url = COALESCE($3, photo_url),
           updated_date = NOW()
       WHERE id = $4
       RETURNING id, email, full_name, role, phone, photo_url, created_date, updated_date`,
      [full_name, phone, photo_url, req.user.id]
    );

    res.json(result.rows[0]);
  } catch (error) {
    handleError(res, error, 'Failed to update user');
  }
});

// Check auth
app.get('/api/auth/check', authenticateToken, (req, res) => {
  res.json({ authenticated: true });
});

// Logout (client-side token removal)
app.post('/api/auth/logout', (req, res) => {
  res.json({ success: true });
});

// ============================================================================
// GENERIC ENTITY CRUD ROUTES
// ============================================================================

// List all records
app.get('/api/entities/:entityName', authenticateToken, async (req, res) => {
  try {
    const { entityName } = req.params;
    const { sort, limit } = req.query;
    
    const tableName = getTableName(entityName);
    
    let query = `SELECT * FROM ${tableName}`;
    const params = [];
    
    // Add sorting
    if (sort) {
      const isDesc = sort.startsWith('-');
      const sortField = isDesc ? sort.substring(1) : sort;
      query += ` ORDER BY ${sortField} ${isDesc ? 'DESC' : 'ASC'}`;
    } else {
      query += ` ORDER BY created_date DESC`;
    }
    
    // Add limit
    if (limit) {
      params.push(parseInt(limit));
      query += ` LIMIT $${params.length}`;
    }
    
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    handleError(res, error, `Failed to list ${req.params.entityName}`);
  }
});

// Filter records
app.post('/api/entities/:entityName/filter', authenticateToken, async (req, res) => {
  try {
    const { entityName } = req.params;
    const { query = {}, sort = '-created_date', limit = 50 } = req.body;
    
    const tableName = getTableName(entityName);
    
    // Build WHERE clause
    const conditions = [];
    const values = [];
    let paramIndex = 1;
    
    Object.entries(query).forEach(([key, value]) => {
      conditions.push(`${key} = $${paramIndex}`);
      values.push(value);
      paramIndex++;
    });
    
    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    
    // Parse sort
    const isDesc = sort.startsWith('-');
    const sortField = isDesc ? sort.substring(1) : sort;
    const orderBy = `ORDER BY ${sortField} ${isDesc ? 'DESC' : 'ASC'}`;
    
    // Add limit
    values.push(parseInt(limit));
    const limitClause = `LIMIT $${paramIndex}`;
    
    const sqlQuery = `SELECT * FROM ${tableName} ${whereClause} ${orderBy} ${limitClause}`;
    
    const result = await pool.query(sqlQuery, values);
    res.json(result.rows);
  } catch (error) {
    handleError(res, error, `Failed to filter ${req.params.entityName}`);
  }
});

// Get single record by ID
app.get('/api/entities/:entityName/:id', authenticateToken, async (req, res) => {
  try {
    const { entityName, id } = req.params;
    const tableName = getTableName(entityName);
    
    const result = await pool.query(
      `SELECT * FROM ${tableName} WHERE id = $1`,
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Record not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    handleError(res, error, `Failed to get ${req.params.entityName}`);
  }
});

// Create new record
app.post('/api/entities/:entityName', authenticateToken, async (req, res) => {
  try {
    const { entityName } = req.params;
    const data = req.body;
    
    const tableName = getTableName(entityName);
    
    const columns = Object.keys(data);
    const values = Object.values(data);
    const placeholders = values.map((_, i) => `$${i + 1}`).join(', ');
    
    // Add created_by
    columns.push('created_by');
    values.push(req.user.email);
    placeholders.slice(0, -2); // Remove last placeholder
    
    const query = `
      INSERT INTO ${tableName} (${columns.join(', ')})
      VALUES (${placeholders}, $${values.length})
      RETURNING *
    `;
    
    const result = await pool.query(query, values);
    
    // Emit real-time update
    io.emit(`${entityName}_created`, result.rows[0]);
    
    res.json(result.rows[0]);
  } catch (error) {
    handleError(res, error, `Failed to create ${req.params.entityName}`);
  }
});

// Bulk create records
app.post('/api/entities/:entityName/bulk', authenticateToken, async (req, res) => {
  try {
    const { entityName } = req.params;
    const items = req.body;
    
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Request body must be a non-empty array' });
    }
    
    const tableName = getTableName(entityName);
    const results = [];
    
    // Use transaction for bulk insert
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      for (const data of items) {
        const columns = Object.keys(data);
        const values = Object.values(data);
        const placeholders = values.map((_, i) => `$${i + 1}`).join(', ');
        
        columns.push('created_by');
        values.push(req.user.email);
        
        const query = `
          INSERT INTO ${tableName} (${columns.join(', ')})
          VALUES (${placeholders}, $${values.length})
          RETURNING *
        `;
        
        const result = await client.query(query, values);
        results.push(result.rows[0]);
      }
      
      await client.query('COMMIT');
      
      // Emit real-time update
      io.emit(`${entityName}_bulk_created`, results);
      
      res.json(results);
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } catch (error) {
    handleError(res, error, `Failed to bulk create ${req.params.entityName}`);
  }
});

// Update record
app.put('/api/entities/:entityName/:id', authenticateToken, async (req, res) => {
  try {
    const { entityName, id } = req.params;
    const data = req.body;
    
    const tableName = getTableName(entityName);
    
    const columns = Object.keys(data);
    const values = Object.values(data);
    const setClause = columns.map((col, i) => `${col} = $${i + 1}`).join(', ');
    
    values.push(id);
    
    const query = `
      UPDATE ${tableName}
      SET ${setClause}, updated_date = NOW()
      WHERE id = $${values.length}
      RETURNING *
    `;
    
    const result = await pool.query(query, values);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Record not found' });
    }
    
    // Emit real-time update
    io.emit(`${entityName}_updated`, result.rows[0]);
    
    res.json(result.rows[0]);
  } catch (error) {
    handleError(res, error, `Failed to update ${req.params.entityName}`);
  }
});

// Delete record
app.delete('/api/entities/:entityName/:id', authenticateToken, async (req, res) => {
  try {
    const { entityName, id } = req.params;
    const tableName = getTableName(entityName);
    
    const result = await pool.query(
      `DELETE FROM ${tableName} WHERE id = $1 RETURNING id`,
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Record not found' });
    }
    
    // Emit real-time update
    io.emit(`${entityName}_deleted`, { id });
    
    res.json({ success: true, id });
  } catch (error) {
    handleError(res, error, `Failed to delete ${req.params.entityName}`);
  }
});

// Get entity schema
app.get('/api/entities/:entityName/schema', authenticateToken, async (req, res) => {
  try {
    const { entityName } = req.params;
    const tableName = getTableName(entityName);
    
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
    handleError(res, error, `Failed to get schema for ${req.params.entityName}`);
  }
});

// ============================================================================
// FILE UPLOAD ROUTES
// ============================================================================

// Upload public file
app.post('/api/integrations/upload', authenticateToken, upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    const fileUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
    
    res.json({ file_url: fileUrl });
  } catch (error) {
    handleError(res, error, 'File upload failed');
  }
});

// Upload private file (same as public for now - can be enhanced)
app.post('/api/integrations/upload-private', authenticateToken, upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    const fileUri = `/uploads/${req.file.filename}`;
    
    res.json({ file_uri: fileUri });
  } catch (error) {
    handleError(res, error, 'Private file upload failed');
  }
});

// ============================================================================
// HEALTH CHECK
// ============================================================================

app.get('/api/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ 
      status: 'ok',
      message: 'Backend and database connected',
      timestamp: new Date().toISOString(),
      database: 'connected',
      socketio: 'enabled'
    });
  } catch (err) {
    res.status(500).json({ 
      status: 'error', 
      message: err.message,
      database: 'disconnected'
    });
  }
});

// Root route
app.get('/', (req, res) => {
  res.json({
    message: 'Cricket Club API Server',
    version: '1.0.0',
    endpoints: {
      health: '/api/health',
      auth: '/api/auth/*',
      entities: '/api/entities/:entityName',
      upload: '/api/integrations/upload'
    }
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    details: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// ============================================================================
// START SERVER
// ============================================================================

server.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════════════════════╗
║                                                            ║
║   🚀 Cricket Club Backend Server                          ║
║                                                            ║
║   Server:     http://localhost:${PORT}                         ║
║   API:        http://localhost:${PORT}/api                     ║
║   Health:     http://localhost:${PORT}/api/health              ║
║   Socket.IO:  Enabled ✅                                   ║
║   Database:   PostgreSQL ✅                                ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝
  `);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
    pool.end(() => {
      console.log('Database pool closed');
      process.exit(0);
    });
  });
});