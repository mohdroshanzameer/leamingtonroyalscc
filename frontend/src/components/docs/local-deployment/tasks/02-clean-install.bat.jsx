@echo off
REM =============================================================================
REM TASK: Clean Existing Installation
REM =============================================================================

setlocal enabledelayedexpansion

call "%~dp0..\config.bat"

echo.
echo ============================================================
echo  Cleaning Existing Installation
echo ============================================================
echo.

if exist "%INSTALL_PATH%" (
    echo Found existing installation at: %INSTALL_PATH%
    echo.
    set /p "CONFIRM=Remove existing installation? (y/n): "
    
    if /i "!CONFIRM!"=="y" (
        echo Removing...
        rd /s /q "%INSTALL_PATH%" 2>nul
        echo [OK] Cleaned existing installation
    ) else (
        echo [INFO] Keeping existing installation
    )
) else (
    echo [INFO] No existing installation found
)

echo.
exit /b 0