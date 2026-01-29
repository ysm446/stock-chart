import os
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv

load_dotenv()

# SQLiteを使用（Dockerなしで動作）
DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "sqlite:///./stock_chart.db"
)

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

async def init_db():
    """データベース初期化"""
    from app.models import Stock, Watchlist, WatchlistStock
    Base.metadata.create_all(bind=engine)
    
    # サンプルデータ挿入
    db = SessionLocal()
    try:
        # 既存データチェック
        if db.query(Stock).count() == 0:
            # サンプル銘柄データ
            stocks = [
                Stock(symbol='7203.T', name='トヨタ自動車', market='Tokyo', category='自動車'),
                Stock(symbol='9984.T', name='ソフトバンクグループ', market='Tokyo', category='通信'),
                Stock(symbol='6758.T', name='ソニーグループ', market='Tokyo', category='電気機器'),
                Stock(symbol='9432.T', name='日本電信電話', market='Tokyo', category='通信'),
                Stock(symbol='6861.T', name='キーエンス', market='Tokyo', category='電気機器'),
                Stock(symbol='8306.T', name='三菱UFJフィナンシャル・グループ', market='Tokyo', category='銀行'),
                Stock(symbol='6501.T', name='日立製作所', market='Tokyo', category='電気機器'),
                Stock(symbol='7974.T', name='任天堂', market='Tokyo', category='その他製品'),
                Stock(symbol='4063.T', name='信越化学工業', market='Tokyo', category='化学'),
                Stock(symbol='8035.T', name='東京エレクトロン', market='Tokyo', category='電気機器'),
            ]
            db.add_all(stocks)
            db.commit()
            
            # ウォッチリスト作成
            watchlists = [
                Watchlist(id=1, name='主要銘柄', color='#3B82F6'),
                Watchlist(id=2, name='テクノロジー', color='#8B5CF6'),
                Watchlist(id=3, name='金融', color='#10B981'),
            ]
            db.add_all(watchlists)
            db.commit()
            
            # ウォッチリストに銘柄追加
            wl_stocks = [
                WatchlistStock(watchlist_id=1, stock_id=1, sort_order=1),
                WatchlistStock(watchlist_id=1, stock_id=2, sort_order=2),
                WatchlistStock(watchlist_id=1, stock_id=3, sort_order=3),
                WatchlistStock(watchlist_id=1, stock_id=4, sort_order=4),
                WatchlistStock(watchlist_id=2, stock_id=3, sort_order=1),
                WatchlistStock(watchlist_id=2, stock_id=5, sort_order=2),
                WatchlistStock(watchlist_id=2, stock_id=10, sort_order=3),
                WatchlistStock(watchlist_id=2, stock_id=8, sort_order=4),
                WatchlistStock(watchlist_id=3, stock_id=6, sort_order=1),
            ]
            db.add_all(wl_stocks)
            db.commit()
    finally:
        db.close()

def get_db():
    """データベースセッション取得"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
