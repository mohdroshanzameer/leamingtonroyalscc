@echo off
REM =============================================================================
REM TASK: Setup Frontend Application
REM =============================================================================

setlocal enabledelayedexpansion

REM Load configuration
call "%~dp0config.bat"

echo.
echo ============================================================
echo  TASK 4: Setting Up Frontend Application
echo ============================================================
echo.
echo Frontend Directory: %FRONTEND_DIR%
echo Port: %FRONTEND_PORT%
echo.

REM Create frontend directory
if not exist "%FRONTEND_DIR%" (
    echo [INFO] Creating frontend directory...
    mkdir "%FRONTEND_DIR%"
)

REM Copy frontend code from cloned repository
if exist "%TEMP_CLONE_DIR%\frontend" (
    echo [INFO] Copying frontend code...
    xcopy /E /I /Y "%TEMP_CLONE_DIR%\frontend\*" "%FRONTEND_DIR%\"
) else if exist "%TEMP_CLONE_DIR%\src" (
    echo [INFO] Copying frontend src...
    xcopy /E /I /Y "%TEMP_CLONE_DIR%\src\*" "%FRONTEND_DIR%\src\"
    if exist "%TEMP_CLONE_DIR%\public" (
        xcopy /E /I /Y "%TEMP_CLONE_DIR%\public\*" "%FRONTEND_DIR%\public\"
    )
)

REM Create .env file
echo [INFO] Creating .env file...
(
    echo REACT_APP_API_URL=http://localhost:%BACKEND_PORT%
    echo PORT=%FRONTEND_PORT%
) > "%FRONTEND_DIR%\.env"

REM Copy package.json if exists
if exist "%TEMP_CLONE_DIR%\package.json" (
    echo [INFO] Copying package.json...
    copy /Y "%TEMP_CLONE_DIR%\package.json" "%FRONTEND_DIR%\package.json"
)

echo.
echo [SUCCESS] Frontend setup completed
echo.

endlocal
exit /b 0