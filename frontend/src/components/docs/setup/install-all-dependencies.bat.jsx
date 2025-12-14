@echo off
REM =============================================================================
REM INSTALL ALL DEPENDENCIES - Install npm packages for backend and frontend
REM =============================================================================

setlocal enabledelayedexpansion

call "%~dp0setup.config"

echo.
echo [INFO] Installing all dependencies...

REM Install backend dependencies
if exist "%BACKEND_DIR%\package.json" (
    echo.
    echo Installing backend dependencies...
    cd "%BACKEND_DIR%"
    call npm install
    if %errorLevel% equ 0 (
        echo [OK] Backend dependencies installed
    ) else (
        echo [ERROR] Backend dependency installation failed
        exit /b 1
    )
) else (
    echo [WARN] No backend package.json found
)

REM Install frontend dependencies
if exist "%FRONTEND_DIR%\package.json" (
    echo.
    echo Installing frontend dependencies...
    cd "%FRONTEND_DIR%"
    call npm install
    if %errorLevel% equ 0 (
        echo [OK] Frontend dependencies installed
    ) else (
        echo [ERROR] Frontend dependency installation failed
        exit /b 1
    )
) else (
    echo [WARN] No frontend package.json found
)

echo.
echo [OK] All dependencies installed

endlocal
exit /b 0