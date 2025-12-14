@echo off
REM =============================================================================
REM DATABASE SETUP - PostgreSQL
REM =============================================================================

setlocal enabledelayedexpansion

REM Load configuration from setup.config
if exist "%~dp0setup.config" (
    call "%~dp0setup.config"
) else (
    echo [WARN] setup.config not found, using default values
    set "DB_NAME=cricket_club_db"
    set "DB_USER=cricket_admin"
    set "DB_PASSWORD=CricketClub2025!"
    set "DB_HOST=localhost"
    set "DB_PORT=5432"
)

REM Validate required variables
if "%DB_NAME%"=="" (
    echo [ERROR] DB_NAME not configured
    exit /b 1
)
if "%DB_USER%"=="" (
    echo [ERROR] DB_USER not configured
    exit /b 1
)
if "%DB_PASSWORD%"=="" (
    echo [ERROR] DB_PASSWORD not configured
    exit /b 1
)

echo.
echo ============================================
echo  PostgreSQL Database Setup
echo ============================================
echo.

set /p "POSTGRES_PASSWORD=Enter PostgreSQL superuser password: "
set PGPASSWORD=%POSTGRES_PASSWORD%

echo.
echo [1/4] Creating database...

REM Check if database exists
psql -U postgres -lqt | findstr /i "%DB_NAME%" >nul 2>&1
if %errorLevel% equ 0 (
    echo [INFO] Database %DB_NAME% already exists
    set /p "DROP_DB=Do you want to drop and recreate it? (y/n): "
    if /i "!DROP_DB!"=="y" (
        echo Dropping existing database...
        psql -U postgres -c "DROP DATABASE %DB_NAME%;" 2>nul
        psql -U postgres -c "CREATE DATABASE %DB_NAME%;"
        if %errorLevel% neq 0 (
            echo [ERROR] Failed to recreate database
            exit /b 1
        )
        echo [OK] Database recreated
    ) else (
        echo [INFO] Using existing database
    )
) else (
    psql -U postgres -c "CREATE DATABASE %DB_NAME%;"
    if %errorLevel% neq 0 (
        echo [ERROR] Failed to create database
        exit /b 1
    )
    echo [OK] Database created
)

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