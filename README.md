# 日本株価チャートアプリ

高性能な日本株式市場向けテクニカルチャートアプリケーション

## 機能

- 📊 **ローソク足チャート** - TradingView Lightweight Chartsによる高速描画
- 📈 **テクニカル指標**
  - 移動平均線（SMA, EMA）
  - ボリンジャーバンド
  - 価格帯別出来高分布
- ⏱️ **時間軸切り替え** - 日足/週足/月足
- 🌙 **ダークモード** - 目に優しいUI
- 📑 **銘柄管理** - カテゴリ分けされたウォッチリスト
- 💾 **データキャッシュ** - 高速レスポンス

## 技術スタック

### Frontend
- React 18 + TypeScript
- TradingView Lightweight Charts
- Tailwind CSS
- Vite

### Backend
- Python 3.11+
- FastAPI
- pandas / pandas-ta（テクニカル分析）
- yfinance（データ取得）

### Database
- PostgreSQL（データ永続化）
- Redis（キャッシュ）

## セットアップ

### 前提条件
- Node.js 18+
- Python 3.11+
- Docker & Docker Compose

### クイックスタート

```bash
# 1. リポジトリのクローン
git clone <repository-url>
cd stock-chart

# 2. Docker環境の起動
docker-compose up -d

# 3. フロントエンド
cd frontend
npm install
npm run dev

# 4. バックエンド
cd ../backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

### アクセス
- Frontend: http://localhost:5173
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs

## 開発

```bash
# Frontend開発サーバー
cd frontend
npm run dev

# Backend開発サーバー
cd backend
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# データベース初期化
docker-compose exec postgres psql -U stockuser -d stockdb -f /docker-entrypoint-initdb.d/init.sql
```

## ライセンス

MIT
