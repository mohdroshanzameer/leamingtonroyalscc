@echo off
REM =============================================================================
REM CREATE ADMIN USER - With bcrypt Password Hashing
REM =============================================================================

setlocal enabledelayedexpansion

REM Load configuration
call "%~dp0setup.config" 2>nul
if errorlevel 1 (
    REM Fallback if config not found
    set "DB_NAME=cricket_club_db"
    set "DB_USER=cricket_admin"
)

echo.
echo ============================================
echo  Create Admin User (Hashed Password)
echo ============================================
echo.

set /p "ADMIN_EMAIL=Enter admin email: "
set /p "ADMIN_NAME=Enter admin full name: "
set /p "ADMIN_PASSWORD=Enter admin password (min 8 chars): "

REM Validate password length
set "pass_length=0"
for /l %%i in (0,1,100) do (
    set "char=!ADMIN_PASSWORD:~%%i,1!"
    if not "!char!"=="" set /a pass_length+=1
)

if %pass_length% LSS 8 (
    echo [ERROR] Password must be at least 8 characters
    exit /b 1
)

echo.
echo Creating admin user with hashed password...

set /p "DB_PASSWORD=Enter database password: "
set PGPASSWORD=%DB_PASSWORD%

REM Generate UUID
for /f "tokens=*" %%i in ('psql -U %DB_USER% -d %DB_NAME% -t -c "SELECT uuid_generate_v4();"') do set "USER_ID=%%i"
set "USER_ID=%USER_ID: =%"

REM Hash password using Node.js (bcryptjs must be installed in backend)
cd "%~dp0..\..\backend" 2>nul
if errorlevel 1 (
    echo [WARN] Backend directory not found, using default path
    cd "%~dp0cricket-club-app\backend"
)

REM Create temporary script to hash password
(
    echo const bcrypt = require('bcryptjs'^);
    echo const password = process.argv[2];
    echo bcrypt.hash(password, 10^).then(hash =^> console.log(hash^)^);
) > hash_password.js

REM Hash the password
echo Hashing password...
for /f "tokens=*" %%h in ('node hash_password.js "%ADMIN_PASSWORD%"') do set "PASSWORD_HASH=%%h"

REM Clean up temp script
del hash_password.js

if "%PASSWORD_HASH%"=="" (
    echo [ERROR] Failed to hash password. Ensure bcryptjs is installed: npm install bcryptjs
    exit /b 1
)

REM Insert user with hashed password
psql -U %DB_USER% -d %DB_NAME% -c "INSERT INTO users (id, email, password_hash, full_name, role, club_role, status) VALUES ('%USER_ID%', '%ADMIN_EMAIL%', '%PASSWORD_HASH%', '%ADMIN_NAME%', 'admin', 'super_admin', 'active') ON CONFLICT (email) DO UPDATE SET password_hash='%PASSWORD_HASH%', full_name='%ADMIN_NAME%', role='admin', club_role='super_admin', status='active';" >nul 2>&1

if %errorLevel% equ 0 (
    echo.
    echo ============================================
    echo [SUCCESS] Admin user created!
    echo ============================================
    echo.
    echo Email:    %ADMIN_EMAIL%
    echo Name:     %ADMIN_NAME%
    echo Role:     super_admin
    echo Password: ******** (hashed with bcrypt)
    echo.
    echo You can now login with these credentials.
    echo.
) else (
    echo [ERROR] Failed to create user
    exit /b 1
)

endlocal
exit /b 0