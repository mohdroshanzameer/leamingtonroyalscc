@echo off
REM =============================================================================
REM AUTOMATED SETUP - MAIN MENU
REM =============================================================================

setlocal enabledelayedexpansion

REM Prompt for project configuration
echo.
echo ============================================================
echo    PROJECT CONFIGURATION
echo ============================================================
echo.

set /p "PROJECT_NAME=Enter project name (e.g., cricket-club): "
if "%PROJECT_NAME%"=="" set "PROJECT_NAME=cricket-club"

set /p "PROJECT_PATH=Enter project path (e.g., C:\Projects): "
if "%PROJECT_PATH%"=="" set "PROJECT_PATH=%USERPROFILE%\Projects"

echo.
echo Project will be created at: %PROJECT_PATH%\%PROJECT_NAME%
echo.
pause

REM Export for config
set "USER_PROJECT_NAME=%PROJECT_NAME%"
set "USER_PROJECT_PATH=%PROJECT_PATH%"

REM Load configuration
call "%~dp0config.bat"

:MENU
cls
echo.
echo ============================================================
echo    CRICKET CLUB - AUTOMATED SETUP SYSTEM
echo ============================================================
echo.
echo    Individual Tasks:
echo    [1] Clone Project from GitHub
echo    [2] Setup Database
echo    [3] Setup Backend
echo    [4] Setup Frontend
echo    [5] Install All Dependencies
echo    [6] Build and Start Application
echo.
echo    Full Automation:
echo    [9] FULL AUTO-SETUP (All Steps in One Go)
echo.
echo    [0] Exit
echo.
echo ============================================================
echo.

set /p "CHOICE=Enter your choice (0-9): "

if "%CHOICE%"=="0" goto :EXIT
if "%CHOICE%"=="1" call "%~dp0clone-from-github.bat" & pause & goto :MENU
if "%CHOICE%"=="2" call "%~dp0setup-database.bat" & pause & goto :MENU
if "%CHOICE%"=="3" call "%~dp0setup-backend.bat" & pause & goto :MENU
if "%CHOICE%"=="4" call "%~dp0setup-frontend.bat" & pause & goto :MENU
if "%CHOICE%"=="5" call "%~dp0install-dependencies.bat" & pause & goto :MENU
if "%CHOICE%"=="6" call "%~dp0build-and-start.bat" & pause & goto :MENU
if "%CHOICE%"=="9" call "%~dp0full-auto-setup.bat" & pause & goto :MENU

echo.
echo [ERROR] Invalid choice. Please try again.
pause
goto :MENU

:EXIT
echo.
echo Exiting setup system...
echo.
endlocal
exit /b 0