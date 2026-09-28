from pathlib import Path
import xml.etree.ElementTree as ET
import json
from datetime import datetime, timezone


# ============================================================
# PROJECT PATHS
# ============================================================

PROJECT_ROOT = Path(__file__).resolve().parents[1]

LGD_DIR = PROJECT_ROOT / "lgd_rajasthan"

OUTPUT_DIR = (
    PROJECT_ROOT
    / "frontend"
    / "public"
    / "data"
    / "administrative"
    / "rajasthan"
)

STATE_CODE = "8"
STATE_NAME = "Rajasthan"


# ============================================================
# LGD FILES
# ============================================================

DISTRICT_FILE = (
    LGD_DIR
    / "districtofSpecificState2026_09_18_23_00_27_490.xls"
)

SUBDISTRICT_FILE = (
    LGD_DIR
    / "subDistrictofSpecificState2026_09_18_23_00_27_540.xls"
)

ULB_FILE = (
    LGD_DIR
    / "ulbSpecificState2026_09_18_23_00_32_952.xls"
)

WARD_FILE = (
    LGD_DIR
    / "uLBWardforState2026_09_18_23_00_34_280.xls"
)


# ============================================================
# XML HELPERS
# ============================================================

def local_name(tag):
    """
    Removes XML namespace from SpreadsheetML tags.
    """
    if "}" in tag:
        return tag.split("}", 1)[1]

    return tag


def get_attribute(element, wanted_name):
    """
    Retrieves an XML attribute regardless of namespace.
    """
    for key, value in element.attrib.items():
        if local_name(key) == wanted_name:
            return value

    return None


def get_cell_value(cell):
    """
    Reads the <Data> content inside an Excel XML cell.
    """
    for child in cell.iter():
        if local_name(child.tag) == "Data":
            return (child.text or "").strip()

    return ""


def read_xml_rows(file_path):
    """
    Reads SpreadsheetML XML and converts it into a list of rows.

    Handles ss:Index so blank/intermediate cells do not shift
    later columns.
    """

    if not file_path.exists():
        raise FileNotFoundError(
            f"LGD file not found: {file_path}"
        )

    tree = ET.parse(file_path)
    root = tree.getroot()

    all_rows = []

    for worksheet in root.iter():

        if local_name(worksheet.tag) != "Worksheet":
            continue

        for row_element in worksheet.iter():

            if local_name(row_element.tag) != "Row":
                continue

            row = []
            current_index = 0

            for cell in row_element:

                if local_name(cell.tag) != "Cell":
                    continue

                explicit_index = get_attribute(cell, "Index")

                if explicit_index:
                    try:
                        target_index = int(explicit_index) - 1

                        while len(row) <= target_index:
                            row.append("")

                        current_index = target_index

                    except ValueError:
                        pass

                value = get_cell_value(cell)

                while len(row) <= current_index:
                    row.append("")

                row[current_index] = value

                current_index += 1

            if any(value != "" for value in row):
                all_rows.append(row)

    return all_rows


def is_serial_number(value):
    """
    Detects data rows whose first field is the S.No.
    """
    value = str(value).strip()

    if not value:
        return False

    try:
        float(value)
        return True
    except ValueError:
        return False


def clean(value):
    if value is None:
        return ""

    return str(value).strip()


def write_json(filename, data):
    output_path = OUTPUT_DIR / filename

    with output_path.open(
        "w",
        encoding="utf-8"
    ) as file:

        json.dump(
            data,
            file,
            ensure_ascii=False,
            indent=2
        )

    print(
        f"Created: {output_path}"
    )


# ============================================================
# PARSE DISTRICTS
# ============================================================

def parse_districts():

    rows = read_xml_rows(DISTRICT_FILE)

    districts = []

    for row in rows:

        if len(row) < 5:
            continue

        if not is_serial_number(row[0]):
            continue

        district = {
            "code": clean(row[1]),
            "version": clean(row[2]),
            "name": clean(row[3]),
            "localName": clean(row[4]),
            "census2001Code": clean(row[5]) if len(row) > 5 else "",
            "census2011Code": clean(row[6]) if len(row) > 6 else "",
        }

        districts.append(district)

    return districts


# ============================================================
# PARSE SUB-DISTRICTS
# ============================================================

def parse_subdistricts():

    rows = read_xml_rows(SUBDISTRICT_FILE)

    subdistricts = []

    for row in rows:

        if len(row) < 6:
            continue

        if not is_serial_number(row[0]):
            continue

        subdistrict = {
            "code": clean(row[3]),
            "version": clean(row[4]),
            "name": clean(row[5]),
            "localName": clean(row[6]) if len(row) > 6 else "",
            "districtCode": clean(row[1]),
            "districtName": clean(row[2]),
            "census2001Code": clean(row[7]) if len(row) > 7 else "",
            "census2011Code": clean(row[8]) if len(row) > 8 else "",
        }

        subdistricts.append(subdistrict)

    return subdistricts


# ============================================================
# PARSE URBAN LOCAL BODIES
# ============================================================

def parse_ulbs():

    rows = read_xml_rows(ULB_FILE)

    ulbs = []

    for row in rows:

        if len(row) < 6:
            continue

        if not is_serial_number(row[0]):
            continue

        ulb = {
            "typeCode": clean(row[1]),
            "typeName": clean(row[2]),
            "code": clean(row[3]),
            "version": clean(row[4]),
            "name": clean(row[5]),
            "localName": clean(row[6]) if len(row) > 6 else "",
            "census2001Code": clean(row[7]) if len(row) > 7 else "",
            "census2011Code": clean(row[8]) if len(row) > 8 else "",
        }

        ulbs.append(ulb)

    return ulbs


# ============================================================
# PARSE ULB WARDS
# ============================================================

def parse_wards():

    rows = read_xml_rows(WARD_FILE)

    wards = []

    for row in rows:

        if len(row) < 6:
            continue

        if not is_serial_number(row[0]):
            continue

        ward = {
            "ulbCode": clean(row[1]),
            "ulbName": clean(row[2]),
            "wardCode": clean(row[3]),
            "wardNumber": clean(row[4]),
            "name": clean(row[5]),
        }

        wards.append(ward)

    return wards


# ============================================================
# BUILD DISTRICT → SUB-DISTRICT HIERARCHY
# ============================================================

def build_district_hierarchy(districts, subdistricts):

    subdistrict_map = {}

    for subdistrict in subdistricts:

        district_code = subdistrict["districtCode"]

        subdistrict_map.setdefault(
            district_code,
            []
        ).append(subdistrict)

    result = []

    for district in districts:

        district_copy = {
            **district,
            "subDistricts": subdistrict_map.get(
                district["code"],
                []
            )
        }

        result.append(district_copy)

    return result


# ============================================================
# BUILD ULB → WARD HIERARCHY
# ============================================================

def build_ulb_hierarchy(ulbs, wards):

    ward_map = {}

    for ward in wards:

        ulb_code = ward["ulbCode"]

        ward_map.setdefault(
            ulb_code,
            []
        ).append(ward)

    result = []

    for ulb in ulbs:

        ulb_copy = {
            **ulb,
            "wards": ward_map.get(
                ulb["code"],
                []
            )
        }

        result.append(ulb_copy)

    return result


# ============================================================
# MAIN
# ============================================================

def main():

    print()
    print("=" * 80)
    print("NAKSHA — Rajasthan LGD Data Builder")
    print("=" * 80)

    OUTPUT_DIR.mkdir(
        parents=True,
        exist_ok=True
    )

    print()
    print("Reading Districts...")

    districts = parse_districts()

    print(
        f"Districts loaded: {len(districts)}"
    )

    print()
    print("Reading Sub-Districts...")

    subdistricts = parse_subdistricts()

    print(
        f"Sub-Districts loaded: {len(subdistricts)}"
    )

    print()
    print("Reading Urban Local Bodies...")

    ulbs = parse_ulbs()

    print(
        f"ULBs loaded: {len(ulbs)}"
    )

    print()
    print("Reading ULB Wards...")

    wards = parse_wards()

    print(
        f"Wards loaded: {len(wards)}"
    )

    print()
    print("Building District → Sub-District hierarchy...")

    district_hierarchy = build_district_hierarchy(
        districts,
        subdistricts
    )

    print()
    print("Building ULB → Ward hierarchy...")

    ulb_hierarchy = build_ulb_hierarchy(
        ulbs,
        wards
    )

    generated_at = datetime.now(
        timezone.utc
    ).isoformat()

    metadata = {
        "source": "Government of India — Local Government Directory (LGD)",
        "state": STATE_NAME,
        "stateCode": STATE_CODE,
        "snapshotType": "Downloaded LGD state reports",
        "generatedAt": generated_at
    }

    # --------------------------------------------------------
    # Individual datasets
    # --------------------------------------------------------

    write_json(
        "districts.json",
        {
            "metadata": metadata,
            "districts": districts
        }
    )

    write_json(
        "subdistricts.json",
        {
            "metadata": metadata,
            "subDistricts": subdistricts
        }
    )

    write_json(
        "ulbs.json",
        {
            "metadata": metadata,
            "ulbs": ulb_hierarchy
        }
    )

    write_json(
        "wards.json",
        {
            "metadata": metadata,
            "wards": wards
        }
    )

    # --------------------------------------------------------
    # Main administrative hierarchy
    # --------------------------------------------------------

    hierarchy = {
        "metadata": metadata,

        "state": {
            "code": STATE_CODE,
            "name": STATE_NAME,
            "type": "STATE"
        },

        "districts": district_hierarchy,

        # Important:
        # ULBs are kept separately because the LGD ULB file
        # downloaded here does not provide a District Code.
        #
        # We will NOT incorrectly attach an ULB to a district
        # based only on matching names.
        "urbanLocalBodies": ulb_hierarchy
    }

    write_json(
        "hierarchy.json",
        hierarchy
    )

    # --------------------------------------------------------
    # Summary
    # --------------------------------------------------------

    print()
    print("=" * 80)
    print("BUILD COMPLETE")
    print("=" * 80)

    print(
        f"Districts: {len(districts)}"
    )

    print(
        f"Sub-Districts: {len(subdistricts)}"
    )

    print(
        f"ULBs: {len(ulbs)}"
    )

    print(
        f"Wards: {len(wards)}"
    )

    print()
    print(
        f"Frontend data location:\n{OUTPUT_DIR}"
    )

    print()
    print(
        "Rajasthan LGD data is ready for frontend integration."
    )


if __name__ == "__main__":
    main()