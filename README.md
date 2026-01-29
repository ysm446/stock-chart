# 日本株価チャートアプリ

高性能な日本株式市場向けテクニカルチャートアプリケーション

## 機能

- 📊 **ローソク足チャート** - TradingView Lightweight Chartsによる高速描画
- 📈 **テクニカル指標**
  - 移動平均線（SMA 25/50/75, EMA）
  - ボリンジャーバンド
  - 価格帯別出来高分布
- 🎯 **ピーク・谷の検出** - 価格の転換点を自動検出
- ⏱️ **時間軸切り替え** - 日足/週足/月足
- 🌙 **ダークモード** - 目に優しいUI
- 📑 **銘柄管理** - タブ形式で整理（主要指標/保有銘柄/注目銘柄）
- 🛒 **購入履歴管理**
  - 購入履歴の記録・編集・削除
  - チャート上に購入ポイントをプロット
  - 平均取得単価・投資総額の自動計算
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
- SQLAlchemy（ORM）
- pandas / pandas-ta（テクニカル分析）
- yfinance（データ取得）

### Database
- SQLite（データ永続化）
- Redis（キャッシュ、オプション）

## セットアップ

### 前提条件
- Node.js 18+
- Python 3.11+

### クイックスタート

```bash
# 1. リポジトリのクローン
git clone <repository-url>
cd stock-chart

# 2. バックエンド
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt

# データベースの初期化（自動で作成されます）
uvicorn app.main:app --reload

# 3. フロントエンド（別のターミナルで）
cd frontend
npm install
npm run dev
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
```

## データベース

アプリケーションはSQLiteを使用しており、初回起動時に自動的にデータベースファイル（`stock_chart.db`）とテーブルが作成されます。

### テーブル構成
- `stocks` - 銘柄情報
- `stock_prices` - 株価データ
- `watchlists` - ウォッチリスト
- `watchlist_stocks` - ウォッチリスト-銘柄の関連
- `stock_purchases` - 購入履歴

## ライセンス

MIT
