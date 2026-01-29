from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import select
from app.database import get_db
from app.models import Watchlist, Stock, WatchlistStock
from pydantic import BaseModel
from typing import List

router = APIRouter()

class WatchlistCreate(BaseModel):
    name: str
    color: str = "#3B82F6"

class StockResponse(BaseModel):
    id: int
    symbol: str
    name: str
    market: str
    sector: str | None = ""
    user_category: str | None = ""

    # 後方互換性のためのプロパティ
    @property
    def category(self):
        return self.user_category or ""

    class Config:
        from_attributes = True

class WatchlistResponse(BaseModel):
    id: int
    name: str
    color: str
    stocks: List[StockResponse]

@router.get("/", response_model=List[WatchlistResponse])
async def get_watchlists(db: Session = Depends(get_db)):
    """全ウォッチリスト取得"""
    watchlists = db.query(Watchlist).all()
    
    result = []
    for wl in watchlists:
        stocks = db.query(Stock).join(
            WatchlistStock,
            Stock.id == WatchlistStock.stock_id
        ).filter(
            WatchlistStock.watchlist_id == wl.id
        ).order_by(
            WatchlistStock.sort_order
        ).all()
        
        result.append({
            "id": wl.id,
            "name": wl.name,
            "color": wl.color,
            "stocks": stocks
        })
    
    return result

@router.post("/", status_code=201)
async def create_watchlist(
    watchlist: WatchlistCreate,
    db: Session = Depends(get_db)
):
    """新規ウォッチリスト作成"""
    new_watchlist = Watchlist(
        name=watchlist.name,
        color=watchlist.color
    )
    db.add(new_watchlist)
    db.commit()
    db.refresh(new_watchlist)
    
    return {"id": new_watchlist.id, "name": new_watchlist.name}

@router.post("/{watchlist_id}/stocks")
async def add_stock_to_watchlist(
    watchlist_id: int,
    stock_id: int,
    db: Session = Depends(get_db)
):
    """ウォッチリストに銘柄追加"""
    # ウォッチリスト存在確認
    watchlist = db.query(Watchlist).filter(Watchlist.id == watchlist_id).first()
    if not watchlist:
        raise HTTPException(status_code=404, detail="Watchlist not found")
    
    # 銘柄存在確認
    stock = db.query(Stock).filter(Stock.id == stock_id).first()
    if not stock:
        raise HTTPException(status_code=404, detail="Stock not found")
    
    # 既に追加済みか確認
    existing = db.query(WatchlistStock).filter(
        WatchlistStock.watchlist_id == watchlist_id,
        WatchlistStock.stock_id == stock_id
    ).first()
    
    if existing:
        raise HTTPException(status_code=400, detail="Stock already in watchlist")
    
    # 追加
    new_entry = WatchlistStock(
        watchlist_id=watchlist_id,
        stock_id=stock_id
    )
    db.add(new_entry)
    db.commit()
    
    return {"message": "Stock added to watchlist"}

@router.delete("/{watchlist_id}/stocks/{stock_id}")
async def remove_stock_from_watchlist(
    watchlist_id: int,
    stock_id: int,
    db: Session = Depends(get_db)
):
    """ウォッチリストから銘柄削除"""
    entry = db.query(WatchlistStock).filter(
        WatchlistStock.watchlist_id == watchlist_id,
        WatchlistStock.stock_id == stock_id
    ).first()
    
    if not entry:
        raise HTTPException(status_code=404, detail="Entry not found")
    
    db.delete(entry)
    db.commit()
    
    return {"message": "Stock removed from watchlist"}
