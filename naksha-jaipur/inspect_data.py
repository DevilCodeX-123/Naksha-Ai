"""
NAKSHA Jaipur -- dataset inspector.

Run once from the naksha-jaipur project root:
    python inspect_data.py

Prints the columns found in every raw source file so we can build an
accurate FIELD_ALIASES mapping for the production ETL pipeline.
Read-only -- nothing is modified, written, or uploaded anywhere.
"""
from pathlib import Path
import geopandas as gpd
import pandas as pd

RAW = Path("data/raw")
VECTOR_EXTS = {".geojson", ".shp", ".gpkg"}
TABLE_EXTS = {".csv", ".tsv"}
RASTER_EXTS = {".tif", ".tiff"}


def inspect_folder(folder: Path):
    if not folder.exists():
        print("  (folder not found)")
        return
    files = sorted(p for p in folder.rglob("*") if p.is_file())
    if not files:
        print("  (empty)")
        return
    for f in files:
        ext = f.suffix.lower()
        try:
            if ext in VECTOR_EXTS:
                gdf = gpd.read_file(f)
                cols = [c for c in gdf.columns if c != "geometry"]
                print(f"  {f.name}  [{len(gdf)} features, crs={gdf.crs}]")
                print(f"    columns: {cols}")
            elif ext in TABLE_EXTS:
                df = pd.read_csv(f, nrows=5)
                print(f"  {f.name}  [csv, {len(df.columns)} columns]")
                print(f"    columns: {list(df.columns)}")
            elif ext in RASTER_EXTS:
                size_mb = f.stat().st_size / (1024 * 1024)
                print(f"  {f.name}  [raster, {size_mb:.1f} MB]")
            else:
                print(f"  {f.name}  [skipped: unrecognized extension {ext}]")
        except Exception as e:
            print(f"  {f.name}  [ERROR reading file: {e}]")


if __name__ == "__main__":
    if not RAW.exists():
        print(f"Can't find {RAW.resolve()} -- run this from the naksha-jaipur project root.")
    else:
        for sub in sorted(p for p in RAW.iterdir() if p.is_dir()):
            print(f"\n=== raw/{sub.name}/ ===")
            inspect_folder(sub)
