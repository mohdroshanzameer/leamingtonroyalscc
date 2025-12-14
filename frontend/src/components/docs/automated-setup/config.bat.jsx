batch
@echo off
REM =============================================================================
REM AUTOMATED SETUP - CENTRAL CONFIGURATION FILE
REM =============================================================================
REM All configuration values are stored here to avoid hardcoding

REM GitHub Repository
set "GITHUB_REPO_URL=https://github.com/yourusername/cricket-club.git"

REM Project Directory (use user-provided values if available)
if not defined USER_PROJECT_PATH set "USER_PROJECT_PATH=C:\zameer\lrcc_setup_2"
if not defined USER_PROJECT_NAME set "USER_PROJECT_NAME=LRCC"

set "PROJECT_ROOT=%USER_PROJECT_PATH%\%USER_PROJECT_NAME%"
set "TEMP_CLONE_DIR=%PROJECT_ROOT%\temp_clone"

REM Create project root if it doesn't exist
if not exist "%PROJECT_ROOT%" mkdir "%PROJECT_ROOT%"

REM Database Configuration
set "DB_HOST=localhost"
set "DB_PORT=5432"
set "DB_NAME=cricket_club_db"
set "DB_USER=cricket_admin"
set "DB_PASSWORD=CricketPass2024!"
set "DB_SUPERUSER=postgres"

REM Backend Configuration
set "BACKEND_DIR=%PROJECT_ROOT%\backend"
set "BACKEND_PORT=5000"
set "JWT_SECRET=your-super-secret-jwt-key-change-this-in-production"

REM Frontend Configuration
set "FRONTEND_DIR=%PROJECT_ROOT%\frontend"
set "FRONTEND_PORT=3000"

REM Admin User Configuration
set "ADMIN_EMAIL=admin@cricketclub.com"
set "ADMIN_NAME=Admin User"
set "ADMIN_PASSWORD=Admin@123"

REM Node Package Manager (npm or yarn)
set "PKG_MANAGER=npm"

REM Backend Dependencies
set "BACKEND_DEPS=express cors pg dotenv bcryptjs jsonwebtoken multer uuid nodemon"

REM Frontend Dependencies
set "FRONTEND_DEPS=@tanstack/react-query react-router-dom axios"

REM =============================================================================
REM DO NOT MODIFY BELOW THIS LINE
REM =============================================================================
exit /b 0
