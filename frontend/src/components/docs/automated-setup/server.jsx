const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// PostgreSQL connection
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'cricket_club',
  user: process.env.DB_USER || 'cricket_admin',
  password: process.env.DB_PASSWORD || 'admin123',
});

// Test database connection
pool.connect((err, client, release) => {
  if (err) {
    console.error('Error connecting to database:', err.stack);
  } else {
    console.log('✓ Database connected successfully');
    release();
  }
});

// JWT secret
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Auth middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ error: 'Access token required' });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid token' });
    req.user = user;
    next();
  });
};

// ============================================================================
// AUTH ROUTES
// ============================================================================

// Register
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, full_name, phone, date_of_birth } = req.body;
    
    // Check if user exists
    const existingUser = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Hash password
    const password_hash = await bcrypt.hash(password, 10);

    // Create user
    const result = await pool.query(
      `INSERT INTO users (email, password_hash, full_name, phone, date_of_birth, role, status) 
       VALUES ($1, $2, $3, $4, $5, $6, $7) 
       RETURNING id, email, full_name, role, created_date`,
      [email, password_hash, full_name, phone, date_of_birth, 'user', 'active']
    );

    const user = result.rows[0];
    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({ user, token });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = result.rows[0];

    // Check password
    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Update last login
    await pool.query('UPDATE users SET last_login = NOW() WHERE id = $1', [user.id]);

    // Generate token
    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '7d' });

    // Remove password hash from response
    delete user.password_hash;

    res.json({ user, token });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Get current user
app.get('/api/auth/me', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, email, full_name, role, phone, photo_url, date_of_birth, club_role, status, created_date FROM users WHERE id = $1',
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to get user' });
  }
});

// Update current user
app.put('/api/auth/me', authenticateToken, async (req, res) => {
  try {
    const { full_name, phone, photo_url, date_of_birth } = req.body;
    
    const result = await pool.query(
      `UPDATE users SET full_name = $1, phone = $2, photo_url = $3, date_of_birth = $4, updated_date = NOW() 
       WHERE id = $5 
       RETURNING id, email, full_name, role, phone, photo_url, date_of_birth, club_role, status`,
      [full_name, phone, photo_url, date_of_birth, req.user.id]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ error: 'Failed to update user' });
  }
});

// ============================================================================
// GENERIC ENTITY ROUTES
// ============================================================================

// List entities
app.get('/api/entities/:entityName', authenticateToken, async (req, res) => {
  try {
    const { entityName } = req.params;
    const tableName = entityName.toLowerCase().replace(/([A-Z])/g, '_$1').replace(/^_/, '');
    
    const result = await pool.query(`SELECT * FROM ${tableName} ORDER BY created_date DESC`);
    res.json(result.rows);
  } catch (error) {
    console.error('List entities error:', error);
    res.status(500).json({ error: 'Failed to fetch entities' });
  }
});

// Get single entity
app.get('/api/entities/:entityName/:id', authenticateToken, async (req, res) => {
  try {
    const { entityName, id } = req.params;
    const tableName = entityName.toLowerCase().replace(/([A-Z])/g, '_$1').replace(/^_/, '');
    
    const result = await pool.query(`SELECT * FROM ${tableName} WHERE id = $1`, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Entity not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get entity error:', error);
    res.status(500).json({ error: 'Failed to fetch entity' });
  }
});

// Create entity
app.post('/api/entities/:entityName', authenticateToken, async (req, res) => {
  try {
    const { entityName } = req.params;
    const tableName = entityName.toLowerCase().replace(/([A-Z])/g, '_$1').replace(/^_/, '');
    const data = req.body;
    
    // Add created_by
    data.created_by = req.user.email;
    
    const columns = Object.keys(data).join(', ');
    const values = Object.values(data);
    const placeholders = values.map((_, i) => `$${i + 1}`).join(', ');
    
    const result = await pool.query(
      `INSERT INTO ${tableName} (${columns}) VALUES (${placeholders}) RETURNING *`,
      values
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create entity error:', error);
    res.status(500).json({ error: 'Failed to create entity' });
  }
});

// Update entity
app.put('/api/entities/:entityName/:id', authenticateToken, async (req, res) => {
  try {
    const { entityName, id } = req.params;
    const tableName = entityName.toLowerCase().replace(/([A-Z])/g, '_$1').replace(/^_/, '');
    const data = req.body;
    
    delete data.id;
    delete data.created_date;
    delete data.created_by;
    
    const setClause = Object.keys(data).map((key, i) => `${key} = $${i + 1}`).join(', ');
    const values = [...Object.values(data), id];
    
    const result = await pool.query(
      `UPDATE ${tableName} SET ${setClause}, updated_date = NOW() WHERE id = $${values.length} RETURNING *`,
      values
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Entity not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update entity error:', error);
    res.status(500).json({ error: 'Failed to update entity' });
  }
});

// Delete entity
app.delete('/api/entities/:entityName/:id', authenticateToken, async (req, res) => {
  try {
    const { entityName, id } = req.params;
    const tableName = entityName.toLowerCase().replace(/([A-Z])/g, '_$1').replace(/^_/, '');
    
    const result = await pool.query(`DELETE FROM ${tableName} WHERE id = $1 RETURNING *`, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Entity not found' });
    }
    
    res.json({ message: 'Entity deleted successfully' });
  } catch (error) {
    console.error('Delete entity error:', error);
    res.status(500).json({ error: 'Failed to delete entity' });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Backend is running', timestamp: new Date().toISOString() });
});

// Start server
app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════╗
║  Cricket Club Backend Server               ║
║  Running on: http://localhost:${PORT}       ║
║  Database: ${process.env.DB_NAME || 'cricket_club'}              ║
╚════════════════════════════════════════════╝
  `);
});

module.exports = app;