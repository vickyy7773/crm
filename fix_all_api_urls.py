import os
import re

src_dir = r'c:\Users\rajpu\OneDrive\Desktop\crm\src'
count = 0

def get_import_path(filepath):
    """Calculate correct relative path to config/api based on file location"""
    rel_path = os.path.relpath(filepath, src_dir)
    depth = rel_path.count(os.sep)
    return '../' * depth + 'config/api'

for root, dirs, files in os.walk(src_dir):
    for file in files:
        if file.endswith(('.js', '.jsx')):
            filepath = os.path.join(root, file)
            try:
                with open(filepath, 'r', encoding='utf-8') as f:
                    content = f.read()

                original_content = content

                # Check if API_URL is already imported
                has_api_import = 'import API_URL from' in content

                if 'localhost:5000' in content:
                    import_path = get_import_path(filepath)

                    # Pattern 1: Replace const API_URL declarations
                    content = re.sub(
                        r"const API_URL = import\.meta\.env\.VITE_API_URL \|\| ['\"]http://localhost:5000/api['\"];",
                        f"import API_URL from '{import_path}';",
                        content
                    )

                    content = re.sub(
                        r"const API_URL = ['\"]http://localhost:5000/api['\"];",
                        f"import API_URL from '{import_path}';",
                        content
                    )

                    # Pattern 2: Replace inline fetch URLs with API_URL variable
                    if not has_api_import and 'localhost:5000' in content:
                        # Add import at the top (after other imports)
                        import_line = f"import API_URL from '{import_path}';\n"

                        # Find the last import statement
                        import_matches = list(re.finditer(r'^import .+?;$', content, re.MULTILINE))
                        if import_matches:
                            last_import = import_matches[-1]
                            insert_pos = last_import.end() + 1
                            content = content[:insert_pos] + import_line + content[insert_pos:]

                    # Replace all inline http://localhost:5000/api URLs
                    content = re.sub(
                        r"['\"]http://localhost:5000/api",
                        "`${API_URL}",
                        content
                    )

                    # Fix trailing quotes/backticks
                    content = re.sub(r'\$\{API_URL\}([^`\'\"]*)[\'\"]([\s,\)])', r'${API_URL}\1`\2', content)

                if content != original_content:
                    with open(filepath, 'w', encoding='utf-8') as f:
                        f.write(content)
                    count += 1
                    print(f'Fixed: {file}')
            except Exception as e:
                print(f'Error in {file}: {e}')

print(f'\nTotal files fixed: {count}')
