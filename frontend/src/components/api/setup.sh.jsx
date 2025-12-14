@echo off
REM =============================================================================
REM CRICKET CLUB MANAGEMENT SYSTEM - WINDOWS SETUP SCRIPT
REM =============================================================================
REM This script automates the complete setup of the Cricket Club Management System
REM on your Windows machine using PostgreSQL as the database.
REM
REM Requirements: Internet connection, Administrator privileges
REM =============================================================================

setlocal enabledelayedexpansion

:: Configuration
set "DB_NAME=cricket_club_db"
set "DB_USER=cricket_admin"
set "DB_PASSWORD=CricketClub2025!"
set "DB_HOST=localhost"
set "DB_PORT=5432"
set "BACKEND_PORT=5000"
set "FRONTEND_PORT=3000"
set "PROJECT_NAME=cricket-club-app"

:: Colors (using PowerShell for colored output)
:: NOTE: Standard Command Prompt does not support ANSI escape codes directly.
::       These will be printed literally unless you're using a terminal that
::       interprets them (e.g., Windows Terminal).
set "GREEN=[32m"
set "RED=[31m"
set "YELLOW=[33m"
set "BLUE=[34m"
set "NC=[0m"

echo.
echo %BLUE%============================================%NC%
echo %BLUE% CRICKET CLUB MANAGEMENT SYSTEM - SETUP %NC%
echo %BLUE%============================================%NC%
echo.
echo %BLUE%ℹ️  This script will set up the complete application on your Windows machine.%NC%
echo %BLUE%ℹ️  It will install dependencies, configure the database, and set up the application.%NC%
echo.
pause

:: Check for Administrator privileges
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo %RED%❌ ERROR: This script requires Administrator privileges.%NC%
    echo %RED%Please right-click and select "Run as Administrator"%NC%
    pause
    exit /b 1
)

echo %GREEN%✅ Running with Administrator privileges%NC%
echo.

:: =============================================================================
:: CHECK PREREQUISITES
:: =============================================================================

echo %BLUE%============================================%NC%
echo %BLUE%Checking Prerequisites%NC%
echo %BLUE%============================================%NC%
echo.

:: Check Node.js
where node >nul 2>&1
if %errorLevel% equ 0 (
    for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
    echo %GREEN%✅ Node.js installed: !NODE_VERSION!%NC%
) else (
    echo %YELLOW%⚠️  Node.js not found. Please install from https://nodejs.org/%NC%
    pause
    exit /b 1
)

:: Check npm
where npm >nul 2>&1
if %errorLevel% equ 0 (
    for /f "tokens=*" %%i in ('npm --version') do set NPM_VERSION=%%i
    echo %GREEN%✅ npm installed: !NPM_VERSION!%NC%
) else (
    echo %RED%❌ npm not found%NC%
    pause
    exit /b 1
)

:: Check PostgreSQL (psql client)
where psql >nul 2>&1
if %errorLevel% equ 0 (
    echo %GREEN%✅ PostgreSQL client (psql) installed%NC%
) else (
    echo %YELLOW%⚠️  PostgreSQL not found. Please install from https://www.postgresql.org/download/windows/%NC%
    echo %YELLOW%Make sure 'psql' is in your system's PATH environment variable.%NC%
    pause
    exit /b 1
)

echo.
echo %GREEN%✅ All essential prerequisites met!%NC%
echo.
pause

:: =============================================================================
:: DATABASE SETUP
:: =============================================================================

echo %BLUE%============================================%NC%
echo %BLUE%Setting Up PostgreSQL Database%NC%
echo %BLUE%============================================%NC%
echo.

:: Prompt for postgres superuser password
set /p "POSTGRES_PASSWORD=Enter your PostgreSQL superuser password (usually 'postgres'): "

echo %BLUE%ℹ️  Creating database and user...%NC%
:: Use the postgres superuser to create the DB and user
(echo CREATE DATABASE %DB_NAME%;) | psql -U postgres -d postgres -h %DB_HOST% -p %DB_PORT% -w -W %POSTGRES_PASSWORD% >nul 2>&1 || (
    echo %YELLOW%⚠️  Database '%DB_NAME%' might already exist or permission denied. Attempting to proceed.%NC%
)

(echo CREATE USER %DB_USER% WITH PASSWORD '%DB_PASSWORD%';) | psql -U postgres -d postgres -h %DB_HOST% -p %DB_PORT% -w -W %POSTGRES_PASSWORD% >nul 2>&1 || (
    echo %YELLOW%⚠️  User '%DB_USER%' might already exist or permission denied. Attempting to proceed.%NC%
)

(echo GRANT ALL PRIVILEGES ON DATABASE %DB_NAME% TO %DB_USER%;) | psql -U postgres -d postgres -h %DB_HOST% -p %DB_PORT% -w -W %POSTGRES_PASSWORD% >nul 2>&1 || (
    echo %RED%❌ Failed to grant privileges to user %DB_USER%. Please check PostgreSQL installation and password.%NC%
    pause
    exit /b 1
)

echo %GREEN%✅ Database '%DB_NAME%' and user '%DB_USER%' created (or already existed).%NC%

echo %BLUE%ℹ️  Creating database schema...%NC%
(
echo -- Enable UUID extension
echo CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

echo -- Users table
echo CREATE TABLE users (
echo     id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
echo     email VARCHAR(255) UNIQUE NOT NULL,
echo     full_name VARCHAR(255),
echo     role VARCHAR(50) DEFAULT 'user',
echo     club_role VARCHAR(50),
echo     created_date TIMESTAMP DEFAULT NOW(),
echo     updated_date TIMESTAMP DEFAULT NOW()
echo );

echo -- Teams table
echo CREATE TABLE teams (
echo     id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
echo     name VARCHAR(255) NOT NULL,
echo     short_name VARCHAR(50),
echo     is_home_team BOOLEAN DEFAULT FALSE,
echo     logo_url TEXT,
echo     home_ground VARCHAR(255),
echo     captain_id UUID,
echo     captain_name VARCHAR(255),
echo     primary_color VARCHAR(7) DEFAULT '#6366f1',
echo     secondary_color VARCHAR(7) DEFAULT '#ffffff',
echo     contact_email VARCHAR(255),
echo     contact_phone VARCHAR(50),
echo     notes TEXT,
echo     status VARCHAR(50) DEFAULT 'Active',
echo     created_date TIMESTAMP DEFAULT NOW(),
echo     updated_date TIMESTAMP DEFAULT NOW(),
echo     created_by VARCHAR(255)
echo );

echo -- Team Players table
echo CREATE TABLE team_players (
echo     id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
echo     team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
echo     team_name VARCHAR(255),
echo     player_name VARCHAR(255) NOT NULL,
echo     email VARCHAR(255) UNIQUE,
echo     phone VARCHAR(50),
echo     photo_url TEXT,
echo     date_of_birth DATE,
echo     date_joined DATE,
echo     status VARCHAR(50) DEFAULT 'Active',
echo     jersey_number INTEGER,
echo     is_captain BOOLEAN DEFAULT FALSE,
echo     is_vice_captain BOOLEAN DEFAULT FALSE,
echo     is_wicket_keeper BOOLEAN DEFAULT FALSE,
echo     role VARCHAR(50) DEFAULT 'Batsman',
echo     batting_style VARCHAR(50),
echo     bowling_style VARCHAR(255),
echo     bio TEXT,
echo     emergency_contact_name VARCHAR(255),
echo     emergency_contact_phone VARCHAR(50),
echo     medical_notes TEXT,
echo     matches_played INTEGER DEFAULT 0,
echo     runs_scored INTEGER DEFAULT 0,
echo     balls_faced INTEGER DEFAULT 0,
echo     highest_score INTEGER DEFAULT 0,
echo     not_outs INTEGER DEFAULT 0,
echo     fours INTEGER DEFAULT 0,
echo     sixes INTEGER DEFAULT 0,
echo     fifties INTEGER DEFAULT 0,
echo     hundreds INTEGER DEFAULT 0,
echo     ducks INTEGER DEFAULT 0,
echo     wickets_taken INTEGER DEFAULT 0,
echo     overs_bowled DECIMAL(10,1) DEFAULT 0,
echo     runs_conceded INTEGER DEFAULT 0,
echo     maidens INTEGER DEFAULT 0,
echo     best_bowling VARCHAR(20),
echo     dot_balls INTEGER DEFAULT 0,
echo     four_wickets INTEGER DEFAULT 0,
echo     five_wickets INTEGER DEFAULT 0,
echo     catches INTEGER DEFAULT 0,
echo     stumpings INTEGER DEFAULT 0,
echo     run_outs INTEGER DEFAULT 0,
echo     created_date TIMESTAMP DEFAULT NOW(),
echo     updated_date TIMESTAMP DEFAULT NOW(),
echo     created_by VARCHAR(255)
echo );

echo -- Competitions table
echo CREATE TABLE competitions (
echo     id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
echo     name VARCHAR(255) NOT NULL,
echo     short_name VARCHAR(50) NOT NULL,
echo     parent_id UUID REFERENCES competitions(id),
echo     parent_name VARCHAR(255),
echo     description TEXT,
echo     format VARCHAR(50) DEFAULT 'T20',
echo     status VARCHAR(50) DEFAULT 'Active',
echo     logo_url TEXT,
echo     website_url TEXT,
echo     organizer VARCHAR(255),
echo     notes TEXT,
echo     created_date TIMESTAMP DEFAULT NOW(),
echo     updated_date TIMESTAMP DEFAULT NOW(),
echo     created_by VARCHAR(255)
echo );

echo -- Seasons table
echo CREATE TABLE seasons (
echo     id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
echo     name VARCHAR(100) NOT NULL,
echo     start_date DATE,
echo     end_date DATE,
echo     status VARCHAR(50) DEFAULT 'Upcoming',
echo     is_current BOOLEAN DEFAULT FALSE,
echo     created_date TIMESTAMP DEFAULT NOW(),
echo     updated_date TIMESTAMP DEFAULT NOW(),
echo     created_by VARCHAR(255)
echo );

echo -- Tournaments table
echo CREATE TABLE tournaments (
echo     id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
echo     name VARCHAR(255) NOT NULL,
echo     short_name VARCHAR(50),
echo     season_id UUID REFERENCES seasons(id),
echo     season_name VARCHAR(255),
echo     competition_id UUID REFERENCES competitions(id),
echo     competition_name VARCHAR(255),
echo     sub_competition_id UUID REFERENCES competitions(id),
echo     sub_competition_name VARCHAR(255),
echo     format VARCHAR(50) DEFAULT 'league',
echo     status VARCHAR(50) DEFAULT 'draft',
echo     start_date DATE,
echo     end_date DATE,
echo     overs_per_match INTEGER DEFAULT 20,
echo     balls_per_over INTEGER DEFAULT 6,
echo     max_teams INTEGER DEFAULT 8,
echo     num_groups INTEGER DEFAULT 2,
echo     teams_qualify_per_group INTEGER DEFAULT 2,
echo     banner_url TEXT,
echo     logo_url TEXT,
echo     description TEXT,
echo     rules TEXT,
echo     prize_money VARCHAR(255),
echo     entry_fee DECIMAL(10,2) DEFAULT 0,
echo     organizer_name VARCHAR(255),
echo     organizer_contact VARCHAR(255),
echo     match_profile_id UUID,
echo     match_profile_name VARCHAR(255),
echo     current_stage VARCHAR(50) DEFAULT 'group',
echo     is_public BOOLEAN DEFAULT TRUE,
echo     created_date TIMESTAMP DEFAULT NOW(),
echo     updated_date TIMESTAMP DEFAULT NOW(),
echo     created_by VARCHAR(255)
echo );

echo -- Tournament Teams table
echo CREATE TABLE tournament_teams (
echo     id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
echo     tournament_id UUID REFERENCES tournaments(id) ON DELETE CASCADE,
echo     team_id UUID REFERENCES teams(id),
echo     team_name VARCHAR(255) NOT NULL,
echo     short_name VARCHAR(50),
echo     group_letter VARCHAR(10),
echo     seed INTEGER,
echo     registration_status VARCHAR(50) DEFAULT 'pending',
echo     matches_played INTEGER DEFAULT 0,
echo     matches_won INTEGER DEFAULT 0,
echo     matches_lost INTEGER DEFAULT 0,
echo     matches_tied INTEGER DEFAULT 0,
echo     matches_nr INTEGER DEFAULT 0,
echo     points INTEGER DEFAULT 0,
echo     runs_scored INTEGER DEFAULT 0,
echo     runs_conceded INTEGER DEFAULT 0,
echo     overs_faced DECIMAL(10,1) DEFAULT 0,
echo     overs_bowled DECIMAL(10,1) DEFAULT 0,
echo     nrr DECIMAL(10,3) DEFAULT 0,
echo     is_eliminated BOOLEAN DEFAULT FALSE,
echo     final_position INTEGER,
echo     created_date TIMESTAMP DEFAULT NOW(),
echo     updated_date TIMESTAMP DEFAULT NOW(),
echo     created_by VARCHAR(255)
echo );

echo -- Tournament Matches table
echo CREATE TABLE tournament_matches (
echo     id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
echo     tournament_id UUID REFERENCES tournaments(id) ON DELETE CASCADE,
echo     match_id UUID,
echo     match_number INTEGER,
echo     stage VARCHAR(50) DEFAULT 'group',
echo     group_letter VARCHAR(10),
echo     round INTEGER DEFAULT 1,
echo     team1_id UUID REFERENCES teams(id),
echo     team1_name VARCHAR(255),
echo     team2_id UUID REFERENCES teams(id),
echo     team2_name VARCHAR(255),
echo     match_date TIMESTAMP,
echo     venue VARCHAR(255),
echo     status VARCHAR(50) DEFAULT 'scheduled',
echo     toss_winner VARCHAR(255),
echo     toss_decision VARCHAR(10),
echo     team1_score VARCHAR(50),
echo     team1_overs VARCHAR(20),
echo     team2_score VARCHAR(50),
echo     team2_overs VARCHAR(20),
echo     winner_id UUID,
echo     winner_name VARCHAR(255),
echo     result_summary TEXT,
echo     man_of_match VARCHAR(255),
echo     mom_performance VARCHAR(255),
echo     is_super_over BOOLEAN DEFAULT FALSE,
echo     bracket_position INTEGER,
echo     next_match_id UUID,
echo     created_date TIMESTAMP DEFAULT NOW(),
echo     updated_date TIMESTAMP DEFAULT NOW(),
echo     created_by VARCHAR(255)
echo );

echo -- Ball by Ball table
echo CREATE TABLE ball_by_ball (
echo     id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
echo     match_id UUID NOT NULL,
echo     innings INTEGER NOT NULL CHECK (innings IN (1, 2)),
echo     over_number INTEGER NOT NULL,
echo     ball_number INTEGER NOT NULL,
echo     batsman_id UUID,
echo     batsman_name VARCHAR(255) NOT NULL,
echo     non_striker_id UUID,
echo     non_striker_name VARCHAR(255),
echo     bowler_id UUID,
echo     bowler_name VARCHAR(255) NOT NULL,
echo     runs INTEGER DEFAULT 0,
echo     extras INTEGER DEFAULT 0,
echo     extra_type VARCHAR(50) DEFAULT '',
echo     is_wicket BOOLEAN DEFAULT FALSE,
echo     wicket_type VARCHAR(50) DEFAULT '',
echo     dismissed_batsman_id UUID,
echo     dismissed_batsman_name VARCHAR(255),
echo     fielder_id UUID,
echo     fielder_name VARCHAR(255),
echo     is_four BOOLEAN DEFAULT FALSE,
echo     is_six BOOLEAN DEFAULT FALSE,
echo     is_dot BOOLEAN DEFAULT FALSE,
echo     is_free_hit BOOLEAN DEFAULT FALSE,
echo     is_powerplay BOOLEAN DEFAULT FALSE,
echo     wagon_wheel_zone INTEGER,
echo     shot_type VARCHAR(50) DEFAULT '',
echo     commentary TEXT,
echo     created_date TIMESTAMP DEFAULT NOW(),
echo     created_by VARCHAR(255)
echo );

echo -- Innings Scores table
echo CREATE TABLE innings_scores (
echo     id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
echo     match_id UUID NOT NULL,
echo     innings INTEGER NOT NULL CHECK (innings IN (1, 2)),
echo     batting_team_id UUID,
echo     batting_team_name VARCHAR(255) NOT NULL,
echo     bowling_team_id UUID,
echo     bowling_team_name VARCHAR(255),
echo     total_runs INTEGER DEFAULT 0,
echo     total_wickets INTEGER DEFAULT 0,
echo     total_overs VARCHAR(20),
echo     extras_wide INTEGER DEFAULT 0,
echo     extras_no_ball INTEGER DEFAULT 0,
echo     extras_bye INTEGER DEFAULT 0,
echo     extras_leg_bye INTEGER DEFAULT 0,
echo     extras_penalty INTEGER DEFAULT 0,
echo     run_rate DECIMAL(10,2),
echo     required_run_rate DECIMAL(10,2),
echo     target INTEGER,
echo     powerplay_runs INTEGER DEFAULT 0,
echo     powerplay_wickets INTEGER DEFAULT 0,
echo     is_completed BOOLEAN DEFAULT FALSE,
echo     fall_of_wickets TEXT,
echo     created_date TIMESTAMP DEFAULT NOW(),
echo     updated_date TIMESTAMP DEFAULT NOW(),
echo     created_by VARCHAR(255)
echo );

echo -- Tournament Players table
echo CREATE TABLE tournament_players (
echo     id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
echo     tournament_id UUID REFERENCES tournaments(id) ON DELETE CASCADE,
echo     tournament_team_id UUID REFERENCES tournament_teams(id),
echo     player_id UUID REFERENCES team_players(id),
echo     player_name VARCHAR(255) NOT NULL,
echo     team_name VARCHAR(255),
echo     matches_played INTEGER DEFAULT 0,
echo     runs_scored INTEGER DEFAULT 0,
echo     balls_faced INTEGER DEFAULT 0,
echo     highest_score INTEGER DEFAULT 0,
echo     fifties INTEGER DEFAULT 0,
echo     hundreds INTEGER DEFAULT 0,
echo     fours INTEGER DEFAULT 0,
echo     sixes INTEGER DEFAULT 0,
echo     not_outs INTEGER DEFAULT 0,
echo     batting_avg DECIMAL(10,2) DEFAULT 0,
echo     strike_rate DECIMAL(10,2) DEFAULT 0,
echo     wickets_taken INTEGER DEFAULT 0,
echo     overs_bowled DECIMAL(10,1) DEFAULT 0,
echo     runs_conceded INTEGER DEFAULT 0,
echo     best_bowling VARCHAR(20),
echo     economy DECIMAL(10,2) DEFAULT 0,
echo     bowling_avg DECIMAL(10,2) DEFAULT 0,
echo     catches INTEGER DEFAULT 0,
echo     stumpings INTEGER DEFAULT 0,
echo     run_outs INTEGER DEFAULT 0,
echo     mom_awards INTEGER DEFAULT 0,
echo     created_date TIMESTAMP DEFAULT NOW(),
echo     updated_date TIMESTAMP DEFAULT NOW(),
echo     created_by VARCHAR(255)
echo );

echo -- Finance Categories table
echo CREATE TABLE finance_categories (
echo     id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
echo     name VARCHAR(255) NOT NULL,
echo     type VARCHAR(50) NOT NULL CHECK (type IN ('Income', 'Expense')),
echo     description TEXT,
echo     is_active BOOLEAN DEFAULT TRUE,
echo     display_order INTEGER DEFAULT 0,
echo     created_date TIMESTAMP DEFAULT NOW(),
echo     updated_date TIMESTAMP DEFAULT NOW(),
echo     created_by VARCHAR(255)
echo );

echo -- Transactions table
echo CREATE TABLE transactions (
echo     id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
echo     category_id UUID REFERENCES finance_categories(id),
echo     category_name VARCHAR(255),
echo     type VARCHAR(50) NOT NULL,
echo     amount DECIMAL(10,2) NOT NULL,
echo     description TEXT,
echo     date DATE NOT NULL,
echo     reference VARCHAR(255),
echo     paid_to VARCHAR(255),
echo     received_from VARCHAR(255),
echo     payment_method VARCHAR(50),
echo     status VARCHAR(50) DEFAULT 'Completed',
echo     receipt_url TEXT,
echo     notes TEXT,
echo     created_date TIMESTAMP DEFAULT NOW(),
echo     updated_date TIMESTAMP DEFAULT NOW(),
echo     created_by VARCHAR(255)
echo );

echo -- Player Charges table
echo CREATE TABLE player_charges (
echo     id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
echo     player_id UUID REFERENCES team_players(id) ON DELETE CASCADE,
echo     charge_type VARCHAR(50) NOT NULL,
echo     amount DECIMAL(10,2) NOT NULL,
echo     description TEXT,
echo     charge_date DATE NOT NULL,
echo     due_date DATE,
echo     reference_type VARCHAR(50),
echo     reference_id UUID,
echo     notes TEXT,
echo     voided BOOLEAN DEFAULT FALSE,
echo     voided_reason TEXT,
echo     created_date TIMESTAMP DEFAULT NOW(),
echo     updated_date TIMESTAMP DEFAULT NOW(),
echo     created_by VARCHAR(255)
echo );

echo -- Player Payments table
echo CREATE TABLE player_payments (
echo     id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
echo     player_id UUID REFERENCES team_players(id) ON DELETE CASCADE,
echo     amount DECIMAL(10,2) NOT NULL,
echo     payment_date DATE NOT NULL,
echo     payment_method VARCHAR(50),
echo     reference VARCHAR(255),
echo     recorded_by VARCHAR(255),
echo     verified BOOLEAN DEFAULT FALSE,
echo     verified_by VARCHAR(255),
echo     verified_date DATE,
echo     notes TEXT,
echo     created_date TIMESTAMP DEFAULT NOW(),
echo     updated_date TIMESTAMP DEFAULT NOW(),
echo     created_by VARCHAR(255)
echo );

echo -- Payment Allocations table
echo CREATE TABLE payment_allocations (
echo     id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
echo     payment_id UUID REFERENCES player_payments(id) ON DELETE CASCADE,
echo     charge_id UUID REFERENCES player_charges(id) ON DELETE CASCADE,
echo     amount DECIMAL(10,2) NOT NULL,
echo     allocation_date DATE NOT NULL,
echo     allocated_by VARCHAR(255),
echo     notes TEXT,
echo     created_date TIMESTAMP DEFAULT NOW(),
echo     created_by VARCHAR(255)
echo );

echo -- Memberships table
echo CREATE TABLE memberships (
echo     id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
echo     player_id UUID REFERENCES team_players(id) ON DELETE CASCADE,
echo     member_name VARCHAR(255) NOT NULL,
echo     email VARCHAR(255),
echo     phone VARCHAR(50),
echo     membership_type VARCHAR(50) NOT NULL,
echo     status VARCHAR(50) DEFAULT 'Pending',
echo     season VARCHAR(100),
echo     start_date DATE,
echo     expiry_date DATE,
echo     fee_amount DECIMAL(10,2),
echo     notes TEXT,
echo     created_date TIMESTAMP DEFAULT NOW(),
echo     updated_date TIMESTAMP DEFAULT NOW(),
echo     created_by VARCHAR(255)
echo );

echo -- Events table
echo CREATE TABLE events (
echo     id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
echo     title VARCHAR(255) NOT NULL,
echo     description TEXT,
echo     event_type VARCHAR(50) NOT NULL,
echo     date TIMESTAMP NOT NULL,
echo     end_date TIMESTAMP,
echo     location VARCHAR(255),
echo     venue VARCHAR(255),
echo     max_attendees INTEGER,
echo     rsvp_enabled BOOLEAN DEFAULT TRUE,
echo     rsvp_deadline TIMESTAMP,
echo     status VARCHAR(50) DEFAULT 'Published',
echo     image_url TEXT,
echo     organizer VARCHAR(255),
echo     cost DECIMAL(10,2) DEFAULT 0,
echo     notes TEXT,
echo     created_date TIMESTAMP DEFAULT NOW(),
echo     updated_date TIMESTAMP DEFAULT NOW(),
echo     created_by VARCHAR(255)
echo );

echo -- Event RSVP table
echo CREATE TABLE event_rsvp (
echo     id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
echo     event_id UUID REFERENCES events(id) ON DELETE CASCADE,
echo     user_email VARCHAR(255) NOT NULL,
echo     user_name VARCHAR(255),
echo     status VARCHAR(50) NOT NULL,
echo     guests INTEGER DEFAULT 0,
echo     notes TEXT,
echo     created_date TIMESTAMP DEFAULT NOW(),
echo     updated_date TIMESTAMP DEFAULT NOW()
echo );

echo -- News table
echo CREATE TABLE news (
echo     id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
echo     title VARCHAR(255) NOT NULL,
echo     content TEXT NOT NULL,
echo     excerpt TEXT,
echo     image_url TEXT,
echo     category VARCHAR(100),
echo     is_featured BOOLEAN DEFAULT FALSE,
echo     created_date TIMESTAMP DEFAULT NOW(),
echo     updated_date TIMESTAMP DEFAULT NOW(),
echo     created_by VARCHAR(255)
echo );

echo -- Gallery Images table
echo CREATE TABLE gallery_images (
echo     id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
echo     title VARCHAR(255),
echo     image_url TEXT NOT NULL,
echo     category VARCHAR(100),
echo     description TEXT,
echo     created_date TIMESTAMP DEFAULT NOW(),
echo     created_by VARCHAR(255)
echo );

echo -- Contact Messages table
echo CREATE TABLE contact_messages (
echo     id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
echo     name VARCHAR(255) NOT NULL,
echo     email VARCHAR(255) NOT NULL,
echo     phone VARCHAR(50),
echo     subject VARCHAR(255),
echo     message TEXT NOT NULL,
echo     created_date TIMESTAMP DEFAULT NOW()
echo );

echo -- Notifications table
echo CREATE TABLE notifications (
echo     id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
echo     title VARCHAR(255) NOT NULL,
echo     message TEXT NOT NULL,
echo     type VARCHAR(50) NOT NULL,
echo     priority VARCHAR(50) DEFAULT 'normal',
echo     target_role VARCHAR(50),
echo     target_users TEXT,
echo     link_url TEXT,
echo     is_active BOOLEAN DEFAULT TRUE,
echo     created_date TIMESTAMP DEFAULT NOW(),
echo     created_by VARCHAR(255)
echo );

echo -- User Notifications table
echo CREATE TABLE user_notifications (
echo     id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
echo     notification_id UUID REFERENCES notifications(id) ON DELETE CASCADE,
echo     user_email VARCHAR(255) NOT NULL,
echo     is_read BOOLEAN DEFAULT FALSE,
echo     read_date TIMESTAMP,
echo     created_date TIMESTAMP DEFAULT NOW()
echo );

echo -- Club Stats table
echo CREATE TABLE club_stats (
echo     id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
echo     season VARCHAR(100) NOT NULL,
echo     matches_played INTEGER DEFAULT 0,
echo     matches_won INTEGER DEFAULT 0,
echo     matches_lost INTEGER DEFAULT 0,
echo     matches_drawn INTEGER DEFAULT 0,
echo     total_runs INTEGER DEFAULT 0,
echo     total_wickets INTEGER DEFAULT 0,
echo     league_position INTEGER DEFAULT 1,
echo     trophies_won INTEGER DEFAULT 0,
echo     created_date TIMESTAMP DEFAULT NOW(),
echo     updated_date TIMESTAMP DEFAULT NOW(),
echo     created_by VARCHAR(255)
echo );

echo -- Match Availability table
echo CREATE TABLE match_availability (
echo     id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
echo     match_id UUID NOT NULL,
echo     match_info VARCHAR(255),
echo     player_id UUID REFERENCES team_players(id) ON DELETE CASCADE,
echo     player_email VARCHAR(255),
echo     player_name VARCHAR(255),
echo     status VARCHAR(50) NOT NULL DEFAULT 'Available',
echo     notes TEXT,
echo     created_date TIMESTAMP DEFAULT NOW(),
echo     updated_date TIMESTAMP DEFAULT NOW()
echo );

echo -- Create indexes
echo CREATE INDEX idx_team_players_team_id ON team_players(team_id);
echo CREATE INDEX idx_team_players_email ON team_players(email);
echo CREATE INDEX idx_tournament_teams_tournament_id ON tournament_teams(tournament_id);
echo CREATE INDEX idx_tournament_matches_tournament_id ON tournament_matches(tournament_id);
echo CREATE INDEX idx_tournament_matches_match_date ON tournament_matches(match_date);
echo CREATE INDEX idx_ball_by_ball_match_id ON ball_by_ball(match_id);
echo CREATE INDEX idx_transactions_date ON transactions(date);
echo CREATE INDEX idx_events_date ON events(date);

echo -- Create updated_date trigger function
echo CREATE OR REPLACE FUNCTION update_updated_date_column()
echo RETURNS TRIGGER AS $$
echo BEGIN
echo     NEW.updated_date = NOW();
echo     RETURN NEW;
echo END;
echo $$ LANGUAGE plpgsql;

echo -- Apply triggers
echo CREATE TRIGGER update_users_updated_date BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_date_column();
echo CREATE TRIGGER update_teams_updated_date BEFORE UPDATE ON teams FOR EACH ROW EXECUTE FUNCTION update_updated_date_column();
echo CREATE TRIGGER update_team_players_updated_date BEFORE UPDATE ON team_players FOR EACH ROW EXECUTE FUNCTION update_updated_date_column();

) > schema.sql

:: Apply schema
psql -U %DB_USER% -d %DB_NAME% -h %DB_HOST% -p %DB_PORT% -f schema.sql >nul 2>&1 || (
    echo %RED%❌ Failed to apply schema. Check DB_USER, DB_PASSWORD, DB_NAME, and schema.sql for errors.%NC%
    del schema.sql
    pause
    exit /b 1
)
del schema.sql

echo %GREEN%✅ Database schema applied successfully%NC%
echo.
pause

:: =============================================================================
:: BACKEND SETUP
:: =============================================================================

echo %BLUE%============================================%NC%
echo %BLUE%Setting Up Backend Server%NC%
echo %BLUE%============================================%NC%
echo.

if not exist %PROJECT_NAME%\backend mkdir %PROJECT_NAME%\backend
cd %PROJECT_NAME%\backend

:: Initialize npm
echo %BLUE%ℹ️  Initializing npm project...%NC%
call npm init -y > nul

:: Install dependencies
echo %BLUE%ℹ️  Installing backend dependencies...%NC%
call npm install express pg cors dotenv bcryptjs jsonwebtoken > nul
call npm install --save-dev nodemon > nul

:: Update package.json scripts (npm init -y creates a basic one, we overwrite to add dev script)
echo %BLUE%ℹ️  Updating package.json scripts...%NC%
(
echo {
echo   "name": "backend",
echo   "version": "1.0.0",
echo   "description": "Cricket Club Management System Backend API",
echo   "main": "server.js",
echo   "scripts": {
echo     "start": "node server.js",
echo     "dev": "nodemon server.js"
echo   },
echo   "keywords": [],
echo   "author": "",
echo   "license": "ISC"
echo }
) > package.json


:: Create server.js
echo %BLUE%ℹ️  Creating backend server...%NC%
(
echo const express = require^('express'^);
echo const cors = require^('cors'^);
echo const { Pool } = require^('pg'^);
echo require^('dotenv'^).config^(^);
echo.
echo const app = express^(^);
echo const PORT = process.env.PORT ^|^| 5000;
echo.
echo app.use^(cors^(^)^);
echo app.use^(express.json^(^)^);
echo.
echo const pool = new Pool^({
echo   user: process.env.DB_USER,
echo   host: process.env.DB_HOST,
echo   database: process.env.DB_NAME,
echo   password: process.env.DB_PASSWORD,
echo   port: process.env.DB_PORT,
echo }^);
echo.
echo pool.query^('SELECT NOW^(^)', ^(err, res^) =^> {
echo   if ^(err^) {
echo     console.error^('❌ Database connection error:', err^);
echo   } else {
echo     console.log^('✅ Database connected successfully'^);
echo   }
echo }^);
echo.
echo // Generic entity routes (simplified from full bash script outline)
echo app.get^('/api/entities/:entityName', async ^(req, res^) =^> {
echo   try {
echo     const { entityName } = req.params;
echo     const ^(sort, limit^) = req.query;
echo     let query = `SELECT * FROM ${entityName}`;
echo     if ^(sort^) {
echo       const sortField = sort.startsWith^('-'^) ? sort.slice^(1^) : sort;
echo       const sortOrder = sort.startsWith^('-'^) ? 'DESC' : 'ASC';
echo       query += ` ORDER BY ${sortField} ${sortOrder}`;
echo     }
echo     if ^(limit^) query += ` LIMIT ${parseInt^(limit^)}`;
echo     const result = await pool.query^(query^);
echo     res.json^(result.rows^);
echo   } catch ^(error^) {
echo     res.status^(500^).json^({ error: error.message }^);
echo   }
echo }^);
echo.
echo app.post^('/api/entities/:entityName/filter', async ^(req, res^) =^> {
echo   try {
echo     const { entityName } = req.params;
echo     const { query: filterQuery, sort, limit } = req.body;
echo     let queryStr = `SELECT * FROM ${entityName}`;
echo     const values = [];
echo     let paramIndex = 1;
echo     if ^(filterQuery && Object.keys^(filterQuery^).length ^> 0^) {
echo       const conditions = Object.entries^(filterQuery^).map^(([key, value]) =^> {
echo         values.push^(value^);
echo         return `${key} = $${paramIndex++}`;
echo       }^);
echo       queryStr += ` WHERE ${conditions.join^(' AND '^)}`;
echo     }
echo     if ^(sort^) {
echo       const sortField = sort.startsWith^('-'^) ? sort.slice^(1^) : sort;
echo       const sortOrder = sort.startsWith^('-'^) ? 'DESC' : 'ASC';
echo       queryStr += ` ORDER BY ${sortField} ${sortOrder}`;
echo     }
echo     if ^(limit^) queryStr += ` LIMIT ${parseInt^(limit^)}`;
echo     const result = await pool.query^(queryStr, values^);
echo     res.json^(result.rows^);
echo   } catch ^(error^) {
echo     res.status^(500^).json^({ error: error.message }^);
echo   }
echo }^);
echo.
echo app.post^('/api/entities/:entityName', async ^(req, res^) =^> {
echo   try {
echo     const { entityName } = req.params;
echo     const data = req.body;
echo     const columns = Object.keys^(data^);
echo     const values = Object.values^(data^);
echo     const placeholders = values.map^((_, i^) =^> `$${i + 1}`^).join^(', '^);
echo     const query = `INSERT INTO ${entityName} ^(${columns.join^(', '^)}^)^ VALUES ^(${placeholders}^)^ RETURNING *`;
echo     const result = await pool.query^(query, values^);
echo     res.status^(201^).json^(result.rows[0]^);
echo   } catch ^(error^) {
echo     res.status^(500^).json^({ error: error.message }^);
echo   }
echo }^);
echo.
echo app.put^('/api/entities/:entityName/:id', async ^(req, res^) =^> {
echo   try {
echo     const { entityName, id } = req.params;
echo     const data = req.body;
echo     const updates = Object.keys^(data^).map^((key, i^) =^> `${key} = $${i + 1}`^).join^(', '^);
echo     const values = [...Object.values^(data^), id];
echo     const query = `UPDATE ${entityName} SET ${updates} WHERE id = $${values.length} RETURNING *`;
echo     const result = await pool.query^(query, values^);
echo     res.json^(result.rows[0]^);
echo   } catch ^(error^) {
echo     res.status^(500^).json^({ error: error.message }^);
echo   }
echo }^);
echo.
echo app.delete^('/api/entities/:entityName/:id', async ^(req, res^) =^> {
echo   try {
echo     const { entityName, id } = req.params;
echo     await pool.query^(`DELETE FROM ${entityName} WHERE id = $1`, [id]^);
echo     res.json^({ message: 'Deleted successfully' }^);
echo   } catch ^(error^) {
echo     res.status^(500^).json^({ error: error.message }^);
echo   }
echo }^);
echo.
echo app.get^('/api/auth/me', ^(req, res^) =^> {
echo   res.json^({ id: '1', email: 'admin@cricketclub.com', full_name: 'Admin User', role: 'admin' }^);
echo }^);
echo.
echo app.listen^(PORT, ^(^) =^> {
echo   console.log^(`🚀 Server running on http://localhost:${PORT}`^);
echo }^);
) > server.js

:: Create .env
echo %BLUE%ℹ️  Creating .env file...%NC%
(
echo DB_USER=%DB_USER%
echo DB_PASSWORD=%DB_PASSWORD%
echo DB_HOST=%DB_HOST%
echo DB_PORT=%DB_PORT%
echo DB_NAME=%DB_NAME%
echo PORT=%BACKEND_PORT%
echo NODE_ENV=development
echo JWT_SECRET=your_super_secret_jwt_key_change_in_production
echo FRONTEND_URL=http://localhost:%FRONTEND_PORT%
) > .env

cd ..\..

echo %GREEN%✅ Backend setup completed%NC%
echo.
pause

:: =============================================================================
:: FRONTEND SETUP
:: =============================================================================

echo %BLUE%============================================%NC%
echo %BLUE%Setting Up Frontend Application%NC%
echo %BLUE%============================================%NC%
echo.

cd %PROJECT_NAME%

echo %BLUE%ℹ️  Creating React application... (This may take a few minutes)%NC%
call npx create-react-app frontend > nul

cd frontend

:: Install dependencies
echo %BLUE%ℹ️  Installing frontend dependencies...%NC%
call npm install @tanstack/react-query react-router-dom axios > nul

:: Create .env
echo %BLUE%ℹ️  Creating .env file...%NC%
(
echo REACT_APP_API_URL=http://localhost:%BACKEND_PORT%/api
echo REACT_APP_NAME=Cricket Club Management System
echo REACT_APP_ENV=development
) > .env

cd ..\..

echo %GREEN%✅ Frontend setup completed%NC%
echo.
pause

:: =============================================================================
:: CREATE START SCRIPTS
:: =============================================================================

echo %BLUE%============================================%NC%
echo %BLUE%Creating Start Scripts%NC%
echo %BLUE%============================================%NC%
echo.

cd %PROJECT_NAME%

:: Backend start script
echo %BLUE%ℹ️  Creating start-backend.bat...%NC%
(
echo @echo off
echo cd backend
echo echo 🚀 Starting backend server...
echo npm run dev
) > start-backend.bat

:: Frontend start script
echo %BLUE%ℹ️  Creating start-frontend.bat...%NC%
(
echo @echo off
echo cd frontend
echo echo 🚀 Starting frontend application...
echo npm start
) > start-frontend.bat

:: Combined start script
echo %BLUE%ℹ️  Creating start-all.bat...%NC%
(
echo @echo off
echo echo 🚀 Starting Cricket Club Management System...
echo.
echo start "Cricket Club Backend" cmd /k "cd backend && npm run dev"
echo timeout /t 5 /nobreak ^> nul
echo start "Cricket Club Frontend" cmd /k "cd frontend && npm start"
echo.
echo echo %GREEN%✅ Both backend and frontend started! Check the separate command prompts for output.%NC%
echo echo %BLUE%ℹ️  Frontend: http://localhost:%FRONTEND_PORT%%NC%
echo echo %BLUE%ℹ️  Backend: http://localhost:%BACKEND_PORT%%NC%
) > start-all.bat

cd ..

echo %GREEN%✅ Start scripts created%NC%
echo.

:: =============================================================================
:: CREATE README
:: =============================================================================

echo %BLUE%============================================%NC%
echo %BLUE%Creating Documentation%NC%
echo %BLUE%============================================%NC%
echo.

cd %PROJECT_NAME%

echo %BLUE%ℹ️  Creating README.md...%NC%
(
echo # Cricket Club Management System

echo ## Quick Start

echo ### Start Both (Recommended)
echo ```bash
echo start-all.bat
echo ```

echo ### Start Backend Only
echo ```bash
echo start-backend.bat
echo ```

echo ### Start Frontend Only
echo ```bash
echo start-frontend.bat
echo ```

echo ## Access

echo - **Frontend**: http://localhost:%FRONTEND_PORT%
echo - **Backend API**: http://localhost:%BACKEND_PORT%/api

echo ## Database Credentials

echo - **Database**: %DB_NAME%
echo - **User**: %DB_USER%
echo - **Password**: %DB_PASSWORD%
echo - **Host**: %DB_HOST%
echo - **Port**: %DB_PORT%

echo ## Default Login

echo - **Email**: admin@cricketclub.com
echo - **Role**: admin

echo ## Project Structure

echo \`\`\`
echo %PROJECT_NAME%\
echo ├── backend\          # Express.js API server
echo │   ├── server.js     # Main server file
echo │   ├── .env          # Environment variables
echo │   └── package.json
echo ├── frontend\         # React application
echo │   ├── src\
echo │   ├── public\
echo │   └── package.json
echo ├── start-backend.bat
echo ├── start-frontend.bat
echo └── start-all.bat
echo \`\`\`

echo ## Support

echo For issues or questions, refer to the setup documentation.
) > README.md

cd ..

echo %GREEN%✅ README created%NC%
echo.

:: =============================================================================
:: FINAL SUMMARY
:: =============================================================================

cls

echo %GREEN%╔═══════════════════════════════════════════════════════════╗%NC%
echo %GREEN%║                                                           ║%NC%
echo %GREEN%║     CRICKET CLUB MANAGEMENT SYSTEM - SETUP COMPLETE!      ║%NC%
echo %GREEN%║                                                           ║%NC%
echo %GREEN%╚═══════════════════════════════════════════════════════════╝%NC%
echo.
echo %GREEN%✅ PostgreSQL database configured%NC%
echo %GREEN%✅ Backend server ready%NC%
echo %GREEN%✅ Frontend application ready%NC%
echo.
echo %BLUE%ℹ️  To start the application:%NC%
echo.
echo   %YELLOW%cd %PROJECT_NAME%%NC%
echo   %YELLOW%start-all.bat%NC%
echo.
echo %BLUE%ℹ️  Access points:%NC%
echo   Frontend:  %BLUE%http://localhost:%FRONTEND_PORT%%NC%
echo   Backend:   %BLUE%http://localhost:%BACKEND_PORT%%NC%
echo.
echo %GREEN%Happy coding! 🏏%NC%
echo.
pause

endlocal