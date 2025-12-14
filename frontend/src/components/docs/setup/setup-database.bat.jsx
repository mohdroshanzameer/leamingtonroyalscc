@echo off
REM =============================================================================
REM DATABASE SETUP - PostgreSQL
REM =============================================================================

setlocal enabledelayedexpansion

set "DB_NAME=cricket_club_db"
set "DB_USER=cricket_admin"
set "DB_PASSWORD=CricketClub2025!"
set "DB_HOST=localhost"
set "DB_PORT=5432"

echo.
echo ============================================
echo  PostgreSQL Database Setup
echo ============================================
echo.

set /p "POSTGRES_PASSWORD=Enter PostgreSQL superuser password: "
set PGPASSWORD=%POSTGRES_PASSWORD%

echo.
echo [1/4] Creating database...
psql -U postgres -c "DROP DATABASE IF EXISTS %DB_NAME%;" 2>nul
psql -U postgres -c "CREATE DATABASE %DB_NAME%;"
if %errorLevel% neq 0 (
    echo [ERROR] Failed to create database
    exit /b 1
)
echo [OK] Database created

echo.
echo [2/4] Creating user...
psql -U postgres -c "CREATE USER %DB_USER% WITH PASSWORD '%DB_PASSWORD%';" 2>nul
if %errorLevel% neq 0 (
    echo [INFO] User already exists, continuing...
)
echo [OK] User ready

echo.
echo [3/4] Granting permissions...
psql -U postgres -c "ALTER DATABASE %DB_NAME% OWNER TO %DB_USER%;"
psql -U postgres -d %DB_NAME% -c "ALTER SCHEMA public OWNER TO %DB_USER%;"
psql -U postgres -d %DB_NAME% -c "GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO %DB_USER%;"
psql -U postgres -d %DB_NAME% -c "GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO %DB_USER%;"
echo [OK] Permissions granted

echo.
echo [4/4] Creating schema...
if exist "%~dp0..\DATABASE_SCHEMA.sql" (
    psql -U postgres -d %DB_NAME% -f "%~dp0..\DATABASE_SCHEMA.sql" >nul 2>&1
    if %errorLevel% equ 0 (
        echo [OK] Database schema applied
    ) else (
        echo [ERROR] Failed to apply schema
        exit /b 1
    )
) else (
    echo [WARN] DATABASE_SCHEMA.sql not found
)

echo.
echo ============================================
echo  Database Setup Complete!
echo ============================================
echo.
echo Database: %DB_NAME%
echo User: %DB_USER%
echo Password: %DB_PASSWORD%
echo Host: %DB_HOST%:%DB_PORT%
echo.

endlocal
exit /b 0