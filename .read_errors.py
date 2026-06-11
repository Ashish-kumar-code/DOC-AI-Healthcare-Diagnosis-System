from pathlib import Path
p = Path('backend/logs/doc_ai_errors.log')
if not p.exists():
    print('MISSING')
else:
    text = p.read_text(encoding='utf-8', errors='replace')
    print(text[-4000:])
