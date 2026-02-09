from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import StockPurchase, Stock
from pydantic import BaseModel
from typing import List
from datetime import datetime

router = APIRouter()

class PurchaseCreate(BaseModel):
    stock_id: int
    purchase_date: str  # ISO format: "2024-01-15"
    quantity: int
    purchase_price: float
    notes: str | None = None

class PurchaseUpdate(BaseModel):
    purchase_date: str | None = None
    quantity: int | None = None
    purchase_price: float | None = None
    notes: str | None = None

class PurchaseResponse(BaseModel):
    id: int
    stock_id: int
    purchase_date: str
    quantity: int
    purchase_price: float
    notes: str | None
    created_at: str
    updated_at: str

    class Config:
        from_attributes = True

@router.get("/", response_model=List[PurchaseResponse])
async def get_purchases(
    stock_id: int | None = None,
    db: Session = Depends(get_db)
):
    """全購入履歴取得（オプションで銘柄別にフィルタ）"""
    query = db.query(StockPurchase)
    if stock_id:
        query = query.filter(StockPurchase.stock_id == stock_id)
    purchases = query.order_by(StockPurchase.purchase_date.desc()).all()

    # 日付をフォーマットしてレスポンスを返す
    return [
        {
            "id": purchase.id,
            "stock_id": purchase.stock_id,
            "purchase_date": purchase.purchase_date.strftime('%Y-%m-%d'),
            "quantity": purchase.quantity,
            "purchase_price": float(purchase.purchase_price),
            "notes": purchase.notes,
            "created_at": purchase.created_at.strftime('%Y-%m-%d %H:%M:%S'),
            "updated_at": purchase.updated_at.strftime('%Y-%m-%d %H:%M:%S'),
        }
        for purchase in purchases
    ]

@router.post("/", response_model=PurchaseResponse, status_code=201)
async def create_purchase(
    purchase: PurchaseCreate,
    db: Session = Depends(get_db)
):
    """新規購入履歴作成"""
    # 銘柄が存在するか確認
    stock = db.query(Stock).filter(Stock.id == purchase.stock_id).first()
    if not stock:
        raise HTTPException(status_code=404, detail="Stock not found")

    # 日付をパース
    try:
        purchase_date = datetime.strptime(purchase.purchase_date, '%Y-%m-%d')
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD")

    # 株数と価格のバリデーション
    if purchase.quantity <= 0:
        raise HTTPException(status_code=400, detail="Quantity must be positive")
    if purchase.purchase_price <= 0:
        raise HTTPException(status_code=400, detail="Price must be positive")

    new_purchase = StockPurchase(
        stock_id=purchase.stock_id,
        purchase_date=purchase_date,
        quantity=purchase.quantity,
        purchase_price=purchase.purchase_price,
        notes=purchase.notes
    )

    db.add(new_purchase)

    # 重要: 銘柄を自動的に「保有銘柄」に分類
    stock.user_category = "保有銘柄"

    db.commit()
    db.refresh(new_purchase)

    return {
        "id": new_purchase.id,
        "stock_id": new_purchase.stock_id,
        "purchase_date": new_purchase.purchase_date.strftime('%Y-%m-%d'),
        "quantity": new_purchase.quantity,
        "purchase_price": float(new_purchase.purchase_price),
        "notes": new_purchase.notes,
        "created_at": new_purchase.created_at.strftime('%Y-%m-%d %H:%M:%S'),
        "updated_at": new_purchase.updated_at.strftime('%Y-%m-%d %H:%M:%S'),
    }

@router.put("/{purchase_id}", response_model=PurchaseResponse)
async def update_purchase(
    purchase_id: int,
    purchase_update: PurchaseUpdate,
    db: Session = Depends(get_db)
):
    """購入履歴更新"""
    purchase = db.query(StockPurchase).filter(StockPurchase.id == purchase_id).first()
    if not purchase:
        raise HTTPException(status_code=404, detail="Purchase not found")

    # 日付の更新
    if purchase_update.purchase_date:
        try:
            purchase.purchase_date = datetime.strptime(purchase_update.purchase_date, '%Y-%m-%d')
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid date format")

    # 株数の更新
    if purchase_update.quantity is not None:
        if purchase_update.quantity <= 0:
            raise HTTPException(status_code=400, detail="Quantity must be positive")
        purchase.quantity = purchase_update.quantity

    # 価格の更新
    if purchase_update.purchase_price is not None:
        if purchase_update.purchase_price <= 0:
            raise HTTPException(status_code=400, detail="Price must be positive")
        purchase.purchase_price = purchase_update.purchase_price

    # メモの更新
    if purchase_update.notes is not None:
        purchase.notes = purchase_update.notes

    purchase.updated_at = datetime.utcnow()

    db.commit()
    db.refresh(purchase)

    return {
        "id": purchase.id,
        "stock_id": purchase.stock_id,
        "purchase_date": purchase.purchase_date.strftime('%Y-%m-%d'),
        "quantity": purchase.quantity,
        "purchase_price": float(purchase.purchase_price),
        "notes": purchase.notes,
        "created_at": purchase.created_at.strftime('%Y-%m-%d %H:%M:%S'),
        "updated_at": purchase.updated_at.strftime('%Y-%m-%d %H:%M:%S'),
    }

@router.delete("/{purchase_id}")
async def delete_purchase(
    purchase_id: int,
    db: Session = Depends(get_db)
):
    """購入履歴削除"""
    purchase = db.query(StockPurchase).filter(StockPurchase.id == purchase_id).first()
    if not purchase:
        raise HTTPException(status_code=404, detail="Purchase not found")

    db.delete(purchase)
    db.commit()

    return {"message": "Purchase deleted successfully"}
