@echo off
REM =============================================================================
REM START BACKEND ONLY
REM =============================================================================

set "PROJECT_DIR=cricket-club-app"

if not exist "%PROJECT_DIR%\backend" (
    echo [ERROR] Backend not found. Run setup-backend.bat first.
    pause
    exit /b 1
)

echo.
echo Starting backend server...
echo.

cd "%PROJECT_DIR%\backend"
call npm run dev