@echo off
REM =============================================================================
REM CLONE AND SETUP - Automated GitHub Clone and Local Setup (Modular)
REM =============================================================================

setlocal enabledelayedexpansion

echo.
echo ============================================
echo  Cricket Club - Clone and Setup
echo ============================================
echo.

REM Load configuration
call "%~dp0setup.config"

REM Prompt for GitHub repository URL
set /p "GITHUB_REPO=Enter GitHub repository URL: "

echo.
echo [1/7] Cloning repository from GitHub...
call "%~dp0clone-repo.bat" "%GITHUB_REPO%"
if %errorLevel% neq 0 (
    echo [ERROR] Repository clone failed
    exit /b 1
)

echo.
echo [2/7] Setting up PostgreSQL database...
call "%~dp0setup-database.bat"
if %errorLevel% neq 0 (
    echo [ERROR] Database setup failed
    exit /b 1
)

echo.
echo [3/7] Creating admin user...
call "%~dp0create-admin-user-hashed.bat"
if %errorLevel% neq 0 (
    echo [WARN] Admin user creation failed, continuing...
)

echo.
echo [4/7] Setting up backend...
call "%~dp0setup-backend.bat"
if %errorLevel% neq 0 (
    echo [ERROR] Backend setup failed
    exit /b 1
)

echo.
echo [5/7] Setting up frontend...
call "%~dp0setup-frontend.bat"
if %errorLevel% neq 0 (
    echo [ERROR] Frontend setup failed
    exit /b 1
)

echo.
echo [6/7] Copying code from repository...
call "%~dp0copy-code.bat"
if %errorLevel% neq 0 (
    echo [ERROR] Code copying failed
    exit /b 1
)

echo.
echo [7/7] Installing all dependencies...
call "%~dp0install-all-dependencies.bat"
if %errorLevel% neq 0 (
    echo [ERROR] Dependency installation failed
    exit /b 1
)

echo.
echo [8/8] Cleaning up...
call "%~dp0cleanup.bat"

echo.
echo ============================================
echo  Setup Complete!
echo ============================================
echo.
echo Backend: %BACKEND_DIR%
echo Frontend: %FRONTEND_DIR%
echo Database: %DB_NAME%
echo.
echo To start the application:
echo   1. Backend:  cd %BACKEND_DIR% ^&^& npm run dev
echo   2. Frontend: cd %FRONTEND_DIR% ^&^& npm start
echo.
echo Or use start-services.bat to start both together
echo.

pause
endlocal