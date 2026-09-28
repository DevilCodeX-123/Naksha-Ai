"""
NAKSHA Jaipur -- fetch real OpenStreetMap data (roads + buildings)
for the Ward 12 AOI, in place of the synthetic placeholders for just
these two categories.

Run once from the naksha-jaipur project root (needs an internet
connection):
    python fetch_open_data.py

What this does, and does NOT do:
  - Queries the public Overpass API for real roads and buildings
    inside the AOI bounding box.
  - Writes results into data/raw/roads/ and data/raw/buildings/ --
    NOT synthetic/. The ETL always prefers raw/ over synthetic/, so
    these take over automatically on the next ETL run, no code
    changes needed.
  - Does NOT touch data/raw/cadastral/ (your real P-101/P-102). No
    open source for real government cadastral parcel boundaries
    exists in India, so cadastral stays as-is.
  - Does NOT touch utilities, GNSS, ground truth, revenue, municipal,
    AI features, or drone/ORI/DSM-DTM imagery -- there is no open
    equivalent for any of these; they stay synthetic.
  - Real OSM buildings that don't fall inside P-101/P-102 will simply
    get parcel_id = NULL when the ETL runs. That's correct behaviour,
    not a bug -- it means we don't have real cadastral coverage for
    that specific building yet.
  - This tiny AOI (~350m x 300m) may genuinely have zero OSM roads or
    buildings mapped -- OSM coverage varies block by block even in a
    well-mapped city like Jaipur. If that happens, this script leaves
    raw/ empty and the ETL correctly keeps using synthetic data. Run
    it and see what comes back rather than assuming either way.
"""
import json
import sys
from pathlib import Path

try:
    import requests
except ImportError:
    sys.exit("This script needs the 'requests' library. Run: pip install requests")

ROOT = Path(__file__).resolve().parent
AOI = (75.7855, 26.9108, 75.7895, 26.9138)  # same AOI as the synthetic generator

# Public Overpass instances reject requests with no identifying User-Agent
# (that's almost certainly the 406 error) -- and the free main instance is
# sometimes busy, so try a mirror if it doesn't respond.
OVERPASS_URLS = [
    "https://overpass-api.de/api/interpreter",
    "https://overpass.kumi.systems/api/interpreter",
]
HEADERS = {"User-Agent": "NAKSHA-Jaipur-Prototype/1.0 (student GIS project, non-commercial)"}


def query_overpass(query: str) -> dict:
    last_error = None
    for url in OVERPASS_URLS:
        try:
            resp = requests.post(url, data={"data": query}, headers=HEADERS, timeout=60)
            resp.raise_for_status()
            return resp.json()
        except requests.exceptions.RequestException as e:
            print(f"  [warning] {url} failed ({e}) -- trying next endpoint...")
            last_error = e
    raise last_error


def _bbox_south_west_north_east():
    min_lon, min_lat, max_lon, max_lat = AOI
    return min_lat, min_lon, max_lat, max_lon  # Overpass wants (south, west, north, east)


def fetch_roads():
    south, west, north, east = _bbox_south_west_north_east()
    query = f'[out:json][timeout:60];way["highway"]({south},{west},{north},{east});(._;>;);out body;'
    data = query_overpass(query)
    nodes = {el["id"]: (el["lon"], el["lat"]) for el in data["elements"] if el["type"] == "node"}
    features = []
    for el in data["elements"]:
        if el["type"] != "way" or "tags" not in el:
            continue
        coords = [nodes[n] for n in el["nodes"] if n in nodes]
        if len(coords) < 2:
            continue
        features.append({
            "type": "Feature",
            "properties": {
                "road_id": f"OSM-{el['id']}",
                "road_name": el["tags"].get("name", "Unnamed Road"),
                "road_type": el["tags"].get("highway", "unknown"),
                "width_m": None,
            },
            "geometry": {"type": "LineString", "coordinates": coords},
        })
    return features


def fetch_buildings():
    south, west, north, east = _bbox_south_west_north_east()
    query = f'[out:json][timeout:60];way["building"]({south},{west},{north},{east});(._;>;);out body;'
    data = query_overpass(query)
    nodes = {el["id"]: (el["lon"], el["lat"]) for el in data["elements"] if el["type"] == "node"}
    features = []
    for el in data["elements"]:
        if el["type"] != "way" or "tags" not in el:
            continue
        coords = [nodes[n] for n in el["nodes"] if n in nodes]
        if len(coords) < 4 or coords[0] != coords[-1]:
            continue  # need a closed ring for a polygon
        features.append({
            "type": "Feature",
            "properties": {
                "building_id": f"OSM-{el['id']}",
                "building_type": el["tags"].get("building", "yes"),
            },
            "geometry": {"type": "Polygon", "coordinates": [coords]},
        })
    return features


def save_geojson(features, path: Path):
    path.parent.mkdir(parents=True, exist_ok=True)
    with open(path, "w") as f:
        json.dump({"type": "FeatureCollection", "features": features}, f)
    print(f"  wrote {path.relative_to(ROOT)} ({len(features)} features)")


def update_catalog(got_roads: bool, got_buildings: bool):
    import pandas as pd
    candidates = [ROOT / "data_catalog.csv", ROOT / "data" / "data_catalog.csv"]
    catalog_path = next((p for p in candidates if p.exists()), None)
    if catalog_path is None:
        print("  [warning] data_catalog.csv not found -- skipping catalog update")
        return

    existing = pd.read_csv(catalog_path)
    today = "2026-09-19"
    candidates_to_add = []
    if got_roads and not (existing["dataset_name"] == "Jaipur_Ward12_Roads_OSM").any():
        candidates_to_add.append(("Jaipur_Ward12_Roads_OSM", "Road network", "REAL", "OpenStreetMap",
                                   "GeoJSON", "Line", "EPSG:4326", today, "-", "Ward 12 AOI", "Ready"))
    if got_buildings and not (existing["dataset_name"] == "Jaipur_Ward12_Buildings_OSM").any():
        candidates_to_add.append(("Jaipur_Ward12_Buildings_OSM", "Building footprint datasets", "REAL",
                                   "OpenStreetMap", "GeoJSON", "Polygon", "EPSG:4326", today, "-",
                                   "Ward 12 AOI", "Ready"))
    if not candidates_to_add:
        print("  catalog already up to date -- nothing new to add")
        return

    next_id = 1 + max(int(d.split("_")[1]) for d in existing["dataset_id"])
    cols = list(existing.columns)
    rows = [{"dataset_id": f"DS_{next_id + i:02d}", **dict(zip(cols[1:], r))}
            for i, r in enumerate(candidates_to_add)]
    new_df = pd.DataFrame(rows)[cols]
    pd.concat([existing, new_df], ignore_index=True).to_csv(catalog_path, index=False)
    print(f"  appended {len(new_df)} row(s) to data_catalog.csv, tagged origin=REAL, department=OpenStreetMap")


if __name__ == "__main__":
    print("Fetching real OpenStreetMap data for the Ward 12 AOI...\n")

    print("Roads:")
    roads = fetch_roads()
    if roads:
        save_geojson(roads, ROOT / "data" / "raw" / "roads" / "osm_ward12_roads.geojson")
    else:
        print("  no roads found in OSM for this AOI -- keeping synthetic roads")

    print("Buildings:")
    buildings = fetch_buildings()
    if buildings:
        save_geojson(buildings, ROOT / "data" / "raw" / "buildings" / "osm_ward12_buildings.geojson")
    else:
        print("  no buildings found in OSM for this AOI -- keeping existing/synthetic buildings")

    print("\nCatalog:")
    update_catalog(got_roads=bool(roads), got_buildings=bool(buildings))

    print("\nDone. Re-run etl_pipeline.py to load whatever was found (raw/ takes priority over synthetic/).")