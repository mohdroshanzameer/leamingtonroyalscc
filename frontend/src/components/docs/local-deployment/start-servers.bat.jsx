@echo off
REM =============================================================================
REM CRICKET CLUB - START SERVERS
REM =============================================================================

call "%~dp0config.bat"

echo.
echo ============================================================
echo  Starting Cricket Club Application
echo ============================================================
echo.

if not exist "%INSTALL_PATH%\start-all.bat" (
    echo [ERROR] Start scripts not found!
    echo Please run the full setup first (option 9 from main menu)
    pause
    exit /b 1
)

echo Starting backend and frontend servers...
echo.
echo Backend: http://localhost:%BACKEND_PORT%
echo Frontend: http://localhost:%FRONTEND_PORT%
echo.

cd /d "%INSTALL_PATH%"
call start-all.bat

exit /b 0