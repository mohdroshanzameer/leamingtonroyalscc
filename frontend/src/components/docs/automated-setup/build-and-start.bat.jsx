@echo off
REM =============================================================================
REM TASK: Build and Start Application
REM =============================================================================

setlocal enabledelayedexpansion

REM Load configuration
call "%~dp0config.bat"

echo.
echo ============================================================
echo  TASK 6: Building and Starting Application
echo ============================================================
echo.

REM ============================================================================
REM VERIFY BACKEND
REM ============================================================================
echo [INFO] Verifying backend setup...

if not exist "%BACKEND_DIR%\package.json" (
    echo [ERROR] Backend package.json not found!
    pause
    exit /b 1
)

if not exist "%BACKEND_DIR%\node_modules\express" (
    echo [ERROR] Backend dependencies not installed!
    echo [INFO] Please run install-dependencies.bat first
    pause
    exit /b 1
)

if not exist "%BACKEND_DIR%\server.js" (
    echo [ERROR] server.js not found!
    pause
    exit /b 1
)

echo [SUCCESS] Backend verified

echo.

REM ============================================================================
REM VERIFY FRONTEND
REM ============================================================================
echo [INFO] Verifying frontend setup...

if not exist "%FRONTEND_DIR%\package.json" (
    echo [ERROR] Frontend package.json not found!
    pause
    exit /b 1
)

if not exist "%FRONTEND_DIR%\node_modules\vite" (
    echo [ERROR] Frontend dependencies not installed!
    echo [INFO] Please run install-dependencies.bat first
    pause
    exit /b 1
)

echo [SUCCESS] Frontend verified

echo.

REM ============================================================================
REM START SERVERS
REM ============================================================================
echo ============================================================
echo  Starting Application Servers
echo ============================================================
echo.

REM Start Backend
echo [INFO] Starting backend server...
echo Backend URL: http://localhost:%BACKEND_PORT%
echo.
start "Cricket Club Backend" cmd /k "cd /d %BACKEND_DIR% && npm run dev"

REM Wait for backend
echo [INFO] Waiting for backend to initialize...
timeout /t 5 >nul

echo.

REM Start Frontend
echo [INFO] Starting frontend application...
echo Frontend URL: http://localhost:%FRONTEND_PORT%
echo.
start "Cricket Club Frontend" cmd /k "cd /d %FRONTEND_DIR% && npm run dev"

echo.
echo ============================================================
echo  Application Started Successfully!
echo ============================================================
echo.
echo  Backend:  http://localhost:%BACKEND_PORT%
echo  Frontend: http://localhost:%FRONTEND_PORT%
echo.
echo  Two command windows opened:
echo  1. Cricket Club Backend
echo  2. Cricket Club Frontend
echo.
echo  Press any key to return to menu...
echo ============================================================
echo.

pause >nul
endlocal
exit /b 0