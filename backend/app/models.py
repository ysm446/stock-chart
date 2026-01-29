from sqlalchemy import Column, Integer, String, DECIMAL, BigInteger, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base

class Stock(Base):
    __tablename__ = "stocks"

    id = Column(Integer, primary_key=True, index=True)
    symbol = Column(String(20), unique=True, nullable=False, index=True)
    name = Column(String(255), nullable=False)
    market = Column(String(50))
    category = Column(String(100), index=True)
    
    prices = relationship("StockPrice", back_populates="stock")

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
