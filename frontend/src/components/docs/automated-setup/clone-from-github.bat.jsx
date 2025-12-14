@echo off
REM =============================================================================
REM TASK: Clone Project from GitHub
REM =============================================================================

setlocal enabledelayedexpansion

REM Load configuration
call "%~dp0config.bat"

echo.
echo ============================================================
echo  TASK 1: Cloning Project from GitHub
echo ============================================================
echo.
echo Repository: %GITHUB_REPO_URL%
echo Target: %TEMP_CLONE_DIR%
echo.

REM Check if Git is installed
where git >nul 2>&1
if %errorLevel% neq 0 (
    echo [ERROR] Git is not installed. Please install Git first.
    exit /b 1
)

REM Clean up any existing clone
if exist "%TEMP_CLONE_DIR%" (
    echo [INFO] Removing existing clone directory...
    rmdir /s /q "%TEMP_CLONE_DIR%"
)

REM Clone repository
echo [INFO] Cloning repository...
git clone "%GITHUB_REPO_URL%" "%TEMP_CLONE_DIR%"

if %errorLevel% neq 0 (
    echo [ERROR] Failed to clone repository
    exit /b 1
)

echo.
echo [SUCCESS] Repository cloned successfully
echo.

endlocal
exit /b 0