@echo off
REM =============================================================================
REM TASK: Setup Local Database
REM =============================================================================

setlocal enabledelayedexpansion

call "%~dp0..\config.bat"

echo.
echo ============================================================
echo  PostgreSQL Database Setup
echo ============================================================
echo.

set /p "POSTGRES_PASSWORD=Enter PostgreSQL superuser password: "

set PGPASSWORD=%POSTGRES_PASSWORD%

echo.
echo Dropping existing database if present...
psql -U postgres -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname='%DB_NAME%';" 2>nul
psql -U postgres -c "DROP DATABASE IF EXISTS %DB_NAME%;" 2>nul

echo Creating fresh database...
psql -U postgres -c "CREATE DATABASE %DB_NAME%;"

echo Creating user...
psql -U postgres -c "CREATE USER %DB_USER% WITH PASSWORD '%DB_PASSWORD%';" 2>nul

echo Granting ownership...
psql -U postgres -c "ALTER DATABASE %DB_NAME% OWNER TO %DB_USER%;"
psql -U postgres -d %DB_NAME% -c "GRANT ALL ON SCHEMA public TO %DB_USER%;"
psql -U postgres -d %DB_NAME% -c "GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO %DB_USER%;"
psql -U postgres -d %DB_NAME% -c "GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO %DB_USER%;"

echo.
echo Applying database schema...

if exist "%~dp0..\..\setup\DATABASE_SCHEMA.sql" (
    set PGPASSWORD=%DB_PASSWORD%
    psql -U %DB_USER% -d %DB_NAME% -f "%~dp0..\..\setup\DATABASE_SCHEMA.sql"
    echo [OK] Schema applied successfully
) else (
    echo [WARN] Schema file not found at: %~dp0..\..\setup\DATABASE_SCHEMA.sql
    echo You'll need to apply the schema manually
)

echo.
echo Importing data if available...

if exist "%~dp0..\database_data.sql" (
    echo Found exported data, importing...
    set PGPASSWORD=%DB_PASSWORD%
    psql -U %DB_USER% -d %DB_NAME% -f "%~dp0..\database_data.sql"
    echo [OK] Data imported successfully
) else (
    echo [INFO] No data file found, skipping import
)

echo.
echo [SUCCESS] Database setup complete!
echo   Database: %DB_NAME%
echo   User: %DB_USER%
echo   Host: %DB_HOST%:%DB_PORT%
echo.

exit /b 0