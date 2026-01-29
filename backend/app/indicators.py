import pandas as pd
from typing import Dict, List, Optional

class IndicatorCalculator:
    """テクニカル指標計算"""
    
    @staticmethod
    def calculate_sma(df: pd.DataFrame, period: int = 25) -> pd.Series:
        """単純移動平均 (SMA)"""
        return df['close'].rolling(window=period).mean()
    
    @staticmethod
    def calculate_ema(df: pd.DataFrame, period: int = 12) -> pd.Series:
        """指数移動平均 (EMA)"""
        return df['close'].ewm(span=period, adjust=False).mean()
    
    @staticmethod
    def calculate_bollinger_bands(
        df: pd.DataFrame,
        period: int = 20,
        std_dev: float = 2.0
    ) -> Dict[str, pd.Series]:
        """ボリンジャーバンド"""
        sma = df['close'].rolling(window=period).mean()
        std = df['close'].rolling(window=period).std()
        
        return {
            'upper': sma + (std * std_dev),
            'middle': sma,
            'lower': sma - (std * std_dev)
        }
    
    @staticmethod
    def calculate_rsi(df: pd.DataFrame, period: int = 14) -> pd.Series:
        """RSI (Relative Strength Index)"""
        delta = df['close'].diff()
        gain = (delta.where(delta > 0, 0)).rolling(window=period).mean()
        loss = (-delta.where(delta < 0, 0)).rolling(window=period).mean()
        
        rs = gain / loss
        rsi = 100 - (100 / (1 + rs))
        return rsi
    
    @staticmethod
    def calculate_macd(
        df: pd.DataFrame,
        fast: int = 12,
        slow: int = 26,
        signal: int = 9
    ) -> Dict[str, pd.Series]:
        """MACD"""
        ema_fast = df['close'].ewm(span=fast, adjust=False).mean()
        ema_slow = df['close'].ewm(span=slow, adjust=False).mean()
        
        macd_line = ema_fast - ema_slow
        signal_line = macd_line.ewm(span=signal, adjust=False).mean()
        histogram = macd_line - signal_line
        
        return {
            'macd': macd_line,
            'signal': signal_line,
            'histogram': histogram
        }
    
    @staticmethod
    def calculate_volume_profile(
        df: pd.DataFrame,
        bins: int = 50
    ) -> Dict[str, List]:
        """価格帯別出来高分布"""
        price_min = df['low'].min()
        price_max = df['high'].max()
        price_range = price_max - price_min
        bin_size = price_range / bins
        
        volume_profile = {}
        for i in range(bins):
            price_level = price_min + (i * bin_size)
            mask = (df['low'] <= price_level) & (df['high'] >= price_level)
            volume = df.loc[mask, 'volume'].sum()
            volume_profile[price_level] = volume
        
        return {
            'prices': list(volume_profile.keys()),
            'volumes': list(volume_profile.values())
        }
