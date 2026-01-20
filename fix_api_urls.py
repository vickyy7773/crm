import os
import re

src_dir = r'c:\Users\rajpu\OneDrive\Desktop\crm\src'
count = 0

for root, dirs, files in os.walk(src_dir):
    for file in files:
        if file.endswith(('.js', '.jsx')):
            filepath = os.path.join(root, file)
            try:
                with open(filepath, 'r', encoding='utf-8') as f:
                    content = f.read()

                original_content = content

                # Pattern 1: const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
                content = re.sub(
                    r"const API_URL = import\.meta\.env\.VITE_API_URL \|\| ['\"]http://localhost:5000/api['\"];",
                    "import API_URL from '../config/api';",
                    content
                )

                # Pattern 2: const API_URL = 'http://localhost:5000/api';
                content = re.sub(
                    r"const API_URL = ['\"]http://localhost:5000/api['\"];",
                    "import API_URL from '../config/api';",
                    content
                )

                if content != original_content:
                    with open(filepath, 'w', encoding='utf-8') as f:
                        f.write(content)
                    count += 1
                    print(f'Fixed: {file}')
            except Exception as e:
                print(f'Error in {file}: {e}')

print(f'\nTotal files fixed: {count}')
