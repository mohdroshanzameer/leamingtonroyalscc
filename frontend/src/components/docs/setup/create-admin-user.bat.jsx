@echo off
REM =============================================================================
REM CREATE ADMIN USER
REM =============================================================================

setlocal enabledelayedexpansion

set "DB_NAME=cricket_club_db"
set "DB_USER=cricket_admin"

echo.
echo ============================================
echo  Create Admin User
echo ============================================
echo.

set /p "ADMIN_EMAIL=Enter admin email: "
set /p "ADMIN_NAME=Enter admin full name: "

echo.
echo Creating admin user in database...

set /p "DB_PASSWORD=Enter database password: "
set PGPASSWORD=%DB_PASSWORD%

REM Generate UUID (using psql's uuid_generate_v4)
for /f "tokens=*" %%i in ('psql -U %DB_USER% -d %DB_NAME% -t -c "SELECT uuid_generate_v4();"') do set "USER_ID=%%i"

REM Clean up UUID (remove whitespace)
set "USER_ID=%USER_ID: =%"

REM Insert user
psql -U %DB_USER% -d %DB_NAME% -c "INSERT INTO users (id, email, full_name, role, club_role, created_date) VALUES ('%USER_ID%', '%ADMIN_EMAIL%', '%ADMIN_NAME%', 'admin', 'super_admin', NOW()) ON CONFLICT (email) DO UPDATE SET full_name='%ADMIN_NAME%', role='admin', club_role='super_admin';" >nul 2>&1

if %errorLevel% equ 0 (
    echo.
    echo [SUCCESS] Admin user created!
    echo.
    echo Email: %ADMIN_EMAIL%
    echo Name: %ADMIN_NAME%
    echo Role: super_admin
    echo.
) else (
    echo [ERROR] Failed to create user
    exit /b 1
)

endlocal
exit /b 0