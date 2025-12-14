@echo off
REM =============================================================================
REM TASK: Setup Backend Server
REM =============================================================================

setlocal enabledelayedexpansion

REM Load configuration
call "%~dp0config.bat"

echo.
echo ============================================================
echo  TASK 3: Setting Up Backend Server
echo ============================================================
echo.
echo Backend Directory: %BACKEND_DIR%
echo Port: %BACKEND_PORT%
echo.

REM Create backend directory
if not exist "%BACKEND_DIR%" (
    echo [INFO] Creating backend directory...
    mkdir "%BACKEND_DIR%"
)

REM Copy backend code from cloned repository
if exist "%TEMP_CLONE_DIR%\backend" (
    echo [INFO] Copying backend code...
    xcopy /E /I /Y "%TEMP_CLONE_DIR%\backend\*" "%BACKEND_DIR%\"
) else (
    echo [WARN] No backend code found in repository
)

REM Create .env file
echo [INFO] Creating .env file...
(
    echo PORT=%BACKEND_PORT%
    echo DB_HOST=%DB_HOST%
    echo DB_PORT=%DB_PORT%
    echo DB_NAME=%DB_NAME%
    echo DB_USER=%DB_USER%
    echo DB_PASSWORD=%DB_PASSWORD%
    echo JWT_SECRET=%JWT_SECRET%
    echo NODE_ENV=development
) > "%BACKEND_DIR%\.env"

REM Always create package.json with all dependencies
echo [INFO] Creating package.json with all dependencies...
cd /d "%BACKEND_DIR%"
(
    echo {
    echo   "name": "cricket-club-backend",
    echo   "version": "1.0.0",
    echo   "description": "Cricket Club Management System - Backend API",
    echo   "main": "server.js",
    echo   "scripts": {
    echo     "start": "node server.js",
    echo     "dev": "nodemon server.js"
    echo   },
    echo   "dependencies": {
    echo     "express": "^4.18.2",
    echo     "cors": "^2.8.5",
    echo     "pg": "^8.11.3",
    echo     "dotenv": "^16.3.1",
    echo     "bcryptjs": "^2.4.3",
    echo     "jsonwebtoken": "^9.0.2"
    echo   },
    echo   "devDependencies": {
    echo     "nodemon": "^3.0.1"
    echo   }
    echo }
) > package.json

REM Create server.js if it doesn't exist
if not exist "%BACKEND_DIR%\server.js" (
    echo [INFO] Creating server.js...
    (
        echo const express = require('express'^);
        echo const cors = require('cors'^);
        echo const { Pool } = require('pg'^);
        echo const bcrypt = require('bcryptjs'^);
        echo const jwt = require('jsonwebtoken'^);
        echo require('dotenv'^).config(^);
        echo.
        echo const app = express(^);
        echo const PORT = process.env.PORT ^|^| 5000;
        echo.
        echo // Database connection
        echo const pool = new Pool({
        echo   host: process.env.DB_HOST,
        echo   port: process.env.DB_PORT,
        echo   database: process.env.DB_NAME,
        echo   user: process.env.DB_USER,
        echo   password: process.env.DB_PASSWORD
        echo }^);
        echo.
        echo app.use(cors(^)^);
        echo app.use(express.json(^)^);
        echo.
        echo app.get('/api/health', async (req, res^) =^> {
        echo   try {
        echo     await pool.query('SELECT 1'^);
        echo     res.json({ status: 'ok', message: 'Backend and database connected' }^);
        echo   } catch (err^) {
        echo     res.status(500^).json({ status: 'error', message: err.message }^);
        echo   }
        echo }^);
        echo.
        echo app.listen(PORT, (^) =^> {
        echo   console.log(`Server running on http://localhost:${PORT}`^);
        echo }^);
    ) > server.js
)

echo.
echo [SUCCESS] Backend setup completed
echo   - package.json created with all dependencies
echo   - .env configured
echo   - server.js ready
echo.

endlocal
exit /b 0