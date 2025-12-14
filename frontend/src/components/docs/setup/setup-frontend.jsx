@echo off
REM =============================================================================
REM FRONTEND APPLICATION SETUP
REM =============================================================================

setlocal enabledelayedexpansion

REM Load configuration from setup.config
call "%~dp0setup.config"

echo.
echo ============================================
echo  Frontend Application Setup
echo ============================================
echo.

REM Check if frontend already exists
if exist "%FRONTEND_DIR%" (
    echo [INFO] Frontend directory already exists: %FRONTEND_DIR%
    echo.
    set /p "OVERWRITE=Do you want to reconfigure? (y/n): "
    if /i not "!OVERWRITE!"=="y" (
        echo Skipping frontend setup
        exit /b 0
    )
) else (
    if not exist "%PROJECT_DIR%" mkdir "%PROJECT_DIR%"
)

cd "%PROJECT_DIR%"

REM Create React app if doesn't exist
if not exist "frontend\package.json" (
    echo.
    echo [1/4] Creating React application...
    echo This may take 3-5 minutes...
    call npx create-react-app@latest frontend
    if %errorLevel% neq 0 (
        echo [ERROR] Failed to create React app
        exit /b 1
    )
    echo [OK] React app created
) else (
    echo [INFO] React app already exists
)

cd frontend

REM Install dependencies
echo.
echo [2/4] Installing dependencies...
call npm install @tanstack/react-query react-router-dom axios >nul 2>&1
if %errorLevel% equ 0 (
    echo [OK] Dependencies installed
) else (
    echo [ERROR] Failed to install dependencies
    exit /b 1
)

REM Create .env
echo.
echo [3/4] Creating .env file...
(
    echo REACT_APP_API_URL=http://localhost:%BACKEND_PORT%/api
    echo REACT_APP_NAME=Cricket Club Management System
    echo REACT_APP_ENV=development
) > .env
echo [OK] .env created

REM Create API client
echo.
echo [4/4] Setting up API client...
if not exist "src\api" mkdir "src\api"
(
    echo import axios from 'axios';
    echo.
    echo const API_BASE_URL = process.env.REACT_APP_API_URL ^|^| 'http://localhost:5000/api';
    echo.
    echo const apiClient = axios.create^({
    echo   baseURL: API_BASE_URL,
    echo   headers: { 'Content-Type': 'application/json' }
    echo }^);
    echo.
    echo export default apiClient;
) > src\api\apiClient.js
echo [OK] API client created

cd ..\..

echo.
echo ============================================
echo  Frontend Setup Complete!
echo ============================================
echo.
echo Location: %FRONTEND_DIR%
echo Port: %FRONTEND_PORT%
echo.
echo To start: cd %FRONTEND_DIR% ^&^& npm start
echo.

endlocal
exit /b 0