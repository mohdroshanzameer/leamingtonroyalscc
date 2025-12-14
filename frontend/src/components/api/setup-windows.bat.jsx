@echo off
REM =============================================================================
REM CRICKET CLUB MANAGEMENT SYSTEM - WINDOWS SETUP SCRIPT (FIXED)
REM =============================================================================

setlocal enabledelayedexpansion

set "DB_NAME=cricket_club_db"
set "DB_USER=cricket_admin"
set "DB_PASSWORD=CricketClub2025!"
set "DB_HOST=localhost"
set "DB_PORT=5432"
set "BACKEND_PORT=5000"
set "FRONTEND_PORT=3000"
set "PROJECT_NAME=cricket-club-app"

echo.
echo ============================================
echo  CRICKET CLUB MANAGEMENT SYSTEM - SETUP
echo ============================================
echo.
pause

net session >nul 2>&1
if %errorLevel% neq 0 (
    echo ERROR: Administrator privileges required
    echo Please right-click and select "Run as Administrator"
    pause
    exit /b 1
)

echo Running with Administrator privileges...
echo.

echo ============================================
echo Checking Prerequisites
echo ============================================
echo.

where node >nul 2>&1
if %errorLevel% equ 0 (
    for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
    echo [OK] Node.js: !NODE_VERSION!
) else (
    echo [ERROR] Node.js not found
    echo Install from: https://nodejs.org/
    pause
    exit /b 1
)

where npm >nul 2>&1
if %errorLevel% equ 0 (
    for /f "tokens=*" %%i in ('npm --version') do set NPM_VERSION=%%i
    echo [OK] npm: !NPM_VERSION!
) else (
    echo [ERROR] npm not found
    pause
    exit /b 1
)

where psql >nul 2>&1
if %errorLevel% equ 0 (
    echo [OK] PostgreSQL installed
) else (
    echo [ERROR] PostgreSQL not found
    echo Install from: https://www.postgresql.org/download/windows/
    pause
    exit /b 1
)

echo.
echo All prerequisites met!
echo.
pause

echo ============================================
echo Setting Up PostgreSQL Database
echo ============================================
echo.

set /p "POSTGRES_PASSWORD=Enter PostgreSQL superuser password: "

echo Creating database and user...
psql -U postgres -c "CREATE DATABASE %DB_NAME%;" 2>nul
psql -U postgres -c "CREATE USER %DB_USER% WITH PASSWORD '%DB_PASSWORD%';" 2>nul
psql -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE %DB_NAME% TO %DB_USER%;" 2>nul

echo Database created successfully
echo.

echo Creating database schema...
(
echo CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
echo CREATE TABLE users ^(id UUID PRIMARY KEY DEFAULT uuid_generate_v4^(^), email VARCHAR^(255^) UNIQUE NOT NULL, full_name VARCHAR^(255^), role VARCHAR^(50^) DEFAULT 'user', created_date TIMESTAMP DEFAULT NOW^(^)^);
echo CREATE TABLE teams ^(id UUID PRIMARY KEY DEFAULT uuid_generate_v4^(^), name VARCHAR^(255^) NOT NULL, short_name VARCHAR^(50^), is_home_team BOOLEAN DEFAULT FALSE, status VARCHAR^(50^) DEFAULT 'Active', created_date TIMESTAMP DEFAULT NOW^(^)^);
echo CREATE TABLE team_players ^(id UUID PRIMARY KEY DEFAULT uuid_generate_v4^(^), team_id UUID REFERENCES teams^(id^), player_name VARCHAR^(255^) NOT NULL, email VARCHAR^(255^) UNIQUE, role VARCHAR^(50^) DEFAULT 'Batsman', matches_played INTEGER DEFAULT 0, runs_scored INTEGER DEFAULT 0, wickets_taken INTEGER DEFAULT 0, created_date TIMESTAMP DEFAULT NOW^(^)^);
echo CREATE TABLE tournaments ^(id UUID PRIMARY KEY DEFAULT uuid_generate_v4^(^), name VARCHAR^(255^) NOT NULL, format VARCHAR^(50^) DEFAULT 'league', status VARCHAR^(50^) DEFAULT 'draft', overs_per_match INTEGER DEFAULT 20, created_date TIMESTAMP DEFAULT NOW^(^)^);
echo CREATE TABLE news ^(id UUID PRIMARY KEY DEFAULT uuid_generate_v4^(^), title VARCHAR^(255^) NOT NULL, content TEXT NOT NULL, category VARCHAR^(100^), created_date TIMESTAMP DEFAULT NOW^(^)^);
echo CREATE TABLE events ^(id UUID PRIMARY KEY DEFAULT uuid_generate_v4^(^), title VARCHAR^(255^) NOT NULL, event_type VARCHAR^(50^) NOT NULL, date TIMESTAMP NOT NULL, status VARCHAR^(50^) DEFAULT 'Published', created_date TIMESTAMP DEFAULT NOW^(^)^);
) > schema.sql

psql -U %DB_USER% -d %DB_NAME% -f schema.sql
del schema.sql

echo Database schema applied
echo.
pause

echo ============================================
echo Setting Up Backend Server
echo ============================================
echo.

mkdir %PROJECT_NAME%\backend 2>nul
cd %PROJECT_NAME%\backend

echo Initializing project...
call npm init -y

echo Installing dependencies...
call npm install express pg cors dotenv
call npm install --save-dev nodemon

echo Creating server...
(
echo const express = require^('express'^);
echo const cors = require^('cors'^);
echo const { Pool } = require^('pg'^);
echo require^('dotenv'^).config^(^);
echo const app = express^(^);
echo const PORT = process.env.PORT ^|^| 5000;
echo app.use^(cors^(^)^);
echo app.use^(express.json^(^)^);
echo const pool = new Pool^({user: process.env.DB_USER, host: process.env.DB_HOST, database: process.env.DB_NAME, password: process.env.DB_PASSWORD, port: process.env.DB_PORT}^);
echo app.get^('/api/entities/:entityName', async ^(req, res^) =^> {try {const result = await pool.query^(`SELECT * FROM ${req.params.entityName}`^); res.json^(result.rows^);} catch^(e^) {res.status^(500^).json^({error: e.message}^);}^}^);
echo app.get^('/api/auth/me', ^(req, res^) =^> res.json^({id:'1',email:'admin@club.com',full_name:'Admin',role:'admin'}^)^);
echo app.listen^(PORT, ^(^) =^> console.log^(`Server: http://localhost:${PORT}`^)^);
) > server.js

(
echo DB_USER=%DB_USER%
echo DB_PASSWORD=%DB_PASSWORD%
echo DB_HOST=%DB_HOST%
echo DB_PORT=%DB_PORT%
echo DB_NAME=%DB_NAME%
echo PORT=%BACKEND_PORT%
) > .env

cd ..\..

echo Backend setup complete
echo.
pause

echo ============================================
echo Creating Start Scripts
echo ============================================
echo.

cd %PROJECT_NAME%

(
echo @echo off
echo cd backend
echo npm run dev
) > start-backend.bat

(
echo @echo off
echo echo Starting system...
echo start "Backend" cmd /k "cd backend && npm run dev"
echo timeout /t 5 /nobreak ^> nul
echo echo Backend started. Open http://localhost:%BACKEND_PORT%
) > start.bat

cd ..

echo Scripts created
echo.

echo ============================================
echo  SETUP COMPLETE!
echo ============================================
echo.
echo Database: %DB_NAME%
echo User: %DB_USER%
echo Password: %DB_PASSWORD%
echo.
echo To start:
echo   cd %PROJECT_NAME%
echo   start.bat
echo.
echo Access: http://localhost:%BACKEND_PORT%
echo.
pause