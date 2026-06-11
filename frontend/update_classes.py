import os
import glob

replacements = {
    'text-white': 'text-text-primary',
    'bg-white/5': 'bg-slate-100',
    'bg-white/10': 'bg-slate-200',
    'bg-card/50': 'bg-white',
    'bg-card': 'bg-white',
    'text-gray-400': 'text-text-secondary',
    'text-gray-300': 'text-text-secondary',
    'text-gray-500': 'text-text-tertiary',
    'bg-gray-800': 'bg-slate-50',
    'bg-gray-900': 'bg-slate-100',
    'border-gray-700': 'border-border',
    'border-gray-800': 'border-border'
}

exceptions = [
    ('text-xs font-bold text-text-primary', 'text-xs font-bold text-white'),
    ('className="w-5 h-5 text-text-primary"', 'className="w-5 h-5 text-white"'),
]

count = 0
for filepath in glob.glob('E:/Ashish Choubey/DOC-AI-main/frontend/src/**/*.jsx', recursive=True):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    original = content
    for old, new in replacements.items():
        content = content.replace(old, new)
        
    for old, new in exceptions:
        content = content.replace(old, new)
        
    if content != original:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        count += 1
        print(f"Updated {filepath}")

print(f"Total files updated: {count}")
