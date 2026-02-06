from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import StockFundamental
from app.fundamental_fetcher import FundamentalFetcher
from pydantic import BaseModel
from datetime import datetime, timedelta
from typing import Optional

router = APIRouter()


class FundamentalResponse(BaseModel):
    symbol: str
    date: str
    market_cap: Optional[int] = None
    per: Optional[float] = None
    pbr: Optional[float] = None
    eps: Optional[float] = None
    bps: Optional[float] = None
    roe: Optional[float] = None
    dividend_yield: Optional[float] = None
    revenue: Optional[int] = None
    operating_income: Optional[int] = None
    net_income: Optional[int] = None
    data_source: str = "yfinance"

    class Config:
        from_attributes = True


@router.get("/{symbol}", response_model=FundamentalResponse)
async def get_fundamental_data(symbol: str, db: Session = Depends(get_db)):
    """
    単一銘柄の財務データを取得
    - DBで24時間以内のデータを検索
    - なければyfinanceから取得してDB保存
    """
    # Yahoo Finance形式に変換（既に.Tが付いている場合はそのまま）
    yahoo_symbol = symbol if symbol.endswith('.T') else f"{symbol}.T"

    # DBから最新データを取得（24時間以内）
    cutoff_time = datetime.utcnow() - timedelta(hours=24)
    existing = db.query(StockFundamental).filter(
        StockFundamental.symbol == symbol,
        StockFundamental.date >= cutoff_time
    ).order_by(StockFundamental.date.desc()).first()

    if existing:
        # キャッシュされたデータを返す
        return FundamentalResponse(
            symbol=existing.symbol,
            date=existing.date.isoformat(),
            market_cap=existing.market_cap,
            per=float(existing.per) if existing.per else None,
            pbr=float(existing.pbr) if existing.pbr else None,
            eps=float(existing.eps) if existing.eps else None,
            bps=float(existing.bps) if existing.bps else None,
            roe=float(existing.roe) if existing.roe else None,
            dividend_yield=float(existing.dividend_yield) if existing.dividend_yield else None,
            revenue=existing.revenue,
            operating_income=existing.operating_income,
            net_income=existing.net_income,
            data_source=existing.data_source
        )

    # yfinanceから新規取得
    data = FundamentalFetcher.fetch_fundamental_data(yahoo_symbol)

    if not data:
        raise HTTPException(status_code=404, detail="Financial data not available for this symbol")

    # DBに保存
    fundamental = StockFundamental(
        symbol=symbol,  # 元のシンボルで保存
        date=data['date'],
        market_cap=data['market_cap'],
        per=data['per'],
        pbr=data['pbr'],
        eps=data['eps'],
        bps=data['bps'],
        roe=data['roe'],
        dividend_yield=data['dividend_yield'],
        revenue=data['revenue'],
        operating_income=data['operating_income'],
        net_income=data['net_income'],
        data_source=data['data_source']
    )

    db.add(fundamental)
    db.commit()
    db.refresh(fundamental)

    return FundamentalResponse(
        symbol=fundamental.symbol,
        date=fundamental.date.isoformat(),
        market_cap=fundamental.market_cap,
        per=float(fundamental.per) if fundamental.per else None,
        pbr=float(fundamental.pbr) if fundamental.pbr else None,
        eps=float(fundamental.eps) if fundamental.eps else None,
        bps=float(fundamental.bps) if fundamental.bps else None,
        roe=float(fundamental.roe) if fundamental.roe else None,
        dividend_yield=float(fundamental.dividend_yield) if fundamental.dividend_yield else None,
        revenue=fundamental.revenue,
        operating_income=fundamental.operating_income,
        net_income=fundamental.net_income,
        data_source=fundamental.data_source
    )
