@echo off
REM =============================================================================
REM CLONE REPOSITORY - Clone code from GitHub
REM =============================================================================

setlocal enabledelayedexpansion

call "%~dp0setup.config"

if "%~1"=="" (
    set /p "GITHUB_REPO=Enter GitHub repository URL: "
) else (
    set "GITHUB_REPO=%~1"
)

if "%GITHUB_REPO%"=="" (
    echo [ERROR] GitHub repository URL is required
    exit /b 1
)

echo.
echo [INFO] Cloning repository from GitHub...
cd "%PROJECT_DIR%"

if exist "temp_clone" rd /s /q temp_clone

git clone "%GITHUB_REPO%" temp_clone
if %errorLevel% neq 0 (
    echo [ERROR] Failed to clone repository
    exit /b 1
)

echo [OK] Repository cloned to temp_clone

endlocal
exit /b 0