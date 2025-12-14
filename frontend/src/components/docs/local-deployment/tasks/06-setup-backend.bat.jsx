@echo off
REM =============================================================================
REM TASK: Setup Backend API
REM =============================================================================

setlocal enabledelayedexpansion

call "%~dp0..\config.bat"

echo.
echo ============================================================
echo  Setup Backend API
echo ============================================================
echo.

if not exist "%BACKEND_DIR%" (
    echo [ERROR] Backend directory not found: %BACKEND_DIR%
    echo Please run task 5 (Get Code) first
    pause
    exit /b 1
)

cd /d "%BACKEND_DIR%"

echo Creating .env file...
(
    echo PORT=%BACKEND_PORT%
    echo DB_HOST=%DB_HOST%
    echo DB_PORT=%DB_PORT%
    echo DB_NAME=%DB_NAME%
    echo DB_USER=%DB_USER%
    echo DB_PASSWORD=%DB_PASSWORD%
    echo JWT_SECRET=%JWT_SECRET%
    echo NODE_ENV=development
) > .env

echo [OK] .env file created

echo.
echo Installing backend dependencies...
echo This may take several minutes...

call npm install

if %errorLevel% neq 0 (
    echo [ERROR] Failed to install backend dependencies
    exit /b 1
)

echo [OK] Backend dependencies installed

echo.
echo [SUCCESS] Backend setup complete!
echo   Location: %BACKEND_DIR%
echo   Port: %BACKEND_PORT%
echo.

exit /b 0