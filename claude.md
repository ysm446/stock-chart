# 日本株チャートアプリ (Stock Chart)

## プロジェクト概要

日本株のチャートを表示・分析するWebアプリケーション。

## 技術スタック

### フロントエンド (`frontend/`)
- **フレームワーク**: React 18 + TypeScript
- **ビルドツール**: Vite
- **スタイリング**: Tailwind CSS
- **チャートライブラリ**: lightweight-charts
- **状態管理**: Zustand
- **HTTP クライアント**: Axios
- **アイコン**: Lucide React

### バックエンド (`backend/`)
- **フレームワーク**: FastAPI (Python)
- **ORM**: SQLAlchemy
- **データベース**: SQLite (`backend/stock_chart.db`)
- **株価データ取得**: yfinance
- **テクニカル指標計算**: pandas-ta
- **キャッシュ**: Redis (オプション)

## ディレクトリ構成

```
stock-chart/
├── backend/
│   └── app/
│       ├── main.py          # FastAPIエントリポイント
│       ├── routers/         # APIルーター
│       ├── models.py        # SQLAlchemyモデル
│       ├── database.py      # DB接続設定
│       ├── data_fetcher.py  # 株価データ取得
│       └── indicators.py    # テクニカル指標計算
├── frontend/
│   └── src/
│       ├── App.tsx          # メインコンポーネント
│       ├── components/      # UIコンポーネント
│       ├── services/        # API通信
│       └── store/           # Zustand ストア
└── database/                # データベース関連
```

## 開発コマンド

### フロントエンド
```bash
cd frontend
npm run dev      # 開発サーバー起動 (localhost:5173)
npm run build    # プロダクションビルド
npm run lint     # ESLint実行
```

### バックエンド
```bash
cd backend
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### 一括起動
- `start.bat` または `start-local.bat` を実行

## APIエンドポイント

バックエンドは `http://localhost:8000` で起動。

## コーディング規約

- フロントエンド: TypeScript strict mode
- バックエンド: Python 3.x、型ヒント使用
- コミットメッセージ: 日本語可
