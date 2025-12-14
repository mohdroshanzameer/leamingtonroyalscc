@echo off
REM =============================================================================
REM CHECK PREREQUISITES
REM =============================================================================

echo.
echo ============================================
echo  Checking Prerequisites
echo ============================================
echo.

set "ALL_OK=1"

REM Check Node.js
where node >nul 2>&1
if %errorLevel% equ 0 (
    for /f "tokens=*" %%i in ('node --version') do (
        echo [OK] Node.js: %%i
    )
) else (
    echo [ERROR] Node.js not found
    echo Install from: https://nodejs.org/
    set "ALL_OK=0"
)

REM Check npm
where npm >nul 2>&1
if %errorLevel% equ 0 (
    for /f "tokens=*" %%i in ('npm --version') do (
        echo [OK] npm: %%i
    )
) else (
    echo [ERROR] npm not found
    set "ALL_OK=0"
)

REM Check PostgreSQL
where psql >nul 2>&1
if %errorLevel% equ 0 (
    for /f "tokens=*" %%i in ('psql --version') do (
        echo [OK] PostgreSQL: %%i
    )
) else (
    echo [ERROR] PostgreSQL not found
    echo Install from: https://www.postgresql.org/download/windows/
    set "ALL_OK=0"
)

REM Check Git (optional)
where git >nul 2>&1
if %errorLevel% equ 0 (
    for /f "tokens=*" %%i in ('git --version') do (
        echo [OK] Git: %%i
    )
) else (
    echo [INFO] Git not found (optional)
)

echo.
if "%ALL_OK%"=="1" (
    echo [SUCCESS] All required prerequisites met!
) else (
    echo [ERROR] Some prerequisites are missing. Please install them first.
)
echo.

exit /b %errorLevel%