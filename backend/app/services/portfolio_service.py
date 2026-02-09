from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models import StockPurchase, Stock, StockFundamental
from app.data_fetcher import DataFetcher
from typing import Dict, List
from decimal import Decimal

class PortfolioService:
    @staticmethod
    def calculate_holdings(db: Session) -> Dict:
        """
        購入履歴から保有銘柄を集計し、損益・配当金を計算します。

        Returns:
            {
                "summary": {...},
                "holdings": [...]
            }
        """
        # 1. 購入履歴を stock_id でグループ化して集計
        purchase_groups = db.query(
            StockPurchase.stock_id,
            func.sum(StockPurchase.quantity).label('total_quantity'),
            func.sum(StockPurchase.quantity * StockPurchase.purchase_price).label('total_cost')
        ).group_by(StockPurchase.stock_id).all()

        if not purchase_groups:
            return {
                "summary": {
                    "total_value": 0.0,
                    "total_cost": 0.0,
                    "total_profit_loss": 0.0,
                    "profit_loss_rate": 0.0,
                    "total_annual_dividend": 0.0
                },
                "holdings": []
            }

        holdings = []
        total_value = 0.0
        total_cost = 0.0
        total_annual_dividend = 0.0

        for group in purchase_groups:
            stock_id = group.stock_id
            total_quantity = int(group.total_quantity)
            group_total_cost = float(group.total_cost)

            # 銘柄情報を取得
            stock = db.query(Stock).filter(Stock.id == stock_id).first()
            if not stock:
                continue

            # 平均取得価格
            average_price = group_total_cost / total_quantity if total_quantity > 0 else 0.0

            # 現在価格を取得
            current_price = DataFetcher.get_latest_price(stock.symbol)
            if current_price is None:
                # 価格取得失敗時は購入価格を使用（デバッグ用）
                print(f"Warning: Failed to get price for {stock.symbol}, using purchase price")
                current_price = average_price

            # 評価額と損益を計算
            current_value = current_price * total_quantity
            profit_loss = current_value - group_total_cost
            profit_loss_rate = (profit_loss / group_total_cost * 100) if group_total_cost > 0 else 0.0

            # 配当情報を取得
            fundamental = db.query(StockFundamental).filter(
                StockFundamental.symbol == stock.symbol
            ).order_by(StockFundamental.date.desc()).first()

            dividend_yield = float(fundamental.dividend_yield) if fundamental and fundamental.dividend_yield else 0.0
            annual_dividend = current_value * (dividend_yield / 100)

            # 集計に追加
            total_value += current_value
            total_cost += group_total_cost
            total_annual_dividend += annual_dividend

            holdings.append({
                "stock_id": stock_id,
                "symbol": stock.symbol,
                "name": stock.name,
                "sector": stock.sector,
                "total_quantity": total_quantity,
                "average_price": round(average_price, 2),
                "total_cost": round(group_total_cost, 2),
                "current_price": round(current_price, 2),
                "current_value": round(current_value, 2),
                "profit_loss": round(profit_loss, 2),
                "profit_loss_rate": round(profit_loss_rate, 2),
                "dividend_yield": round(dividend_yield, 2),
                "annual_dividend": round(annual_dividend, 2),
                "weight": 0.0  # 後で計算
            })

        # 各銘柄のポートフォリオ内割合を計算
        for holding in holdings:
            holding["weight"] = round((holding["current_value"] / total_value * 100) if total_value > 0 else 0.0, 2)

        # サマリーを計算
        total_profit_loss = total_value - total_cost
        profit_loss_rate = (total_profit_loss / total_cost * 100) if total_cost > 0 else 0.0

        summary = {
            "total_value": round(total_value, 2),
            "total_cost": round(total_cost, 2),
            "total_profit_loss": round(total_profit_loss, 2),
            "profit_loss_rate": round(profit_loss_rate, 2),
            "total_annual_dividend": round(total_annual_dividend, 2)
        }

        return {
            "summary": summary,
            "holdings": holdings
        }
