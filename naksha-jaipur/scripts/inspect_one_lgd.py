from pathlib import Path
import sys
import xml.etree.ElementTree as ET

PROJECT_ROOT = Path(__file__).resolve().parents[1]
LGD_DIR = PROJECT_ROOT / "lgd_rajasthan"


def local_name(tag):
    if "}" in tag:
        return tag.split("}", 1)[1]
    return tag


def get_value(cell):
    for child in cell.iter():
        if local_name(child.tag) == "Data":
            return (child.text or "").strip()
    return ""


if len(sys.argv) != 2:
    raise SystemExit(
        'Usage: py scripts\\inspect_one_lgd.py "filename.xls"'
    )

filename = sys.argv[1]
file_path = LGD_DIR / filename

if not file_path.exists():
    raise SystemExit(f"File not found: {file_path}")

tree = ET.parse(file_path)
root = tree.getroot()

rows = []

for worksheet in root.iter():
    if local_name(worksheet.tag) != "Worksheet":
        continue

    for row in worksheet.iter():
        if local_name(row.tag) != "Row":
            continue

        values = []

        for cell in row:
            if local_name(cell.tag) == "Cell":
                values.append(get_value(cell))

        if values:
            rows.append(values)

print("=" * 100)
print(f"FILE: {filename}")
print(f"TOTAL ROWS: {len(rows)}")
print("=" * 100)

for i, row in enumerate(rows[:15], start=1):
    print(f"{i:02d}: {row}")