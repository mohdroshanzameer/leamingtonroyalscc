@echo off
REM =============================================================================
REM TASK: Get Application Code
REM =============================================================================

setlocal enabledelayedexpansion

call "%~dp0..\config.bat"

echo.
echo ============================================================
echo  Get Application Code
echo ============================================================
echo.
echo How would you like to get the application code?
echo.
echo [1] Clone from GitHub
echo [2] Copy from local directory
echo [0] Cancel
echo.

set /p "CODE_SOURCE=Enter choice (1/2/0): "

if "%CODE_SOURCE%"=="0" (
    echo Cancelled
    exit /b 1
)

if "%CODE_SOURCE%"=="1" (
    echo.
    set /p "REPO_URL=Enter GitHub repository URL: "
    
    echo Cloning repository...
    git clone "!REPO_URL!" "%INSTALL_PATH%"
    
    if %errorLevel% neq 0 (
        echo [ERROR] Failed to clone repository
        exit /b 1
    )
    
    echo [OK] Repository cloned successfully
    exit /b 0
)

if "%CODE_SOURCE%"=="2" (
    echo.
    set /p "LOCAL_PATH=Enter local code path: "
    
    if not exist "!LOCAL_PATH!" (
        echo [ERROR] Path not found: !LOCAL_PATH!
        exit /b 1
    )
    
    echo Copying code...
    if not exist "%INSTALL_PATH%" mkdir "%INSTALL_PATH%"
    xcopy /E /I /Y "!LOCAL_PATH!\*" "%INSTALL_PATH%\"
    
    echo [OK] Code copied successfully
    exit /b 0
)

echo [ERROR] Invalid choice
exit /b 1