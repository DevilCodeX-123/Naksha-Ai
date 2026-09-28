from pathlib import Path
import xml.etree.ElementTree as ET


PROJECT_ROOT = Path(__file__).resolve().parents[1]
LGD_DIR = PROJECT_ROOT / "lgd_rajasthan"


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


def inspect_file(file_path):
    print("\n" + "=" * 100)
    print(f"FILE: {file_path.name}")
    print("=" * 100)

    rows = read_rows(file_path)

    print(f"Total rows: {len(rows)}")

    for i, row in enumerate(rows[:12], start=1):
        print(f"{i:02d}: {row}")


def main():
    if not LGD_DIR.exists():
        raise SystemExit(
            f"Folder not found:\n{LGD_DIR}"
        )

    wanted_patterns = [
        "districtofSpecificState*.xls",
        "subDistrictofSpecificState*.xls",
        "ulbSpecificState*.xls",
        "uLBWardforState*.xls",
    ]

    files = []

    for pattern in wanted_patterns:
        matches = sorted(LGD_DIR.glob(pattern))

        matches = [
            f for f in matches
            if "WithCov" not in f.name
        ]

        files.extend(matches)

    unique_files = []
    seen = set()

    for file_path in files:
        if file_path not in seen:
            unique_files.append(file_path)
            seen.add(file_path)

    if not unique_files:
        raise SystemExit(
            "None of the required LGD files were found."
        )

    print(f"Found {len(unique_files)} target LGD files.")

    for file_path in unique_files:
        inspect_file(file_path)


if __name__ == "__main__":
    main()