@echo off
REM =============================================================================
REM FULL AUTOMATED SETUP - Cricket Club Application
REM =============================================================================

setlocal enabledelayedexpansion

REM ============================================================================
REM PROJECT CONFIGURATION
REM ============================================================================
echo.
echo ============================================================
echo  Cricket Club - Full Automated Setup
echo ============================================================
echo.

REM Ask for project configuration if not set
if not defined PROJECT_NAME (
    set /p PROJECT_NAME="Enter project name (default: cricket-club): "
    if "!PROJECT_NAME!"=="" set PROJECT_NAME=cricket-club
)

if not defined PROJECT_PATH (
    set /p PROJECT_PATH="Enter project path (default: C:\Projects): "
    if "!PROJECT_PATH!"=="" set PROJECT_PATH=C:\Projects
)

REM Save to config for reuse
set "PROJECT_ROOT=%PROJECT_PATH%\%PROJECT_NAME%"

REM ============================================================================
REM INITIALIZATION
REM ============================================================================
call "%~dp0config.bat"

echo.
echo This will perform the following steps:
echo   1. Clone repository from GitHub
echo   2. Setup PostgreSQL database
echo   3. Setup backend server
echo   4. Setup frontend application
echo   5. Install all dependencies
echo   6. Build and start application
echo.
echo Current Configuration:
echo   - Project: %PROJECT_NAME%
echo   - Location: %PROJECT_ROOT%
echo   - Database: %DB_NAME%
echo   - Backend Port: %BACKEND_PORT%
echo   - Frontend Port: %FRONTEND_PORT%
echo.

set /p CONFIRM="Continue with setup? (Y/N): "
if /i not "%CONFIRM%"=="Y" (
    echo Setup cancelled.
    exit /b 0
)

echo.
echo ============================================================
echo  Starting Automated Setup
echo ============================================================

REM ============================================================================
REM STEP 1: CLONE REPOSITORY
REM ============================================================================
echo.
echo [STEP 1/6] Cloning repository...
call "%~dp0clone-from-github.bat"
if %errorLevel% neq 0 (
    echo [ERROR] Failed at Step 1: Clone Repository
    pause
    exit /b 1
)

REM ============================================================================
REM STEP 2: SETUP DATABASE
REM ============================================================================
echo.
echo [STEP 2/6] Setting up database...
call "%~dp0setup-database.bat"
if %errorLevel% neq 0 (
    echo [ERROR] Failed at Step 2: Database Setup
    pause
    exit /b 1
)

REM ============================================================================
REM STEP 3: SETUP BACKEND
REM ============================================================================
echo.
echo [STEP 3/6] Setting up backend...
call "%~dp0setup-backend.bat"
if %errorLevel% neq 0 (
    echo [ERROR] Failed at Step 3: Backend Setup
    pause
    exit /b 1
)

REM ============================================================================
REM STEP 4: SETUP FRONTEND
REM ============================================================================
echo.
echo [STEP 4/6] Setting up frontend...
call "%~dp0setup-frontend.bat"
if %errorLevel% neq 0 (
    echo [ERROR] Failed at Step 4: Frontend Setup
    pause
    exit /b 1
)

REM ============================================================================
REM STEP 5: INSTALL DEPENDENCIES
REM ============================================================================
echo.
echo [STEP 5/6] Installing dependencies...
call "%~dp0install-dependencies.bat"
if %errorLevel% neq 0 (
    echo [ERROR] Failed at Step 5: Install Dependencies
    pause
    exit /b 1
)

REM ============================================================================
REM STEP 6: BUILD AND START
REM ============================================================================
echo.
echo [STEP 6/6] Building and starting application...
call "%~dp0build-and-start.bat"
if %errorLevel% neq 0 (
    echo [ERROR] Failed at Step 6: Build and Start
    pause
    exit /b 1
)

echo.
echo ============================================================
echo  SETUP COMPLETED SUCCESSFULLY!
echo ============================================================
echo.
echo  Application is now running:
echo.
echo  Frontend: http://localhost:%FRONTEND_PORT%
echo  Backend:  http://localhost:%BACKEND_PORT%
echo.
echo  Admin Login:
echo  Email:    %ADMIN_EMAIL%
echo  Password: %ADMIN_PASSWORD%
echo.
echo  Project Location: %PROJECT_ROOT%
echo.
echo ============================================================

pause
endlocal
exit /b 0