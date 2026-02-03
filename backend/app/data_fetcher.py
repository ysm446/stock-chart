import yfinance as yf
import pandas as pd
from datetime import datetime, timedelta
from typing import Optional

class DataFetcher:
    """Yahoo Financeからデータ取得"""
    
    @staticmethod
    def fetch_stock_data(
        symbol: str,
        period: str = "1y",
        interval: str = "1d"
    ) -> Optional[pd.DataFrame]:
        """
        株価データ取得
        
        Args:
            symbol: 銘柄コード（例: '7203.T'）
            period: 期間（'1d', '5d', '1mo', '3mo', '6mo', '1y', '2y', '5y', 'max'）
            interval: 間隔（'1d', '1wk', '1mo'）
        """
        try:
            ticker = yf.Ticker(symbol)
            df = ticker.history(period=period, interval=interval)
            
            if df.empty:
                return None
            
            # インデックスをリセット（日付をカラムに）
            df.reset_index(inplace=True)
            
            # カラム名を小文字に変換
            df.columns = [col.lower() for col in df.columns]
            
            # Dateカラムが存在しない場合、インデックス名を確認
            if 'date' not in df.columns:
                # インデックスをdateカラムに
                df.rename(columns={df.columns[0]: 'date'}, inplace=True)
            
            # タイムゾーン情報を削除してソート
            if pd.api.types.is_datetime64_any_dtype(df['date']):
                df['date'] = pd.to_datetime(df['date']).dt.tz_localize(None)
            
            # 日付で昇順ソート
            df = df.sort_values('date').reset_index(drop=True)
            
            print(f"Fetched data columns: {df.columns.tolist()}")
            print(f"Data range: {df['date'].min()} to {df['date'].max()}")
            print(f"Total rows: {len(df)}")
            
            return df
        except Exception as e:
            print(f"Error fetching data for {symbol}: {e}")
            return None
    
    @staticmethod
    def get_latest_price(symbol: str) -> Optional[float]:
        """最新価格取得"""
        try:
            ticker = yf.Ticker(symbol)
            data = ticker.history(period="1d")
            if not data.empty:
                return float(data['Close'].iloc[-1])
            return None
        except Exception as e:
            print(f"Error fetching latest price for {symbol}: {e}")
            return None

    @staticmethod
    def get_realtime_quote(symbol: str) -> Optional[dict]:
        """
        リアルタイム株価情報を取得
        取引時間中は現在価格、閉場時は最終価格を返す
        """
        try:
            ticker = yf.Ticker(symbol)

            # historyから直近2営業日のデータを取得（最も確実な方法）
            data = ticker.history(period="5d")
            if data.empty or len(data) < 2:
                print(f"[{symbol}] Insufficient history data")
                return None

            # 最新の営業日とその前の営業日のデータを取得
            current_price = float(data['Close'].iloc[-1])
            previous_close = float(data['Close'].iloc[-2])

            # 最新日付を取得
            last_date = data.index[-1]
            market_time = last_date.isoformat() if hasattr(last_date, 'isoformat') else None

            # 前日終値の日付も確認
            prev_date = data.index[-2]

            print(f"[{symbol}] Latest date: {last_date}, Previous date: {prev_date}")
            print(f"[{symbol}] current={current_price}, previous={previous_close}")

            change = current_price - previous_close
            change_percent = (change / previous_close) * 100

            print(f"[{symbol}] Final: change={change}, change%={change_percent}")

            return {
                "current_price": float(current_price),
                "previous_close": float(previous_close),
                "change": float(change),
                "change_percent": float(change_percent),
                "market_time": market_time
            }

        except Exception as e:
            print(f"Error fetching realtime quote for {symbol}: {e}")
            return None
