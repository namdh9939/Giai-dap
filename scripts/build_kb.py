import json
import re
import os

def build_knowledge_base(input_file, output_file):
    if not os.path.exists(input_file):
        print(f"Error: {input_file} not found.")
        return

    with open(input_file, 'r', encoding='utf-8') as f:
        content = f.read()

    # Split by files first
    file_blocks = re.split(r'={10,}\nFILE \(.*?\): (.*?)\n={10,}', content)
    
    kb = []
    
    # file_blocks[0] is empty or preamble
    for i in range(1, len(file_blocks), 2):
        filename = file_blocks[i].strip()
        file_content = file_blocks[i+1]
        
        # Split by pages
        page_blocks = re.split(r'--- Page (\d+) ---', file_content)
        
        for j in range(1, len(page_blocks), 2):
            page_num = page_blocks[j]
            page_text = page_blocks[j+1].strip()
            
            if not page_text:
                continue
                
            # Further split page text into paragraphs/sections if it's too long
            # For now, we take page-level chunks for better context
            
            # Clean text: remove repeating watermarks if any
            clean_text = page_text.replace('nhacuami nh. vn', '').replace('nhacuami nh. vn', '').strip()
            clean_text = re.sub(r'\s+', ' ', clean_text)
            
            # Simple keyword extraction (can be improved by AI later)
            # We take nouns or capitalized words as basic keywords
            keywords = list(set(re.findall(r'[A-ZÀÁẢÃẠÂẦẤẨẪẬĂẰẮẲẴẶÈÉẺẼẸÊỀẾỂỄỆÌÍỈĨỊÒÓỎÕỌÔỒỐỔỖỘƠỜỚỞỠỢÙÚỦŨỤƯỪỨỬỮỰỲÝỶỸỴĐ][a-zàáảãạâầấẩẫậăằắẳẵặcèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđ]{2,}', clean_text)))
            
            kb_entry = {
                "id": f"{filename}_p{page_num}",
                "source": filename,
                "page": int(page_num),
                "content": clean_text[:2000],  # Limit chunk size
                "keywords": keywords
            }
            kb.append(kb_entry)

    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(kb, f, ensure_ascii=False, indent=2)
    
    print(f"Knowledge base built with {len(kb)} chunks saved to {output_file}")

if __name__ == "__main__":
    build_knowledge_base('extracted_data.txt', 'knowledge_base.json')
