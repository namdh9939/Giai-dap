import pandas as pd
import json
import sys
import io

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

file_path = r'D:\XNLD\Checklist kiểm tra công việc.xlsx'
try:
    xl = pd.ExcelFile(file_path)
    print('Sheets:', xl.sheet_names)
    for sheet in xl.sheet_names[:5]:
        df = pd.read_excel(file_path, sheet_name=sheet, nrows=5)
        print(f'\n--- Sheet: {sheet} ---')
        # Drop columns that are completely unnamed and empty to reduce noise
        df = df.dropna(how='all', axis=1)
        print(df.to_json(orient='records', force_ascii=False))
except Exception as e:
    print('Failed:', e)
