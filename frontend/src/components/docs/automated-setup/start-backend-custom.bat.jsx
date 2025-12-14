@echo off
REM Custom backend starter for your actual path

set "BACKEND_DIR=C:\zameer\lrcc_setup_2\LRCC\backend"
set "BACKEND_PORT=5000"

echo Starting backend server...
echo Backend URL: http://localhost:%BACKEND_PORT%
echo.

cd /d "%BACKEND_DIR%"

if not exist "server.js" (
    echo [ERROR] server.js not found at %BACKEND_DIR%
    pause
    exit /b 1
)

if not exist "node_modules\express" (
    echo [ERROR] Backend dependencies not installed!
    echo Run: npm install
    pause
    exit /b 1
)

echo [OK] Starting server with npm run dev...
npm run dev

pause