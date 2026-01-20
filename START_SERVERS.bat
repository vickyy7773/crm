@echo off
echo ========================================
echo Starting CRM Application Servers
echo ========================================
echo.

:: Check if XAMPP MySQL is running
echo [1/3] Checking MySQL...
netstat -ano | findstr :3306 >nul
if %errorlevel% == 0 (
    echo     ✓ MySQL is running on port 3306
) else (
    echo     ✗ MySQL is NOT running!
    echo     Please start MySQL from XAMPP Control Panel
    pause
    exit /b 1
)
echo.

:: Start Backend Server
echo [2/3] Starting Backend Server...
cd /d c:\Users\rajpu\OneDrive\Desktop\crm\backend
start "CRM Backend" cmd /k "echo Backend Server Running... && node server.js"
timeout /t 3 /nobreak >nul
echo     ✓ Backend started on port 5000
echo.

:: Start Frontend Server
echo [3/3] Starting Frontend Server...
cd /d c:\Users\rajpu\OneDrive\Desktop\crm
start "CRM Frontend" cmd /k "echo Frontend Server Running... && npm run dev"
timeout /t 3 /nobreak >nul
echo     ✓ Frontend started on port 5173
echo.

echo ========================================
echo ✓ All servers started successfully!
echo ========================================
echo.
echo Backend:  http://localhost:5000
echo Frontend: http://localhost:5173
echo.
echo Press any key to close this window...
pause >nul
