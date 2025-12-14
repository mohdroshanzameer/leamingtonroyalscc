@echo off
REM =============================================================================
REM START FRONTEND ONLY
REM =============================================================================

set "PROJECT_DIR=cricket-club-app"

if not exist "%PROJECT_DIR%\frontend" (
    echo [ERROR] Frontend not found. Run setup-frontend.bat first.
    pause
    exit /b 1
)

echo.
echo Starting frontend application...
echo.

cd "%PROJECT_DIR%\frontend"
call npm start