from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Stock, Watchlist, WatchlistStock
from app.routers.search import convert_sector_code
from pydantic import BaseModel
from typing import List

router = APIRouter()

class StockCreate(BaseModel):
    symbol: str
    name: str
    market: str = "Tokyo"
    sector: str = "その他"
    user_category: str = "ウォッチリスト"

class StockUpdate(BaseModel):
    name: str | None = None
    market: str | None = None
    sector: str | None = None
    user_category: str | None = None

class StockResponse(BaseModel):
    id: int
    symbol: str
    name: str
    market: str
    sector: str
    user_category: str
    
    # 後方互換性のため
    @property
    def category(self):
        return self.user_category

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
    
    # セクターコードを名称に変換
    sector_name = convert_sector_code(stock.sector)

    new_stock = Stock(
        symbol=stock.symbol,
        name=stock.name,
        market=stock.market,
        sector=sector_name,
        user_category=stock.user_category
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
    if stock_update.sector is not None:
        stock.sector = stock_update.sector
    if stock_update.user_category is not None:
        stock.user_category = stock_update.user_category
    
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

@router.post("/fix-sectors")
async def fix_sector_codes(db: Session = Depends(get_db)):
    """既存銘柄のセクターコードを名称に変換"""
    stocks = db.query(Stock).all()
    updated_count = 0

    for stock in stocks:
        new_sector = convert_sector_code(stock.sector)
        if new_sector != stock.sector:
            stock.sector = new_sector
            updated_count += 1

    db.commit()

    return {"message": f"Updated {updated_count} stocks"}
