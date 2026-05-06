@echo off
chcp 65001 >nul
title AI FlowOps - Sistem Baslatiliyor...

echo.
echo  ================================================
echo    AI FlowOps  -  Sistem Baslatici
echo  ================================================
echo.

:: Calisma dizinini bat dosyasinin bulundugu yere ayarla
cd /d "%~dp0"

:: --- Port temizligi: 3001 (backend) -----------------------------------------
echo  [1/4] Port 3001 kontrol ediliyor (backend)...
for /f "tokens=5" %%a in ('netstat -ano 2^>nul ^| findstr ":3001 " ^| findstr "LISTENING"') do (
    echo        PID %%a kapatiliyor...
    taskkill /PID %%a /F >nul 2>&1
)

:: --- Port temizligi: 5173 (frontend) ----------------------------------------
echo  [2/4] Port 5173 kontrol ediliyor (frontend)...
for /f "tokens=5" %%a in ('netstat -ano 2^>nul ^| findstr ":5173 " ^| findstr "LISTENING"') do (
    echo        PID %%a kapatiliyor...
    taskkill /PID %%a /F >nul 2>&1
)

timeout /t 1 >nul

:: --- Backend baslatiliyor ----------------------------------------------------
echo  [3/4] Backend baslatiliyor (http://localhost:3001) ...
start "FlowOps Backend" cmd /k "cd /d "%~dp0" && title FlowOps Backend ^| Port 3001 && node src/index.js"

:: Backend saglik kontrolu (maks 10 sn)
echo        Backend hazir olana kadar bekleniyor...
set /a RETRY=0
:HEALTH_CHECK
timeout /t 2 >nul
set /a RETRY+=1
curl -s -o nul http://localhost:3001/api/health
if %ERRORLEVEL% EQU 0 (
    echo        Backend HAZIR! [OK]
    goto FRONTEND_START
)
if %RETRY% LSS 5 (
    echo        Deneme %RETRY%/5...
    goto HEALTH_CHECK
)
echo        [UYARI] Backend yanit vermedi, yine de devam ediliyor.

:FRONTEND_START
:: --- Frontend baslatiliyor ---------------------------------------------------
echo  [4/4] Frontend baslatiliyor (http://localhost:5173) ...
start "FlowOps Frontend" cmd /k "cd /d "%~dp0\frontend" && title FlowOps Frontend ^| Port 5173 && npm run dev"

echo        Frontend derleniyor (5 sn bekleniyor)...
timeout /t 5 >nul

:: --- Tarayici ac -------------------------------------------------------------
echo.
echo  ================================================
echo    Sistem HAZIR!
echo.
echo    Frontend  :  http://localhost:5173
echo    Backend   :  http://localhost:3001
echo    API Test  :  http://localhost:3001/api/health
echo  ================================================
echo.

start "" "http://localhost:5173"

echo  Sistemi durdurmak icin acilan terminal pencerelerini kapatin.
echo  Bu pencere kapatilabilir.
echo.
pause
