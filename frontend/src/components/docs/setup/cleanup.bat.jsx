@echo off
REM =============================================================================
REM CLEANUP - Remove temporary files and folders
REM =============================================================================

setlocal enabledelayedexpansion

call "%~dp0setup.config"

echo.
echo [INFO] Cleaning up temporary files...

cd "%PROJECT_DIR%"

if exist "temp_clone" (
    rd /s /q temp_clone
    echo [OK] Temporary clone folder removed
) else (
    echo [INFO] No temporary files to clean
)

echo [OK] Cleanup complete

endlocal
exit /b 0