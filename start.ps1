# 日本株チャートアプリ起動スクリプト

Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "  日本株チャートアプリ起動中...  " -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

# 環境変数を更新
$env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")

# バックエンド起動
Write-Host "[1/2] バックエンドサーバーを起動中..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\backend'; python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000"
Start-Sleep -Seconds 3

# フロントエンド起動
Write-Host "[2/2] フロントエンドサーバーを起動中..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "`$env:Path = [System.Environment]::GetEnvironmentVariable('Path','Machine') + ';' + [System.Environment]::GetEnvironmentVariable('Path','User'); cd '$PSScriptRoot\frontend'; npm run dev"
Start-Sleep -Seconds 5

Write-Host ""
Write-Host "=====================================" -ForegroundColor Green
Write-Host "  起動完了！  " -ForegroundColor Green
Write-Host "=====================================" -ForegroundColor Green
Write-Host ""
Write-Host "アプリを開く: http://localhost:5173" -ForegroundColor Cyan
Write-Host "API確認: http://localhost:8000/docs" -ForegroundColor Cyan
Write-Host ""
Write-Host "終了するには、開いた2つのウィンドウで Ctrl+C を押してください" -ForegroundColor Gray
Write-Host ""

# ブラウザを開く
Start-Sleep -Seconds 3
Start-Process "http://localhost:5173"
