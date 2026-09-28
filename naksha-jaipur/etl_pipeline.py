"""
NAKSHA Jaipur -- Production ETL Pipeline (Phase 2b)

Run from the naksha-jaipur project root:
    python backend/etl_pipeline.py      (if kept under backend/)
    python etl_pipeline.py              (if run from the project root)

What this does, replacing the prototype script:
  - Reads DATABASE_URL / TARGET_CRS / ETL_MODE from .env -- no hardcoded
    credentials.
  - For every category, checks data/raw/<category>/ first and only
    falls back to data/synthetic/<category>/ if raw/ is empty. Drop a
    real government file into raw/<category>/ later and this pipeline
    picks it up automatically -- no code changes needed here.
  - Normalizes column names via FIELD_ALIASES instead of assuming
    fixed names, so a differently-formatted real file doesn't break it.
  - Repairs invalid geometry with shapely's make_valid.
  - Reprojects everything to TARGET_CRS (EPSG:32643).
  - Spatially joins buildings to their parent parcel (real spatial
    join, not labeled "AI").
  - height_m is left NULL for buildings -- never a fabricated default.
  - Extracts raster bounds/resolution (not pixel data) for drone/ORI/
    DSM-DTM imagery into imagery_metadata.
  - Populates data_sources from data_catalog.csv, so every row loaded
    elsewhere can be traced to its origin (REAL / DERIVED / SYNTHETIC).
  - ETL_MODE=refresh (default) wipes and reloads everything each run;
    set ETL_MODE=append in .env to keep adding instead.
"""

import os
from pathlib import Path

import pandas as pd
import geopandas as gpd
from shapely.geometry import box
from shapely.validation import make_valid
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

load_dotenv()

ROOT = Path(__file__).resolve().parent
DB_URL = os.getenv("DATABASE_URL")
TARGET_CRS = os.getenv("TARGET_CRS", "EPSG:32643")
ETL_MODE = os.getenv("ETL_MODE", "refresh")  # refresh = wipe+reload every run

if not DB_URL:
    raise RuntimeError("DATABASE_URL not found -- check your .env file")

engine = create_engine(DB_URL)

RAW = ROOT / "data" / "raw"
SYN = ROOT / "data" / "synthetic"
_CATALOG_CANDIDATES = [ROOT / "data_catalog.csv", ROOT / "data" / "data_catalog.csv"]


# =================================================================
# Field alias normalization -- extend this as real government files
# replace synthetic ones and use different column names.
# =================================================================
FIELD_ALIASES = {
    "parcels": {
        "Parcel_ID": "parcel_id", "PARCEL_ID": "parcel_id", "parcel_no": "parcel_id",
        "Land_Use": "land_use", "LAND_USE": "land_use", "landuse": "land_use",
        "Survey_No": "survey_number", "Khasra_No": "survey_number", "khasra_no": "survey_number",
        "Owner": "owner_name", "Owner_Name": "owner_name",
    },
    "buildings": {
        "Bldg_ID": "building_id", "BLDG_ID": "building_id", "building_no": "building_id",
        "Type": "building_type", "TYPE": "building_type", "Bldg_Type": "building_type",
        "Height": "height_m", "HEIGHT_M": "height_m", "Floors": "floors",
        "@id": "building_id", "building": "building_type",            # OpenStreetMap export tags
        "building:levels": "floors", "height": "height_m",
    },
    "roads": {
        "Road_ID": "road_id", "Name": "road_name", "Road_Type": "road_type", "Width": "width_m",
        "@id": "road_id", "name": "road_name", "highway": "road_type", "width": "width_m",  # OSM tags
    },
    "utilities": {"Utility_ID": "utility_id", "Type": "utility_type", "Dept": "department"},
    "municipal": {"Municipal_ID": "municipal_id", "UPIC": "upic", "Ward": "ward_no"},
    "ai_features": {"Feature_ID": "feature_id", "Type": "feature_type"},
}

CATEGORY_KEYWORDS = {
    "parcels": "Cadastral", "buildings": "Building", "roads": "Road", "utilities": "Utilit",
    "gnss": "GNSS", "gt": "Ground", "revenue": "Revenue", "municipal": "Municipal",
    "drone": "Drone", "ori": "ORI", "dsm_dtm": "DSM", "ai_features": "AI",
}


def ensure_proj_ok():
    """Same Windows fix as the synthetic-data generator: force rasterio to
    use its own bundled PROJ data instead of a conflicting PostGIS install."""
    try:
        import rasterio
        bundled = Path(rasterio.__file__).parent / "proj_data"
        if bundled.exists():
            os.environ["PROJ_DATA"] = str(bundled)
            os.environ["PROJ_LIB"] = str(bundled)
    except ImportError:
        pass


def find_source(category: str):
    """Prefer data/raw/<category>/, fall back to data/synthetic/<category>/."""
    raw_dir = RAW / category
    if raw_dir.exists() and any(raw_dir.iterdir()):
        return raw_dir, "REAL"
    syn_dir = SYN / category
    if syn_dir.exists() and any(syn_dir.iterdir()):
        return syn_dir, "SYNTHETIC"
    return None, None


def normalize_columns(gdf, category):
    aliases = FIELD_ALIASES.get(category, {})
    gdf = gdf.copy()
    for src_col, target_col in aliases.items():
        if src_col not in gdf.columns:
            continue
        if target_col in gdf.columns:
            # Target already exists -- e.g. one source file already uses the
            # canonical name while another uses an alias. Merge the two
            # instead of creating a duplicate column of the same name.
            gdf[target_col] = gdf[target_col].combine_first(gdf[src_col])
            gdf = gdf.drop(columns=[src_col])
        else:
            gdf = gdf.rename(columns={src_col: target_col})
    return gdf


def repair_and_reproject(gdf):
    gdf = gdf.copy()
    gdf["geometry"] = gdf["geometry"].apply(lambda g: g if (g is not None and g.is_valid) else make_valid(g))
    if gdf.crs is None:
        gdf = gdf.set_crs("EPSG:4326")
    return gdf.to_crs(TARGET_CRS)


def load_catalog():
    for p in _CATALOG_CANDIDATES:
        if p.exists():
            return pd.read_csv(p)
    print("  [warning] data_catalog.csv not found -- source_dataset_id will be NULL everywhere")
    return pd.DataFrame()


def match_dataset_id(catalog_df, category, prefer_origin):
    if catalog_df.empty:
        return None
    kw = CATEGORY_KEYWORDS.get(category)
    if not kw:
        return None
    hits = catalog_df[catalog_df["dataset_name"].str.contains(kw, case=False, na=False)]
    if hits.empty:
        return None
    preferred = hits[hits["origin"].astype(str).str.upper() == prefer_origin.upper()]
    row = preferred.iloc[0] if len(preferred) else hits.iloc[0]
    return row["dataset_id"]


def read_vector_files(source_dir: Path):
    files = sorted(list(source_dir.glob("*.geojson")) + list(source_dir.glob("*.shp")))
    if not files:
        return gpd.GeoDataFrame()
    parts = [gpd.read_file(f) for f in files]
    combined = pd.concat(parts, ignore_index=True)
    return gpd.GeoDataFrame(combined, geometry="geometry", crs=parts[0].crs)


def read_csv_files(source_dir: Path):
    files = sorted(source_dir.glob("*.csv"))
    if not files:
        return pd.DataFrame()
    return pd.concat([pd.read_csv(f) for f in files], ignore_index=True)


def reset_if_refresh():
    if ETL_MODE != "refresh":
        return
    with engine.begin() as conn:
        conn.execute(text("TRUNCATE TABLE data_sources RESTART IDENTITY CASCADE"))
    print("ETL_MODE=refresh -> wiped data_sources and every table that references it\n")


def write_vector(gdf, table):
    if gdf is None or gdf.empty:
        print(f"  [skip] {table}: no data found")
        return
    if gdf.geometry.name != "geom":
        gdf = gdf.rename_geometry("geom")
    gdf.to_postgis(table, con=engine, if_exists="append", index=False)
    print(f"  loaded {len(gdf)} rows -> {table}")


def write_table(df, table):
    if df is None or df.empty:
        print(f"  [skip] {table}: no data found")
        return
    df.to_sql(table, con=engine, if_exists="append", index=False)
    print(f"  loaded {len(df)} rows -> {table}")


# =================================================================
# data_sources -- load the whole catalog so every row elsewhere can
# be traced back to its source and REAL/DERIVED/SYNTHETIC origin.
# =================================================================
def load_data_sources(catalog_df):
    if catalog_df.empty:
        return
    df = catalog_df.rename(columns={"CRS": "source_crs"})
    keep = ["dataset_id", "dataset_name", "source_type", "origin", "department",
            "format", "geometry_type", "source_crs", "survey_date", "resolution",
            "coverage", "status"]
    df = df[[c for c in keep if c in df.columns]]
    write_table(df, "data_sources")


# =================================================================
# Parcels + buildings (the real spatial join)
# =================================================================
def load_parcels(catalog_df):
    src, origin = find_source("cadastral")
    if src is None:
        print("  [skip] parcels: no data in raw/cadastral or synthetic/cadastral")
        return None
    gdf = read_vector_files(src)
    gdf = normalize_columns(gdf, "parcels")
    gdf = repair_and_reproject(gdf)
    gdf["area_sqm"] = gdf.geometry.area
    gdf["crs_epsg"] = int(TARGET_CRS.split(":")[-1])
    gdf["source_dataset_id"] = match_dataset_id(catalog_df, "parcels", origin)
    keep = ["parcel_id", "survey_number", "land_use", "owner_name", "area_sqm",
            "source_dataset_id", "crs_epsg", "geometry"]
    gdf = gdf[[c for c in keep if c in gdf.columns]]
    write_vector(gdf, "parcels")
    return gdf


def load_buildings(catalog_df, parcels_gdf):
    src, origin = find_source("buildings")
    if src is None:
        print("  [skip] buildings: no data in raw/buildings or synthetic/buildings")
        return
    gdf = read_vector_files(src)
    gdf = normalize_columns(gdf, "buildings")
    gdf = repair_and_reproject(gdf)
    if "height_m" not in gdf.columns:
        gdf["height_m"] = None  # never fabricate a default -- derive from DSM/DTM later
    gdf["source_dataset_id"] = match_dataset_id(catalog_df, "buildings", origin)

    if parcels_gdf is not None and not parcels_gdf.empty and "parcel_id" not in gdf.columns:
        joined = gpd.sjoin(gdf, parcels_gdf[["parcel_id", "geometry"]], how="left", predicate="within")
        gdf = joined.drop(columns=[c for c in ["index_right"] if c in joined.columns])

    keep = ["building_id", "parcel_id", "building_type", "height_m", "floors",
            "source_dataset_id", "geometry"]
    gdf = gdf[[c for c in keep if c in gdf.columns]]
    write_vector(gdf, "buildings")


# =================================================================
# Generic vector / point-CSV loaders for the rest of the categories
# =================================================================
def load_simple_vector(category, table, catalog_df):
    src, origin = find_source(category)
    if src is None:
        print(f"  [skip] {table}: no data in raw/{category} or synthetic/{category}")
        return
    gdf = read_vector_files(src)
    gdf = normalize_columns(gdf, category)
    gdf = repair_and_reproject(gdf)
    gdf["source_dataset_id"] = match_dataset_id(catalog_df, category, origin)
    write_vector(gdf, table)


def load_point_csv(category, table, catalog_df):
    src, origin = find_source(category)
    if src is None:
        print(f"  [skip] {table}: no data in raw/{category} or synthetic/{category}")
        return
    df = read_csv_files(src)
    if df.empty:
        print(f"  [skip] {table}: no data found")
        return
    gdf = gpd.GeoDataFrame(df, geometry=gpd.points_from_xy(df["longitude"], df["latitude"]), crs="EPSG:4326")
    gdf = gdf.drop(columns=["longitude", "latitude"]).to_crs(TARGET_CRS)
    gdf["source_dataset_id"] = match_dataset_id(catalog_df, category, origin)
    write_vector(gdf, table)


def load_revenue(catalog_df):
    src, origin = find_source("revenue")
    if src is None:
        print("  [skip] revenue_records: no data found")
        return
    df = read_csv_files(src)
    if df.empty:
        print("  [skip] revenue_records: no data found")
        return
    df["source_dataset_id"] = match_dataset_id(catalog_df, "revenue", origin)
    write_table(df, "revenue_records")


# =================================================================
# Raster metadata -- bounds/resolution only, never raw pixel data
# =================================================================
def load_imagery(catalog_df):
    ensure_proj_ok()
    try:
        import rasterio
    except ImportError:
        print("  [skip] imagery_metadata: rasterio not installed")
        return

    for category in ["drone", "ori", "dsm_dtm"]:
        src, origin = find_source(category)
        if src is None:
            print(f"  [skip] {category}: no raster files found")
            continue
        for f in sorted(src.glob("*.tif")):
            with rasterio.open(f) as ds:
                bounds = ds.bounds
                res_x = abs(ds.transform.a)
                raster_crs = ds.crs.to_string() if ds.crs else "EPSG:4326"
            footprint = gpd.GeoSeries(
                [box(bounds.left, bounds.bottom, bounds.right, bounds.top)], crs=raster_crs
            ).to_crs(TARGET_CRS)
            row_gdf = gpd.GeoDataFrame(
                {
                    "image_id": [f.stem],
                    "imagery_type": [category],
                    "file_path": [str(f.relative_to(ROOT))],
                    "resolution_m": [res_x],
                    "source_dataset_id": [match_dataset_id(catalog_df, category, origin)],
                },
                geometry=footprint, crs=TARGET_CRS,
            ).rename_geometry("bounds")
            row_gdf.to_postgis("imagery_metadata", con=engine, if_exists="append", index=False)
            print(f"  loaded imagery_metadata <- {f.name}")


def main():
    print(f"NAKSHA ETL -- mode={ETL_MODE}, target_crs={TARGET_CRS}\n")
    catalog_df = load_catalog()
    reset_if_refresh()

    print("data_sources:");     load_data_sources(catalog_df)
    print("parcels:");          parcels_gdf = load_parcels(catalog_df)
    print("buildings:");        load_buildings(catalog_df, parcels_gdf)
    print("roads:");            load_simple_vector("roads", "roads", catalog_df)
    print("utilities:");        load_simple_vector("utilities", "utilities", catalog_df)
    print("gnss:");             load_point_csv("gnss", "gnss_points", catalog_df)
    print("ground truth:");     load_point_csv("gt", "ground_truth", catalog_df)
    print("revenue:");          load_revenue(catalog_df)
    print("municipal:");        load_simple_vector("municipal", "municipal_records", catalog_df)
    print("ai_features:");      load_simple_vector("ai_features", "ai_features", catalog_df)
    print("imagery:");          load_imagery(catalog_df)

    print("\nETL complete.")


if __name__ == "__main__":
    main()