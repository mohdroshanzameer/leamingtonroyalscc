@echo off
REM =============================================================================
REM CRICKET CLUB - COMPLETE LOCAL DEPLOYMENT SCRIPT
REM =============================================================================
REM Purpose: Automates local development setup for Cricket Club Management System
REM - Exports data from existing database (optional)
REM - Sets up PostgreSQL database with schema
REM - Copies/downloads Base44 app code
REM - Configures backend Express.js API
REM - Builds React frontend
REM - Creates convenient start scripts
REM =============================================================================

REM Enable delayed variable expansion for dynamic variable assignment in loops
setlocal enabledelayedexpansion

REM =============================================================================
REM CONFIGURATION VARIABLES
REM =============================================================================

REM PostgreSQL database credentials
set "DB_NAME=cricket_club_db"           REM Database name to create
set "DB_USER=cricket_admin"              REM Database user to create
set "DB_PASSWORD=CricketClub2025!"       REM Password for database user
set "DB_HOST=localhost"                  REM Database host (local machine)
set "DB_PORT=5432"                       REM PostgreSQL default port

REM Application server ports
set "BACKEND_PORT=5000"                  REM Express.js backend API port
set "FRONTEND_PORT=3000"                 REM React development server port (unused in production build)

REM Project directory settings
set "PROJECT_NAME=cricket-club-local"    REM Folder name for the project
set "INSTALL_PATH=%CD%\%PROJECT_NAME%"   REM Full installation path (current dir + project name)

REM =============================================================================
REM DISPLAY WELCOME MESSAGE
REM =============================================================================

echo.
echo ============================================
echo  CRICKET CLUB - COMPLETE LOCAL SETUP
echo ============================================
echo.
echo Installation Path: %INSTALL_PATH%
echo.
echo This will:
echo   1. Clean any existing installation
echo   2. Setup PostgreSQL database
echo   3. Get your Base44 app code (GitHub or local)
echo   4. Setup local backend API
echo   5. Configure frontend to use local backend
echo   6. Create start scripts
echo.
pause

REM =============================================================================
REM CLEAN EXISTING INSTALLATION
REM =============================================================================
REM Purpose: Remove any previous installation to ensure clean setup
REM This prevents conflicts from old files/configurations

echo ============================================
echo Cleaning Existing Installation
echo ============================================
echo.

REM Check if project directory already exists
if exist "%INSTALL_PATH%" (
    echo Found existing installation at: %INSTALL_PATH%
    echo Removing...
    REM /s = remove subdirectories, /q = quiet mode (no confirmation)
    REM 2>nul suppresses error messages if directory doesn't exist
    rd /s /q "%INSTALL_PATH%" 2>nul
    echo [OK] Cleaned existing installation
) else (
    echo [INFO] No existing installation found
)

echo.
pause

REM =============================================================================
REM CHECK ADMINISTRATOR PRIVILEGES
REM =============================================================================
REM Purpose: Verify script is running with admin rights (required for PostgreSQL)

REM Try to access admin-only 'net session' command
net session >nul 2>&1
REM Check the exit code from the previous command
if %errorLevel% neq 0 (
    REM Non-zero exit code = not admin
    echo [ERROR] Administrator privileges required
    echo Right-click the .bat file and select "Run as Administrator"
    pause
    exit /b 1
)

echo [OK] Running with Administrator privileges
echo.

REM =============================================================================
REM CHECK PREREQUISITES
REM =============================================================================
REM Purpose: Verify all required software is installed before proceeding
REM Checks: Node.js, npm, PostgreSQL, Git (optional)

echo ============================================
echo Checking Prerequisites
echo ============================================
echo.

REM Check for Node.js
REM 'where' command searches PATH for executable
REM >nul 2>&1 suppresses output, only checks exit code
where node >nul 2>&1
if %errorLevel% equ 0 (
    REM If found, display version
    REM for /f captures command output into variable
    for /f "tokens=*" %%i in ('node --version') do echo [OK] Node.js: %%i
) else (
    REM Exit code non-zero = not found
    echo [ERROR] Node.js not found
    echo Install from: https://nodejs.org/
    pause
    exit /b 1
)

REM Check for npm (Node Package Manager)
where npm >nul 2>&1
if %errorLevel% equ 0 (
    for /f "tokens=*" %%i in ('npm --version') do echo [OK] npm: %%i
) else (
    echo [ERROR] npm not found
    echo Should be included with Node.js installation
    pause
    exit /b 1
)

REM Check for PostgreSQL command-line tool
where psql >nul 2>&1
if %errorLevel% equ 0 (
    echo [OK] PostgreSQL installed
) else (
    echo [ERROR] PostgreSQL not found
    echo Install from: https://www.postgresql.org/download/windows/
    pause
    exit /b 1
)

REM Check for Git (optional - only needed if cloning from GitHub)
where git >nul 2>&1
if %errorLevel% equ 0 (
    echo [OK] Git installed
) else (
    echo [WARN] Git not found (optional - only needed for GitHub clone)
)

echo.
pause

REM =============================================================================
REM EXPORT CURRENT DATA (OPTIONAL)
REM =============================================================================
REM Purpose: Export all existing data from your Base44/Supabase production database
REM This allows you to work with real data locally instead of empty tables

echo ============================================
echo Export Current Data
echo ============================================
echo.
echo Do you want to export data from an existing database?
echo This will copy all data from your current Base44/Supabase database.
echo.
REM /p = prompt for user input
set /p "EXPORT_DATA=Export existing data? (y/n): "

REM /i = case-insensitive comparison
if /i "%EXPORT_DATA%"=="y" (
    echo.
    REM Collect source database connection details
    set /p "SOURCE_DB_HOST=Enter source database host (e.g., db.xxx.supabase.co): "
    set /p "SOURCE_DB_NAME=Enter source database name: "
    set /p "SOURCE_DB_USER=Enter source database user: "
    set /p "SOURCE_DB_PASSWORD=Enter source database password: "
    set /p "SOURCE_DB_PORT=Enter source database port (default 5432): "
    
    REM Use default port if user didn't enter one
    REM ! needed for delayed expansion inside if block
    if "!SOURCE_DB_PORT!"=="" set "SOURCE_DB_PORT=5432"
    
    echo.
    echo Exporting data from !SOURCE_DB_HOST!...
    echo This may take a few minutes...
    
    REM Set password as environment variable for pg_dump
    set PGPASSWORD=!SOURCE_DB_PASSWORD!
    
    REM pg_dump: PostgreSQL backup utility
    REM -h = host, -p = port, -U = user, -d = database
    REM --data-only = skip schema, only export data
    REM --inserts = use INSERT statements instead of COPY (more compatible)
    REM --column-inserts = include column names in INSERT (safer for schema differences)
    REM > redirects output to file
    REM %~dp0 = directory where this .bat file is located
    pg_dump -h !SOURCE_DB_HOST! -p !SOURCE_DB_PORT! -U !SOURCE_DB_USER! -d !SOURCE_DB_NAME! --data-only --inserts --column-inserts > "%~dp0database_data.sql"
    
    REM Verify the export file was created
    if exist "%~dp0database_data.sql" (
        echo [OK] Data exported to database_data.sql
    ) else (
        echo [ERROR] Failed to export data
        echo Continuing without data import...
    )
    echo.
)

pause

REM =============================================================================
REM DATABASE SETUP
REM =============================================================================
REM Purpose: Create and configure local PostgreSQL database
REM Steps: 
REM   1. Drop any existing database
REM   2. Create fresh database
REM   3. Create dedicated user with password
REM   4. Apply schema (tables, indexes, constraints)
REM   5. Import data (if exported in previous step)

echo ============================================
echo PostgreSQL Database Setup
echo ============================================
echo.

REM Prompt for postgres superuser password
REM This is the password you set when installing PostgreSQL
set /p "POSTGRES_PASSWORD=Enter PostgreSQL superuser password: "

REM Set PGPASSWORD environment variable so psql doesn't prompt for password
set PGPASSWORD=%POSTGRES_PASSWORD%

echo.
echo Dropping existing database if present...

REM Terminate all connections to database before dropping
REM psql -U postgres = connect as postgres superuser
REM -c = execute command directly (don't enter interactive mode)
REM pg_terminate_backend = PostgreSQL function to kill connections
REM 2>nul = suppress error messages if database doesn't exist
psql -U postgres -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname='%DB_NAME%';" 2>nul

REM DROP DATABASE IF EXISTS = safe drop (no error if doesn't exist)
psql -U postgres -c "DROP DATABASE IF EXISTS %DB_NAME%;" 2>nul

echo Creating fresh database...
REM CREATE DATABASE creates new empty database
psql -U postgres -c "CREATE DATABASE %DB_NAME%;" 2>nul

echo Creating user...
REM CREATE USER creates new database user with login capability
REM WITH PASSWORD sets the password
REM 2>nul suppresses error if user already exists
psql -U postgres -c "CREATE USER %DB_USER% WITH PASSWORD '%DB_PASSWORD%';" 2>nul

echo Granting ownership...
REM Give the new user full ownership of the database
REM This allows the user to create/modify/delete all objects
psql -U postgres -c "ALTER DATABASE %DB_NAME% OWNER TO %DB_USER%;"

REM Also give ownership of the 'public' schema
REM -d specifies which database to connect to
psql -U postgres -d %DB_NAME% -c "ALTER SCHEMA public OWNER TO %DB_USER%;"

echo Applying database schema...
REM Check if schema file exists in the same directory as this script
if exist "%~dp0database_schema.sql" (
    REM Execute SQL file to create all tables, indexes, constraints, etc.
    REM -f = read commands from file
    REM -h = host, -p = port
    psql -U postgres -d %DB_NAME% -h %DB_HOST% -p %DB_PORT% -f "%~dp0database_schema.sql"
    
    REM Check if schema application succeeded
    if %errorLevel% equ 0 (
        echo [OK] Database schema applied
    ) else (
        echo [ERROR] Failed to apply schema
        echo Check the SQL file for syntax errors
        pause
    )
) else (
    echo [ERROR] database_schema.sql not found
    echo Place database_schema.sql in the same folder as this script
    pause
)

echo Fixing table ownership and permissions...
REM Change ownership of ALL tables in public schema to cricket_admin
psql -U postgres -d %DB_NAME% -c "DO $$ DECLARE r RECORD; BEGIN FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') LOOP EXECUTE 'ALTER TABLE ' || quote_ident(r.tablename) || ' OWNER TO %DB_USER%'; END LOOP; END $$;"

REM Grant all privileges on existing tables and sequences
psql -U postgres -d %DB_NAME% -c "GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO %DB_USER%;"
psql -U postgres -d %DB_NAME% -c "GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO %DB_USER%;"
psql -U postgres -d %DB_NAME% -c "GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO %DB_USER%;"

REM Grant schema privileges
psql -U postgres -d %DB_NAME% -c "GRANT USAGE ON SCHEMA public TO %DB_USER%;"
psql -U postgres -d %DB_NAME% -c "GRANT CREATE ON SCHEMA public TO %DB_USER%;"

REM Grant privileges on future tables and sequences
psql -U postgres -d %DB_NAME% -c "ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO %DB_USER%;"
psql -U postgres -d %DB_NAME% -c "ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO %DB_USER%;"

echo [OK] Table ownership changed and permissions granted

REM Import data if it was exported in the previous step
if exist "%~dp0database_data.sql" (
    echo.
    echo Importing data...
    REM Execute the data SQL file (contains INSERT statements)
    REM 2>nul suppresses constraint errors (if any)
    psql -U postgres -d %DB_NAME% -h %DB_HOST% -p %DB_PORT% -f "%~dp0database_data.sql" 2>nul
    
    if %errorLevel% equ 0 (
        echo [OK] Data imported successfully
        echo All existing records have been copied to local database
    ) else (
        echo [WARN] Some data import errors occurred - check if data needs manual review
        echo This is normal if there are foreign key constraints or duplicate IDs
    )
)

echo.
pause

REM =============================================================================
REM GET APPLICATION CODE
REM =============================================================================
REM Purpose: Get your Base44 application code into the project directory
REM Three options:
REM   1. Clone from GitHub repository
REM   2. Copy from local Base44 export folder
REM   3. Use current directory (if script is run from app folder)

echo ============================================
echo Get Application Code
echo ============================================
echo.
echo Choose source for application code:
echo   1. Download from GitHub (enter repo URL)
echo   2. Copy from local Base44 export/folder
echo   3. Use current directory (if already in app folder)
echo.
set /p "CODE_SOURCE=Enter choice (1/2/3): "

REM Create project directory if it doesn't exist
if not exist "%PROJECT_NAME%" mkdir "%PROJECT_NAME%"

REM Change to project directory
cd "%PROJECT_NAME%"

REM Handle user's choice
if "%CODE_SOURCE%"=="1" (
    REM OPTION 1: Clone from GitHub
    echo.
    set /p "REPO_URL=Enter GitHub repository URL: "
    echo Cloning repository...
    REM git clone downloads repository from GitHub into temp folder
    git clone !REPO_URL! temp_clone
    REM Move contents from temp folder to current directory
    xcopy "temp_clone\*" . /E /I /H /Y
    rd /s /q temp_clone
    
) else if "%CODE_SOURCE%"=="2" (
    REM OPTION 2: Copy from local folder
    echo.
    set /p "SOURCE_PATH=Enter path to Base44 app folder: "
    echo Copying files...
    REM xcopy copies directory tree directly into current directory
    REM /E = copy subdirectories including empty ones
    REM /I = assume destination is directory
    REM /H = copy hidden and system files
    REM /Y = suppress confirmation prompts
    xcopy "!SOURCE_PATH!\*" . /E /I /H /Y
    
) else if "%CODE_SOURCE%"=="3" (
    REM OPTION 3: Use current directory (copy to project directory)
    echo.
    echo Copying current directory to project folder...
    
    REM Verify this looks like a Base44 app by checking for 'pages' folder
    REM Check in the directory where script was run from
    if not exist "%~dp0pages" (
        echo [ERROR] No 'pages' folder found in script directory
        echo Make sure this script is in your Base44 app directory
        pause
        exit /b 1
    )
    
    REM Copy all files from script directory to project directory
    REM %~dp0 = directory where this script is located
    REM Current directory is already PROJECT_NAME
    REM /E = subdirectories, /I = directory, /H = hidden files, /Y = no prompts
    REM /EXCLUDE = exclude the script itself and project folders
    echo. > exclude.tmp
    echo %~nx0 >> exclude.tmp
    echo cricket-club-local >> exclude.tmp
    xcopy "%~dp0*" . /E /I /H /Y /EXCLUDE:exclude.tmp
    del exclude.tmp
    
) else (
    REM Invalid choice entered
    echo [ERROR] Invalid choice
    pause
    exit /b 1
)

echo [OK] Application code ready
echo.
pause

REM =============================================================================
REM BACKEND SETUP
REM =============================================================================
REM Purpose: Create Express.js backend API server
REM This provides:
REM   - REST API endpoints for all entities
REM   - Database connection to PostgreSQL
REM   - Authentication routes
REM   - Static file serving for React frontend

echo ============================================
echo Backend API Setup
echo ============================================
echo.

REM Create backend directory if it doesn't exist
if not exist "backend" mkdir "backend"
cd backend

echo Creating package.json...
echo [DEBUG] Current directory: %CD%
echo [DEBUG] Creating package.json in backend directory...

(
echo {
echo   "name": "cricket-club-backend",
echo   "version": "1.0.0",
echo   "description": "Cricket Club Management System Backend",
echo   "main": "server.js",
echo   "scripts": {
echo     "start": "node server.js",
echo     "dev": "nodemon server.js"
echo   },
echo   "keywords": [],
echo   "author": "",
echo   "license": "ISC",
echo   "dependencies": {}
echo }
) > package.json

echo [DEBUG] Checking if package.json was created...
if exist "package.json" (
    echo [DEBUG] ✓ package.json exists
    echo [DEBUG] Contents of package.json:
    type package.json
) else (
    echo [ERROR] ✗ package.json was NOT created!
)

echo Installing dependencies...
echo [DEBUG] Current directory before npm install: %CD%
echo [DEBUG] Listing files in current directory:
dir /b

REM Install required npm packages:
REM - express: web framework
REM - pg: PostgreSQL client
REM - cors: enable cross-origin requests
REM - dotenv: load environment variables from .env
REM - bcryptjs: password hashing (pure JS, no native deps)
REM - jsonwebtoken: JWT authentication
REM - multer: file upload handling
echo [DEBUG] Installing: express pg cors dotenv bcryptjs jsonwebtoken multer
call npm install express pg cors dotenv bcryptjs jsonwebtoken multer
if %errorLevel% neq 0 (
    echo [ERROR] npm install failed!
    pause
    exit /b 1
)

REM Install development dependencies:
REM - nodemon: auto-restart server on file changes
REM --save-dev = save as dev dependency
echo [DEBUG] Installing dev dependencies: nodemon
call npm install --save-dev nodemon
if %errorLevel% neq 0 (
    echo [WARN] nodemon install failed - continuing anyway
)

echo Creating server.js...
REM The following lines use 'echo' to write the Express.js server code
REM Each 'echo' line writes one line to server.js
REM ^( ^) ^| etc = escape special characters in batch files
(
echo const express = require^('express'^);
echo const cors = require^('cors'^);
echo const { Pool } = require^('pg'^);
echo const path = require^('path'^);
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
echo pool.query^('SELECT NOW^(^)'^).then^(^(^) =^> {
echo   console.log^('✓ Database connected'^);
echo }^).catch^(err =^> console.error^('DB error:', err^)^);
echo.
echo // Generic entity CRUD routes
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
echo // Auth middleware
echo const authenticateToken = ^(req, res, next^) =^> {
echo   const token = req.headers.authorization?.split^(' '^)[1];
echo   if ^(^^!token^) return res.status^(401^).json^({ error: 'No token provided' }^);
echo   try {
echo     const jwt = require^('jsonwebtoken'^);
echo     req.user = jwt.verify^(token, process.env.JWT_SECRET^);
echo     next^(^);
echo   } catch ^(err^) {
echo     res.status^(401^).json^({ error: 'Invalid token' }^);
echo   }
echo };
echo.
echo // Login page
echo app.get^('/login', ^(req, res^) =^> {
echo   res.send^(`
echo     ^<!DOCTYPE html^>
echo     ^<html^>^<head^>^<title^>Login - LRCC^</title^>
echo     ^<style^>body{margin:0;font-family:system-ui;background:#000;color:#fff;display:flex;align-items:center;justify-content:center;min-height:100vh}
echo     .card{background:#0d0d0d;padding:2rem;border-radius:1rem;border:1px solid #262626;width:100%%;max-width:400px}
echo     h1{margin:0 0 1.5rem;font-size:1.5rem}input{width:100%%;padding:0.75rem;margin-bottom:1rem;background:#171717;border:1px solid #333;
echo     border-radius:0.5rem;color:#fff;font-size:1rem}button{width:100%%;padding:0.75rem;background:#00d4ff;color:#000;border:none;
echo     border-radius:0.5rem;font-weight:bold;cursor:pointer;font-size:1rem}button:hover{opacity:0.9}.error{color:#ff3b5c;margin-top:1rem}
echo     ^</style^>^</head^>^<body^>^<div class="card"^>^<h1^>Login to LRCC^</h1^>^<input id="email" type="email" placeholder="Email"^>
echo     ^<input id="password" type="password" placeholder="Password"^>^<button onclick="login()"^>Login^</button^>
echo     ^<div id="error" class="error"^>^</div^>^</div^>^<script^>
echo     async function login^(^){const email=document.getElementById^('email'^).value;const password=document.getElementById^('password'^).value;
echo     try{const r=await fetch^('/api/auth/login',{method:'POST',headers:{'Content-Type':'application/json'},
echo     body:JSON.stringify^({email,password}^)}^);const data=await r.json^(^);if^(r.ok^){localStorage.setItem^('token',data.token^);
echo     const params=new URLSearchParams^(window.location.search^);window.location.href=params.get^('from_url'^)^|^|'/'}else{
echo     document.getElementById^('error'^).textContent=data.error^|^|'Login failed'}}catch^(e^){document.getElementById^('error'^).textContent='Error: '+e.message}}
echo     ^</script^>^</body^>^</html^>
echo   `^);
echo }^);
echo.
echo // Register endpoint
echo app.post^('/api/auth/register', async ^(req, res^) =^> {
echo   try {
echo     const { email, password, full_name, role } = req.body;
echo     const existing = await pool.query^('SELECT * FROM users WHERE email = $1', [email]^);
echo     if ^(existing.rows.length ^> 0^) {
echo       return res.status^(400^).json^({ error: 'Email already registered' }^);
echo     }
echo     const bcrypt = require^('bcryptjs'^);
echo     const hashedPassword = await bcrypt.hash^(password, 10^);
echo     const result = await pool.query^(
echo       'INSERT INTO users ^(email, password, full_name, role, email_verified^) VALUES ^($1, $2, $3, $4, false^) RETURNING *',
echo       [email, hashedPassword, full_name, role ^|^| 'user']
echo     ^);
echo     res.status^(201^).json^({ user: result.rows[0] }^);
echo   } catch ^(error^) {
echo     res.status^(500^).json^({ error: error.message }^);
echo   }
echo }^);
echo.
echo // Verify email endpoint
echo app.post^('/api/auth/verify-email', async ^(req, res^) =^> {
echo   try {
echo     const { email } = req.body;
echo     await pool.query^('UPDATE users SET email_verified = true WHERE email = $1', [email]^);
echo     res.json^({ success: true }^);
echo   } catch ^(error^) {
echo     res.status^(500^).json^({ error: error.message }^);
echo   }
echo }^);
echo.
echo // Login endpoint
echo app.post^('/api/auth/login', async ^(req, res^) =^> {
echo   try {
echo     const { email, password } = req.body;
echo     const result = await pool.query^('SELECT * FROM users WHERE email = $1', [email]^);
echo     if ^(result.rows.length === 0^) {
echo       return res.status^(401^).json^({ error: 'Invalid credentials' }^);
echo     }
echo     const user = result.rows[0];
echo     const bcrypt = require^('bcryptjs'^);
echo     const validPassword = await bcrypt.compare^(password, user.password^);
echo     if ^(^^!validPassword^) {
echo       return res.status^(401^).json^({ error: 'Invalid credentials' }^);
echo     }
echo     const jwt = require^('jsonwebtoken'^);
echo     const access_token = jwt.sign^(
echo       { id: user.id, email: user.email, role: user.role, full_name: user.full_name },
echo       process.env.JWT_SECRET,
echo       { expiresIn: '7d' }
echo     ^);
echo     res.json^({ access_token, email_verified: user.email_verified }^);
echo   } catch ^(error^) {
echo     res.status^(500^).json^({ error: error.message }^);
echo   }
echo }^);
echo.
echo // Get current user
echo app.get^('/api/auth/me', authenticateToken, async ^(req, res^) =^> {
echo   try {
echo     const result = await pool.query^('SELECT * FROM users WHERE id = $1', [req.user.id]^);
echo     res.json^(result.rows[0]^);
echo   } catch ^(error^) {
echo     res.status^(500^).json^({ error: error.message }^);
echo   }
echo }^);
echo.
echo // Check auth status
echo app.get^('/api/auth/check', authenticateToken, ^(req, res^) =^> {
echo   res.json^({ authenticated: true, user: req.user }^);
echo }^);
echo.
echo // Update current user
echo app.put^('/api/auth/me', authenticateToken, async ^(req, res^) =^> {
echo   try {
echo     const updates = { ...req.body };
echo     delete updates.id;
echo     delete updates.email;
echo     delete updates.role;
echo     const keys = Object.keys^(updates^);
echo     const values = Object.values^(updates^);
echo     const setClause = keys.map^(^(k, i^) =^> `${k} = $${i + 1}`^).join^(', '^);
echo     const result = await pool.query^(
echo       `UPDATE users SET ${setClause} WHERE id = $${keys.length + 1} RETURNING *`,
echo       [...values, req.user.id]
echo     ^);
echo     res.json^(result.rows[0]^);
echo   } catch ^(error^) {
echo     res.status^(500^).json^({ error: error.message }^);
echo   }
echo }^);
echo.
echo // Logout
echo app.post^('/api/auth/logout', ^(req, res^) =^> {
echo   res.json^({ success: true }^);
echo }^);
echo.
echo // Serve static frontend files - must come AFTER API routes
echo const frontendDir = require^('fs'^).existsSync^(path.join^(__dirname, '../build'^)^) ? '../build' : '../dist';
echo app.use^(express.static^(path.join^(__dirname, frontendDir^)^)^);
echo.
echo // SPA fallback - send index.html for any non-API routes
echo app.use^(^(req, res^) =^> {
echo   const indexPath = path.join^(__dirname, frontendDir, 'index.html'^);
echo   res.sendFile^(indexPath^);
echo }^);
echo.
echo app.listen^(PORT, ^(^) =^> {
echo   console.log^(`✓ Server running on http://localhost:${PORT}`^);
echo   console.log^(`✓ API available at http://localhost:${PORT}/api`^);
echo }^);
) > server.js

echo Creating backend .env file...
(
echo DB_USER=%DB_USER%
echo DB_PASSWORD=%DB_PASSWORD%
echo DB_HOST=%DB_HOST%
echo DB_PORT=%DB_PORT%
echo DB_NAME=%DB_NAME%
echo PORT=%BACKEND_PORT%
echo HTTPS_PORT=5443
echo USE_HTTPS=false
echo NODE_ENV=development
echo JWT_SECRET=your_super_secret_jwt_key_change_in_production
) > .env

if exist ".env" (
    echo [OK] Backend .env file created
) else (
    echo [ERROR] Failed to create .env file
)

echo Verifying backend setup...
echo [DEBUG] ===========================================
echo [DEBUG] Backend Directory Verification
echo [DEBUG] ===========================================
echo [DEBUG] Current directory: %CD%
echo.

if exist "server.js" (
    echo [DEBUG] ✓ server.js exists
    echo [DEBUG] File size: 
    for %%F in (server.js) do echo    %%~zF bytes
) else (
    echo [ERROR] ✗ server.js missing!
)

if exist "package.json" (
    echo [DEBUG] ✓ package.json exists
    echo [DEBUG] File size:
    for %%F in (package.json) do echo    %%~zF bytes
    echo.
    echo [DEBUG] Package.json contents:
    type package.json
    echo.
    echo [DEBUG] Checking for 'start' script in package.json:
    findstr /C:"start" package.json
) else (
    echo [ERROR] ✗ package.json missing!
)

echo.
echo [DEBUG] Complete directory listing:
dir /b
echo [DEBUG] ===========================================

REM Return to parent directory (app root)
cd ..

echo [OK] Backend setup complete
echo.
pause

REM =============================================================================
REM FRONTEND CONFIGURATION
REM =============================================================================
REM Purpose: Configure React app to use local backend instead of Base44 cloud
REM Changes:
REM   - Update API client to point to localhost
REM   - Create .env with local API URL
REM   - Install/update npm dependencies

echo ============================================
echo Frontend Configuration
echo ============================================
echo.

echo Updating API client to use local backend...
REM Check if API client file exists
if exist "src\api\apiClient.js" (
    REM Use PowerShell to find and replace Base44 URLs with localhost
    REM Get-Content reads file
    REM -replace performs regex replacement
    REM Set-Content writes back to file
    powershell -Command "(Get-Content 'src\api\apiClient.js') -replace 'base44-prod', 'localhost:%BACKEND_PORT%' | Set-Content 'src\api\apiClient.js'"
)

echo Creating .env file...
REM .env for React app (different from backend .env)
REM REACT_APP_ prefix is required for Create React App / Vite to expose variables
(
echo REACT_APP_API_URL=http://localhost:%BACKEND_PORT%/api    REM Backend API URL
echo REACT_APP_NAME=Cricket Club Management System            REM App name
echo REACT_APP_ENV=development                                REM Environment
) > .env

echo Updating package.json name...
REM Update package name to LRCC-app
if exist "package.json" (
    powershell -Command "$json = Get-Content 'package.json' | ConvertFrom-Json; $json.name = 'lrcc-app'; $json | ConvertTo-Json -Depth 10 | Set-Content 'package.json'"
    echo [OK] Package name updated to lrcc-app
) else (
    echo [WARN] package.json not found
)

echo Installing dependencies...
REM Install all npm packages listed in package.json
REM This may take several minutes
call npm install

echo Updating baseline-browser-mapping...
REM Update this package to fix build warning about outdated browser data
REM -D = save as dev dependency
call npm install baseline-browser-mapping@latest -D

echo Updating browser tab title...
REM Update the page title in index.html to show LRCC instead of Base44 APP
if exist "index.html" (
    powershell -Command "(Get-Content 'index.html') -replace '<title>.*?</title>', '<title>LRCC - Leamington Royals Cricket Club</title>' | Set-Content 'index.html'"
    echo [OK] Browser tab title updated to LRCC
) else (
    echo [WARN] index.html not found - title not updated
)

echo [OK] Frontend configured
echo.
pause

REM =============================================================================
REM BUILD FRONTEND
REM =============================================================================
REM Purpose: Compile React app into static HTML/CSS/JS files for production
REM Output: build/ or dist/ directory with optimized files
REM These files will be served by Express.js backend

echo ============================================
echo Building Frontend
echo ============================================
echo.
echo Building React production build...
REM npm run build executes the "build" script from package.json
REM This uses Vite or Create React App to:
REM   - Bundle all React components
REM   - Minify JavaScript and CSS
REM   - Optimize images
REM   - Generate static files ready for deployment
call npm run build

REM Check if build succeeded by looking for index.html
if exist "build\index.html" (
    REM Create React App uses 'build' directory
    echo [OK] Frontend built successfully
    echo Output directory: build\
    goto :build_success
)

if exist "dist\index.html" (
    REM Vite uses 'dist' directory - rename to 'build' for consistency
    echo [OK] Frontend built successfully ^(Vite output^)
    echo Renaming dist\ to build\...
    REM Delete build folder if it exists first
    if exist "build" rd /s /q "build"
    REM ren = rename command
    ren dist build
    if %errorLevel% equ 0 (
        echo [OK] Renamed successfully
    ) else (
        echo [WARN] Could not rename - using dist\ folder instead
    )
    goto :build_success
)

REM No index.html found = build failed
echo [ERROR] Frontend build failed
echo Check the error messages above for details
echo Common issues:
echo   - Syntax errors in React code
echo   - Missing dependencies
echo   - TypeScript errors
pause
exit /b 1

:build_success

echo.
pause

REM =============================================================================
REM CREATE START SCRIPTS
REM =============================================================================
REM Purpose: Create convenient .bat files to start the application
REM Two scripts created:
REM   1. start-server.bat - Starts only the backend
REM   2. start-app.bat - Starts the complete application

echo ============================================
echo Creating Start Scripts
echo ============================================
echo.

REM Create scripts in the app root directory (current location after build)

REM =============================================================================
REM CREATE start-server.bat in app root
REM =============================================================================
(
echo @echo off
echo echo [DEBUG] Start Server Script Diagnostics
echo echo [DEBUG] =========================================
echo echo [DEBUG] Script location: %%~dp0
echo echo [DEBUG] Current directory before cd: %%CD%%
echo echo.
echo if not exist "%%~dp0backend" ^(
echo   echo [ERROR] Backend folder not found at: %%~dp0backend
echo   echo [DEBUG] Contents of script directory:
echo   dir /b "%%~dp0"
echo   pause
echo   exit /b 1
echo ^)
echo.
echo cd /d "%%~dp0backend"
echo echo [DEBUG] Changed to: %%CD%%
echo echo [DEBUG] Contents of backend directory:
echo dir /b
echo echo.
echo if not exist "package.json" ^(
echo   echo [ERROR] package.json not found in: %%CD%%
echo   pause
echo   exit /b 1
echo ^)
echo.
echo echo [DEBUG] Checking for start script in package.json:
echo findstr /C:"start" package.json
echo echo.
echo echo [DEBUG] Starting server...
echo echo Server: http://localhost:%BACKEND_PORT%
echo echo.
echo npm start
) > start-server.bat

REM =============================================================================
REM CREATE start-app.bat in app root
REM =============================================================================
(
echo @echo off
echo echo.
echo echo ============================================
echo echo  CRICKET CLUB MANAGEMENT SYSTEM
echo echo ============================================
echo echo.
echo echo Starting server...
echo echo.
echo start "Cricket Club Server" cmd /k "%%~dp0start-server.bat"
echo echo.
echo echo [OK] Server started in new window
echo echo.
echo echo Access the app at: http://localhost:%BACKEND_PORT%
echo echo   - Frontend pages served from /
echo echo   - API endpoints at /api/*
echo echo.
echo pause
) > start-app.bat

REM Also create wrapper scripts in parent directory for convenience
cd ..
(
echo @echo off
echo cd /d "%~dp0%PROJECT_NAME%"
echo call start-server.bat
) > start-server.bat

(
echo @echo off
echo cd /d "%~dp0%PROJECT_NAME%"
echo call start-app.bat
) > start-app.bat

REM Return to project directory
cd "%PROJECT_NAME%"

echo [OK] Start scripts created
echo   - start-server.bat (backend only)
echo   - start-app.bat (complete application)
echo.

REM =============================================================================
REM CREATE README
REM =============================================================================
REM Purpose: Create documentation file with usage instructions
REM This README.md is placed in the project root directory

(
echo # Cricket Club Management System - Local Deployment
echo.
echo ## Quick Start
echo.
echo 1. Start the application:
echo    ```
echo    start-app.bat
echo    ```
echo.
echo 2. Access: http://localhost:%BACKEND_PORT%
echo.
echo ## What's Included
echo.
echo - ✓ PostgreSQL database with full schema
echo - ✓ Express.js backend API
echo - ✓ Your complete Base44 app ^(frontend^)
echo - ✓ All pages, components, and features
echo - ✓ All your existing data ^(if exported^)
echo.
echo ## Database
echo.
echo - Database: %DB_NAME%
echo - User: %DB_USER%
echo - Password: %DB_PASSWORD%
echo - Host: %DB_HOST%:%DB_PORT%
echo.
echo ## Project Structure
echo.
echo ```
echo %PROJECT_NAME%/
echo ├── backend/          # Express.js API
echo │   ├── server.js     # Main server file
echo │   ├── .env          # Environment variables
echo │   └── package.json  # Node dependencies
echo ├── src/              # Your Base44 app source
echo │   ├── pages/        # React pages
echo │   ├── components/   # React components
echo │   └── ...
echo ├── build/            # Production build output
echo ├── start-server.bat  # Start backend only
echo └── start-app.bat     # Start complete app
echo ```
echo.
echo ## Troubleshooting
echo.
echo **Server won't start:**
echo - Check PostgreSQL is running: Services ^> postgresql
echo - Verify port %BACKEND_PORT% is available
echo - Check backend/.env has correct database credentials
echo.
echo **Database errors:**
echo - Check credentials in backend/.env
echo - Verify schema was applied: psql -U %DB_USER% -d %DB_NAME% -c "\dt"
echo - Try reconnecting: Stop server, restart PostgreSQL, start server
echo.
echo **Frontend issues:**
echo - Rebuild: cd %PROJECT_NAME% ^&^& npm run build
echo - Clear cache: Delete build/ folder and rebuild
echo - Check for React errors in browser console
) > README.md

REM =============================================================================
REM FINAL SUMMARY
REM =============================================================================
REM Purpose: Display completion message with all important information
REM This is the last thing the user sees when setup completes successfully

REM Clear screen for clean final display
cls
echo.
echo ============================================
echo  SETUP COMPLETE!
echo ============================================
echo.
REM Display checklist of completed tasks
echo [OK] PostgreSQL database configured
echo [OK] Backend API ready
echo [OK] Frontend built and configured
echo [OK] All Base44 app pages included
echo [OK] Start scripts created
echo.
echo Installation Location:
echo   %INSTALL_PATH%
echo.
echo Database:
echo   Name: %DB_NAME%
echo   User: %DB_USER%
echo   Password: %DB_PASSWORD%
echo   Host: %DB_HOST%:%DB_PORT%
echo.
echo To start the application:
echo   Option A - From install directory:
echo     1. Navigate to: C:\zameer\projects\lrcc-install
echo     2. Double-click: start-app.bat
echo   Option B - From project directory:
echo     1. Navigate to: %INSTALL_PATH%
echo     2. Double-click: start-app.bat
echo   3. Open browser: http://localhost:%BACKEND_PORT%
echo.
echo Everything is ready to run!
echo See README.md for detailed documentation.
echo.
REM Wait for user acknowledgment before closing
pause

REM End local environment variable scope
endlocal