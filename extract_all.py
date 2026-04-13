import os
import PyPDF2
from docx import Document
import pandas as pd

def extract_pdf(file_path):
    text = f"\n\n{'='*40}\nFILE (PDF): {os.path.basename(file_path)}\n{'='*40}\n"
    try:
        with open(file_path, 'rb') as f:
            reader = PyPDF2.PdfReader(f)
            num_pages = len(reader.pages)
            text += f"Total Pages: {num_pages}\n"
            # Extract all pages
            for i in range(num_pages):
                page_text = reader.pages[i].extract_text()
                if page_text:
                    text += f"--- Page {i+1} ---\n{page_text[:1000]}...\n"
    except Exception as e:
        text += f"Error: {e}\n"
    return text

def extract_docx(file_path):
    text = f"\n\n{'='*40}\nFILE (DOCX): {os.path.basename(file_path)}\n{'='*40}\n"
    try:
        doc = Document(file_path)
        # Extract first 50 paragraphs
        text += "--- Content Sample ---\n"
        for p in doc.paragraphs[:50]:
            if p.text.strip():
                text += p.text + "\n"
    except Exception as e:
        text += f"Error: {e}\n"
    return text

def extract_xlsx(file_path):
    text = f"\n\n{'='*40}\nFILE (XLSX): {os.path.basename(file_path)}\n{'='*40}\n"
    try:
        xl = pd.ExcelFile(file_path)
        text += f"Sheets: {xl.sheet_names}\n"
        for sheet in xl.sheet_names[:10]:
            df = pd.read_excel(file_path, sheet_name=sheet, nrows=50) # Read up to 50 rows
            df = df.dropna(how='all', axis=1).dropna(how='all', axis=0) # Clean empty
            if not df.empty:
                text += f"\n--- Sheet: {sheet} ---\n"
                # Flatten to readable text
                for idx, row in df.iterrows():
                    values = [str(x) for x in row.values if pd.notna(x)]
                    if values:
                        text += " | ".join(values) + "\n"
    except Exception as e:
        text += f"Error: {e}\n"
    return text

files_to_process = [
    r'D:\App check\Quy chuẩn kiểm tra_nhà thầu.pdf',
    r'D:\App check\Quy chuẩn thi công_cđt.pdf',
    r'D:\XNLD\Checklist kiểm tra công việc.xlsx'
]

# Get all files in XÂY NHÀ LẦN ĐẦU.COM folder
xaynha_dir = r"D:\App check\XÂY NHÀ LẦN ĐẦU.COM"
for root, dirs, files in os.walk(xaynha_dir):
    for f in files:
        files_to_process.append(os.path.join(root, f))

# Extract all
with open('extracted_data.txt', 'w', encoding='utf-8') as out:
    for fp in files_to_process:
        if fp.endswith('.pdf'):
            out.write(extract_pdf(fp))
        elif fp.endswith('.docx'):
            out.write(extract_docx(fp))
        elif fp.endswith('.xlsx'):
            out.write(extract_xlsx(fp))

print("Extraction completed.")
