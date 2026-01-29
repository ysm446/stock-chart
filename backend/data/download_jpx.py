import pandas as pd
import requests
from pathlib import Path

# JPXのデータURLを試す（実際のURLは変わる可能性があるため複数試行）
urls = [
    "https://www.jpx.co.jp/markets/statistics-equities/misc/tvdivq0000001vg2-att/data_j.xls",
    "https://www.jpx.co.jp/markets/statistics-equities/misc/tvdivq0000001vg2-att/data.xls",
]

def download_and_convert():
    """JPXから上場銘柄データをダウンロードしてCSVに変換"""
    
    print("JPXから上場銘柄データをダウンロード中...")
    
    # ダウンロード試行
    excel_data = None
    for url in urls:
        try:
            print(f"試行中: {url}")
            response = requests.get(url, timeout=30)
            if response.status_code == 200:
                excel_data = response.content
                print(f"✓ ダウンロード成功: {len(excel_data)} bytes")
                break
        except Exception as e:
            print(f"✗ エラー: {e}")
            continue
    
    if not excel_data:
        print("\n❌ ダウンロード失敗")
        print("手動でダウンロードしてください:")
        print("1. https://www.jpx.co.jp/markets/statistics-equities/misc/01.html")
        print("2. 「東証上場銘柄一覧」のExcelファイルをダウンロード")
        print("3. data_j.xls として保存")
        return False
    
    # 一時ファイルに保存
    temp_file = Path(__file__).parent / "temp_jpx.xls"
    with open(temp_file, 'wb') as f:
        f.write(excel_data)
    
    # Excelファイルを読み込み
    try:
        print("\nExcelファイルを解析中...")
        df = pd.read_excel(temp_file, header=0)
        
        print(f"読み込んだ行数: {len(df)}")
        print(f"列: {df.columns.tolist()}")
        
        # 必要な列を抽出（列名は実際のファイルに合わせて調整が必要）
        # 一般的なフォーマット: コード、銘柄名、市場、業種など
        
        # 列名を確認して適切にマッピング
        result_df = pd.DataFrame()
        
        # コード列を探す
        code_col = None
        for col in df.columns:
            if 'コード' in str(col) or 'code' in str(col).lower():
                code_col = col
                break
        
        # 銘柄名列を探す
        name_col = None
        for col in df.columns:
            if '銘柄名' in str(col) or '名称' in str(col) or 'name' in str(col).lower():
                name_col = col
                break
        
        # 市場列を探す
        market_col = None
        for col in df.columns:
            if '市場' in str(col) or 'market' in str(col).lower():
                market_col = col
                break
        
        # 業種列を探す
        sector_col = None
        for col in df.columns:
            if '業種' in str(col) or 'sector' in str(col).lower() or '33業種' in str(col):
                sector_col = col
                break
        
        if code_col and name_col:
            result_df['code'] = df[code_col].astype(str).str.strip()
            result_df['name'] = df[name_col].astype(str).str.strip()
            result_df['name_en'] = ''  # 英語名は後で追加可能
            result_df['market'] = df[market_col].astype(str).str.strip() if market_col else '東証'
            result_df['sector'] = df[sector_col].astype(str).str.strip() if sector_col else ''
            
            # 空行やヘッダー行を除外
            result_df = result_df[result_df['code'].str.len() > 0]
            result_df = result_df[result_df['code'] != 'nan']
            result_df = result_df[~result_df['code'].str.contains('コード', na=False)]
            
            # CSVに保存
            output_file = Path(__file__).parent / "jpx_stocks_full.csv"
            result_df.to_csv(output_file, index=False, encoding='utf-8')
            
            print(f"\n✓ CSV変換成功: {len(result_df)}銘柄")
            print(f"保存先: {output_file}")
            print("\n最初の5件:")
            print(result_df.head())
            
            # 一時ファイルを削除
            temp_file.unlink()
            
            return True
        else:
            print("\n⚠ 必要な列が見つかりません")
            print("実際の列名:")
            for i, col in enumerate(df.columns):
                print(f"  {i}: {col}")
            print("\n最初の数行:")
            print(df.head())
            
            return False
            
    except Exception as e:
        print(f"\n❌ エラー: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == '__main__':
    download_and_convert()
