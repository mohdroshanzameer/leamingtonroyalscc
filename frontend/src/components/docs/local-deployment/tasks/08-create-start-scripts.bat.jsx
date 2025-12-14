@echo off
REM =============================================================================
REM TASK: Create Start Scripts
REM =============================================================================

setlocal enabledelayedexpansion

call "%~dp0..\config.bat"

echo.
echo ============================================================
echo  Creating Start Scripts
echo ============================================================
echo.

REM Create start-backend.bat
echo Creating start-backend.bat...
(
    echo @echo off
    echo cd /d "%BACKEND_DIR%"
    echo echo Starting Backend API...
    echo echo URL: http://localhost:%BACKEND_PORT%
    echo npm run dev
) > "%INSTALL_PATH%\start-backend.bat"

REM Create start-frontend.bat
echo Creating start-frontend.bat...
(
    echo @echo off
    echo cd /d "%FRONTEND_DIR%"
    echo echo Starting Frontend...
    echo echo URL: http://localhost:%FRONTEND_PORT%
    echo npm start
) > "%INSTALL_PATH%\start-frontend.bat"

REM Create start-all.bat
echo Creating start-all.bat...
(
    echo @echo off
    echo echo Starting Cricket Club Application...
    echo echo.
    echo echo Backend:  http://localhost:%BACKEND_PORT%
    echo echo Frontend: http://localhost:%FRONTEND_PORT%
    echo echo.
    echo start "Cricket Club Backend" cmd /k "%INSTALL_PATH%\start-backend.bat"
    echo timeout /t 5 ^>nul
    echo start "Cricket Club Frontend" cmd /k "%INSTALL_PATH%\start-frontend.bat"
    echo echo.
    echo echo Application servers are starting...
    echo echo Check the opened windows for logs.
    echo pause
) > "%INSTALL_PATH%\start-all.bat"

echo [OK] Start scripts created

echo.
echo [SUCCESS] Start scripts created in: %INSTALL_PATH%
echo   - start-backend.bat
echo   - start-frontend.bat
echo   - start-all.bat
echo.

exit /b 0