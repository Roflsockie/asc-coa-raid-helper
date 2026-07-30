@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo.
echo  Raid-COA server starting...
echo  Open: http://localhost:8080
echo  Close this window to stop
echo.
start http://localhost:8080
npx --yes serve . -p 8080 --cors
pause
