@echo off
REM =============================================================================
REM FULL AUTOMATED SETUP - All Steps
REM =============================================================================

echo.
echo ============================================
echo  FULL SETUP - All Steps
echo ============================================
echo.
echo This will run all setup steps in sequence:
echo   1. Check prerequisites
echo   2. Setup database
echo   3. Setup backend
echo   4. Setup frontend
echo   5. Install dependencies
echo   6. Create admin user
echo.
set /p "CONFIRM=Continue? (y/n): "
if /i not "%CONFIRM%"=="y" exit /b 0

echo.
echo ============================================
echo  Step 1/6: Checking Prerequisites
echo ============================================
call "%~dp0check-prerequisites.bat"
if %errorLevel% neq 0 (
    echo [ERROR] Prerequisites check failed
    exit /b 1
)

echo.
echo ============================================
echo  Step 2/6: Setting Up Database
echo ============================================
call "%~dp0setup-database.bat"
if %errorLevel% neq 0 (
    echo [ERROR] Database setup failed
    exit /b 1
)

echo.
echo ============================================
echo  Step 3/6: Setting Up Backend
echo ============================================
call "%~dp0setup-backend.bat"
if %errorLevel% neq 0 (
    echo [ERROR] Backend setup failed
    exit /b 1
)

echo.
echo ============================================
echo  Step 4/6: Setting Up Frontend
echo ============================================
call "%~dp0setup-frontend.bat"
if %errorLevel% neq 0 (
    echo [ERROR] Frontend setup failed
    exit /b 1
)

echo.
echo ============================================
echo  Step 5/6: Installing Dependencies
echo ============================================
call "%~dp0install-dependencies.bat"
if %errorLevel% neq 0 (
    echo [ERROR] Dependency installation failed
    exit /b 1
)

echo.
echo ============================================
echo  Step 6/6: Creating Admin User
echo ============================================
call "%~dp0create-admin-user.bat"
if %errorLevel% neq 0 (
    echo [WARN] Admin user creation failed (you can do this later)
)

echo.
echo ============================================
echo  FULL SETUP COMPLETE!
echo ============================================
echo.
echo All components are ready.
echo.
set /p "START_NOW=Start the application now? (y/n): "
if /i "%START_NOW%"=="y" (
    call "%~dp0start-services.bat"
)

exit /b 0