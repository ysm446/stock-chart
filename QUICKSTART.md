# 日本株チャートアプリ - クイックスタートガイド

## 🚀 起動方法

### 方法1: ダブルクリックで起動（簡単！）

**Windows:**
- `start.bat` をダブルクリック

または

- `start.ps1` を右クリック → **PowerShellで実行**

自動的に：
1. バックエンドサーバーが起動
2. フロントエンドサーバーが起動  
3. ブラウザが開く（http://localhost:5173）

---

### 方法2: 手動起動

#### ターミナル1（バックエンド）
```powershell
cd backend
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

#### ターミナル2（フロントエンド）
```powershell
cd frontend
npm run dev
```

その後、http://localhost:5173 を開く

---

## 🛑 停止方法

開いた各ターミナルウィンドウで `Ctrl+C` を押す

---

## 📊 使い方

1. **サイドバー**から銘柄を選択
2. **日足/週足/月足**ボタンで時間軸を切り替え
3. **指標**ボタンでテクニカル指標を表示
   - 単純移動平均（SMA）
   - 指数移動平均（EMA）
   - ボリンジャーバンド

---

## 🔧 トラブルシューティング

### エラー: `node` または `npm` が認識されない
→ PowerShellを再起動してください

### ポート8000が使用中
→ 他のアプリを終了するか、`backend/app/main.py` でポート番号を変更

### チャートが表示されない
→ F12を押してコンソールのエラーを確認
→ バックエンドとフロントエンド両方が起動しているか確認

---

## 📝 プロジェクト構成

```
stock-chart/
├── start.bat          ← クリックで起動（Windows）
├── start.ps1          ← PowerShellで起動
├── backend/           ← FastAPI (Python)
│   └── app/
├── frontend/          ← React + Vite
│   └── src/
└── database/          ← SQLite (自動作成)
```
