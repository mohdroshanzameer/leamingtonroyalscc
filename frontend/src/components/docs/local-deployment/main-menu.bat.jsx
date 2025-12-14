@echo off
REM =============================================================================
REM CRICKET CLUB - LOCAL DEPLOYMENT MAIN MENU
REM =============================================================================

setlocal enabledelayedexpansion

REM Load configuration
call "%~dp0config.bat"

:MENU
cls
echo.
echo ============================================================
echo    CRICKET CLUB - LOCAL DEPLOYMENT SYSTEM
echo ============================================================
echo.
echo    Installation Path: %INSTALL_PATH%
echo    Database: %DB_NAME% on %DB_HOST%:%DB_PORT%
echo.
echo    Individual Tasks:
echo    [1] Check Prerequisites
echo    [2] Clean Existing Installation
echo    [3] Export Data from Existing Database
echo    [4] Setup Local Database
echo    [5] Get Application Code
echo    [6] Setup Backend API
echo    [7] Setup Frontend
echo    [8] Create Start Scripts
echo.
echo    Full Automation:
echo    [9] FULL SETUP (All Steps)
echo.
echo    Utilities:
echo    [S] Start Application Servers
echo    [C] Edit Configuration
echo.
echo    [0] Exit
echo.
echo ============================================================
echo.

set /p "CHOICE=Enter your choice (0-9, S, C): "

if "%CHOICE%"=="0" goto :EXIT
if /i "%CHOICE%"=="1" call "%~dp0tasks\01-check-prerequisites.bat" & pause & goto :MENU
if /i "%CHOICE%"=="2" call "%~dp0tasks\02-clean-install.bat" & pause & goto :MENU
if /i "%CHOICE%"=="3" call "%~dp0tasks\03-export-data.bat" & pause & goto :MENU
if /i "%CHOICE%"=="4" call "%~dp0tasks\04-setup-database.bat" & pause & goto :MENU
if /i "%CHOICE%"=="5" call "%~dp0tasks\05-get-code.bat" & pause & goto :MENU
if /i "%CHOICE%"=="6" call "%~dp0tasks\06-setup-backend.bat" & pause & goto :MENU
if /i "%CHOICE%"=="7" call "%~dp0tasks\07-setup-frontend.bat" & pause & goto :MENU
if /i "%CHOICE%"=="8" call "%~dp0tasks\08-create-start-scripts.bat" & pause & goto :MENU
if /i "%CHOICE%"=="9" call "%~dp0full-setup.bat" & pause & goto :MENU
if /i "%CHOICE%"=="S" call "%~dp0start-servers.bat" & goto :MENU
if /i "%CHOICE%"=="C" notepad "%~dp0config.bat" & goto :MENU

echo.
echo [ERROR] Invalid choice. Please try again.
timeout /t 2 >nul
goto :MENU

:EXIT
echo.
echo Exiting...
endlocal
exit /b 0