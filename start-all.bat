@echo off
echo Starting Cricket Club Application...
echo.
echo Backend:  http://localhost:5000
echo Frontend: http://localhost:3000
echo.
start "Cricket Club Backend" cmd /k "C:\zameer\leamingtonroyalscc\start-backend.bat"
timeout /t 5 >nul
start "Cricket Club Frontend" cmd /k "C:\zameer\leamingtonroyalscc\start-frontend.bat"
echo.
echo Application servers are starting...
echo Check the opened windows for logs.
pause
