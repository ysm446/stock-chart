from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.services.portfolio_service import PortfolioService

router = APIRouter()

@router.get("/summary")
async def get_portfolio_summary(db: Session = Depends(get_db)):
    """
    ポートフォリオ集計データ取得

    購入履歴から保有銘柄を集計し、以下を返します：
    - summary: 総評価額、総取得金額、総損益、損益率、年間配当金合計
    - holdings: 銘柄ごとの詳細データ
    """
    result = PortfolioService.calculate_holdings(db)
    return result
