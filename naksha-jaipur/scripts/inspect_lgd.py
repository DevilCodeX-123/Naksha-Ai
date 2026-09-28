from pathlib import Path
import xml.etree.ElementTree as ET


PROJECT_ROOT = Path(__file__).resolve().parents[1]
LGD_DIR = PROJECT_ROOT / "lgd_rajasthan"


def local_name(tag):
    """
    Remove XML namespace from a tag.

    Example:
    {urn:schemas-microsoft-com:office:spreadsheet}Row
    becomes:
    Row
    """
    if "}" in tag:
        return tag.split("}", 1)[1]

    return tag


def parse_spreadsheetml(file_path):
    print("\n" + "=" * 100)
    print(f"FILE: {file_path.name}")
    print("=" * 100)

    try:
        # Read the XML file.
        tree = ET.parse(file_path)
        root = tree.getroot()

        print("XML format detected successfully.")

        worksheets = []

        for element in root.iter():
            if local_name(element.tag) == "Worksheet":
                worksheet_name = None

                # SpreadsheetML stores the worksheet name
                # in an attribute such as ss:Name.
                for key, value in element.attrib.items():
                    if key.endswith("}Name") or key == "Name":
                        worksheet_name = value
                        break

                worksheets.append((worksheet_name, element))

        print(f"Worksheets found: {len(worksheets)}")

        for worksheet_name, worksheet in worksheets:
            print("\n" + "-" * 80)
            print(f"WORKSHEET: {worksheet_name}")
            print("-" * 80)

            rows = []

            # Find rows belonging to this worksheet.
            for element in worksheet.iter():
                if local_name(element.tag) != "Row":
                    continue

                row_values = []

                for cell in element:
                    if local_name(cell.tag) != "Cell":
                        continue

                    value = ""

                    for child in cell.iter():
                        if local_name(child.tag) == "Data":
                            value = child.text or ""
                            break

                    row_values.append(value.strip())

                if row_values:
                    rows.append(row_values)

            print(f"Rows detected: {len(rows)}")

            print("\nFirst 15 rows:")

            for row_number, row in enumerate(rows[:15], start=1):
                print(f"{row_number:02d}: {row}")

    except ET.ParseError as error:
        print("XML PARSE ERROR")
        print(error)

    except Exception as error:
        print("ERROR")
        print(type(error).__name__)
        print(error)


def main():
    if not LGD_DIR.exists():
        raise SystemExit(
            f"LGD folder not found:\n{LGD_DIR}"
        )

    files = sorted(
        LGD_DIR.glob("*.xls")
    )

    if not files:
        raise SystemExit(
            f"No .xls files found inside:\n{LGD_DIR}"
        )

    print(f"Found {len(files)} LGD files.")

    # For now, inspect the smaller files.
    # We intentionally skip the huge Ward-with-Coverage file
    # and the village file until we understand the format.
    for file_path in files:
        if file_path.stat().st_size > 10 * 1024 * 1024:
            print(
                f"\nSKIPPING LARGE FILE FOR NOW: "
                f"{file_path.name} "
                f"({file_path.stat().st_size / (1024 * 1024):.1f} MB)"
            )
            continue

        parse_spreadsheetml(file_path)


if __name__ == "__main__":
    main()