import os
from motor.motor_asyncio import AsyncIOMotorClient
import pymongo
import logging

MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017")
DB_NAME = "naksha_plateform"

client = AsyncIOMotorClient(MONGO_URI, serverSelectionTimeoutMS=2000)
db = client[DB_NAME]

async def setup_database():
    try:
        # Ensure 2dsphere indexes for spatial collections
        await db.parcels.create_index([("geometry", pymongo.GEOSPHERE)])
        await db.roads.create_index([("geometry", pymongo.GEOSPHERE)])
        await db.buildings.create_index([("geometry", pymongo.GEOSPHERE)])
        await db.aoi_polygons.create_index([("geometry", pymongo.GEOSPHERE)])
        logging.info("MongoDB 2dsphere indexes created successfully.")
    except Exception as e:
        logging.error(f"Error setting up MongoDB indexes: {e}")

async def get_db():
    return db
