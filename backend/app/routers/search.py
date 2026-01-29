from fastapi import APIRouter
from pydantic import BaseModel
from typing import List
import csv
import os

router = APIRouter()

class StockSearchResult(BaseModel):
    symbol: str
    name: str
    market: str
    currency: str
    sector: str = ""

# 銘柄マスターデータをCSVから読み込み
def load_stock_master():
    stocks = []
    csv_path = os.path.join(os.path.dirname(__file__), '..', '..', 'data', 'jpx_stocks.csv')
    
    if os.path.exists(csv_path):
        try:
            with open(csv_path, 'r', encoding='utf-8') as f:
                reader = csv.DictReader(f)
                for row in reader:
                    stocks.append((
                        row['code'],
                        row['name'],
                        row['name_en'],
                        row.get('sector', 'その他')
                    ))
            print(f"Loaded {len(stocks)} stocks from CSV")
        except Exception as e:
            print(f"Error loading CSV: {e}")
    
    # CSVがない場合のフォールバック
    if not stocks:
        stocks = [
            ("7203", "トヨタ自動車", "Toyota", "輸送用機器"),
            ("9984", "ソフトバンクグループ", "SoftBank", "情報・通信業"),
            ("6758", "ソニーグループ", "Sony", "電気機器"),
            ("8058", "三菱商事", "Mitsubishi", "卸売業"),
            ("8031", "三井物産", "Mitsui", "卸売業"),
            ("7011", "三菱重工業", "MitsubishiHeavy", "機械"),
        ]
        print(f"Using fallback list with {len(stocks)} stocks")
    
    return stocks

# 起動時に読み込み
STOCK_MASTER = load_stock_master()

@router.get("/stocks/search", response_model=List[StockSearchResult])
async def search_stocks(q: str):
    """
    東証銘柄を検索する
    銘柄コードまたは銘柄名で検索
    """
    if not q or len(q) < 1:
        return []
    
    results = []
    query_upper = q.upper()
    query_lower = q.lower()
    
    # 検索実行
    for code, name_jp, name_en, sector in STOCK_MASTER:
        # 銘柄コードまたは銘柄名で一致
        if (query_upper in code.upper() or 
            query_lower in name_jp.lower() or 
            query_lower in name_en.lower()):
            results.append({
                "symbol": code,
                "name": name_jp,
                "market": "東証",
                "currency": "JPY",
                "sector": sector
            })
    
    return results[:50]  # 最大50件
