from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import chart, watchlist, stock, search, purchase, fundamental, company, portfolio
from app.database import init_db

app = FastAPI(
    title="日本株チャートAPI",
    description="日本株式市場向けテクニカルチャートAPI",
    version="1.0.0"
)

# CORS設定
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ルーター登録
app.include_router(chart.router, prefix="/api/chart", tags=["chart"])
app.include_router(watchlist.router, prefix="/api/watchlists", tags=["watchlist"])
app.include_router(stock.router, prefix="/api/stocks", tags=["stocks"])
app.include_router(search.router, prefix="/api", tags=["search"])
app.include_router(purchase.router, prefix="/api/purchases", tags=["purchases"])
app.include_router(fundamental.router, prefix="/api/fundamentals", tags=["fundamentals"])
app.include_router(company.router, prefix="/api/company", tags=["company"])
app.include_router(portfolio.router, prefix="/api/portfolio", tags=["portfolio"])

@app.on_event("startup")
async def startup_event():
    """アプリ起動時の初期化"""
    await init_db()

@app.get("/")
async def root():
    return {"message": "日本株チャートAPI v1.0"}

@app.get("/health")
async def health_check():
    return {"status": "ok"}
