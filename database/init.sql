-- TimescaleDB拡張を有効化
CREATE EXTENSION IF NOT EXISTS timescaledb;

-- 株価データテーブル
CREATE TABLE IF NOT EXISTS stock_prices (
    id SERIAL,
    symbol VARCHAR(20) NOT NULL,
    date TIMESTAMP NOT NULL,
    open DECIMAL(12, 2),
    high DECIMAL(12, 2),
    low DECIMAL(12, 2),
    close DECIMAL(12, 2),
    volume BIGINT,
    PRIMARY KEY (symbol, date)
);

-- TimescaleDBハイパーテーブル化
SELECT create_hypertable('stock_prices', 'date', if_not_exists => TRUE);

-- 銘柄マスタテーブル
CREATE TABLE IF NOT EXISTS stocks (
    id SERIAL PRIMARY KEY,
    symbol VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    market VARCHAR(50),
    category VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ユーザーウォッチリストテーブル
CREATE TABLE IF NOT EXISTS watchlists (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    color VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ウォッチリスト銘柄関連テーブル
CREATE TABLE IF NOT EXISTS watchlist_stocks (
    watchlist_id INTEGER REFERENCES watchlists(id) ON DELETE CASCADE,
    stock_id INTEGER REFERENCES stocks(id) ON DELETE CASCADE,
    sort_order INTEGER DEFAULT 0,
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (watchlist_id, stock_id)
);

-- インデックス作成
CREATE INDEX idx_stock_prices_symbol ON stock_prices(symbol);
CREATE INDEX idx_stock_prices_date ON stock_prices(date DESC);
CREATE INDEX idx_stocks_symbol ON stocks(symbol);
CREATE INDEX idx_stocks_category ON stocks(category);

-- サンプルデータ挿入
INSERT INTO stocks (symbol, name, market, category) VALUES
    ('7203.T', 'トヨタ自動車', 'Tokyo', '自動車'),
    ('9984.T', 'ソフトバンクグループ', 'Tokyo', '通信'),
    ('6758.T', 'ソニーグループ', 'Tokyo', '電気機器'),
    ('9432.T', '日本電信電話', 'Tokyo', '通信'),
    ('6861.T', 'キーエンス', 'Tokyo', '電気機器'),
    ('8306.T', '三菱UFJフィナンシャル・グループ', 'Tokyo', '銀行'),
    ('6501.T', '日立製作所', 'Tokyo', '電気機器'),
    ('7974.T', '任天堂', 'Tokyo', 'その他製品'),
    ('4063.T', '信越化学工業', 'Tokyo', '化学'),
    ('8035.T', '東京エレクトロン', 'Tokyo', '電気機器')
ON CONFLICT (symbol) DO NOTHING;

-- デフォルトウォッチリスト作成
INSERT INTO watchlists (name, color) VALUES
    ('主要銘柄', '#3B82F6'),
    ('テクノロジー', '#8B5CF6'),
    ('金融', '#10B981')
ON CONFLICT DO NOTHING;

-- ウォッチリストに銘柄追加
INSERT INTO watchlist_stocks (watchlist_id, stock_id, sort_order)
SELECT 1, id, ROW_NUMBER() OVER (ORDER BY id)
FROM stocks
WHERE symbol IN ('7203.T', '9984.T', '6758.T', '9432.T')
ON CONFLICT DO NOTHING;

INSERT INTO watchlist_stocks (watchlist_id, stock_id, sort_order)
SELECT 2, id, ROW_NUMBER() OVER (ORDER BY id)
FROM stocks
WHERE symbol IN ('6758.T', '6861.T', '8035.T', '7974.T')
ON CONFLICT DO NOTHING;

INSERT INTO watchlist_stocks (watchlist_id, stock_id, sort_order)
SELECT 3, id, ROW_NUMBER() OVER (ORDER BY id)
FROM stocks
WHERE symbol IN ('8306.T')
ON CONFLICT DO NOTHING;
