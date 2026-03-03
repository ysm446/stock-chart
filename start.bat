@echo off
setlocal
chcp 65001 >nul

cd /d %~dp0

echo =====================================
echo   Starting Electron app (dev mode)...
echo =====================================
echo.

if not exist package.json (
  echo [ERROR] package.json was not found in the project root.
  echo Please run this file from the stock-chart root folder.
  pause
  exit /b 1
)

if not exist node_modules (
  echo [ERROR] node_modules was not found.
  echo        Run manually: npm install
  pause
  exit /b 1
)

if not exist frontend\node_modules (
  echo [ERROR] frontend\node_modules was not found.
  echo        Run manually: npm --prefix frontend install
  pause
  exit /b 1
)

if not defined BACKEND_PYTHON (
  if exist backend\venv\Scripts\python.exe (
    set "BACKEND_PYTHON=%CD%\backend\venv\Scripts\python.exe"
  )
)

if not defined BACKEND_PYTHON (
  if exist D:\miniconda3\conda_envs\main\python.exe (
    set "BACKEND_PYTHON=D:\miniconda3\conda_envs\main\python.exe"
  )
)

if not defined BACKEND_PYTHON (
  if exist C:\Users\%USERNAME%\miniconda3\python.exe (
    set "BACKEND_PYTHON=C:\Users\%USERNAME%\miniconda3\python.exe"
  )
)

if defined BACKEND_PYTHON (
  echo Backend Python: %BACKEND_PYTHON%
  "%BACKEND_PYTHON%" -c "import uvicorn" >nul 2>&1
  if errorlevel 1 (
    echo [ERROR] uvicorn is missing in backend Python environment.
    echo        Run manually: "%BACKEND_PYTHON%" -m pip install -r backend\requirements.txt
    pause
    exit /b 1
  )

  "%BACKEND_PYTHON%" -c "import sqlalchemy" >nul 2>&1
  if errorlevel 1 (
    echo [ERROR] sqlalchemy is missing in backend Python environment.
    echo        Run manually: "%BACKEND_PYTHON%" -m pip install -r backend\requirements.txt
    pause
    exit /b 1
  )
) else (
  echo [WARN] BACKEND_PYTHON was not detected automatically.
  echo        Set BACKEND_PYTHON manually if backend launch fails.
  echo.
)

echo Launch command: npm run dev
echo This starts Vite and Electron together.
echo.

call npm run dev
set EXIT_CODE=%ERRORLEVEL%

if not "%EXIT_CODE%"=="0" (
  echo.
  echo [ERROR] Failed to start Electron app. Please check:
  echo   1) npm install
  echo   2) npm --prefix frontend install
  echo   3) backend Python runtime and dependencies
  pause
)

endlocal & exit /b %EXIT_CODE%
