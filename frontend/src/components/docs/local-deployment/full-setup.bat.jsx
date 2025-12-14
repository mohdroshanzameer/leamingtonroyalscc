@echo off
REM =============================================================================
REM CRICKET CLUB - FULL AUTOMATED SETUP
REM =============================================================================

setlocal enabledelayedexpansion

call "%~dp0config.bat"

echo.
echo ============================================================
echo    CRICKET CLUB - FULL AUTOMATED SETUP
echo ============================================================
echo.
echo This will execute all setup steps in sequence:
echo   1. Check Prerequisites
echo   2. Clean Installation
echo   3. Setup Database
echo   4. Get Application Code
echo   5. Setup Backend
echo   6. Setup Frontend
echo   7. Create Start Scripts
echo.
echo Installation Path: %INSTALL_PATH%
echo.
set /p "CONFIRM=Continue with full setup? (y/n): "

if /i not "%CONFIRM%"=="y" (
    echo Setup cancelled.
    exit /b 0
)

echo.
echo ============================================================
echo  Step 1/7: Checking Prerequisites
echo ============================================================
call "%~dp0tasks\01-check-prerequisites.bat"
if %errorLevel% neq 0 (
    echo [ERROR] Prerequisites check failed!
    pause
    exit /b 1
)

echo.
echo ============================================================
echo  Step 2/7: Cleaning Installation
echo ============================================================
call "%~dp0tasks\02-clean-install.bat"
if %errorLevel% neq 0 (
    echo [ERROR] Clean installation failed!
    pause
    exit /b 1
)

echo.
echo ============================================================
echo  Step 3/7: Setting Up Database
echo ============================================================
call "%~dp0tasks\04-setup-database.bat"
if %errorLevel% neq 0 (
    echo [ERROR] Database setup failed!
    pause
    exit /b 1
)

echo.
echo ============================================================
echo  Step 4/7: Getting Application Code
echo ============================================================
call "%~dp0tasks\05-get-code.bat"
if %errorLevel% neq 0 (
    echo [ERROR] Failed to get application code!
    pause
    exit /b 1
)

echo.
echo ============================================================
echo  Step 5/7: Setting Up Backend
echo ============================================================
call "%~dp0tasks\06-setup-backend.bat"
if %errorLevel% neq 0 (
    echo [ERROR] Backend setup failed!
    pause
    exit /b 1
)

echo.
echo ============================================================
echo  Step 6/7: Setting Up Frontend
echo ============================================================
call "%~dp0tasks\07-setup-frontend.bat"
if %errorLevel% neq 0 (
    echo [ERROR] Frontend setup failed!
    pause
    exit /b 1
)

echo.
echo ============================================================
echo  Step 7/7: Creating Start Scripts
echo ============================================================
call "%~dp0tasks\08-create-start-scripts.bat"

echo.
echo ============================================================
echo  SETUP COMPLETE!
echo ============================================================
echo.
echo Installation: %INSTALL_PATH%
echo Backend API: http://localhost:%BACKEND_PORT%
echo Frontend: http://localhost:%FRONTEND_PORT%
echo.
echo Start scripts created:
echo   - start-backend.bat
echo   - start-frontend.bat
echo   - start-all.bat
echo.
echo To start the application, run: start-servers.bat
echo.
pause

endlocal
exit /b 0