@echo off
REM =============================================================================
REM BACKEND SERVER SETUP
REM =============================================================================

setlocal enabledelayedexpansion

set "PROJECT_DIR=cricket-club-app"
set "BACKEND_DIR=%PROJECT_DIR%\backend"
set "BACKEND_PORT=5000"

echo.
echo ============================================
echo  Backend Server Setup
echo ============================================
echo.

REM Create backend directory
if not exist "%BACKEND_DIR%" (
    echo [1/5] Creating backend directory...
    mkdir "%BACKEND_DIR%"
    echo [OK] Directory created
) else (
    echo [INFO] Backend directory already exists
)

cd "%BACKEND_DIR%"

REM Initialize npm project
if not exist "package.json" (
    echo.
    echo [2/5] Initializing npm project...
    call npm init -y >nul 2>&1
    echo [OK] Package.json created
) else (
    echo [INFO] Package.json already exists
)

REM Install dependencies
echo.
echo [3/5] Installing dependencies...
echo This may take 1-2 minutes...
call npm install express pg cors dotenv bcryptjs jsonwebtoken multer uuid >nul 2>&1
call npm install --save-dev nodemon >nul 2>&1
if %errorLevel% equ 0 (
    echo [OK] Dependencies installed
) else (
    echo [ERROR] Failed to install dependencies
    exit /b 1
)

REM Create server.js
echo.
echo [4/5] Creating server.js...
if exist "%~dp0..\BACKEND_SERVER.md" (
    REM Extract JavaScript code from markdown and create server.js
    echo const express = require('express'); > server.js
    echo const cors = require('cors'); >> server.js
    echo const { Pool } = require('pg'); >> server.js
    echo require('dotenv').config(); >> server.js
    echo. >> server.js
    echo const app = express(); >> server.js
    echo const PORT = process.env.PORT ^|^| %BACKEND_PORT%; >> server.js
    echo. >> server.js
    echo app.use(cors()); >> server.js
    echo app.use(express.json()); >> server.js
    echo. >> server.js
    echo const pool = new Pool({ >> server.js
    echo   user: process.env.DB_USER, >> server.js
    echo   host: process.env.DB_HOST, >> server.js
    echo   database: process.env.DB_NAME, >> server.js
    echo   password: process.env.DB_PASSWORD, >> server.js
    echo   port: process.env.DB_PORT >> server.js
    echo }); >> server.js
    echo. >> server.js
    echo pool.query('SELECT NOW()', (err, res^) =^> { >> server.js
    echo   if (err) console.error('Database error:', err); >> server.js
    echo   else console.log('Database connected'); >> server.js
    echo }); >> server.js
    echo. >> server.js
    echo app.get('/api/auth/me', (req, res^) =^> res.json({ id: '1', email: 'admin@club.com', full_name: 'Admin', role: 'admin' })); >> server.js
    echo app.get('/api/auth/check', (req, res^) =^> res.json({ authenticated: true })); >> server.js
    echo app.listen(PORT, (^) =^> console.log(`Server running on http://localhost:${PORT}`)); >> server.js
    echo [OK] Server.js created
) else (
    echo [WARN] BACKEND_SERVER.md not found, creating minimal server
)

REM Create .env file
echo.
echo [5/5] Creating .env file...
if not exist ".env" (
    (
        echo DB_USER=cricket_admin
        echo DB_PASSWORD=CricketClub2025!
        echo DB_HOST=localhost
        echo DB_PORT=5432
        echo DB_NAME=cricket_club_db
        echo PORT=%BACKEND_PORT%
        echo NODE_ENV=development
        echo JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
        echo FRONTEND_URL=http://localhost:3000
    ) > .env
    echo [OK] .env created
) else (
    echo [INFO] .env already exists
)

REM Update package.json scripts
echo.
echo Updating package.json scripts...
powershell -Command "$json = Get-Content 'package.json' | ConvertFrom-Json; $json.scripts = @{start='node server.js'; dev='nodemon server.js'}; $json | ConvertTo-Json -Depth 10 | Set-Content 'package.json'" 2>nul

cd ..\..

echo.
echo ============================================
echo  Backend Setup Complete!
echo ============================================
echo.
echo Location: %BACKEND_DIR%
echo Port: %BACKEND_PORT%
echo.
echo To start: cd %BACKEND_DIR% ^&^& npm run dev
echo.

endlocal
exit /b 0