"""
NAKSHA Jaipur -- synthetic data generator (Phase 2a)

Run once from the naksha-jaipur project root:
    python generate_synthetic_data.py

Generates realistic placeholder data for the 8 dataset categories that
currently have no source files: roads, utilities, GNSS points, ground
truth, revenue records, municipal records, drone/ORI/DSM-DTM imagery --
plus a bonus 9th (AI-detected features), since the schema already has
a table for it and the architecture spec calls for it.

Design principles:
  - Every synthetic file lands in data/synthetic/<category>/, never in
    data/raw/<category>/. The production ETL (next step) checks raw/
    first and only falls back to synthetic/ when a category is empty --
    so dropping a real government file into raw/<category>/ later
    requires no code changes anywhere.
  - Geometry is anchored around your ACTUAL parcels (P-101, P-102) and
    buildings (B-01, B-02) from raw/cadastral and raw/buildings, so
    spatial joins (buildings-in-parcels, parcels-near-roads, etc.)
    produce real, checkable results instead of empty sets.
  - Attribute names follow real Rajasthan/Jaipur government conventions
    (khasra/khatedar/jamabandi for revenue, UPIC/ward/UD-Tax for
    municipal, JVVNL/PHED for utilities) instead of generic placeholders.
  - New rows are appended to data_catalog.csv (dataset_id DS_11 onward)
    with origin=SYNTHETIC. Your existing DS_01-DS_10 rows are untouched.
  - Safe to re-run: files are overwritten, and the catalog append is
    skipped (not duplicated) if it already ran once.
"""

from pathlib import Path
import random
import numpy as np
import pandas as pd
import geopandas as gpd
from shapely.geometry import LineString, box

random.seed(12)
np.random.seed(12)

ROOT = Path(__file__).resolve().parent
SYN = ROOT / "data" / "synthetic"

# data_catalog.csv has shown up in different spots depending on how the
# project was set up -- check the likely locations instead of assuming one.
_CATALOG_CANDIDATES = [ROOT / "data_catalog.csv", ROOT / "data" / "data_catalog.csv"]
CATALOG = next((p for p in _CATALOG_CANDIDATES if p.exists()), None)

# ---------------------------------------------------------------
# Anchors -- taken directly from your actual raw/cadastral and
# raw/buildings files, not invented.
# ---------------------------------------------------------------
PARCELS = {
    "P-101": {"land_use": "Residential", "bbox": (75.7870, 26.9120, 75.7875, 26.9125)},
    "P-102": {"land_use": "Commercial",  "bbox": (75.7875, 26.9120, 75.7880, 26.9125)},
}
BUILDINGS = {
    "B-01": {"parcel_id": "P-101", "type": "House", "bbox": (75.7871, 26.9121, 75.7874, 26.9124)},
    "B-02": {"parcel_id": "P-102", "type": "Shop",  "bbox": (75.7876, 26.9121, 75.7879, 26.9124)},
}

# Ward 12 synthetic working AOI -- wide enough for a small road grid
# and utility network around the two real parcels.
AOI = (75.7855, 26.9108, 75.7895, 26.9138)  # (min_lon, min_lat, max_lon, max_lat)

CRS = "EPSG:4326"  # matches the CRS your actual raw files are already in


def ensure_dir(p: Path) -> Path:
    p.mkdir(parents=True, exist_ok=True)
    return p


def save_geojson(gdf: gpd.GeoDataFrame, path: Path):
    gdf = gdf.set_crs(CRS, allow_override=True)
    gdf.to_file(path, driver="GeoJSON")
    print(f"  wrote {path.relative_to(ROOT)}  ({len(gdf)} features)")


def save_csv(df: pd.DataFrame, path: Path):
    df.to_csv(path, index=False)
    print(f"  wrote {path.relative_to(ROOT)}  ({len(df)} rows)")


# =================================================================
# 1. ROADS
# =================================================================
def make_roads():
    out = ensure_dir(SYN / "roads")
    rows = [
        {"road_id": "R-01", "road_name": "Ward 12 Main Road", "road_type": "arterial", "width_m": 15,
         "geometry": LineString([(AOI[0], 26.91265), (AOI[2], 26.91265)])},
        {"road_id": "R-02", "road_name": "Parcel Access Lane West", "road_type": "local", "width_m": 6,
         "geometry": LineString([(75.7867, AOI[1]), (75.7867, 26.9130)])},
        {"road_id": "R-03", "road_name": "Parcel Access Lane East", "road_type": "local", "width_m": 6,
         "geometry": LineString([(75.7883, AOI[1]), (75.7883, 26.9130)])},
    ]
    gdf = gpd.GeoDataFrame(rows)
    save_geojson(gdf, out / "jaipur_ward12_roads.geojson")


# =================================================================
# 2. UTILITIES (PHED water/sewer, JVVNL electric)
# =================================================================
def make_utilities():
    out = ensure_dir(SYN / "utilities")
    rows = [
        {"utility_id": "U-01", "utility_type": "water_supply", "department": "PHED",
         "geometry": LineString([(AOI[0], 26.91260), (AOI[2], 26.91260)])},
        {"utility_id": "U-02", "utility_type": "sewer", "department": "PHED",
         "geometry": LineString([(AOI[0], 26.91270), (AOI[2], 26.91270)])},
        {"utility_id": "U-03", "utility_type": "electric_line", "department": "JVVNL",
         "geometry": LineString([(75.78665, AOI[1]), (75.78665, 26.9130)])},
    ]
    gdf = gpd.GeoDataFrame(rows)
    save_geojson(gdf, out / "jaipur_ward12_utilities.geojson")


# =================================================================
# 3. GNSS / CORS CONTROL POINTS
# =================================================================
def make_gnss():
    out = ensure_dir(SYN / "gnss")
    rows = [
        {"point_id": "GNSS-01", "point_type": "CORS", "accuracy_m": 0.02,
         "survey_date": "2026-01-15", "longitude": 75.7857, "latitude": 26.9136},
        {"point_id": "GNSS-02", "point_type": "control_point", "accuracy_m": 0.05,
         "survey_date": "2026-01-15", "longitude": 75.7893, "latitude": 26.9110},
    ]
    save_csv(pd.DataFrame(rows), out / "jaipur_ward12_gnss_points.csv")


# =================================================================
# 4. GROUND TRUTH (field verification)
# =================================================================
def make_ground_truth():
    out = ensure_dir(SYN / "gt")
    rows = [
        {"gt_id": "GT-01", "observation_type": "building_verified",
         "notes": "Structure matches cadastral footprint", "verified_by": "Field Team A",
         "survey_date": "2026-02-01", "longitude": 75.78725, "latitude": 26.91225},
        {"gt_id": "GT-02", "observation_type": "land_use_confirmed",
         "notes": "Shop in active commercial use", "verified_by": "Field Team A",
         "survey_date": "2026-02-01", "longitude": 75.78775, "latitude": 26.91225},
    ]
    save_csv(pd.DataFrame(rows), out / "jaipur_ward12_ground_truth.csv")


# =================================================================
# 5. REVENUE RECORDS (Rajasthan Revenue Dept conventions)
# =================================================================
def make_revenue():
    out = ensure_dir(SYN / "revenue")
    rows = [
        {"revenue_id": "REV-101", "parcel_id": "P-101", "khasra_number": "101/2", "khata_number": "K-45",
         "khatedar_name": "Ramesh Chand Sharma", "tehsil": "Jaipur", "patwari_circle": "Circle-12",
         "land_classification": "Residential", "area_bigha": 0.55, "jamabandi_year": 2026,
         "tax_status": "Paid"},
        {"revenue_id": "REV-102", "parcel_id": "P-102", "khasra_number": "101/3", "khata_number": "K-46",
         "khatedar_name": "Suresh Traders (Partnership)", "tehsil": "Jaipur", "patwari_circle": "Circle-12",
         "land_classification": "Commercial", "area_bigha": 0.55, "jamabandi_year": 2026,
         "tax_status": "Due"},
    ]
    save_csv(pd.DataFrame(rows), out / "jaipur_ward12_revenue_records.csv")


# =================================================================
# 6. MUNICIPAL RECORDS (JMC UD-Tax / UPIC conventions)
# =================================================================
def make_municipal():
    out = ensure_dir(SYN / "municipal")
    rows = [
        {"municipal_id": "MUN-101", "parcel_id": "P-101", "record_type": "UD_Tax_Assessment",
         "department": "JMC Heritage", "upic": "058073187750101", "ward_no": 12,
         "property_type": "Residential", "status": "Assessed",
         "geometry": box(*PARCELS["P-101"]["bbox"])},
        {"municipal_id": "MUN-102", "parcel_id": "P-102", "record_type": "UD_Tax_Assessment",
         "department": "JMC Heritage", "upic": "058073187750102", "ward_no": 12,
         "property_type": "Commercial", "status": "Assessed",
         "geometry": box(*PARCELS["P-102"]["bbox"])},
    ]
    gdf = gpd.GeoDataFrame(rows)
    save_geojson(gdf, out / "jaipur_ward12_municipal_records.geojson")


# =================================================================
# 7. AI-DETECTED FEATURES (simulated CV output -- deliberately
#    imperfect, so the confidence-scoring phase has something to do)
# =================================================================
def jitter_box(bbox, amt=0.00008):
    minx, miny, maxx, maxy = bbox
    return box(minx + random.uniform(-amt, amt), miny + random.uniform(-amt, amt),
               maxx + random.uniform(-amt, amt), maxy + random.uniform(-amt, amt))


def make_ai_features():
    out = ensure_dir(SYN / "ai_features")
    rows = [
        {"feature_id": "AI-01", "feature_type": "building_detection", "confidence_score": 91.4,
         "source_model": "NAKSHA-CV-BuildingDetect-v1", "extracted_date": "2026-02-10",
         "geometry": jitter_box(BUILDINGS["B-01"]["bbox"])},
        {"feature_id": "AI-02", "feature_type": "building_detection", "confidence_score": 87.9,
         "source_model": "NAKSHA-CV-BuildingDetect-v1", "extracted_date": "2026-02-10",
         "geometry": jitter_box(BUILDINGS["B-02"]["bbox"])},
        {"feature_id": "AI-03", "feature_type": "unregistered_structure", "confidence_score": 68.2,
         "source_model": "NAKSHA-CV-BuildingDetect-v1", "extracted_date": "2026-02-10",
         "geometry": box(75.7886, 26.9117, 75.7889, 26.9119)},
    ]
    gdf = gpd.GeoDataFrame(rows)
    save_geojson(gdf, out / "jaipur_ward12_ai_features.geojson")


# =================================================================
# 8. DRONE / ORI / DSM-DTM -- small but genuinely valid GeoTIFFs so
#    the raster-ingestion code path in the ETL actually runs, rather
#    than being faked as a metadata-only row.
# =================================================================
def make_rasters():
    try:
        import rasterio
    except ImportError:
        print("  [skipped] rasterio not installed -- run: pip install rasterio")
        return

    # Windows fix: PostGIS/PostgreSQL installs its own (older, incompatible)
    # proj.db and can set a system-wide PROJ_DATA/PROJ_LIB variable pointing
    # to it. That makes rasterio's GDAL pick up the wrong PROJ database and
    # fail with "EPSG code is unknown". Force rasterio to use the copy it
    # ships with instead, regardless of what's set system-wide.
    import os
    bundled_proj = Path(rasterio.__file__).parent / "proj_data"
    if bundled_proj.exists():
        os.environ["PROJ_DATA"] = str(bundled_proj)
        os.environ["PROJ_LIB"] = str(bundled_proj)
    else:
        print(f"  [warning] couldn't find rasterio's bundled PROJ data at {bundled_proj}; "
              f"if this still fails, run these in PowerShell then re-run the script:\n"
              f"    Remove-Item Env:\\PROJ_DATA -ErrorAction SilentlyContinue\n"
              f"    Remove-Item Env:\\PROJ_LIB -ErrorAction SilentlyContinue")

    from rasterio.transform import from_bounds

    W, H = 100, 84  # pixel grid, keeps files small (~4m/pixel over this AOI)
    transform = from_bounds(*AOI, W, H)

    def px_range(bbox):
        minx, miny, maxx, maxy = bbox
        col0, row0 = ~transform * (minx, maxy)
        col1, row1 = ~transform * (maxx, miny)
        return (slice(max(int(row0), 0), min(int(row1) + 1, H)),
                slice(max(int(col0), 0), min(int(col1) + 1, W)))

    # --- Drone orthophoto (RGB) ---
    out = ensure_dir(SYN / "drone")
    rgb = np.random.randint(90, 140, (3, H, W)).astype("uint8")
    path = out / "jaipur_ward12_drone_orthophoto.tif"
    with rasterio.open(path, "w", driver="GTiff", height=H, width=W, count=3, dtype="uint8",
                        crs=CRS, transform=transform) as dst:
        dst.write(rgb)
    print(f"  wrote {path.relative_to(ROOT)}  ({W}x{H}px, 3-band RGB)")

    # --- ORI mosaic (RGB, distinct tone so it's clearly a different source) ---
    out = ensure_dir(SYN / "ori")
    rgb2 = np.random.randint(100, 150, (3, H, W)).astype("uint8")
    path = out / "jaipur_ward12_ori_mosaic.tif"
    with rasterio.open(path, "w", driver="GTiff", height=H, width=W, count=3, dtype="uint8",
                        crs=CRS, transform=transform) as dst:
        dst.write(rgb2)
    print(f"  wrote {path.relative_to(ROOT)}  ({W}x{H}px, 3-band RGB)")

    # --- DTM (bare terrain) + DSM (terrain + structures) ---
    # DSM is deliberately higher than DTM exactly at the two real
    # building footprints, so "derive height_m from DSM-DTM" has
    # genuine signal to work with later, not just flat ground.
    out = ensure_dir(SYN / "dsm_dtm")
    base_elev = 431.0  # approx Jaipur elevation, metres above sea level
    dtm = base_elev + np.random.normal(0, 0.3, (H, W)).astype("float32")
    dsm = dtm.copy()
    r, c = px_range(BUILDINGS["B-01"]["bbox"])
    dsm[r, c] += 4.5 + np.random.normal(0, 0.2, dsm[r, c].shape)  # ~1-storey house
    r, c = px_range(BUILDINGS["B-02"]["bbox"])
    dsm[r, c] += 6.0 + np.random.normal(0, 0.2, dsm[r, c].shape)  # ~shop w/ signage height

    for name, arr in [("dtm", dtm), ("dsm", dsm)]:
        path = out / f"jaipur_ward12_{name}.tif"
        with rasterio.open(path, "w", driver="GTiff", height=H, width=W, count=1, dtype="float32",
                            crs=CRS, transform=transform) as dst:
            dst.write(arr, 1)
        print(f"  wrote {path.relative_to(ROOT)}  ({W}x{H}px, elevation)")


# =================================================================
# 9. data_catalog.csv -- append new entries, never touch DS_01-DS_10
# =================================================================
def update_catalog():
    if CATALOG is None:
        checked = ", ".join(str(p.relative_to(ROOT)) for p in _CATALOG_CANDIDATES)
        print(f"  [skipped] data_catalog.csv not found -- checked: {checked}")
        return
    existing = pd.read_csv(CATALOG)
    next_id = 11
    first_new_id = f"DS_{next_id:02d}"
    if (existing["dataset_id"] == first_new_id).any():
        print(f"  [skipped] {first_new_id} already exists in data_catalog.csv -- "
              f"this script already ran once. Delete those rows manually to regenerate.")
        return

    today = "2026-09-18"
    # order matches your real header: dataset_name, source_type, origin,
    # department, format, geometry_type, CRS, survey_date, resolution,
    # coverage, status  (dataset_id is assigned separately below)
    new_rows = [
        ("Jaipur_Ward12_Roads_SYNTHETIC", "Road network", "SYNTHETIC", "Municipal / Public Works",
         "GeoJSON", "Line", "EPSG:4326", today, "-", "Ward 12 AOI", "Ready"),
        ("Jaipur_Ward12_Utilities_SYNTHETIC", "Utility network data", "SYNTHETIC", "PHED / JVVNL",
         "GeoJSON", "Line", "EPSG:4326", today, "-", "Ward 12 AOI", "Ready"),
        ("Jaipur_Ward12_GNSS_SYNTHETIC", "GNSS/CORS survey data", "SYNTHETIC", "Survey of India",
         "CSV", "Point", "EPSG:4326", today, "-", "Ward 12 AOI", "Ready"),
        ("Jaipur_Ward12_GroundTruth_SYNTHETIC", "Ground Truthing datasets", "SYNTHETIC", "Field Survey Team",
         "CSV", "Point", "EPSG:4326", today, "-", "Ward 12 AOI", "Ready"),
        ("Jaipur_Ward12_Revenue_SYNTHETIC", "Revenue records", "SYNTHETIC", "Revenue Department",
         "CSV", "Tabular", "-", today, "-", "Ward 12 AOI", "Ready"),
        ("Jaipur_Ward12_Municipal_SYNTHETIC", "Municipal GIS layers", "SYNTHETIC", "Jaipur Municipal Corporation",
         "GeoJSON", "Polygon", "EPSG:4326", today, "-", "Ward 12 AOI", "Ready"),
        ("Jaipur_Ward12_Drone_SYNTHETIC", "Drone imagery", "SYNTHETIC", "Surveys and Land Records",
         "GeoTIFF", "Raster", "EPSG:4326", today, "~4m (demo)", "Ward 12 AOI", "Ready"),
        ("Jaipur_Ward12_ORI_SYNTHETIC", "ORI", "SYNTHETIC", "State Remote Sensing Application Centre",
         "GeoTIFF", "Raster", "EPSG:4326", today, "~4m (demo)", "Ward 12 AOI", "Ready"),
        ("Jaipur_Ward12_DSM_DTM_SYNTHETIC", "DSM/DTM", "SYNTHETIC", "Surveys and Land Records",
         "GeoTIFF", "Raster", "EPSG:4326", today, "~4m (demo)", "Ward 12 AOI", "Ready"),
        ("Jaipur_Ward12_AIFeatures_SYNTHETIC", "AI-generated features", "SYNTHETIC", "GeoAI / Computer Vision",
         "GeoJSON", "Polygon", "EPSG:4326", today, "-", "Ward 12 AOI", "Ready"),
    ]
    cols = list(existing.columns)
    rows = [{"dataset_id": f"DS_{next_id + i:02d}", **dict(zip(cols[1:], r))}
            for i, r in enumerate(new_rows)]
    new_df = pd.DataFrame(rows)[cols]
    pd.concat([existing, new_df], ignore_index=True).to_csv(CATALOG, index=False)
    print(f"  appended {len(new_df)} rows to data_catalog.csv "
          f"(DS_{next_id:02d}-DS_{next_id + len(new_df) - 1:02d})")


if __name__ == "__main__":
    print("Generating synthetic Ward 12 datasets (anchored on P-101/P-102, B-01/B-02)...\n")
    print("Roads:");             make_roads()
    print("Utilities:");         make_utilities()
    print("GNSS points:");       make_gnss()
    print("Ground truth:");      make_ground_truth()
    print("Revenue records:");   make_revenue()
    print("Municipal records:"); make_municipal()
    print("AI features:");       make_ai_features()
    print("Rasters:");           make_rasters()
    print("Catalog:");           update_catalog()
    print("\nDone. All new files are under data/synthetic/ and tagged SYNTHETIC in data_catalog.csv.")