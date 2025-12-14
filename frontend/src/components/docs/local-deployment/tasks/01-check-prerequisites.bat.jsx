@echo off
REM =============================================================================
REM TASK: Check Prerequisites
REM =============================================================================

setlocal enabledelayedexpansion

call "%~dp0..\config.bat"

echo.
echo ============================================================
echo  Checking Prerequisites
echo ============================================================
echo.

set "ALL_OK=1"

REM Check Node.js
where node >nul 2>&1
if %errorLevel% equ 0 (
    for /f "tokens=*" %%i in ('node --version') do echo [OK] Node.js: %%i
) else (
    echo [ERROR] Node.js not found
    echo Install from: https://nodejs.org/
    set "ALL_OK=0"
)

REM Check npm
where npm >nul 2>&1
if %errorLevel% equ 0 (
    for /f "tokens=*" %%i in ('npm --version') do echo [OK] npm: %%i
) else (
    echo [ERROR] npm not found
    set "ALL_OK=0"
)

REM Check PostgreSQL
where psql >nul 2>&1
if %errorLevel% equ 0 (
    echo [OK] PostgreSQL installed
) else (
    echo [ERROR] PostgreSQL not found
    echo Install from: https://www.postgresql.org/download/windows/
    set "ALL_OK=0"
)

REM Check Git (optional)
where git >nul 2>&1
if %errorLevel% equ 0 (
    echo [OK] Git installed
) else (
    echo [WARN] Git not found (optional - only needed for GitHub clone)
)

echo.

if "%ALL_OK%"=="0" (
    echo [ERROR] Some prerequisites are missing!
    exit /b 1
) else (
    echo [SUCCESS] All prerequisites are installed!
    exit /b 0
)