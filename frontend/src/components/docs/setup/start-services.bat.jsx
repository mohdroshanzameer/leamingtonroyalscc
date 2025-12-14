@echo off
REM =============================================================================
REM START ALL SERVICES
REM =============================================================================

set "PROJECT_DIR=cricket-club-app"

echo.
echo ============================================
echo  Starting All Services
echo ============================================
echo.

if not exist "%PROJECT_DIR%\backend" (
    echo [ERROR] Backend not found. Run setup-backend.bat first.
    pause
    exit /b 1
)

if not exist "%PROJECT_DIR%\frontend" (
    echo [ERROR] Frontend not found. Run setup-frontend.bat first.
    pause
    exit /b 1
)

echo Starting backend server...
start "Cricket Club Backend" cmd /k "cd %PROJECT_DIR%\backend && npm run dev"

echo Waiting for backend to start...
timeout /t 5 /nobreak >nul

echo.
echo Starting frontend application...
start "Cricket Club Frontend" cmd /k "cd %PROJECT_DIR%\frontend && npm start"

echo.
echo ============================================
echo  Services Started!
echo ============================================
echo.
echo Backend:  http://localhost:5000
echo Frontend: http://localhost:3000
echo.
echo Check the separate command windows for logs.
echo Press any key to return to menu...
pause >nul
exit /b 0