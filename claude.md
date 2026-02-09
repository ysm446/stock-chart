# 日本株チャートアプリ (Stock Chart)

## プロジェクト概要

日本株のチャート表示・分析とポートフォリオ管理を統合したWebアプリケーション。

### 主要機能
- **チャート分析**: テクニカル指標、ピーク検出、購入履歴プロット
- **ポートフォリオ管理**: 保有銘柄の集計、損益計算、配当金管理
- **可視化**: 保有割合の円グラフ、損益分析

## 技術スタック

### フロントエンド (`frontend/`)
- **フレームワーク**: React 18 + TypeScript
- **ルーティング**: React Router v6
- **ビルドツール**: Vite
- **スタイリング**: Tailwind CSS
- **チャートライブラリ**:
  - lightweight-charts（ローソク足チャート）
  - recharts（円グラフ）
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
│       │   ├── chart.py
│       │   ├── portfolio.py # ポートフォリオAPI
│       │   ├── purchase.py  # 購入履歴API
│       │   └── ...
│       ├── services/        # ビジネスロジック
│       │   └── portfolio_service.py
│       ├── models.py        # SQLAlchemyモデル
│       ├── database.py      # DB接続設定
│       ├── data_fetcher.py  # 株価データ取得
│       └── indicators.py    # テクニカル指標計算
├── frontend/
│   └── src/
│       ├── App.tsx          # ルーティング設定
│       ├── pages/           # ページコンポーネント
│       │   ├── ChartPage.tsx      # チャート画面
│       │   └── PortfolioPage.tsx  # ポートフォリオ画面
│       ├── components/      # UIコンポーネント
│       │   ├── layout/      # レイアウト
│       │   │   └── Navigation.tsx # ナビゲーションバー
│       │   ├── portfolio/   # ポートフォリオ関連
│       │   │   └── HoldingsPieChart.tsx
│       │   └── ...
│       ├── services/        # API通信
│       └── store/           # Zustand ストア
│           ├── chartStore.ts
│           └── portfolioStore.ts
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

### 主要エンドポイント
- `GET /api/chart/{symbol}` - チャートデータ取得
- `GET /api/stocks` - 銘柄一覧取得
- `GET /api/purchases` - 購入履歴取得
- `POST /api/purchases` - 購入履歴追加
- `GET /api/portfolio/summary` - ポートフォリオサマリー取得
  - 購入履歴から保有銘柄を集計
  - リアルタイム株価で評価額・損益を計算
  - 配当金情報を含む

APIドキュメント: `http://localhost:8000/docs`

## 画面構成

### チャート画面 (`/`)
- サイドバー: 銘柄リスト（主要銘柄/保有銘柄/注目銘柄）
- メインエリア: ローソク足チャート + テクニカル指標
- パネル: 購入履歴管理、企業情報

### ポートフォリオ画面 (`/portfolio`)
- サマリーカード: 総評価額、総損益、配当金、銘柄数
- 保有割合円グラフ: キーカラーベースのグラデーション配色
- 保有銘柄テーブル: 詳細情報、クリックでチャート画面へ遷移

## データフロー

1. **購入履歴登録**: ユーザーがチャート画面で購入履歴を登録
2. **自動分類**: 購入履歴のある銘柄は自動的に「保有銘柄」に分類
3. **ポートフォリオ集計**:
   - 購入履歴から保有数・平均単価を計算
   - Yahoo Finance APIで最新株価を取得
   - 評価額・損益を算出
   - 配当金情報を取得して年間配当金を計算
4. **可視化**: 円グラフとテーブルで保有状況を表示

## コーディング規約

- フロントエンド: TypeScript strict mode
- バックエンド: Python 3.x、型ヒント使用
- コミットメッセージ: 日本語可

## 重要な実装ノート

### 保有銘柄の定義
購入履歴（`stock_purchases`）が存在する銘柄を「保有銘柄」として扱う。チャート画面とポートフォリオ画面で定義を統一。

### 株価データ
- 日本株は `.T` サフィックスが必須（例: `7203.T`）
- Yahoo Finance APIを使用してリアルタイム価格を取得
- 取得失敗時は購入価格をフォールバック

### カラーシステム
ポートフォリオ円グラフは4つのキーカラー（ブルー、ピンク、シアン、パープル）を基調とし、各色に明度の異なる4バリエーションを生成。保有割合の大きい順に色を割り当て。
