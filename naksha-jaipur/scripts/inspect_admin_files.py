from pathlib import Path
import xml.etree.ElementTree as ET


PROJECT_ROOT = Path(__file__).resolve().parents[1]
LGD_DIR = PROJECT_ROOT / "lgd_rajasthan"


FILES = [
    "districtofSpecificState2026_09_18_23_00_27_490.xls",
    "subDistrictofSpecificState2026_09_18_23_00_27_540.xls",
    "ulbSpecificState2026_09_18_23_00_32_952.xls",
]


def local_name(tag):
    if "}" in tag:
        return tag.split("}", 1)[1]
    return tag


def get_cell_value(cell):
    for child in cell.iter():
        if local_name(child.tag) == "Data":
            return (child.text or "").strip()
    return ""


def read_rows(file_path):
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
                    values.append(get_cell_value(cell))

            if values:
                rows.append(values)

    return rows


for filename in FILES:
    file_path = LGD_DIR / filename

    print("\n" + "=" * 100)
    print(filename)
    print("=" * 100)

    if not file_path.exists():
        print("FILE NOT FOUND")
        continue

    rows = read_rows(file_path)

    print(f"Total rows: {len(rows)}")

    for index, row in enumerate(rows[:12], start=1):
        print(f"{index:02d}: {row}")