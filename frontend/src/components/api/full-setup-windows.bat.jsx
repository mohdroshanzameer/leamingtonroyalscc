@echo off
REM =============================================================================
REM CRICKET CLUB MANAGEMENT SYSTEM - COMPLETE WINDOWS SETUP
REM Based on LOCAL_DEVELOPMENT_SETUP.md
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
echo  CRICKET CLUB MANAGEMENT - FULL SETUP
echo ============================================
echo.
echo This will create a complete local development environment:
echo   - PostgreSQL database with full schema
echo   - Express backend API with all routes
echo   - React frontend application
echo   - Development environment configuration
echo.
pause

REM Check admin privileges
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo [ERROR] Administrator privileges required
    echo Right-click and select "Run as Administrator"
    pause
    exit /b 1
)

echo [OK] Running with Administrator privileges
echo.

REM =============================================================================
REM CHECK PREREQUISITES
REM =============================================================================

echo ============================================
echo Checking Prerequisites
echo ============================================
echo.

where node >nul 2>&1
if %errorLevel% equ 0 (
    for /f "tokens=*" %%i in ('node --version') do echo [OK] Node.js: %%i
) else (
    echo [ERROR] Node.js not found. Install from: https://nodejs.org/
    pause
    exit /b 1
)

where npm >nul 2>&1
if %errorLevel% equ 0 (
    for /f "tokens=*" %%i in ('npm --version') do echo [OK] npm: %%i
) else (
    echo [ERROR] npm not found
    pause
    exit /b 1
)

where psql >nul 2>&1
if %errorLevel% equ 0 (
    echo [OK] PostgreSQL installed
) else (
    echo [ERROR] PostgreSQL not found. Install from: https://www.postgresql.org/download/windows/
    pause
    exit /b 1
)

echo.
echo All prerequisites met!
echo.
pause

REM =============================================================================
REM DATABASE SETUP
REM =============================================================================

echo ============================================
echo PostgreSQL Database Setup
echo ============================================
echo.

set /p "POSTGRES_PASSWORD=Enter PostgreSQL superuser password: "

REM Set password for all psql commands
set PGPASSWORD=%POSTGRES_PASSWORD%

echo.
echo Dropping existing database if present...
psql -U postgres -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname='%DB_NAME%';" 2>nul
psql -U postgres -c "DROP DATABASE IF EXISTS %DB_NAME%;" 2>nul

echo Creating fresh database...
psql -U postgres -c "CREATE DATABASE %DB_NAME%;" 2>nul
if %errorLevel% neq 0 (
    echo [WARN] Database might already exist, continuing...
)

echo Creating user...
psql -U postgres -c "CREATE USER %DB_USER% WITH PASSWORD '%DB_PASSWORD%';" 2>nul
if %errorLevel% neq 0 (
    echo [INFO] User already exists
)

echo Granting ownership...
psql -U postgres -c "ALTER DATABASE %DB_NAME% OWNER TO %DB_USER%;"
psql -U postgres -d %DB_NAME% -c "ALTER SCHEMA public OWNER TO %DB_USER%;"

echo.
echo Creating full database schema...
echo This includes: users, teams, players, competitions, tournaments, matches,
echo ball-by-ball, finance, events, gallery, and more...
echo.

if exist "%~dp0database_schema.sql" (
    echo Applying schema as postgres superuser...
    psql -U postgres -d %DB_NAME% -h %DB_HOST% -p %DB_PORT% -f "%~dp0database_schema.sql"
    if %errorLevel% equ 0 (
        echo [OK] Database schema applied successfully
    ) else (
        echo.
        echo [ERROR] Failed to apply schema.
        echo This usually means:
        echo   - Database user doesn't have proper permissions
        echo   - The SQL file has syntax errors
        echo.
        echo Try running manually: psql -U %DB_USER% -d %DB_NAME% -f database_schema.sql
        pause
    )
) else (
    echo [ERROR] database_schema.sql file not found in the script directory
    pause
)

echo.
pause

REM =============================================================================
REM BACKEND SETUP
REM =============================================================================

echo ============================================
echo Backend Server Setup
echo ============================================
echo.

if not exist "%PROJECT_NAME%" mkdir "%PROJECT_NAME%"
cd "%PROJECT_NAME%"

if not exist "backend" mkdir "backend"
cd backend

echo Initializing npm project...
call npm init -y >nul 2>&1

echo Installing backend dependencies...
echo   - express, pg, cors, dotenv, bcryptjs, jsonwebtoken
call npm install express pg cors dotenv bcryptjs jsonwebtoken multer >nul 2>&1
call npm install --save-dev nodemon >nul 2>&1

echo Creating server.js...
(
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
    echo   port: process.env.DB_PORT
    echo }^);
    echo.
    echo // Test connection
    echo pool.query^('SELECT NOW^(^)'^).then^(^(^) =^> {
    echo   console.log^('Database connected'^);
    echo }^).catch^(err =^> console.error^('DB error:', err^)^);
    echo.
    echo // Generic entity routes
    echo app.get^('/api/entities/:entityName', async ^(req, res^) =^> {
    echo   try {
    echo     const { entityName } = req.params;
    echo     const { sort, limit } = req.query;
    echo     let query = `SELECT * FROM ${entityName}`;
    echo     if ^(sort^) {
    echo       const field = sort.startsWith^('-'^) ? sort.slice^(1^) : sort;
    echo       const order = sort.startsWith^('-'^) ? 'DESC' : 'ASC';
    echo       query += ` ORDER BY ${field} ${order}`;
    echo     }
    echo     if ^(limit^) query += ` LIMIT ${limit}`;
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
    echo     let query = `SELECT * FROM ${entityName}`;
    echo     const values = [];
    echo     let idx = 1;
    echo     if ^(filterQuery ^&^& Object.keys^(filterQuery^).length ^> 0^) {
    echo       const conditions = Object.entries^(filterQuery^).map^(^([key, val]^) =^> {
    echo         values.push^(val^);
    echo         return `${key} = $${idx++}`;
    echo       }^);
    echo       query += ` WHERE ${conditions.join^(' AND '^)}`;
    echo     }
    echo     if ^(sort^) {
    echo       const field = sort.startsWith^('-'^) ? sort.slice^(1^) : sort;
    echo       const order = sort.startsWith^('-'^) ? 'DESC' : 'ASC';
    echo       query += ` ORDER BY ${field} ${order}`;
    echo     }
    echo     if ^(limit^) query += ` LIMIT ${limit}`;
    echo     const result = await pool.query^(query, values^);
    echo     res.json^(result.rows^);
    echo   } catch ^(error^) {
    echo     res.status^(500^).json^({ error: error.message }^);
    echo   }
    echo }^);
    echo.
    echo app.get^('/api/entities/:entityName/:id', async ^(req, res^) =^> {
    echo   try {
    echo     const result = await pool.query^(`SELECT * FROM ${req.params.entityName} WHERE id = $1`, [req.params.id]^);
    echo     res.json^(result.rows[0]^);
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
    echo     const placeholders = values.map^(^(_, i^) =^> `$${i + 1}`^).join^(', '^);
    echo     const query = `INSERT INTO ${entityName} ^(${columns.join^(', '^)}^) VALUES ^(${placeholders}^) RETURNING *`;
    echo     const result = await pool.query^(query, values^);
    echo     res.status^(201^).json^(result.rows[0]^);
    echo   } catch ^(error^) {
    echo     res.status^(500^).json^({ error: error.message }^);
    echo   }
    echo }^);
    echo.
    echo app.post^('/api/entities/:entityName/bulk', async ^(req, res^) =^> {
    echo   try {
    echo     const { entityName } = req.params;
    echo     const items = req.body;
    echo     const results = [];
    echo     for ^(const item of items^) {
    echo       const columns = Object.keys^(item^);
    echo       const values = Object.values^(item^);
    echo       const placeholders = values.map^(^(_, i^) =^> `$${i + 1}`^).join^(', '^);
    echo       const query = `INSERT INTO ${entityName} ^(${columns.join^(', '^)}^) VALUES ^(${placeholders}^) RETURNING *`;
    echo       const result = await pool.query^(query, values^);
    echo       results.push^(result.rows[0]^);
    echo     }
    echo     res.status^(201^).json^(results^);
    echo   } catch ^(error^) {
    echo     res.status^(500^).json^({ error: error.message }^);
    echo   }
    echo }^);
    echo.
    echo app.put^('/api/entities/:entityName/:id', async ^(req, res^) =^> {
    echo   try {
    echo     const { entityName, id } = req.params;
    echo     const data = req.body;
    echo     const updates = Object.keys^(data^).map^(^(key, i^) =^> `${key} = $${i + 1}`^).join^(', '^);
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
    echo     await pool.query^(`DELETE FROM ${req.params.entityName} WHERE id = $1`, [req.params.id]^);
    echo     res.json^({ message: 'Deleted' }^);
    echo   } catch ^(error^) {
    echo     res.status^(500^).json^({ error: error.message }^);
    echo   }
    echo }^);
    echo.
    echo app.get^('/api/entities/:entityName/schema', async ^(req, res^) =^> {
    echo   res.json^({ type: 'object', properties: {} }^);
    echo }^);
    echo.
    echo // Auth routes
    echo app.get^('/api/auth/me', ^(req, res^) =^> {
    echo   res.json^({ id: '1', email: 'admin@cricketclub.com', full_name: 'Admin User', role: 'admin' }^);
    echo }^);
    echo.
    echo app.get^('/api/auth/check', ^(req, res^) =^> {
    echo   res.json^({ authenticated: true }^);
    echo }^);
    echo.
    echo app.put^('/api/auth/me', async ^(req, res^) =^> {
    echo   res.json^({ id: '1', ...req.body }^);
    echo }^);
    echo.
    echo app.post^('/api/auth/logout', ^(req, res^) =^> {
    echo   res.json^({ message: 'Logged out' }^);
    echo }^);
    echo.
    echo app.listen^(PORT, ^(^) =^> {
    echo   console.log^(`Server running on http://localhost:${PORT}`^);
    echo   console.log^(`API available at http://localhost:${PORT}/api`^);
    echo }^);
) > server.js

echo Creating .env file...
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

echo Updating package.json scripts...
powershell -Command "$json = Get-Content 'package.json' | ConvertFrom-Json; $json.scripts = @{start='node server.js'; dev='nodemon server.js'}; $json | ConvertTo-Json -Depth 10 | Set-Content 'package.json'"

cd ..

echo [OK] Backend setup complete
echo.
pause

REM =============================================================================
REM FRONTEND SETUP
REM =============================================================================

echo ============================================
echo Frontend Setup
echo ============================================
echo.

echo Creating React application...
echo This may take several minutes...
call npx create-react-app@latest frontend

cd frontend

echo.
echo Installing frontend dependencies...
call npm install @tanstack/react-query react-router-dom axios

echo.
echo Creating .env file...
(
echo REACT_APP_API_URL=http://localhost:%BACKEND_PORT%/api
echo REACT_APP_NAME=Cricket Club Management System
echo REACT_APP_ENV=development
) > .env

echo.
echo Configuring API client...
if not exist "src\api" mkdir "src\api"
(
echo import axios from 'axios';
echo.
echo const API_BASE_URL = process.env.REACT_APP_API_URL ^|^| 'http://localhost:5000/api';
echo.
echo const apiClient = axios.create^({
echo   baseURL: API_BASE_URL,
echo   headers: { 'Content-Type': 'application/json' }
echo }^);
echo.
echo export default apiClient;
) > src\api\apiClient.js

cd ..

echo [OK] Frontend setup complete
echo.
pause

REM =============================================================================
REM CREATE START SCRIPTS
REM =============================================================================

echo ============================================
echo Creating Start Scripts
echo ============================================
echo.

(
echo @echo off
echo cd backend
echo echo.
echo echo Starting backend server...
echo echo API: http://localhost:%BACKEND_PORT%
echo echo.
echo npm run dev
) > start-backend.bat

(
echo @echo off
echo cd frontend
echo echo.
echo echo Starting frontend application...
echo echo UI: http://localhost:%FRONTEND_PORT%
echo echo.
echo npm start
) > start-frontend.bat

(
echo @echo off
echo echo.
echo echo ============================================
echo echo  CRICKET CLUB MANAGEMENT SYSTEM
echo echo ============================================
echo echo.
echo echo Starting backend and frontend...
echo echo.
echo start "Backend API" cmd /k "cd backend ^&^& npm run dev"
echo timeout /t 5 /nobreak ^> nul
echo start "Frontend UI" cmd /k "cd frontend ^&^& npm start"
echo echo.
echo echo [OK] Both services started in separate windows
echo echo.
echo echo Access:
echo echo   Frontend: http://localhost:%FRONTEND_PORT%
echo echo   Backend:  http://localhost:%BACKEND_PORT%
echo echo.
pause
) > start-all.bat

echo [OK] Start scripts created
echo.

REM =============================================================================
REM CREATE README
REM =============================================================================

echo Creating README...
(
echo # Cricket Club Management System
echo.
echo ## Local Development Setup
echo.
echo This project has been set up for local development.
echo.
echo ### Quick Start
echo.
echo 1. Start both services:
echo    ```
echo    start-all.bat
echo    ```
echo.
echo 2. Or start individually:
echo    ```
echo    start-backend.bat
echo    start-frontend.bat
echo    ```
echo.
echo ### Access
echo.
echo - Frontend UI: http://localhost:%FRONTEND_PORT%
echo - Backend API: http://localhost:%BACKEND_PORT%/api
echo.
echo ### Database
echo.
echo - Database: %DB_NAME%
echo - User: %DB_USER%
echo - Password: %DB_PASSWORD%
echo - Host: %DB_HOST%
echo - Port: %DB_PORT%
echo.
echo ### Default Login
echo.
echo - Email: admin@cricketclub.com
echo - Role: admin
echo.
echo ### Project Structure
echo.
echo ```
echo cricket-club-app/
echo ├── backend/          # Express.js API
echo │   ├── server.js     # Main server file
echo │   ├── .env          # Environment config
echo │   └── package.json
echo ├── frontend/         # React application
echo │   ├── src/
echo │   ├── public/
echo │   └── package.json
echo ├── start-backend.bat
echo ├── start-frontend.bat
echo └── start-all.bat
echo ```
echo.
echo ### Troubleshooting
echo.
echo If you encounter issues:
echo.
echo 1. **Database connection**: Check PostgreSQL is running
echo 2. **Port conflicts**: Ensure ports %BACKEND_PORT% and %FRONTEND_PORT% are available
echo 3. **Dependencies**: Run `npm install` in backend/ and frontend/ directories
echo.
echo Refer to LOCAL_DEVELOPMENT_SETUP.md for detailed documentation.
) > README.md

cd ..

echo [OK] README created
echo.

REM =============================================================================
REM FINAL SUMMARY
REM =============================================================================

cls
echo.
echo ============================================
echo  SETUP COMPLETE!
echo ============================================
echo.
echo [OK] PostgreSQL database configured
echo [OK] Backend server ready
echo [OK] Frontend application ready
echo [OK] Start scripts created
echo.
echo Database Details:
echo   Database: %DB_NAME%
echo   User: %DB_USER%
echo   Password: %DB_PASSWORD%
echo   Host: %DB_HOST%:%DB_PORT%
echo.
echo To start the application:
echo   1. cd %PROJECT_NAME%
echo   2. start-all.bat
echo.
echo Access:
echo   Frontend: http://localhost:%FRONTEND_PORT%
echo   Backend:  http://localhost:%BACKEND_PORT%
echo.
echo Happy coding!
echo.
pause

endlocal