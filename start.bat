@echo off
setlocal
chcp 65001 >nul

cd /d %~dp0

echo =====================================
echo   Starting Electron app...
echo =====================================
echo.

if not exist package.json (
  echo [ERROR] package.json was not found in the project root.
  echo Please run this file from the stock-chart root folder.
  pause
  exit /b 1
)

call npm run dev
set EXIT_CODE=%ERRORLEVEL%

if not "%EXIT_CODE%"=="0" (
  echo.
  echo [ERROR] Failed to start Electron app. Please check:
  echo   1) npm install
  echo   2) npm --prefix frontend install
  echo   3) backend Python venv and requirements
  pause
)

endlocal & exit /b %EXIT_CODE%
