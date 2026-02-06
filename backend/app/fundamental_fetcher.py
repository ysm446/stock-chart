import yfinance as yf
from typing import Optional
from datetime import datetime


class FundamentalFetcher:
    @staticmethod
    def fetch_fundamental_data(symbol: str) -> Optional[dict]:
        """yfinanceから財務データを取得"""
        try:
            ticker = yf.Ticker(symbol)
            info = ticker.info

            # ROEを%に変換（0.15 -> 15%）
            roe_value = info.get('returnOnEquity')
            roe = roe_value * 100 if roe_value is not None else None

            # 配当利回り: yfinanceのdividendYieldは既に%値で返される
            dividend_yield = info.get('dividendYield')

            # PER: 予想PER（forwardPE）を優先、なければ実績PER（trailingPE）
            per_value = info.get('forwardPE') or info.get('trailingPE')

            return {
                'symbol': symbol,
                'date': datetime.utcnow(),
                'market_cap': info.get('marketCap'),
                'per': per_value,
                'pbr': info.get('priceToBook'),
                'eps': info.get('epsTrailingTwelveMonths'),
                'bps': info.get('bookValue'),
                'roe': roe,
                'dividend_yield': dividend_yield,
                'revenue': info.get('totalRevenue'),
                'operating_income': info.get('operatingIncome'),
                'net_income': info.get('netIncomeToCommon'),
                'data_source': 'yfinance'
            }
        except Exception as e:
            print(f"Error fetching fundamental data for {symbol}: {e}")
            return None
