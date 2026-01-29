@echo off
chcp 65001 >nul
echo =====================================
echo   日本株チャートアプリ起動中...
echo =====================================
echo.

cd /d %~dp0

echo [1/2] バックエンドサーバーを起動中...
start "Backend Server" cmd /k "cd backend && python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000"
timeout /t 3 >nul

echo [2/2] フロントエンドサーバーを起動中...
start "Frontend Server" cmd /k "cd frontend && npm run dev"
timeout /t 5 >nul

echo.
echo =====================================
echo   起動完了！
echo =====================================
echo.
echo アプリを開く: http://localhost:5173
echo API確認: http://localhost:8000/docs
echo.
echo 終了するには、開いた2つのウィンドウで Ctrl+C を押してください
echo.

timeout /t 3 >nul
start http://localhost:5173

pause
