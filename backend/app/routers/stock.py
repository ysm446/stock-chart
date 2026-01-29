from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Stock, Watchlist, WatchlistStock
from pydantic import BaseModel
from typing import List

router = APIRouter()

class StockCreate(BaseModel):
    symbol: str
    name: str
    market: str = "Tokyo"
    category: str = "その他"

class StockUpdate(BaseModel):
    name: str | None = None
    market: str | None = None
    category: str | None = None

class StockResponse(BaseModel):
    id: int
    symbol: str
    name: str
    market: str
    category: str

    class Config:
        from_attributes = True

@router.get("/", response_model=List[StockResponse])
async def get_all_stocks(db: Session = Depends(get_db)):
    """全銘柄取得"""
    stocks = db.query(Stock).order_by(Stock.symbol).all()
    return stocks

@router.post("/", response_model=StockResponse, status_code=201)
async def create_stock(stock: StockCreate, db: Session = Depends(get_db)):
    """新規銘柄追加"""
    # 既存チェック
    existing = db.query(Stock).filter(Stock.symbol == stock.symbol).first()
    if existing:
        raise HTTPException(status_code=400, detail="Symbol already exists")
    
    new_stock = Stock(
        symbol=stock.symbol,
        name=stock.name,
        market=stock.market,
        category=stock.category
    )
    db.add(new_stock)
    db.commit()
    db.refresh(new_stock)
    
    # デフォルトのウォッチリスト（主要銘柄）に自動追加
    default_watchlist = db.query(Watchlist).filter(Watchlist.name == "主要銘柄").first()
    if default_watchlist:
        # 既にウォッチリストに存在するかチェック
        existing_in_watchlist = db.query(WatchlistStock).filter(
            WatchlistStock.watchlist_id == default_watchlist.id,
            WatchlistStock.stock_id == new_stock.id
        ).first()
        
        if not existing_in_watchlist:
            # 現在の最大sort_orderを取得
            max_order = db.query(WatchlistStock).filter(
                WatchlistStock.watchlist_id == default_watchlist.id
            ).count()
            
            new_entry = WatchlistStock(
                watchlist_id=default_watchlist.id,
                stock_id=new_stock.id,
                sort_order=max_order
            )
            db.add(new_entry)
            db.commit()  # ここでコミット！
    
    return new_stock

@router.put("/{stock_id}", response_model=StockResponse)
async def update_stock(
    stock_id: int,
    stock_update: StockUpdate,
    db: Session = Depends(get_db)
):
    """銘柄情報更新"""
    stock = db.query(Stock).filter(Stock.id == stock_id).first()
    if not stock:
        raise HTTPException(status_code=404, detail="Stock not found")
    
    if stock_update.name is not None:
        stock.name = stock_update.name
    if stock_update.market is not None:
        stock.market = stock_update.market
    if stock_update.category is not None:
        stock.category = stock_update.category
    
    db.commit()
    db.refresh(stock)
    
    return stock

@router.delete("/{stock_id}")
async def delete_stock(stock_id: int, db: Session = Depends(get_db)):
    """銘柄削除"""
    stock = db.query(Stock).filter(Stock.id == stock_id).first()
    if not stock:
        raise HTTPException(status_code=404, detail="Stock not found")
    
    db.delete(stock)
    db.commit()
    
    return {"message": "Stock deleted"}
