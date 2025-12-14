@echo off
REM =============================================================================
REM CRICKET CLUB MANAGEMENT SYSTEM - MASTER SETUP MENU
REM =============================================================================

setlocal enabledelayedexpansion

:MENU
cls
echo.
echo ============================================
echo  CRICKET CLUB MANAGEMENT - SETUP MENU
echo ============================================
echo.
echo  1. Check Prerequisites
echo  2. Setup Database (PostgreSQL)
echo  3. Setup Backend Server
echo  4. Setup Frontend Application
echo  5. Install All Dependencies
echo  6. Create Admin User
echo  7. Clone from GitHub
echo  8. Clone and Full Setup
echo  9. Start All Services
echo  10. Start Backend Only
echo  11. Start Frontend Only
echo  12. Run Full Setup (All Steps)
echo  0. Exit
echo.
echo ============================================
echo.

set /p CHOICE="Enter your choice (0-12): "

if "%CHOICE%"=="0" goto :EXIT
if "%CHOICE%"=="1" call "%~dp0check-prerequisites.bat" & pause & goto :MENU
if "%CHOICE%"=="2" call "%~dp0setup-database.bat" & pause & goto :MENU
if "%CHOICE%"=="3" call "%~dp0setup-backend.bat" & pause & goto :MENU
if "%CHOICE%"=="4" call "%~dp0setup-frontend.bat" & pause & goto :MENU
if "%CHOICE%"=="5" call "%~dp0install-dependencies.bat" & pause & goto :MENU
if "%CHOICE%"=="6" call "%~dp0create-admin-user.bat" & pause & goto :MENU
if "%CHOICE%"=="7" call "%~dp0clone-repo.bat" & pause & goto :MENU
if "%CHOICE%"=="8" call "%~dp0clone-and-setup.bat" & pause & goto :MENU
if "%CHOICE%"=="9" call "%~dp0start-services.bat" & goto :MENU
if "%CHOICE%"=="10" call "%~dp0start-backend.bat" & goto :MENU
if "%CHOICE%"=="11" call "%~dp0start-frontend.bat" & goto :MENU
if "%CHOICE%"=="12" call "%~dp0full-setup.bat" & pause & goto :MENU

echo.
echo Invalid choice. Please try again.
pause
goto :MENU

:EXIT
echo.
echo Exiting setup menu...
echo.
endlocal
exit /b 0