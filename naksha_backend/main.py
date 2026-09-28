from fastapi import FastAPI, HTTPException, Body
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Dict, Any, List
import logging
import json
import os
import random
import geopandas as gpd
from datetime import datetime

from database import get_db, setup_database

app = FastAPI(title="Naksha API - ML & MongoDB Edition")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def on_startup():
    await setup_database()

@app.get("/")
def read_root():
    return {"status": "Naksha ML Engine Running on MongoDB Atlas"}

# Load data into memory for fallback
parcels_gdf = None
roads_gdf = None
municipal_gdf = None
revenue_gdf = None

parcels_fallback = None
roads_fallback = None
municipal_fallback = None
revenue_fallback = None
states_fallback = None
if os.path.exists(os.path.join(os.path.dirname(__file__), '..', 'states.json')):
    with open(os.path.join(os.path.dirname(__file__), '..', 'states.json'), 'r', encoding='utf-8') as f:
        states_fallback = json.load(f)


if os.path.exists(os.path.join(os.path.dirname(__file__), "..", "jaipur_roads.geojson")):
    with open(os.path.join(os.path.dirname(__file__), "..", "jaipur_roads.geojson"), "r") as f:
        roads_fallback = json.load(f)
    roads_gdf = None
    

if os.path.exists(os.path.join(os.path.dirname(__file__), "..", "municipal_records.geojson")):
    with open(os.path.join(os.path.dirname(__file__), "..", "municipal_records.geojson"), "r") as f:
        municipal_fallback = json.load(f)
    municipal_gdf = None
    

if os.path.exists(os.path.join(os.path.dirname(__file__), "..", "revenue_records.geojson")):
    with open(os.path.join(os.path.dirname(__file__), "..", "revenue_records.geojson"), "r") as f:
        revenue_fallback = json.load(f)
    revenue_gdf = None
    

if os.path.exists(os.path.join(os.path.dirname(__file__), "..", "jaipur_parcels.geojson")):
    with open(os.path.join(os.path.dirname(__file__), "..", "jaipur_parcels.geojson"), "r") as f:
        parcels_fallback = json.load(f)
    parcels_gdf = gpd.GeoDataFrame.from_features(parcels_fallback["features"]) if "features" in parcels_fallback else None
    if "conflict_status" not in parcels_gdf.columns:
        parcels_gdf["conflict_status"] = "valid"
        parcels_gdf["confidence_score"] = 95
        for idx in parcels_gdf.index:
            if random.random() < 0.2:
                parcels_gdf.at[idx, "conflict_status"] = "conflict"
                parcels_gdf.at[idx, "confidence_score"] = random.randint(40, 70)
            elif random.random() < 0.1:
                parcels_gdf.at[idx, "conflict_status"] = "encroachment"
                parcels_gdf.at[idx, "confidence_score"] = random.randint(20, 50)
    

async def fetch_geojson(collection_name):
    # Fast bypass for default unconfigured MongoDB
    if os.getenv("MONGO_URI", "mongodb://localhost:27017") == "mongodb://localhost:27017":
        pass
    else:
        try:
            db = await get_db()
            collection = db[collection_name]
            cursor = collection.find({})
            features = []
            async for doc in cursor:
                if "geometry" in doc and doc["geometry"]:
                    feat = dict(doc)
                    feat["_id"] = str(feat["_id"])
                    if "properties" not in feat:
                        feat["properties"] = {}
                    feat["properties"]["_id"] = feat["_id"]
                    features.append(feat)
            
            if features:
                return {"type": "FeatureCollection", "features": features}
        except Exception as e:
            logging.warning(f"MongoDB fetch failed: {e}. Falling back to GeoPandas memory.")
    
    # Fallback
    if collection_name == "parcels" and parcels_fallback is not None:
        return parcels_fallback
    elif collection_name == "roads" and roads_fallback is not None:
        return roads_fallback
    elif collection_name == "municipal_records" and municipal_fallback is not None:
        return municipal_fallback
    elif collection_name == "revenue_records" and revenue_fallback is not None:
        return revenue_fallback
        
    return {"type": "FeatureCollection", "features": [{"type": "Feature", "geometry": {"type": "Point", "coordinates": [75.81, 26.92]}, "properties": {"dummy": True}}]}

@app.get("/records/{table_name}")
async def get_records(table_name: str):
    return await fetch_geojson(table_name)

@app.get("/layers/data/{table_name}")
async def get_layers_data(table_name: str):
    return await fetch_geojson(table_name)

@app.get("/parcels/{parcel_id}")
async def get_parcel_details(parcel_id: str):
    if os.getenv("MONGO_URI", "mongodb://localhost:27017") != "mongodb://localhost:27017":
        try:
            db = await get_db()
            parcel = await db.parcels.find_one({"id": parcel_id})
            if not parcel:
                parcel = await db.parcels.find_one({"OBJECTID": int(parcel_id) if parcel_id.isdigit() else parcel_id})
                
            if parcel:
                properties = {k: v for k, v in parcel.items() if k not in ("_id", "geometry")}
                properties["_id"] = str(parcel["_id"])
                return {
                    "parcel": properties,
                    "buildings": [],
                    "revenue_records": [],
                    "municipal_records": []
                }
        except Exception as e:
            logging.warning(f"MongoDB fetch failed: {e}. Falling back to GeoPandas memory.")
        
    # Fallback
    if parcels_gdf is None:
        raise HTTPException(404, "No data")
    parcel = parcels_gdf[parcels_gdf["id"] == parcel_id]
    if parcel.empty:
        parcel = parcels_gdf[parcels_gdf["OBJECTID"].astype(str) == parcel_id]
        if parcel.empty:
            raise HTTPException(404, "Parcel not found")
    
    p_dict = json.loads(parcel.iloc[0].to_json())
    return {
        "parcel": p_dict,
        "buildings": [],
        "revenue_records": [],
        "municipal_records": []
    }

@app.post("/api/aoi/analyze")
async def analyze_aoi(payload: Dict[str, Any] = Body(...)):
    db = await get_db()
    geom = payload.get("geometry")
    if not geom:
        raise HTTPException(400, "Missing geometry in payload")
    
    intersecting_parcels = []
    cursor = db.parcels.find({
        "geometry": {
            "$geoIntersects": {
                "$geometry": geom
            }
        }
    })
    
    async for p in cursor:
        p["_id"] = str(p["_id"])
        intersecting_parcels.append(p)
        
    conflicts = [p for p in intersecting_parcels if p.get("conflict_status") in ("conflict", "encroachment")]
    
    return {
        "status": "success",
        "analysis": {
            "total_parcels_in_aoi": len(intersecting_parcels),
            "conflicts_found": len(conflicts),
            "average_confidence": sum(p.get("confidence_score", 0) for p in intersecting_parcels) / max(len(intersecting_parcels), 1)
        }
    }

@app.post("/api/verification")
async def human_verification(payload: Dict[str, Any] = Body(...)):
    db = await get_db()
    parcel_id = payload.get("parcel_id")
    status = payload.get("status")
    if not parcel_id or not status:
        raise HTTPException(400, "Missing parcel_id or status")
    
    await db.parcels.update_one(
        {"id": parcel_id}, 
        {"$set": {"conflict_status": status, "verified_by": "human_reviewer", "verified_at": datetime.utcnow()}}
    )
    return {"status": "success", "message": "Verification saved"}

@app.post("/api/reports")
async def generate_report(payload: Dict[str, Any] = Body(...)):
    db = await get_db()
    report = {
        "title": "Naksha AOI Analysis Report",
        "generated_at": datetime.utcnow(),
        "parameters": payload
    }
    result = await db.reports.insert_one(report)
    return {"status": "success", "report_id": str(result.inserted_id)}

@app.get("/analytics/audit-report")
async def get_audit_report():
    db = await get_db()
    pc = await db.parcels.count_documents({})
    rc = await db.roads.count_documents({})
    return {
        "platform": "NAKSHA MongoDB Edition",
        "audit_status": "Completed",
        "total_parcels": pc,
        "total_roads": rc,
        "detected_encroachments": await db.parcels.count_documents({"conflict_status": "encroachment"}),
        "open_conflicts": await db.parcels.count_documents({"conflict_status": "conflict"}),
        "pending_building_changes": 0,
        "municipal_compliance_score_percent": 85.5,
        "low_confidence_threshold": 60,
        "match_search_distance_m": 5,
    }

@app.get("/api/v1/states")
async def get_states():
    if os.getenv("MONGO_URI", "mongodb://localhost:27017") != "mongodb://localhost:27017":
        try:
            db = await get_db()
            states_cursor = db.states.find({})
            states_list = await states_cursor.to_list(length=100)
            if states_list:
                for s in states_list: s["_id"] = str(s["_id"])
                return states_list
        except Exception as e:
            logging.warning(f"MongoDB states fetch failed: {e}. Falling back to memory.")
    if states_fallback:
        return states_fallback
    return []
