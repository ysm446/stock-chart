from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.data_fetcher import DataFetcher
from app.indicators import IndicatorCalculator
from typing import Optional
import redis
import json
import pandas as pd

router = APIRouter()

# Redisクライアント（オプショナル）
try:
    redis_client = redis.Redis(host='localhost', port=6379, db=0, decode_responses=True, socket_connect_timeout=1)
    redis_client.ping()
except:
    redis_client = None  # Redisなしでも動作

@router.get("/{symbol}")
async def get_chart_data(
    symbol: str,
    timeframe: str = Query("1d", regex="^(1d|1wk|1mo)$"),
    db: Session = Depends(get_db)
):
    """
    チャートデータ取得
    
    Args:
        symbol: 銘柄コード（例: 7203 または 7203.T または ^N225 または USDJPY=X）
        timeframe: 時間軸（1d=日足、1wk=週足、1mo=月足）
    """
    # 指数（^で始まる）、為替（=Xで終わる）、またはすでに.Tがある場合はそのまま、それ以外は.T接尾辞を追加
    if symbol.startswith('^') or symbol.endswith('.T') or symbol.endswith('=X'):
        yahoo_symbol = symbol
    else:
        yahoo_symbol = f"{symbol}.T"
    
    cache_key = f"chart:{symbol}:{timeframe}"
    
    # キャッシュチェック
    if redis_client:
        try:
            cached_data = redis_client.get(cache_key)
            if cached_data:
                return json.loads(cached_data)
        except Exception as e:
            print(f"Redis error: {e}")
    
    # データ取得
    df = DataFetcher.fetch_stock_data(yahoo_symbol, period="2y", interval=timeframe)
    
    if df is None or df.empty:
        raise HTTPException(status_code=404, detail=f"Data not found for {symbol}")
    
    # 日付でソート（昇順）
    df = df.sort_values('date').reset_index(drop=True)
    
    # データフォーマット
    chart_data = []
    for _, row in df.iterrows():
        chart_data.append({
            "time": row['date'].strftime('%Y-%m-%d'),
            "open": float(row['open']),
            "high": float(row['high']),
            "low": float(row['low']),
            "close": float(row['close']),
            "volume": int(row['volume'])
        })
    
    # テクニカル指標計算
    sma25_data = []
    sma50_data = []
    sma75_data = []
    ema_data = []
    bb_data = {"upper": [], "middle": [], "lower": []}
    
    # SMA25計算
    sma25 = IndicatorCalculator.calculate_sma(df, period=25)
    for date, value in zip(df['date'], sma25):
        if pd.notna(value):
            sma25_data.append({
                "time": date.strftime('%Y-%m-%d'),
                "value": float(value)
            })
    
    # SMA50計算
    sma50 = IndicatorCalculator.calculate_sma(df, period=50)
    for date, value in zip(df['date'], sma50):
        if pd.notna(value):
            sma50_data.append({
                "time": date.strftime('%Y-%m-%d'),
                "value": float(value)
            })
    
    # SMA75計算
    sma75 = IndicatorCalculator.calculate_sma(df, period=75)
    for date, value in zip(df['date'], sma75):
        if pd.notna(value):
            sma75_data.append({
                "time": date.strftime('%Y-%m-%d'),
                "value": float(value)
            })
    
    # EMA計算
    ema = IndicatorCalculator.calculate_ema(df, period=12)
    for date, value in zip(df['date'], ema):
        if pd.notna(value):
            ema_data.append({
                "time": date.strftime('%Y-%m-%d'),
                "value": float(value)
            })
    
    # ボリンジャーバンド計算
    bb = IndicatorCalculator.calculate_bollinger_bands(df, period=20)
    for date, upper, middle, lower in zip(df['date'], bb['upper'], bb['middle'], bb['lower']):
        if pd.notna(upper):
            bb_data['upper'].append({
                "time": date.strftime('%Y-%m-%d'),
                "value": float(upper)
            })
            bb_data['middle'].append({
                "time": date.strftime('%Y-%m-%d'),
                "value": float(middle)
            })
            bb_data['lower'].append({
                "time": date.strftime('%Y-%m-%d'),
                "value": float(lower)
            })
    
    # リアルタイム株価を取得
    realtime_quote = DataFetcher.get_realtime_quote(yahoo_symbol)

    response = {
        "symbol": symbol,
        "data": chart_data,
        "sma25": sma25_data,
        "sma50": sma50_data,
        "sma75": sma75_data,
        "ema": ema_data,
        "bollinger": bb_data,
        "quote": realtime_quote
    }
    
    if redis_client:
        try:
            redis_client.setex(cache_key, 300, json.dumps(response))
        except Exception as e:
            print(f"Redis cache error: {e}")
    
    return response

@router.get("/{symbol}/volume-profile")
async def get_volume_profile(
    symbol: str,
    timeframe: str = Query("1d", regex="^(1d|1wk|1mo)$"),
    bins: int = Query(50, ge=10, le=100)
):
    """価格帯別出来高分布取得"""
    df = DataFetcher.fetch_stock_data(symbol, period="1y", interval=timeframe)
    
    if df is None or df.empty:
        raise HTTPException(status_code=404, detail=f"Data not found for {symbol}")
    
    volume_profile = IndicatorCalculator.calculate_volume_profile(df, bins=bins)
    
    return {
        "symbol": symbol,
        "volume_profile": volume_profile
    }
