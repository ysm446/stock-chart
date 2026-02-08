from sqlalchemy import Column, Integer, String, DECIMAL, BigInteger, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base
from datetime import datetime

class Stock(Base):
    __tablename__ = "stocks"

    id = Column(Integer, primary_key=True, index=True)
    symbol = Column(String(20), unique=True, nullable=False, index=True)
    name = Column(String(255), nullable=False)
    market = Column(String(50))
    sector = Column(String(100))  # 業種（電気機器、化学など）
    user_category = Column(String(100), default="ウォッチリスト", index=True)  # ユーザー分類（保有銘柄、ウォッチリスト）

    prices = relationship("StockPrice", back_populates="stock")
    purchases = relationship("StockPurchase", back_populates="stock")
    fundamentals = relationship("StockFundamental", back_populates="stock")

class StockPrice(Base):
    __tablename__ = "stock_prices"

    id = Column(Integer, primary_key=True)
    symbol = Column(String(20), ForeignKey("stocks.symbol"), nullable=False)
    date = Column(DateTime, nullable=False)
    open = Column(DECIMAL(12, 2))
    high = Column(DECIMAL(12, 2))
    low = Column(DECIMAL(12, 2))
    close = Column(DECIMAL(12, 2))
    volume = Column(BigInteger)
    
    stock = relationship("Stock", back_populates="prices")

class Watchlist(Base):
    __tablename__ = "watchlists"

    id = Column(Integer, primary_key=True)
    name = Column(String(100), nullable=False)
    color = Column(String(20))

class WatchlistStock(Base):
    __tablename__ = "watchlist_stocks"

    watchlist_id = Column(Integer, ForeignKey("watchlists.id"), primary_key=True)
    stock_id = Column(Integer, ForeignKey("stocks.id"), primary_key=True)
    sort_order = Column(Integer, default=0)

class StockPurchase(Base):
    __tablename__ = "stock_purchases"

    id = Column(Integer, primary_key=True, index=True)
    stock_id = Column(Integer, ForeignKey("stocks.id"), nullable=False)
    purchase_date = Column(DateTime, nullable=False, index=True)
    quantity = Column(Integer, nullable=False)  # 購入株数
    purchase_price = Column(DECIMAL(12, 2), nullable=False)  # 購入単価
    notes = Column(String(500))  # メモ（オプション）
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    stock = relationship("Stock", back_populates="purchases")

class StockFundamental(Base):
    __tablename__ = "stock_fundamentals"

    id = Column(Integer, primary_key=True, index=True)
    symbol = Column(String(20), ForeignKey("stocks.symbol"), nullable=False, index=True)
    date = Column(DateTime, nullable=False, index=True)

    # 基本財務指標
    market_cap = Column(BigInteger)  # 時価総額
    per = Column(DECIMAL(10, 2))  # PER (株価収益率)
    pbr = Column(DECIMAL(10, 2))  # PBR (株価純資産倍率)
    eps = Column(DECIMAL(12, 2))  # EPS (1株当たり利益)
    bps = Column(DECIMAL(12, 2))  # BPS (1株当たり純資産)
    roe = Column(DECIMAL(8, 4))  # ROE (%)
    dividend_yield = Column(DECIMAL(8, 4))  # 配当利回り (%)

    # 追加データ（オプション）
    revenue = Column(BigInteger)  # 売上高
    operating_income = Column(BigInteger)  # 営業利益
    net_income = Column(BigInteger)  # 純利益

    # メタデータ
    data_source = Column(String(50), default="yfinance")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # リレーション
    stock = relationship("Stock", back_populates="fundamentals")

class CompanyInfo(Base):
    __tablename__ = "company_info"

    id = Column(Integer, primary_key=True, index=True)
    symbol = Column(String(20), ForeignKey("stocks.symbol"), unique=True, nullable=False, index=True)

    # 基本情報
    long_name = Column(String(255))  # 正式名称
    industry = Column(String(100))  # 業種
    sector = Column(String(100))  # セクター
    business_summary = Column(String(5000))  # 事業概要

    # 企業情報
    website = Column(String(255))  # ウェブサイト
    full_time_employees = Column(Integer)  # 従業員数

    # 所在地
    city = Column(String(100))  # 市区町村
    state = Column(String(100))  # 都道府県
    country = Column(String(100))  # 国
    address = Column(String(255))  # 住所
    zip_code = Column(String(20))  # 郵便番号
    phone = Column(String(50))  # 電話番号

    # その他
    previous_close = Column(DECIMAL(12, 2))  # 前日終値
    market_cap = Column(BigInteger)  # 時価総額

    # メタデータ
    data_source = Column(String(50), default="yfinance")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # リレーション
    stock = relationship("Stock")
