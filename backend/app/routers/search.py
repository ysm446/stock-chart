from fastapi import APIRouter
from pydantic import BaseModel
from typing import List
import csv
import os

router = APIRouter()

# JPX業種コードから業種名へのマッピング
SECTOR_CODE_MAP = {
    "50": "水産・農林業",
    "1050": "鉱業",
    "2050": "建設業",
    "3050": "食料品",
    "3100": "繊維製品",
    "3150": "パルプ・紙",
    "3200": "化学",
    "3250": "医薬品",
    "3300": "石油・石炭製品",
    "3350": "ゴム製品",
    "3400": "ガラス・土石製品",
    "3450": "鉄鋼",
    "3500": "非鉄金属",
    "3550": "金属製品",
    "3600": "機械",
    "3650": "電気機器",
    "3700": "輸送用機器",
    "3750": "精密機器",
    "3800": "その他製品",
    "4050": "電気・ガス業",
    "5050": "陸運業",
    "5100": "海運業",
    "5150": "空運業",
    "5200": "倉庫・運輸関連業",
    "5250": "情報・通信業",
    "6050": "卸売業",
    "6100": "小売業",
    "7050": "銀行業",
    "7100": "証券・商品先物取引業",
    "7150": "保険業",
    "7200": "その他金融業",
    "8050": "不動産業",
    "9050": "サービス業",
    "-": "ETF・ETN",
}

def convert_sector_code(sector_code: str) -> str:
    """業種コードを業種名に変換"""
    if not sector_code:
        return "その他"
    # すでに業種名の場合はそのまま返す
    if not sector_code.replace("-", "").isdigit() and sector_code != "-":
        return sector_code
    return SECTOR_CODE_MAP.get(sector_code, sector_code)

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
                    sector_code = row.get('sector', 'その他')
                    sector_name = convert_sector_code(sector_code)
                    stocks.append((
                        row['code'],
                        row['name'],
                        row['name_en'],
                        sector_name
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
