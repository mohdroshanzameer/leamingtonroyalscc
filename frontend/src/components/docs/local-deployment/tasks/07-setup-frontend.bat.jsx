@echo off
REM =============================================================================
REM TASK: Setup Frontend
REM =============================================================================

setlocal enabledelayedexpansion

call "%~dp0..\config.bat"

echo.
echo ============================================================
echo  Setup Frontend
echo ============================================================
echo.

if not exist "%FRONTEND_DIR%" (
    echo [ERROR] Frontend directory not found: %FRONTEND_DIR%
    echo Please run task 5 (Get Code) first
    pause
    exit /b 1
)

cd /d "%FRONTEND_DIR%"

echo Creating .env file...
(
    echo REACT_APP_API_URL=http://localhost:%BACKEND_PORT%
    echo PORT=%FRONTEND_PORT%
) > .env

echo [OK] .env file created

echo.
echo Installing frontend dependencies...
echo This may take several minutes...

call npm install

if %errorLevel% neq 0 (
    echo [ERROR] Failed to install frontend dependencies
    exit /b 1
)

echo [OK] Frontend dependencies installed

echo.
echo [SUCCESS] Frontend setup complete!
echo   Location: %FRONTEND_DIR%
echo   Port: %FRONTEND_PORT%
echo   API URL: http://localhost:%BACKEND_PORT%
echo.

exit /b 0