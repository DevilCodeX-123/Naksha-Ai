import os
import json
from pymongo import MongoClient
from dotenv import load_dotenv

load_dotenv()
MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017")

def seed_mongo():
    print(f"Connecting to MongoDB: {MONGO_URI}")
    client = MongoClient(MONGO_URI)
    db = client['naksha_plateform']

    # Load parcels
    print("Loading jaipur_parcels.geojson...")
    if os.path.exists("jaipur_parcels.geojson"):
        with open("jaipur_parcels.geojson", "r") as f:
            data = json.load(f)
            features = data.get("features", [])
            if features:
                import random
                for feat in features:
                    if "properties" not in feat:
                        feat["properties"] = {}
                    feat["properties"]["conflict_status"] = "valid"
                    feat["properties"]["confidence_score"] = 95
                    if random.random() < 0.2:
                        feat["properties"]["conflict_status"] = "conflict"
                        feat["properties"]["confidence_score"] = random.randint(40, 70)
                    elif random.random() < 0.1:
                        feat["properties"]["conflict_status"] = "encroachment"
                        feat["properties"]["confidence_score"] = random.randint(20, 50)
                db.parcels.drop()
                db.parcels.insert_many(features)
                db.parcels.create_index([("geometry", "2dsphere")])
                print(f"Successfully seeded {len(features)} parcels.")
    else:
        print("jaipur_parcels.geojson not found.")

    # Load roads
    print("Loading jaipur_roads.geojson...")
    if os.path.exists("jaipur_roads.geojson"):
        with open("jaipur_roads.geojson", "r") as f:
            data = json.load(f)
            features = data.get("features", [])
            if features:
                db.roads.drop()
                db.roads.insert_many(features)
                db.roads.create_index([("geometry", "2dsphere")])
                print(f"Successfully seeded {len(features)} roads.")
    else:
        print("jaipur_roads.geojson not found.")
        
        # Load states
    print("Loading states.json...")
    if os.path.exists("states.json"):
        with open("states.json", "r", encoding="utf-8") as f:
            states = json.load(f)
            if states:
                db.states.drop()
                db.states.insert_many(states)
                print(f"Successfully seeded {len(states)} states.")
    print("MongoDB seeding complete!")

if __name__ == "__main__":
    seed_mongo()
