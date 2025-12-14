@echo off
REM =============================================================================
REM TASK: Setup PostgreSQL Database
REM =============================================================================

setlocal enabledelayedexpansion

REM Load configuration
call "%~dp0config.bat"

echo.
echo ============================================================
echo  TASK 2: Setting Up PostgreSQL Database
echo ============================================================
echo.
echo Database Name: %DB_NAME%
echo Database User: %DB_USER%
echo Host: %DB_HOST%:%DB_PORT%
echo.

REM Check if PostgreSQL is installed
where psql >nul 2>&1
if %errorLevel% neq 0 (
    echo [ERROR] PostgreSQL is not installed
    echo Please install PostgreSQL from: https://www.postgresql.org/download/
    exit /b 1
)

REM Prompt for superuser password
echo [INFO] Please enter PostgreSQL superuser password when prompted
echo.

REM Set password for psql
set "PGPASSWORD=%DB_SUPERUSER_PASSWORD%"

REM Create database
echo [INFO] Creating database...
psql -U %DB_SUPERUSER% -h %DB_HOST% -p %DB_PORT% -c "CREATE DATABASE %DB_NAME%;" 2>nul
if %errorLevel% equ 0 (
    echo [SUCCESS] Database created
) else (
    echo [INFO] Database may already exist
)

REM Create user
echo [INFO] Creating database user...
psql -U %DB_SUPERUSER% -h %DB_HOST% -p %DB_PORT% -c "CREATE USER %DB_USER% WITH PASSWORD '%DB_PASSWORD%';" 2>nul
if %errorLevel% equ 0 (
    echo [SUCCESS] User created
) else (
    echo [INFO] User may already exist
)

REM Grant privileges
echo [INFO] Granting privileges...
psql -U %DB_SUPERUSER% -h %DB_HOST% -p %DB_PORT% -c "GRANT ALL PRIVILEGES ON DATABASE %DB_NAME% TO %DB_USER%;"
psql -U %DB_SUPERUSER% -h %DB_HOST% -p %DB_PORT% -d %DB_NAME% -c "GRANT ALL ON SCHEMA public TO %DB_USER%;"

REM Apply schema if exists
set "SCHEMA_FILE=%TEMP_CLONE_DIR%\database\DATABASE_SCHEMA.sql"
if exist "%SCHEMA_FILE%" (
    echo [INFO] Applying database schema...
    psql -U %DB_USER% -h %DB_HOST% -p %DB_PORT% -d %DB_NAME% -f "%SCHEMA_FILE%"
    if %errorLevel% equ 0 (
        echo [SUCCESS] Schema applied
    ) else (
        echo [ERROR] Failed to apply schema
        exit /b 1
    )
) else (
    echo [WARN] Schema file not found at: %SCHEMA_FILE%
)

REM Create admin user
echo [INFO] Creating admin user...
psql -U %DB_USER% -h %DB_HOST% -p %DB_PORT% -d %DB_NAME% -c "INSERT INTO users (email, password_hash, full_name, role, status) VALUES ('%ADMIN_EMAIL%', crypt('%ADMIN_PASSWORD%', gen_salt('bf')), '%ADMIN_NAME%', 'admin', 'active') ON CONFLICT (email) DO NOTHING;"

echo.
echo [SUCCESS] Database setup completed
echo.

endlocal
exit /b 0