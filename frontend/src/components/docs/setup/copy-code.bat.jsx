@echo off
REM =============================================================================
REM COPY CODE - Copy ALL cloned code to project directories
REM =============================================================================

setlocal enabledelayedexpansion

call "%~dp0setup.config"

echo.
echo [INFO] Copying ALL files from repository...

set "CLONE_DIR=%PROJECT_DIR%\temp_clone"

REM Copy backend code
if exist "%CLONE_DIR%\backend" (
    echo Copying backend code...
    xcopy /E /Y /I "%CLONE_DIR%\backend\*" "%BACKEND_DIR%\"
    echo [OK] Backend code copied
) else (
    echo [INFO] No backend folder in repository
)

REM Copy frontend src code
if exist "%CLONE_DIR%\frontend\src" (
    echo Copying frontend src...
    xcopy /E /Y /I "%CLONE_DIR%\frontend\src\*" "%FRONTEND_DIR%\src\"
    echo [OK] Frontend code copied
) else if exist "%CLONE_DIR%\src" (
    echo Copying frontend src...
    xcopy /E /Y /I "%CLONE_DIR%\src\*" "%FRONTEND_DIR%\src\"
    echo [OK] Frontend code copied
)

REM Copy public assets
if exist "%CLONE_DIR%\public" (
    echo Copying public assets...
    xcopy /E /Y /I "%CLONE_DIR%\public\*" "%FRONTEND_DIR%\public\"
    echo [OK] Public assets copied
) else if exist "%CLONE_DIR%\frontend\public" (
    echo Copying public assets...
    xcopy /E /Y /I "%CLONE_DIR%\frontend\public\*" "%FRONTEND_DIR%\public\"
    echo [OK] Public assets copied
)

REM Copy package.json files
if exist "%CLONE_DIR%\backend\package.json" (
    echo Copying backend package.json...
    copy /Y "%CLONE_DIR%\backend\package.json" "%BACKEND_DIR%\package.json"
)

if exist "%CLONE_DIR%\frontend\package.json" (
    echo Copying frontend package.json...
    copy /Y "%CLONE_DIR%\frontend\package.json" "%FRONTEND_DIR%\package.json"
) else if exist "%CLONE_DIR%\package.json" (
    echo Copying frontend package.json...
    copy /Y "%CLONE_DIR%\package.json" "%FRONTEND_DIR%\package.json"
)

REM Copy environment example files
if exist "%CLONE_DIR%\backend\.env.example" (
    echo Copying backend .env.example...
    copy /Y "%CLONE_DIR%\backend\.env.example" "%BACKEND_DIR%\.env.example"
)

if exist "%CLONE_DIR%\frontend\.env.example" (
    echo Copying frontend .env.example...
    copy /Y "%CLONE_DIR%\frontend\.env.example" "%FRONTEND_DIR%\.env.example"
) else if exist "%CLONE_DIR%\.env.example" (
    echo Copying frontend .env.example...
    copy /Y "%CLONE_DIR%\.env.example" "%FRONTEND_DIR%\.env.example"
)

REM Copy database schema files
if exist "%CLONE_DIR%\database" (
    echo Copying database files...
    if not exist "%PROJECT_DIR%\database" mkdir "%PROJECT_DIR%\database"
    xcopy /E /Y /I "%CLONE_DIR%\database\*" "%PROJECT_DIR%\database\"
    echo [OK] Database files copied
) else if exist "%CLONE_DIR%\DATABASE_SCHEMA.sql" (
    echo Copying DATABASE_SCHEMA.sql...
    if not exist "%PROJECT_DIR%\database" mkdir "%PROJECT_DIR%\database"
    copy /Y "%CLONE_DIR%\DATABASE_SCHEMA.sql" "%PROJECT_DIR%\database\DATABASE_SCHEMA.sql"
    echo [OK] Database schema copied
)

REM Copy docs folder
if exist "%CLONE_DIR%\docs" (
    echo Copying documentation...
    if not exist "%PROJECT_DIR%\docs" mkdir "%PROJECT_DIR%\docs"
    xcopy /E /Y /I "%CLONE_DIR%\docs\*" "%PROJECT_DIR%\docs\"
    echo [OK] Documentation copied
)

REM Copy components/docs folder
if exist "%CLONE_DIR%\components\docs" (
    echo Copying components/docs...
    if not exist "%PROJECT_DIR%\docs" mkdir "%PROJECT_DIR%\docs"
    xcopy /E /Y /I "%CLONE_DIR%\components\docs\*" "%PROJECT_DIR%\docs\"
    echo [OK] Component docs copied
)

REM Copy setup scripts
if exist "%CLONE_DIR%\setup" (
    echo Copying setup scripts...
    if not exist "%~dp0" mkdir "%~dp0"
    xcopy /E /Y /I "%CLONE_DIR%\setup\*" "%~dp0\"
    echo [OK] Setup scripts copied
) else if exist "%CLONE_DIR%\components\docs\setup" (
    echo Copying setup scripts...
    xcopy /E /Y /I "%CLONE_DIR%\components\docs\setup\*" "%~dp0\"
    echo [OK] Setup scripts copied
)

REM Copy README files
if exist "%CLONE_DIR%\README.md" (
    echo Copying README.md...
    copy /Y "%CLONE_DIR%\README.md" "%PROJECT_DIR%\README.md"
)

REM Copy .gitignore
if exist "%CLONE_DIR%\.gitignore" (
    echo Copying .gitignore...
    copy /Y "%CLONE_DIR%\.gitignore" "%PROJECT_DIR%\.gitignore"
)

REM Copy config files
if exist "%CLONE_DIR%\config" (
    echo Copying config files...
    if not exist "%PROJECT_DIR%\config" mkdir "%PROJECT_DIR%\config"
    xcopy /E /Y /I "%CLONE_DIR%\config\*" "%PROJECT_DIR%\config\"
    echo [OK] Config files copied
)

echo [OK] ALL files copied successfully

endlocal
exit /b 0