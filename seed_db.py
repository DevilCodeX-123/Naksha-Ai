import os
import json
import geopandas as gpd
from sqlalchemy import create_engine
from dotenv import load_dotenv

# Load env variables
load_dotenv()
DB_URL = os.getenv("DATABASE_URL", "postgresql://db_admin:Qwertyuiopas12@localhost:5432/naksha")
# SQLAlchemy 2.0 requires postgresql+psycopg2 or postgresql+psycopg
if DB_URL.startswith("postgresql://"):
    DB_URL = DB_URL.replace("postgresql://", "postgresql+psycopg://")

def seed_database():
    print(f"Connecting to database: {DB_URL}")
    try:
        engine = create_engine(DB_URL)
        
        # Load parcels
        print("Loading jaipur_parcels.geojson...")
        if os.path.exists("jaipur_parcels.geojson"):
            parcels_gdf = gpd.read_file("jaipur_parcels.geojson")
            parcels_gdf.to_postgis("parcels", engine, if_exists="replace", index=False)
            print("Successfully seeded 'parcels' table.")
        else:
            print("jaipur_parcels.geojson not found.")

        # Load roads
        print("Loading jaipur_roads.geojson...")
        if os.path.exists("jaipur_roads.geojson"):
            roads_gdf = gpd.read_file("jaipur_roads.geojson")
            roads_gdf.to_postgis("roads", engine, if_exists="replace", index=False)
            print("Successfully seeded 'roads' table.")
        else:
            print("jaipur_roads.geojson not found.")
            
        print("Database seeding complete!")
        
    except Exception as e:
        print(f"Failed to seed database. Is PostgreSQL running? Error: {e}")

if __name__ == "__main__":
    seed_database()
