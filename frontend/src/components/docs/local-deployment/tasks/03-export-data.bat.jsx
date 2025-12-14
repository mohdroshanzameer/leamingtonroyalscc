@echo off
REM =============================================================================
REM TASK: Export Data from Existing Database
REM =============================================================================

setlocal enabledelayedexpansion

call "%~dp0..\config.bat"

echo.
echo ============================================================
echo  Export Data from Existing Database
echo ============================================================
echo.
echo This will export all data from your production database
echo (e.g., Base44/Supabase) to import into your local database.
echo.

set /p "EXPORT_DATA=Export existing data? (y/n): "

if /i not "%EXPORT_DATA%"=="y" (
    echo [INFO] Skipping data export
    exit /b 0
)

echo.
set /p "SOURCE_DB_HOST=Enter source database host (e.g., db.xxx.supabase.co): "
set /p "SOURCE_DB_NAME=Enter source database name: "
set /p "SOURCE_DB_USER=Enter source database user: "
set /p "SOURCE_DB_PASSWORD=Enter source database password: "
set /p "SOURCE_DB_PORT=Enter source database port (default 5432): "

if "!SOURCE_DB_PORT!"=="" set "SOURCE_DB_PORT=5432"

echo.
echo Exporting data from !SOURCE_DB_HOST!...
echo This may take a few minutes...

set PGPASSWORD=!SOURCE_DB_PASSWORD!

pg_dump -h !SOURCE_DB_HOST! -p !SOURCE_DB_PORT! -U !SOURCE_DB_USER! -d !SOURCE_DB_NAME! --data-only --inserts --column-inserts > "%~dp0..\database_data.sql"

if exist "%~dp0..\database_data.sql" (
    echo [OK] Data exported to database_data.sql
    exit /b 0
) else (
    echo [ERROR] Failed to export data
    exit /b 1
)