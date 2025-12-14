# Local Development Setup Guide
## Cricket Club Management System - PostgreSQL Setup

This guide will help you set up the Cricket Club Management System on your local laptop using PostgreSQL as the database (without Supabase).

---

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [PostgreSQL Installation & Setup](#postgresql-installation--setup)
3. [Database Configuration](#database-configuration)
4. [Backend Setup](#backend-setup)
5. [Frontend Setup](#frontend-setup)
6. [Running the Application](#running-the-application)
7. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Software
- **Node.js** (v18 or higher) - [Download](https://nodejs.org/)
- **PostgreSQL** (v14 or higher) - [Download](https://www.postgresql.org/download/)
- **npm** or **yarn** (comes with Node.js)
- **Git** (optional, for version control)

### Verify Installations
```bash
node --version  # Should show v18.x.x or higher
npm --version   # Should show 8.x.x or higher
psql --version  # Should show PostgreSQL 14.x or higher
```

---

## PostgreSQL Installation & Setup

### Windows
1. Download PostgreSQL installer from [postgresql.org](https://www.postgresql.org/download/windows/)
2. Run the installer and follow the setup wizard
3. Set a password for the `postgres` superuser (remember this!)
4. Default port: `5432` (keep it unless you have a conflict)
5. Install pgAdmin 4 (included) for GUI management

### macOS
```bash
# Using Homebrew
brew install postgresql@14

# Start PostgreSQL service
brew services start postgresql@14

# Create default postgres user
createuser -s postgres
```

### Linux (Ubuntu/Debian)
```bash
# Install PostgreSQL
sudo apt update
sudo apt install postgresql postgresql-contrib

# Start PostgreSQL service
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Switch to postgres user
sudo -i -u postgres
```

### Verify PostgreSQL is Running
```bash
# Windows (in Command Prompt)
pg_isready

# macOS/Linux
psql -U postgres -c "SELECT version();"
```

---

## Database Configuration

### Step 1: Create Database
```bash
# Connect to PostgreSQL
psql -U postgres

# Inside psql prompt:
CREATE DATABASE cricket_club_db;

# Create a dedicated user (recommended)
CREATE USER cricket_admin WITH PASSWORD 'your_secure_password_here';

# Grant privileges
GRANT ALL PRIVILEGES ON DATABASE cricket_club_db TO cricket_admin;

# Exit psql
\q
```

### Step 2: Create Database Schema

Create a file `database_schema.sql` with the following content:

```sql
-- ============================================
-- CRICKET CLUB MANAGEMENT SYSTEM - DATABASE SCHEMA
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- USERS & AUTHENTICATION
-- ============================================

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(255),
    role VARCHAR(50) DEFAULT 'user' CHECK (role IN ('admin', 'user')),
    club_role VARCHAR(50),
    created_date TIMESTAMP DEFAULT NOW(),
    updated_date TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- TEAMS
-- ============================================

CREATE TABLE teams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    short_name VARCHAR(50),
    is_home_team BOOLEAN DEFAULT FALSE,
    logo_url TEXT,
    home_ground VARCHAR(255),
    captain_id UUID,
    captain_name VARCHAR(255),
    primary_color VARCHAR(7) DEFAULT '#6366f1',
    secondary_color VARCHAR(7) DEFAULT '#ffffff',
    contact_email VARCHAR(255),
    contact_phone VARCHAR(50),
    notes TEXT,
    status VARCHAR(50) DEFAULT 'Active',
    created_date TIMESTAMP DEFAULT NOW(),
    updated_date TIMESTAMP DEFAULT NOW(),
    created_by VARCHAR(255)
);

-- ============================================
-- PLAYERS
-- ============================================

CREATE TABLE team_players (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
    team_name VARCHAR(255),
    player_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE,
    phone VARCHAR(50),
    photo_url TEXT,
    date_of_birth DATE,
    date_joined DATE,
    status VARCHAR(50) DEFAULT 'Active',
    jersey_number INTEGER,
    is_captain BOOLEAN DEFAULT FALSE,
    is_vice_captain BOOLEAN DEFAULT FALSE,
    is_wicket_keeper BOOLEAN DEFAULT FALSE,
    role VARCHAR(50) DEFAULT 'Batsman',
    batting_style VARCHAR(50),
    bowling_style VARCHAR(255),
    bio TEXT,
    emergency_contact_name VARCHAR(255),
    emergency_contact_phone VARCHAR(50),
    medical_notes TEXT,
    -- Career Statistics
    matches_played INTEGER DEFAULT 0,
    runs_scored INTEGER DEFAULT 0,
    balls_faced INTEGER DEFAULT 0,
    highest_score INTEGER DEFAULT 0,
    not_outs INTEGER DEFAULT 0,
    fours INTEGER DEFAULT 0,
    sixes INTEGER DEFAULT 0,
    fifties INTEGER DEFAULT 0,
    hundreds INTEGER DEFAULT 0,
    ducks INTEGER DEFAULT 0,
    wickets_taken INTEGER DEFAULT 0,
    overs_bowled DECIMAL(10,1) DEFAULT 0,
    runs_conceded INTEGER DEFAULT 0,
    maidens INTEGER DEFAULT 0,
    best_bowling VARCHAR(20),
    dot_balls INTEGER DEFAULT 0,
    four_wickets INTEGER DEFAULT 0,
    five_wickets INTEGER DEFAULT 0,
    catches INTEGER DEFAULT 0,
    stumpings INTEGER DEFAULT 0,
    run_outs INTEGER DEFAULT 0,
    created_date TIMESTAMP DEFAULT NOW(),
    updated_date TIMESTAMP DEFAULT NOW(),
    created_by VARCHAR(255)
);

-- ============================================
-- COMPETITIONS & SEASONS
-- ============================================

CREATE TABLE competitions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    short_name VARCHAR(50) NOT NULL,
    parent_id UUID REFERENCES competitions(id),
    parent_name VARCHAR(255),
    description TEXT,
    format VARCHAR(50) DEFAULT 'T20',
    status VARCHAR(50) DEFAULT 'Active',
    logo_url TEXT,
    website_url TEXT,
    organizer VARCHAR(255),
    notes TEXT,
    created_date TIMESTAMP DEFAULT NOW(),
    updated_date TIMESTAMP DEFAULT NOW(),
    created_by VARCHAR(255)
);

CREATE TABLE seasons (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    start_date DATE,
    end_date DATE,
    status VARCHAR(50) DEFAULT 'Upcoming',
    is_current BOOLEAN DEFAULT FALSE,
    created_date TIMESTAMP DEFAULT NOW(),
    updated_date TIMESTAMP DEFAULT NOW(),
    created_by VARCHAR(255)
);

-- ============================================
-- TOURNAMENTS
-- ============================================

CREATE TABLE tournaments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    short_name VARCHAR(50),
    season_id UUID REFERENCES seasons(id),
    season_name VARCHAR(255),
    competition_id UUID REFERENCES competitions(id),
    competition_name VARCHAR(255),
    sub_competition_id UUID REFERENCES competitions(id),
    sub_competition_name VARCHAR(255),
    format VARCHAR(50) DEFAULT 'league',
    status VARCHAR(50) DEFAULT 'draft',
    start_date DATE,
    end_date DATE,
    overs_per_match INTEGER DEFAULT 20,
    balls_per_over INTEGER DEFAULT 6,
    max_teams INTEGER DEFAULT 8,
    num_groups INTEGER DEFAULT 2,
    teams_qualify_per_group INTEGER DEFAULT 2,
    banner_url TEXT,
    logo_url TEXT,
    description TEXT,
    rules TEXT,
    prize_money VARCHAR(255),
    entry_fee DECIMAL(10,2) DEFAULT 0,
    organizer_name VARCHAR(255),
    organizer_contact VARCHAR(255),
    match_profile_id UUID,
    match_profile_name VARCHAR(255),
    current_stage VARCHAR(50) DEFAULT 'group',
    is_public BOOLEAN DEFAULT TRUE,
    created_date TIMESTAMP DEFAULT NOW(),
    updated_date TIMESTAMP DEFAULT NOW(),
    created_by VARCHAR(255)
);

-- ============================================
-- TOURNAMENT TEAMS
-- ============================================

CREATE TABLE tournament_teams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tournament_id UUID REFERENCES tournaments(id) ON DELETE CASCADE,
    team_id UUID REFERENCES teams(id),
    team_name VARCHAR(255) NOT NULL,
    short_name VARCHAR(50),
    group_letter VARCHAR(10),
    seed INTEGER,
    registration_status VARCHAR(50) DEFAULT 'pending',
    matches_played INTEGER DEFAULT 0,
    matches_won INTEGER DEFAULT 0,
    matches_lost INTEGER DEFAULT 0,
    matches_tied INTEGER DEFAULT 0,
    matches_nr INTEGER DEFAULT 0,
    points INTEGER DEFAULT 0,
    runs_scored INTEGER DEFAULT 0,
    runs_conceded INTEGER DEFAULT 0,
    overs_faced DECIMAL(10,1) DEFAULT 0,
    overs_bowled DECIMAL(10,1) DEFAULT 0,
    nrr DECIMAL(10,3) DEFAULT 0,
    is_eliminated BOOLEAN DEFAULT FALSE,
    final_position INTEGER,
    created_date TIMESTAMP DEFAULT NOW(),
    updated_date TIMESTAMP DEFAULT NOW(),
    created_by VARCHAR(255)
);

-- ============================================
-- MATCHES
-- ============================================

CREATE TABLE tournament_matches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tournament_id UUID REFERENCES tournaments(id) ON DELETE CASCADE,
    match_id UUID,
    match_number INTEGER,
    stage VARCHAR(50) DEFAULT 'group',
    group_letter VARCHAR(10),
    round INTEGER DEFAULT 1,
    team1_id UUID REFERENCES teams(id),
    team1_name VARCHAR(255),
    team2_id UUID REFERENCES teams(id),
    team2_name VARCHAR(255),
    match_date TIMESTAMP,
    venue VARCHAR(255),
    status VARCHAR(50) DEFAULT 'scheduled',
    toss_winner VARCHAR(255),
    toss_decision VARCHAR(10),
    team1_score VARCHAR(50),
    team1_overs VARCHAR(20),
    team2_score VARCHAR(50),
    team2_overs VARCHAR(20),
    winner_id UUID,
    winner_name VARCHAR(255),
    result_summary TEXT,
    man_of_match VARCHAR(255),
    mom_performance VARCHAR(255),
    is_super_over BOOLEAN DEFAULT FALSE,
    bracket_position INTEGER,
    next_match_id UUID,
    created_date TIMESTAMP DEFAULT NOW(),
    updated_date TIMESTAMP DEFAULT NOW(),
    created_by VARCHAR(255)
);

-- ============================================
-- BALL BY BALL SCORING
-- ============================================

CREATE TABLE ball_by_ball (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    match_id UUID NOT NULL,
    innings INTEGER NOT NULL CHECK (innings IN (1, 2)),
    over_number INTEGER NOT NULL,
    ball_number INTEGER NOT NULL,
    batsman_id UUID,
    batsman_name VARCHAR(255) NOT NULL,
    non_striker_id UUID,
    non_striker_name VARCHAR(255),
    bowler_id UUID,
    bowler_name VARCHAR(255) NOT NULL,
    runs INTEGER DEFAULT 0,
    extras INTEGER DEFAULT 0,
    extra_type VARCHAR(50) DEFAULT '',
    is_wicket BOOLEAN DEFAULT FALSE,
    wicket_type VARCHAR(50) DEFAULT '',
    dismissed_batsman_id UUID,
    dismissed_batsman_name VARCHAR(255),
    fielder_id UUID,
    fielder_name VARCHAR(255),
    is_four BOOLEAN DEFAULT FALSE,
    is_six BOOLEAN DEFAULT FALSE,
    is_dot BOOLEAN DEFAULT FALSE,
    is_free_hit BOOLEAN DEFAULT FALSE,
    is_powerplay BOOLEAN DEFAULT FALSE,
    wagon_wheel_zone INTEGER,
    shot_type VARCHAR(50) DEFAULT '',
    commentary TEXT,
    created_date TIMESTAMP DEFAULT NOW(),
    created_by VARCHAR(255)
);

-- ============================================
-- INNINGS SCORING
-- ============================================

CREATE TABLE innings_scores (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    match_id UUID NOT NULL,
    innings INTEGER NOT NULL CHECK (innings IN (1, 2)),
    batting_team_id UUID,
    batting_team_name VARCHAR(255) NOT NULL,
    bowling_team_id UUID,
    bowling_team_name VARCHAR(255),
    total_runs INTEGER DEFAULT 0,
    total_wickets INTEGER DEFAULT 0,
    total_overs VARCHAR(20),
    extras_wide INTEGER DEFAULT 0,
    extras_no_ball INTEGER DEFAULT 0,
    extras_bye INTEGER DEFAULT 0,
    extras_leg_bye INTEGER DEFAULT 0,
    extras_penalty INTEGER DEFAULT 0,
    run_rate DECIMAL(10,2),
    required_run_rate DECIMAL(10,2),
    target INTEGER,
    powerplay_runs INTEGER DEFAULT 0,
    powerplay_wickets INTEGER DEFAULT 0,
    is_completed BOOLEAN DEFAULT FALSE,
    fall_of_wickets TEXT,
    created_date TIMESTAMP DEFAULT NOW(),
    updated_date TIMESTAMP DEFAULT NOW(),
    created_by VARCHAR(255)
);

-- ============================================
-- TOURNAMENT PLAYER STATS
-- ============================================

CREATE TABLE tournament_players (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tournament_id UUID REFERENCES tournaments(id) ON DELETE CASCADE,
    tournament_team_id UUID REFERENCES tournament_teams(id),
    player_id UUID REFERENCES team_players(id),
    player_name VARCHAR(255) NOT NULL,
    team_name VARCHAR(255),
    matches_played INTEGER DEFAULT 0,
    runs_scored INTEGER DEFAULT 0,
    balls_faced INTEGER DEFAULT 0,
    highest_score INTEGER DEFAULT 0,
    fifties INTEGER DEFAULT 0,
    hundreds INTEGER DEFAULT 0,
    fours INTEGER DEFAULT 0,
    sixes INTEGER DEFAULT 0,
    not_outs INTEGER DEFAULT 0,
    batting_avg DECIMAL(10,2) DEFAULT 0,
    strike_rate DECIMAL(10,2) DEFAULT 0,
    wickets_taken INTEGER DEFAULT 0,
    overs_bowled DECIMAL(10,1) DEFAULT 0,
    runs_conceded INTEGER DEFAULT 0,
    best_bowling VARCHAR(20),
    economy DECIMAL(10,2) DEFAULT 0,
    bowling_avg DECIMAL(10,2) DEFAULT 0,
    catches INTEGER DEFAULT 0,
    stumpings INTEGER DEFAULT 0,
    run_outs INTEGER DEFAULT 0,
    mom_awards INTEGER DEFAULT 0,
    created_date TIMESTAMP DEFAULT NOW(),
    updated_date TIMESTAMP DEFAULT NOW(),
    created_by VARCHAR(255)
);

-- ============================================
-- FINANCE TABLES
-- ============================================

CREATE TABLE finance_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('Income', 'Expense')),
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    display_order INTEGER DEFAULT 0,
    created_date TIMESTAMP DEFAULT NOW(),
    updated_date TIMESTAMP DEFAULT NOW(),
    created_by VARCHAR(255)
);

CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category_id UUID REFERENCES finance_categories(id),
    category_name VARCHAR(255),
    type VARCHAR(50) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    description TEXT,
    date DATE NOT NULL,
    reference VARCHAR(255),
    paid_to VARCHAR(255),
    received_from VARCHAR(255),
    payment_method VARCHAR(50),
    status VARCHAR(50) DEFAULT 'Completed',
    receipt_url TEXT,
    notes TEXT,
    created_date TIMESTAMP DEFAULT NOW(),
    updated_date TIMESTAMP DEFAULT NOW(),
    created_by VARCHAR(255)
);

CREATE TABLE player_charges (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    player_id UUID REFERENCES team_players(id) ON DELETE CASCADE,
    charge_type VARCHAR(50) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    description TEXT,
    charge_date DATE NOT NULL,
    due_date DATE,
    reference_type VARCHAR(50),
    reference_id UUID,
    notes TEXT,
    voided BOOLEAN DEFAULT FALSE,
    voided_reason TEXT,
    created_date TIMESTAMP DEFAULT NOW(),
    updated_date TIMESTAMP DEFAULT NOW(),
    created_by VARCHAR(255)
);

CREATE TABLE player_payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    player_id UUID REFERENCES team_players(id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL,
    payment_date DATE NOT NULL,
    payment_method VARCHAR(50),
    reference VARCHAR(255),
    recorded_by VARCHAR(255),
    verified BOOLEAN DEFAULT FALSE,
    verified_by VARCHAR(255),
    verified_date DATE,
    notes TEXT,
    created_date TIMESTAMP DEFAULT NOW(),
    updated_date TIMESTAMP DEFAULT NOW(),
    created_by VARCHAR(255)
);

CREATE TABLE payment_allocations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    payment_id UUID REFERENCES player_payments(id) ON DELETE CASCADE,
    charge_id UUID REFERENCES player_charges(id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL,
    allocation_date DATE NOT NULL,
    allocated_by VARCHAR(255),
    notes TEXT,
    created_date TIMESTAMP DEFAULT NOW(),
    created_by VARCHAR(255)
);

CREATE TABLE memberships (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    player_id UUID REFERENCES team_players(id) ON DELETE CASCADE,
    member_name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(50),
    membership_type VARCHAR(50) NOT NULL,
    status VARCHAR(50) DEFAULT 'Pending',
    season VARCHAR(100),
    start_date DATE,
    expiry_date DATE,
    fee_amount DECIMAL(10,2),
    notes TEXT,
    created_date TIMESTAMP DEFAULT NOW(),
    updated_date TIMESTAMP DEFAULT NOW(),
    created_by VARCHAR(255)
);

-- ============================================
-- EVENTS & NEWS
-- ============================================

CREATE TABLE events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    event_type VARCHAR(50) NOT NULL,
    date TIMESTAMP NOT NULL,
    end_date TIMESTAMP,
    location VARCHAR(255),
    venue VARCHAR(255),
    max_attendees INTEGER,
    rsvp_enabled BOOLEAN DEFAULT TRUE,
    rsvp_deadline TIMESTAMP,
    status VARCHAR(50) DEFAULT 'Published',
    image_url TEXT,
    organizer VARCHAR(255),
    cost DECIMAL(10,2) DEFAULT 0,
    notes TEXT,
    created_date TIMESTAMP DEFAULT NOW(),
    updated_date TIMESTAMP DEFAULT NOW(),
    created_by VARCHAR(255)
);

CREATE TABLE event_rsvp (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID REFERENCES events(id) ON DELETE CASCADE,
    user_email VARCHAR(255) NOT NULL,
    user_name VARCHAR(255),
    status VARCHAR(50) NOT NULL,
    guests INTEGER DEFAULT 0,
    notes TEXT,
    created_date TIMESTAMP DEFAULT NOW(),
    updated_date TIMESTAMP DEFAULT NOW()
);

CREATE TABLE news (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    excerpt TEXT,
    image_url TEXT,
    category VARCHAR(100),
    is_featured BOOLEAN DEFAULT FALSE,
    created_date TIMESTAMP DEFAULT NOW(),
    updated_date TIMESTAMP DEFAULT NOW(),
    created_by VARCHAR(255)
);

CREATE TABLE gallery_images (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255),
    image_url TEXT NOT NULL,
    category VARCHAR(100),
    description TEXT,
    created_date TIMESTAMP DEFAULT NOW(),
    created_by VARCHAR(255)
);

-- ============================================
-- CONTACT & NOTIFICATIONS
-- ============================================

CREATE TABLE contact_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    subject VARCHAR(255),
    message TEXT NOT NULL,
    created_date TIMESTAMP DEFAULT NOW()
);

CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) NOT NULL,
    priority VARCHAR(50) DEFAULT 'normal',
    target_role VARCHAR(50),
    target_users TEXT,
    link_url TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_date TIMESTAMP DEFAULT NOW(),
    created_by VARCHAR(255)
);

CREATE TABLE user_notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    notification_id UUID REFERENCES notifications(id) ON DELETE CASCADE,
    user_email VARCHAR(255) NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    read_date TIMESTAMP,
    created_date TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- CLUB STATS
-- ============================================

CREATE TABLE club_stats (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    season VARCHAR(100) NOT NULL,
    matches_played INTEGER DEFAULT 0,
    matches_won INTEGER DEFAULT 0,
    matches_lost INTEGER DEFAULT 0,
    matches_drawn INTEGER DEFAULT 0,
    total_runs INTEGER DEFAULT 0,
    total_wickets INTEGER DEFAULT 0,
    league_position INTEGER DEFAULT 1,
    trophies_won INTEGER DEFAULT 0,
    created_date TIMESTAMP DEFAULT NOW(),
    updated_date TIMESTAMP DEFAULT NOW(),
    created_by VARCHAR(255)
);

-- ============================================
-- MATCH AVAILABILITY
-- ============================================

CREATE TABLE match_availability (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    match_id UUID NOT NULL,
    match_info VARCHAR(255),
    player_id UUID REFERENCES team_players(id) ON DELETE CASCADE,
    player_email VARCHAR(255),
    player_name VARCHAR(255),
    status VARCHAR(50) NOT NULL DEFAULT 'Available',
    notes TEXT,
    created_date TIMESTAMP DEFAULT NOW(),
    updated_date TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

CREATE INDEX idx_team_players_team_id ON team_players(team_id);
CREATE INDEX idx_team_players_email ON team_players(email);
CREATE INDEX idx_tournament_teams_tournament_id ON tournament_teams(tournament_id);
CREATE INDEX idx_tournament_matches_tournament_id ON tournament_matches(tournament_id);
CREATE INDEX idx_tournament_matches_match_date ON tournament_matches(match_date);
CREATE INDEX idx_ball_by_ball_match_id ON ball_by_ball(match_id);
CREATE INDEX idx_ball_by_ball_innings ON ball_by_ball(match_id, innings);
CREATE INDEX idx_transactions_date ON transactions(date);
CREATE INDEX idx_player_charges_player_id ON player_charges(player_id);
CREATE INDEX idx_player_payments_player_id ON player_payments(player_id);
CREATE INDEX idx_events_date ON events(date);
CREATE INDEX idx_news_created_date ON news(created_date);

-- ============================================
-- UPDATED_DATE TRIGGER FUNCTION
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_date_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_date = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to all tables with updated_date
CREATE TRIGGER update_users_updated_date BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_date_column();
CREATE TRIGGER update_teams_updated_date BEFORE UPDATE ON teams FOR EACH ROW EXECUTE FUNCTION update_updated_date_column();
CREATE TRIGGER update_team_players_updated_date BEFORE UPDATE ON team_players FOR EACH ROW EXECUTE FUNCTION update_updated_date_column();
CREATE TRIGGER update_tournaments_updated_date BEFORE UPDATE ON tournaments FOR EACH ROW EXECUTE FUNCTION update_updated_date_column();
CREATE TRIGGER update_tournament_teams_updated_date BEFORE UPDATE ON tournament_teams FOR EACH ROW EXECUTE FUNCTION update_updated_date_column();
CREATE TRIGGER update_tournament_matches_updated_date BEFORE UPDATE ON tournament_matches FOR EACH ROW EXECUTE FUNCTION update_updated_date_column();
CREATE TRIGGER update_transactions_updated_date BEFORE UPDATE ON transactions FOR EACH ROW EXECUTE FUNCTION update_updated_date_column();
CREATE TRIGGER update_events_updated_date BEFORE UPDATE ON events FOR EACH ROW EXECUTE FUNCTION update_updated_date_column();
CREATE TRIGGER update_news_updated_date BEFORE UPDATE ON news FOR EACH ROW EXECUTE FUNCTION update_updated_date_column();

-- ============================================
-- END OF SCHEMA
-- ============================================
```

### Step 3: Apply Schema to Database
```bash
# Apply the schema
psql -U cricket_admin -d cricket_club_db -f database_schema.sql

# Verify tables were created
psql -U cricket_admin -d cricket_club_db -c "\dt"
```

---

## Backend Setup

### Step 1: Create Backend Directory Structure
```bash
mkdir cricket-club-backend
cd cricket-club-backend
npm init -y
```

### Step 2: Install Backend Dependencies
```bash
npm install express pg cors dotenv bcryptjs jsonwebtoken
npm install --save-dev nodemon
```

### Step 3: Create Backend Server

Create `server.js`:

```javascript
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// PostgreSQL connection pool
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

// Test database connection
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('❌ Database connection error:', err);
  } else {
    console.log('✅ Database connected successfully');
  }
});

// ============================================
// GENERIC ENTITY CRUD ROUTES
// ============================================

// List all records from an entity
app.get('/api/entities/:entityName', async (req, res) => {
  try {
    const { entityName } = req.params;
    const { sort, limit } = req.query;
    
    let query = `SELECT * FROM ${entityName}`;
    
    if (sort) {
      const sortField = sort.startsWith('-') ? sort.slice(1) : sort;
      const sortOrder = sort.startsWith('-') ? 'DESC' : 'ASC';
      query += ` ORDER BY ${sortField} ${sortOrder}`;
    }
    
    if (limit) {
      query += ` LIMIT ${parseInt(limit)}`;
    }
    
    const result = await pool.query(query);
    res.json(result.rows);
  } catch (error) {
    console.error('Error listing entities:', error);
    res.status(500).json({ error: error.message });
  }
});

// Filter records with query object
app.post('/api/entities/:entityName/filter', async (req, res) => {
  try {
    const { entityName } = req.params;
    const { query: filterQuery, sort, limit } = req.body;
    
    let queryStr = `SELECT * FROM ${entityName}`;
    const values = [];
    let paramIndex = 1;
    
    if (filterQuery && Object.keys(filterQuery).length > 0) {
      const conditions = Object.entries(filterQuery).map(([key, value]) => {
        values.push(value);
        return `${key} = $${paramIndex++}`;
      });
      queryStr += ` WHERE ${conditions.join(' AND ')}`;
    }
    
    if (sort) {
      const sortField = sort.startsWith('-') ? sort.slice(1) : sort;
      const sortOrder = sort.startsWith('-') ? 'DESC' : 'ASC';
      queryStr += ` ORDER BY ${sortField} ${sortOrder}`;
    }
    
    if (limit) {
      queryStr += ` LIMIT ${parseInt(limit)}`;
    }
    
    const result = await pool.query(queryStr, values);
    res.json(result.rows);
  } catch (error) {
    console.error('Error filtering entities:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get single record by ID
app.get('/api/entities/:entityName/:id', async (req, res) => {
  try {
    const { entityName, id } = req.params;
    const result = await pool.query(
      `SELECT * FROM ${entityName} WHERE id = $1`,
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Record not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error getting entity:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create new record
app.post('/api/entities/:entityName', async (req, res) => {
  try {
    const { entityName } = req.params;
    const data = req.body;
    
    const columns = Object.keys(data);
    const values = Object.values(data);
    const placeholders = values.map((_, i) => `$${i + 1}`).join(', ');
    
    const query = `
      INSERT INTO ${entityName} (${columns.join(', ')})
      VALUES (${placeholders})
      RETURNING *
    `;
    
    const result = await pool.query(query, values);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating entity:', error);
    res.status(500).json({ error: error.message });
  }
});

// Bulk create records
app.post('/api/entities/:entityName/bulk', async (req, res) => {
  try {
    const { entityName } = req.params;
    const items = req.body;
    
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Invalid data format' });
    }
    
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      const results = [];
      for (const item of items) {
        const columns = Object.keys(item);
        const values = Object.values(item);
        const placeholders = values.map((_, i) => `$${i + 1}`).join(', ');
        
        const query = `
          INSERT INTO ${entityName} (${columns.join(', ')})
          VALUES (${placeholders})
          RETURNING *
        `;
        
        const result = await client.query(query, values);
        results.push(result.rows[0]);
      }
      
      await client.query('COMMIT');
      res.status(201).json(results);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error bulk creating entities:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update record
app.put('/api/entities/:entityName/:id', async (req, res) => {
  try {
    const { entityName, id } = req.params;
    const data = req.body;
    
    const updates = Object.keys(data)
      .map((key, i) => `${key} = $${i + 1}`)
      .join(', ');
    const values = [...Object.values(data), id];
    
    const query = `
      UPDATE ${entityName}
      SET ${updates}
      WHERE id = $${values.length}
      RETURNING *
    `;
    
    const result = await pool.query(query, values);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Record not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating entity:', error);
    res.status(500).json({ error: error.message });
  }
});

// Delete record
app.delete('/api/entities/:entityName/:id', async (req, res) => {
  try {
    const { entityName, id } = req.params;
    const result = await pool.query(
      `DELETE FROM ${entityName} WHERE id = $1 RETURNING *`,
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Record not found' });
    }
    
    res.json({ message: 'Record deleted successfully' });
  } catch (error) {
    console.error('Error deleting entity:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get entity schema (mock - adapt as needed)
app.get('/api/entities/:entityName/schema', async (req, res) => {
  try {
    const { entityName } = req.params;
    
    const query = `
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = $1
      ORDER BY ordinal_position
    `;
    
    const result = await pool.query(query, [entityName]);
    res.json(result.rows);
  } catch (error) {
    console.error('Error getting schema:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// AUTH ROUTES (BASIC)
// ============================================

// Get current user (mock - implement proper auth)
app.get('/api/auth/me', async (req, res) => {
  // In production, verify JWT token from Authorization header
  // For now, return a mock admin user
  res.json({
    id: '1',
    email: 'admin@cricketclub.com',
    full_name: 'Admin User',
    role: 'admin'
  });
});

// Check if authenticated
app.get('/api/auth/check', (req, res) => {
  // In production, verify token
  res.json({ authenticated: true });
});

// Update current user
app.put('/api/auth/me', async (req, res) => {
  // Implement user update logic
  res.json({ message: 'User updated' });
});

// Logout
app.post('/api/auth/logout', (req, res) => {
  res.json({ message: 'Logged out successfully' });
});

// ============================================
// INTEGRATION ROUTES
// ============================================

// File upload (basic - expand as needed)
app.post('/api/integrations/upload', (req, res) => {
  // Implement file upload logic
  res.json({ file_url: 'https://example.com/uploaded-file.jpg' });
});

// Send email
app.post('/api/integrations/send-email', (req, res) => {
  const { to, subject, body } = req.body;
  console.log('Email to send:', { to, subject, body });
  res.json({ message: 'Email sent successfully' });
});

// ============================================
// START SERVER
// ============================================

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📊 API available at http://localhost:${PORT}/api`);
});
```

### Step 4: Create Environment Variables

Create `.env` file in backend directory:

```env
# Database Configuration
DB_USER=cricket_admin
DB_PASSWORD=your_secure_password_here
DB_HOST=localhost
DB_PORT=5432
DB_NAME=cricket_club_db

# Server Configuration
PORT=5000
NODE_ENV=development

# JWT Secret (for authentication)
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:3000
```

### Step 5: Update package.json Scripts

Edit `package.json`:

```json
{
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js"
  }
}
```

### Step 6: Test Backend

```bash
# Start backend in development mode
npm run dev

# Should see:
# ✅ Database connected successfully
# 🚀 Server running on http://localhost:5000
```

Test API endpoint:
```bash
curl http://localhost:5000/api/auth/me
```

---

## Frontend Setup

### Step 1: Navigate to Frontend Directory

Assuming your frontend code is already present (the React app with all the components we've been working on).

### Step 2: Update API Client Configuration

Update `components/api/apiClient.js` to use your local backend:

```javascript
// Set API base URL
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Rest of the apiClient code remains the same...
```

### Step 3: Create Frontend Environment Variables

Create `.env` file in frontend root:

```env
# API Configuration
REACT_APP_API_URL=http://localhost:5000/api

# App Configuration
REACT_APP_NAME=Leamington Royals Cricket Club
REACT_APP_ENV=development
```

### Step 4: Install Frontend Dependencies

```bash
npm install
```

### Step 5: Start Frontend

```bash
npm start
```

Frontend should now be running on `http://localhost:3000`

---

## Running the Application

### Terminal 1: Backend
```bash
cd cricket-club-backend
npm run dev
```

### Terminal 2: Frontend
```bash
cd cricket-club-frontend  # or wherever your frontend is
npm start
```

### Access the Application
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000/api

---

## Troubleshooting

### Database Connection Issues

**Problem**: `Error: connect ECONNREFUSED`

**Solution**:
```bash
# Check if PostgreSQL is running
sudo systemctl status postgresql  # Linux
brew services list  # macOS
pg_isready  # Windows

# Restart PostgreSQL
sudo systemctl restart postgresql  # Linux
brew services restart postgresql  # macOS
```

**Problem**: `password authentication failed for user`

**Solution**:
```bash
# Reset user password
psql -U postgres
ALTER USER cricket_admin WITH PASSWORD 'new_password';
\q

# Update .env file with new password
```

### Port Already in Use

**Backend Port 5000**:
```bash
# Find process using port
lsof -i :5000  # macOS/Linux
netstat -ano | findstr :5000  # Windows

# Kill process
kill -9 <PID>  # macOS/Linux
taskkill /PID <PID> /F  # Windows
```

**Frontend Port 3000**:
```bash
# Change port in package.json
"scripts": {
  "start": "PORT=3001 react-scripts start"
}
```

### CORS Errors

Add to `server.js`:
```javascript
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));
```

### Database Schema Issues

```bash
# Drop and recreate database
psql -U postgres
DROP DATABASE cricket_club_db;
CREATE DATABASE cricket_club_db;
GRANT ALL PRIVILEGES ON DATABASE cricket_club_db TO cricket_admin;
\q

# Reapply schema
psql -U cricket_admin -d cricket_club_db -f database_schema.sql
```

### Module Not Found Errors

```bash
# Backend
cd cricket-club-backend
rm -rf node_modules package-lock.json
npm install

# Frontend
cd cricket-club-frontend
rm -rf node_modules package-lock.json
npm install
```

---

## Development Tips

### 1. Database GUI Tools

Use **pgAdmin 4** or **DBeaver** for visual database management:
- View tables and data
- Run SQL queries
- Export/import data
- Monitor performance

### 2. API Testing

Use **Postman** or **Thunder Client** (VS Code extension):

```bash
# Test entity list
GET http://localhost:5000/api/entities/teams

# Test entity create
POST http://localhost:5000/api/entities/teams
Body: { "name": "Test Team", "is_home_team": true }
```

### 3. Live Reload

Both frontend and backend have hot-reload enabled:
- Frontend: Save any React file → Auto-refresh browser
- Backend: Save server.js → Nodemon auto-restarts

### 4. Database Backups

```bash
# Backup database
pg_dump -U cricket_admin cricket_club_db > backup_$(date +%Y%m%d).sql

# Restore database
psql -U cricket_admin cricket_club_db < backup_20250206.sql
```

### 5. Seed Data

Create `seed.js` to populate test data:

```javascript
const { Pool } = require('pg');

const pool = new Pool({
  user: 'cricket_admin',
  host: 'localhost',
  database: 'cricket_club_db',
  password: 'your_password',
  port: 5432,
});

async function seed() {
  try {
    // Create home team
    await pool.query(`
      INSERT INTO teams (name, short_name, is_home_team, status)
      VALUES ('Leamington Royals', 'LRCC', true, 'Active')
    `);
    
    console.log('✅ Seed data inserted successfully');
  } catch (error) {
    console.error('❌ Seed error:', error);
  } finally {
    pool.end();
  }
}

seed();
```

Run: `node seed.js`

---

## Production Deployment

For production deployment, consider:

1. **Use environment-specific configs**
2. **Implement proper JWT authentication**
3. **Add request validation and sanitization**
4. **Use connection pooling and query optimization**
5. **Add logging and monitoring**
6. **Implement rate limiting**
7. **Use HTTPS/SSL certificates**
8. **Set up database backups**
9. **Configure firewalls**
10. **Use PM2 for process management**

---

## Additional Resources

- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Node.js Express Guide](https://expressjs.com/)
- [React Documentation](https://react.dev/)
- [pg (node-postgres) Documentation](https://node-postgres.com/)

---

## Support

For issues or questions:
1. Check PostgreSQL logs: `tail -f /var/log/postgresql/postgresql-14-main.log` (Linux)
2. Check Node.js logs in terminal
3. Use browser DevTools Console for frontend errors
4. Review this guide's Troubleshooting section

---

**Happy Coding! 🏏**