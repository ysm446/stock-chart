"""
Fix stock symbols by adding .T suffix for Japanese stocks
"""
from app.database import SessionLocal
from app.models import Stock

def fix_stock_symbols():
    db = SessionLocal()
    try:
        stocks = db.query(Stock).all()

        print("Current stocks:")
        print("-" * 60)
        for stock in stocks:
            print(f"ID: {stock.id}, Symbol: {stock.symbol}, Name: {stock.name}")

        print("\n" + "=" * 60)
        print("Fixing stock symbols...")
        print("=" * 60 + "\n")

        for stock in stocks:
            # Add .T suffix if not already present
            if not stock.symbol.endswith('.T'):
                old_symbol = stock.symbol
                stock.symbol = f"{stock.symbol}.T"
                print(f"Updated: {old_symbol} → {stock.symbol} ({stock.name})")

        db.commit()
        print("\n✓ Stock symbols updated successfully!")

        print("\nUpdated stocks:")
        print("-" * 60)
        for stock in stocks:
            print(f"ID: {stock.id}, Symbol: {stock.symbol}, Name: {stock.name}")

    except Exception as e:
        db.rollback()
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    fix_stock_symbols()
