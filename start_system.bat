@echo off
echo ========================================
echo   Website Dat Lich Kham & Tu Van Tam Ly
echo ========================================
echo.

echo [1/4] Kiem tra MySQL...
mysql --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: MySQL khong duoc cai dat hoac khong co trong PATH
    echo Vui long cai dat MySQL va them vao PATH
    pause
    exit /b 1
)
echo MySQL da san sang

echo.
echo [2/4] Khoi dong Backend...
cd Backend
start "Backend Server" cmd /k "npm start"
timeout /t 3 /nobreak >nul

echo.
echo [3/4] Khoi dong Frontend...
cd ..\frontend
start "Frontend Server" cmd /k "npm run dev"
timeout /t 3 /nobreak >nul

echo.
echo [4/4] Mo trinh duyet...
timeout /t 5 /nobreak >nul
rem Open Vite dev server (default 5173)
start http://localhost:5173

echo.
echo ========================================
echo   He thong da khoi dong thanh cong!
echo ========================================
echo.
echo Backend: http://localhost:5000
echo Frontend: http://localhost:5173
echo.
echo Nhan phim bat ky de dong cua so nay...
pause >nul

