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

            # fast_infoでリアルタイムデータを取得
            fast_info = ticker.fast_info

            current_price = fast_info.get('lastPrice') or fast_info.get('last_price')
            previous_close = fast_info.get('previousClose') or fast_info.get('previous_close')

            # 時間情報を取得
            market_time = None
            try:
                info = ticker.info
                regular_market_time = info.get('regularMarketTime')
                if regular_market_time:
                    # UNIXタイムスタンプをISO形式に変換
                    market_time = datetime.fromtimestamp(regular_market_time).isoformat()
            except Exception:
                pass

            if current_price is None:
                # フォールバック: historyから取得
                data = ticker.history(period="5d")
                if data.empty:
                    return None
                current_price = float(data['Close'].iloc[-1])
                if len(data) >= 2:
                    previous_close = float(data['Close'].iloc[-2])
                # historyの最新日付を時間情報として使用
                if market_time is None and not data.empty:
                    last_date = data.index[-1]
                    if hasattr(last_date, 'isoformat'):
                        market_time = last_date.isoformat()

            if current_price and previous_close:
                change = current_price - previous_close
                change_percent = (change / previous_close) * 100

                return {
                    "current_price": float(current_price),
                    "previous_close": float(previous_close),
                    "change": float(change),
                    "change_percent": float(change_percent),
                    "market_time": market_time
                }

            return None
        except Exception as e:
            print(f"Error fetching realtime quote for {symbol}: {e}")
            return None
