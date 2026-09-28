import os

content = open('naksha_backend/main.py', encoding='utf-8').read()

import re
content = re.sub(r'r"C:\\Users\\Dell\\Documents\\Naksha Ai\\(.*?)"', r'os.path.join(os.path.dirname(__file__), "..", "\1")', content)

open('naksha_backend/main.py', 'w', encoding='utf-8').write(content)
