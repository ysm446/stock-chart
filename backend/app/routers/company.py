from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import CompanyInfo
from app.data_fetcher import DataFetcher
from pydantic import BaseModel
from typing import Optional
from datetime import datetime

router = APIRouter()

class CompanyInfoResponse(BaseModel):
    id: int
    symbol: str
    long_name: Optional[str] = None
    industry: Optional[str] = None
    sector: Optional[str] = None
    business_summary: Optional[str] = None
    website: Optional[str] = None
    full_time_employees: Optional[int] = None
    city: Optional[str] = None
    state: Optional[str] = None
    country: Optional[str] = None
    address: Optional[str] = None
    zip_code: Optional[str] = None
    phone: Optional[str] = None
    previous_close: Optional[float] = None
    market_cap: Optional[int] = None
    data_source: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

@router.get("/{symbol}", response_model=CompanyInfoResponse)
async def get_company_info(symbol: str, db: Session = Depends(get_db)):
    """
    企業情報を取得

    DBにデータがある場合はDBから取得、
    ない場合はyfinanceから取得してDBに保存
    """
    # 指数（^で始まる）、為替（=Xで終わる）、またはすでに.Tがある場合はそのまま、それ以外は.T接尾辞を追加
    if symbol.startswith('^') or symbol.endswith('.T') or symbol.endswith('=X'):
        yahoo_symbol = symbol
    else:
        yahoo_symbol = f"{symbol}.T"

    # DBから検索（元のsymbolで）
    company_info = db.query(CompanyInfo).filter(CompanyInfo.symbol == symbol).first()

    if company_info:
        print(f"[{symbol}] Company info found in DB")
        return company_info

    # DBにない場合はyfinanceから取得（yahoo_symbolで）
    print(f"[{symbol}] Fetching company info from yfinance as {yahoo_symbol}")
    company_data = DataFetcher.get_company_info(yahoo_symbol)

    if not company_data:
        raise HTTPException(status_code=404, detail="Company info not found")

    # DBに保存（元のsymbolで保存）
    company_data["symbol"] = symbol
    new_company_info = CompanyInfo(**company_data)
    db.add(new_company_info)
    db.commit()
    db.refresh(new_company_info)

    print(f"[{symbol}] Company info saved to DB")
    return new_company_info

@router.post("/{symbol}/refresh", response_model=CompanyInfoResponse)
async def refresh_company_info(symbol: str, db: Session = Depends(get_db)):
    """
    企業情報を強制的に再取得してDBを更新
    """
    # 指数（^で始まる）、為替（=Xで終わる）、またはすでに.Tがある場合はそのまま、それ以外は.T接尾辞を追加
    if symbol.startswith('^') or symbol.endswith('.T') or symbol.endswith('=X'):
        yahoo_symbol = symbol
    else:
        yahoo_symbol = f"{symbol}.T"

    print(f"[{symbol}] Refreshing company info from yfinance as {yahoo_symbol}")
    company_data = DataFetcher.get_company_info(yahoo_symbol)

    if not company_data:
        raise HTTPException(status_code=404, detail="Company info not found")

    # 元のsymbolに戻す
    company_data["symbol"] = symbol

    # 既存データを検索
    company_info = db.query(CompanyInfo).filter(CompanyInfo.symbol == symbol).first()

    if company_info:
        # 更新
        for key, value in company_data.items():
            if key != "symbol":  # symbolは更新しない
                setattr(company_info, key, value)
        company_info.updated_at = datetime.utcnow()
    else:
        # 新規作成
        company_info = CompanyInfo(**company_data)
        db.add(company_info)

    db.commit()
    db.refresh(company_info)

    print(f"[{symbol}] Company info refreshed")
    return company_info

@router.delete("/{symbol}")
async def delete_company_info(symbol: str, db: Session = Depends(get_db)):
    """
    企業情報を削除
    """
    company_info = db.query(CompanyInfo).filter(CompanyInfo.symbol == symbol).first()

    if not company_info:
        raise HTTPException(status_code=404, detail="Company info not found")

    db.delete(company_info)
    db.commit()

    return {"message": "Company info deleted"}
