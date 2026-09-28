"""
NAKSHA Jaipur -- Building Change Detection

Compares the buildings currently loaded in the database against an
earlier reference survey, and records what changed into
building_changes: new construction, demolished structures, and
modified footprints.

Run this AFTER etl_pipeline.py has loaded the current buildings table:
    python detect_building_changes.py

This runs against real synthetic "prior survey" data
(data/synthetic/prior_survey/buildings_2025_survey.geojson) -- it is
a genuine geometric comparison, not a fabricated result. When you
eventually have two real surveys from different dates, point
PRIOR_SURVEY_FILE at the older one and this logic works unchanged.
"""
import os
from pathlib import Path

import geopandas as gpd
from shapely.validation import make_valid
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

load_dotenv()

ROOT = Path(__file__).resolve().parent
DB_URL = os.getenv("DATABASE_URL")
TARGET_CRS = os.getenv("TARGET_CRS", "EPSG:32643")
AREA_CHANGE_THRESHOLD = 0.05  # >5% footprint area difference counts as "modified"

if not DB_URL:
    raise RuntimeError("DATABASE_URL not found -- check your .env file")

engine = create_engine(DB_URL)
PRIOR_SURVEY_FILE = ROOT / "data" / "synthetic" / "prior_survey" / "buildings_2025_survey.geojson"


def load_current_buildings():
    gdf = gpd.read_postgis("SELECT building_id, geom FROM buildings", con=engine, geom_col="geom")
    return gdf.set_index("building_id")


def load_prior_buildings():
    gdf = gpd.read_file(PRIOR_SURVEY_FILE)
    if "Bldg_ID" in gdf.columns:
        gdf = gdf.rename(columns={"Bldg_ID": "building_id"})
    gdf["geometry"] = gdf["geometry"].apply(lambda g: g if g.is_valid else make_valid(g))
    if gdf.crs is None:
        gdf = gdf.set_crs("EPSG:4326")
    gdf = gdf.to_crs(TARGET_CRS)
    return gdf.set_index("building_id")


def detect_changes():
    if not PRIOR_SURVEY_FILE.exists():
        print(f"[error] prior survey file not found at {PRIOR_SURVEY_FILE}")
        return []

    current = load_current_buildings()
    prior = load_prior_buildings()
    all_ids = sorted(set(current.index) | set(prior.index))

    rows = []
    for bid in all_ids:
        in_current, in_prior = bid in current.index, bid in prior.index

        if in_current and not in_prior:
            geom = current.loc[bid, "geom"]
            rows.append(dict(building_id=bid, change_type="new", geom=geom,
                              area_change_sqm=round(geom.area, 2), height_change_m=None,
                              confidence_score=95.0))
        elif in_prior and not in_current:
            geom = prior.loc[bid, "geometry"]
            rows.append(dict(building_id=bid, change_type="demolished", geom=geom,
                              area_change_sqm=round(-geom.area, 2), height_change_m=None,
                              confidence_score=95.0))
        else:
            cur_geom, pri_geom = current.loc[bid, "geom"], prior.loc[bid, "geometry"]
            area_diff = cur_geom.area - pri_geom.area
            pct = abs(area_diff) / pri_geom.area if pri_geom.area else 0
            change_type = "modified" if pct > AREA_CHANGE_THRESHOLD else "unchanged"
            rows.append(dict(building_id=bid, change_type=change_type, geom=cur_geom,
                              area_change_sqm=round(area_diff, 2), height_change_m=None,
                              confidence_score=round(max(60.0, 95 - pct * 20), 2)))
    return rows


def write_changes(rows):
    if not rows:
        print("No changes to write.")
        return
    gdf = gpd.GeoDataFrame(rows, geometry="geom", crs=TARGET_CRS)
    gdf["detected_from"] = "2025_survey (synthetic prior)"
    gdf["detected_to"] = "current"
    gdf["status"] = "unreviewed"
    with engine.begin() as conn:
        conn.execute(text("TRUNCATE TABLE building_changes RESTART IDENTITY"))
    gdf.to_postgis("building_changes", con=engine, if_exists="append", index=False)
    print(f"\nLoaded {len(gdf)} rows -> building_changes")
    for r in rows:
        print(f"  {r['building_id']}: {r['change_type']}  (area change: {r['area_change_sqm']} sqm)")


if __name__ == "__main__":
    print("Detecting building changes vs. prior survey...\n")
    write_changes(detect_changes())
