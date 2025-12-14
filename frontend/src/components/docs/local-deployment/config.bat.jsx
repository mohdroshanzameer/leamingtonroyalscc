@echo off
REM =============================================================================
REM CRICKET CLUB - CENTRAL CONFIGURATION FILE
REM =============================================================================
REM All settings are stored here. Modify values below as needed.

REM =============================================================================
REM DATABASE CONFIGURATION
REM =============================================================================
set "DB_NAME=cricket_club_db"
set "DB_USER=cricket_admin"
set "DB_PASSWORD=CricketClub2025!"
set "DB_HOST=localhost"
set "DB_PORT=5432"

REM =============================================================================
REM APPLICATION PORTS
REM =============================================================================
set "BACKEND_PORT=5000"
set "FRONTEND_PORT=3000"

REM =============================================================================
REM PROJECT PATHS
REM =============================================================================
set "PROJECT_NAME=cricket-club-local"
set "INSTALL_PATH=%CD%\%PROJECT_NAME%"
set "BACKEND_DIR=%INSTALL_PATH%\backend"
set "FRONTEND_DIR=%INSTALL_PATH%\frontend"

REM =============================================================================
REM CODE SOURCE CONFIGURATION
REM =============================================================================
set "GITHUB_REPO_URL=https://github.com/yourusername/cricket-club.git"
set "LOCAL_CODE_PATH="

REM =============================================================================
REM JWT SECRET
REM =============================================================================
set "JWT_SECRET=your-super-secret-jwt-key-change-this-in-production"

exit /b 0