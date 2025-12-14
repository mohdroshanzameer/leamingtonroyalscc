@echo off
REM =============================================================================
REM INSTALL ALL DEPENDENCIES
REM =============================================================================

setlocal enabledelayedexpansion

set "PROJECT_DIR=cricket-club-app"

echo.
echo ============================================
echo  Installing All Dependencies
echo ============================================
echo.

REM Backend dependencies
if exist "%PROJECT_DIR%\backend\package.json" (
    echo [1/2] Installing backend dependencies...
    cd "%PROJECT_DIR%\backend"
    call npm install
    if %errorLevel% equ 0 (
        echo [OK] Backend dependencies installed
    ) else (
        echo [ERROR] Failed to install backend dependencies
        exit /b 1
    )
    cd ..\..
) else (
    echo [WARN] Backend not found - run setup-backend.bat first
)

REM Frontend dependencies
if exist "%PROJECT_DIR%\frontend\package.json" (
    echo.
    echo [2/2] Installing frontend dependencies...
    cd "%PROJECT_DIR%\frontend"
    call npm install
    if %errorLevel% equ 0 (
        echo [OK] Frontend dependencies installed
    ) else (
        echo [ERROR] Failed to install frontend dependencies
        exit /b 1
    )
    cd ..\..
) else (
    echo [WARN] Frontend not found - run setup-frontend.bat first
)

echo.
echo ============================================
echo  Installation Complete!
echo ============================================
echo.

endlocal
exit /b 0