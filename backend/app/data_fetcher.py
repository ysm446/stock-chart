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
