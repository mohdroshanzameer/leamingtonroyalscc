@echo off
REM =============================================================================
REM TASK: Install All Dependencies
REM =============================================================================

setlocal enabledelayedexpansion

REM Load configuration
call "%~dp0config.bat"

echo.
echo ============================================================
echo  TASK 5: Installing All Dependencies
echo ============================================================
echo.

REM Check if Node.js is installed
where node >nul 2>&1
if %errorLevel% neq 0 (
    echo [ERROR] Node.js is not installed
    echo Please install Node.js from: https://nodejs.org/
    pause
    exit /b 1
)

echo Node.js version:
node --version
echo npm version:
npm --version
echo.

REM ============================================================================
REM BACKEND DEPENDENCIES
REM ============================================================================
echo [INFO] Checking backend directory: %BACKEND_DIR%

if not exist "%BACKEND_DIR%" (
    echo [ERROR] Backend directory does not exist: %BACKEND_DIR%
    echo Please run setup-backend.bat first
    pause
    exit /b 1
)

if not exist "%BACKEND_DIR%\package.json" (
    echo [ERROR] Backend package.json not found at: %BACKEND_DIR%\package.json
    echo Please run setup-backend.bat first
    pause
    exit /b 1
)

echo [SUCCESS] Backend directory and package.json found
echo.

echo [INFO] Installing backend dependencies...
cd /d "%BACKEND_DIR%"

REM Clean node_modules if exists
if exist "node_modules" (
    echo [INFO] Removing old node_modules...
    rmdir /s /q "node_modules" 2>nul
)

REM Install dependencies
echo [INFO] Running npm install...
call npm install

if %errorLevel% neq 0 (
    echo [ERROR] npm install failed - trying individual packages...
    
    REM Install core dependencies one by one
    echo [INFO] Installing express...
    call npm install express
    echo [INFO] Installing cors...
    call npm install cors
    echo [INFO] Installing pg...
    call npm install pg
    echo [INFO] Installing dotenv...
    call npm install dotenv
    echo [INFO] Installing bcryptjs...
    call npm install bcryptjs
    echo [INFO] Installing jsonwebtoken...
    call npm install jsonwebtoken
    echo [INFO] Installing nodemon...
    call npm install -D nodemon
)

REM Verify critical packages
echo.
echo [INFO] Verifying backend installations...
if not exist "node_modules\express" (
    echo [ERROR] Express not installed!
    pause
    exit /b 1
)
if not exist "node_modules\pg" (
    echo [ERROR] pg not installed!
    pause
    exit /b 1
)

echo [SUCCESS] Backend dependencies installed successfully
echo.

REM ============================================================================
REM FRONTEND DEPENDENCIES
REM ============================================================================
echo [INFO] Checking frontend directory: %FRONTEND_DIR%

if not exist "%FRONTEND_DIR%" (
    echo [ERROR] Frontend directory does not exist: %FRONTEND_DIR%
    echo Please run setup-frontend.bat first
    pause
    exit /b 1
)

if not exist "%FRONTEND_DIR%\package.json" (
    echo [ERROR] Frontend package.json not found at: %FRONTEND_DIR%\package.json
    echo Please run setup-frontend.bat first
    pause
    exit /b 1
)

echo [SUCCESS] Frontend directory and package.json found
echo.

echo [INFO] Installing frontend dependencies...
cd /d "%FRONTEND_DIR%"

REM Clean node_modules if exists
if exist "node_modules" (
    echo [INFO] Removing old node_modules...
    rmdir /s /q "node_modules" 2>nul
)

REM Install dependencies
echo [INFO] Running npm install...
call npm install

if %errorLevel% neq 0 (
    echo [ERROR] npm install failed - retrying with --force...
    call npm install --force
    
    if %errorLevel% neq 0 (
        echo [ERROR] Frontend installation failed!
        pause
        exit /b 1
    )
)

REM Verify vite
echo.
echo [INFO] Verifying frontend installations...
if not exist "node_modules\vite" (
    echo [ERROR] Vite not installed!
    pause
    exit /b 1
)

echo [SUCCESS] Frontend dependencies installed successfully
echo.

echo ============================================================
echo [SUCCESS] All dependencies installed successfully!
echo ============================================================
echo.
echo Backend: %BACKEND_DIR%\node_modules
echo Frontend: %FRONTEND_DIR%\node_modules
echo.

pause
endlocal
exit /b 0