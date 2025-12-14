/**
 * ============================================================================
 * BACKEND SERVER WITH LOCAL AUTHENTICATION
 * ============================================================================
 * Complete Express.js server with bcrypt password hashing
 * No Supabase - Local PostgreSQL authentication
 */

const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// ============================================================================
// CONFIGURATION
// ============================================================================

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'cricket_club_db',
  user: process.env.DB_USER || 'cricket_admin',
  password: process.env.DB_PASSWORD,
});

const JWT_SECRET = process.env.JWT_SECRET || 'change-this-secret-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRATION || '7d';
const BCRYPT_ROUNDS = parseInt(process.env.BCRYPT_ROUNDS) || 10;

// ============================================================================
// MIDDLEWARE
// ============================================================================

app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// ============================================================================
// AUTH MIDDLEWARE
// ============================================================================

const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Get user from database
    const result = await pool.query(
      'SELECT id, email, full_name, role, club_role, photo_url FROM users WHERE id = $1 AND status = $2',
      [decoded.userId, 'active']
    );

    if (result.rows.length === 0) {
      return res.status(403).json({ error: 'User not found or inactive' });
    }

    req.user = result.rows[0];
    next();
  } catch (error) {
    console.error('Auth error:', error);
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
};

// ============================================================================
// AUDIT LOGGING
// ============================================================================

async function logAuthEvent(userId, email, action, success, ipAddress, userAgent, errorMessage = null) {
  try {
    await pool.query(
      `INSERT INTO auth_audit_log (user_id, email, action, success, ip_address, user_agent, error_message)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [userId, email, action, success, ipAddress, userAgent, errorMessage]
    );
  } catch (error) {
    console.error('Failed to log auth event:', error);
  }
}

// ============================================================================
// AUTHENTICATION ROUTES
// ============================================================================

// Register new user
app.post('/api/auth/register', async (req, res) => {
  const { email, password, full_name, phone } = req.body;

  if (!email || !password || !full_name) {
    return res.status(400).json({ error: 'Email, password, and full name are required' });
  }

  // Password validation
  if (password.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters' });
  }

  try {
    // Check if user exists
    const existingUser = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existingUser.rows.length > 0) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    // Hash password
    const password_hash = await bcrypt.hash(password, BCRYPT_ROUNDS);

    // Create user
    const result = await pool.query(
      `INSERT INTO users (email, password_hash, full_name, phone, role)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, email, full_name, role, created_date`,
      [email, password_hash, full_name, phone, 'user']
    );

    const user = result.rows[0];

    // Generate JWT
    const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

    // Log registration
    await logAuthEvent(user.id, email, 'register', true, req.ip, req.get('user-agent'));

    res.status(201).json({
      message: 'Registration successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Registration error:', error);
    await logAuthEvent(null, email, 'register', false, req.ip, req.get('user-agent'), error.message);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Login
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    // Get user
    const result = await pool.query(
      'SELECT id, email, password_hash, full_name, role, club_role, photo_url, status FROM users WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      await logAuthEvent(null, email, 'failed_login', false, req.ip, req.get('user-agent'), 'User not found');
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const user = result.rows[0];

    // Check if user is active
    if (user.status !== 'active') {
      await logAuthEvent(user.id, email, 'failed_login', false, req.ip, req.get('user-agent'), 'Account inactive');
      return res.status(403).json({ error: 'Account is inactive or suspended' });
    }

    // Verify password
    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      await logAuthEvent(user.id, email, 'failed_login', false, req.ip, req.get('user-agent'), 'Invalid password');
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Update last login
    await pool.query('UPDATE users SET last_login = NOW() WHERE id = $1', [user.id]);

    // Generate JWT
    const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

    // Log successful login
    await logAuthEvent(user.id, email, 'login', true, req.ip, req.get('user-agent'));

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        role: user.role,
        club_role: user.club_role,
        photo_url: user.photo_url,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    await logAuthEvent(null, email, 'failed_login', false, req.ip, req.get('user-agent'), error.message);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Get current user
app.get('/api/auth/me', authenticateToken, (req, res) => {
  res.json(req.user);
});

// Check authentication
app.get('/api/auth/check', authenticateToken, (req, res) => {
  res.json({ authenticated: true, user: req.user });
});

// Update current user
app.put('/api/auth/me', authenticateToken, async (req, res) => {
  const { full_name, phone, photo_url } = req.body;

  try {
    const result = await pool.query(
      `UPDATE users SET full_name = COALESCE($1, full_name), phone = COALESCE($2, phone), 
       photo_url = COALESCE($3, photo_url) WHERE id = $4
       RETURNING id, email, full_name, role, club_role, phone, photo_url`,
      [full_name, phone, photo_url, req.user.id]
    );

    res.json({ message: 'Profile updated', user: result.rows[0] });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// Change password
app.post('/api/auth/change-password', authenticateToken, async (req, res) => {
  const { current_password, new_password } = req.body;

  if (!current_password || !new_password) {
    return res.status(400).json({ error: 'Current and new password required' });
  }

  if (new_password.length < 8) {
    return res.status(400).json({ error: 'New password must be at least 8 characters' });
  }

  try {
    // Get current password hash
    const result = await pool.query('SELECT password_hash FROM users WHERE id = $1', [req.user.id]);
    const user = result.rows[0];

    // Verify current password
    const validPassword = await bcrypt.compare(current_password, user.password_hash);
    if (!validPassword) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    // Hash new password
    const new_password_hash = await bcrypt.hash(new_password, BCRYPT_ROUNDS);

    // Update password
    await pool.query('UPDATE users SET password_hash = $1 WHERE id = $2', [new_password_hash, req.user.id]);

    await logAuthEvent(req.user.id, req.user.email, 'password_change', true, req.ip, req.get('user-agent'));

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ error: 'Failed to change password' });
  }
});

// Logout
app.post('/api/auth/logout', authenticateToken, async (req, res) => {
  await logAuthEvent(req.user.id, req.user.email, 'logout', true, req.ip, req.get('user-agent'));
  res.json({ message: 'Logged out successfully' });
});

// ============================================================================
// ENTITY ROUTES (Example - Team Players)
// ============================================================================

// List all team players
app.get('/api/entities/TeamPlayer', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM team_players ORDER BY created_date DESC');
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching players:', error);
    res.status(500).json({ error: 'Failed to fetch players' });
  }
});

// Create team player
app.post('/api/entities/TeamPlayer', authenticateToken, async (req, res) => {
  const { player_name, email, phone, team_id, team_name, role } = req.body;

  try {
    const result = await pool.query(
      `INSERT INTO team_players (player_name, email, phone, team_id, team_name, role, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [player_name, email, phone, team_id, team_name, role, req.user.email]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating player:', error);
    res.status(500).json({ error: 'Failed to create player' });
  }
});

// ============================================================================
// HEALTH CHECK
// ============================================================================

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ============================================================================
// DATABASE CONNECTION TEST
// ============================================================================

pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('❌ Database connection failed:', err.message);
  } else {
    console.log('✅ Database connected:', res.rows[0].now);
  }
});

// ============================================================================
// START SERVER
// ============================================================================

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔐 Auth: Local with bcrypt password hashing`);
});