import json

features = []
base_lng = 75.73
base_lat = 26.85

# Create a 50x50 grid (2500 parcels)
for i in range(50):
    for j in range(50):
        lng = base_lng + i * 0.004
        lat = base_lat + j * 0.004
        
        # A tiny gap between parcels to make them look like blocks
        lng_end = lng + 0.0035
        lat_end = lat + 0.0035
        
        import random
        
        land_uses = ["Residential", "Commercial", "Industrial", "Agricultural", "Mixed Use", "Public"]
        building_purposes = {
            "Residential": ["Single Family Home", "Apartment Complex", "Duplex", "Townhouse"],
            "Commercial": ["Retail Store", "Office Building", "Restaurant", "Shopping Mall", "Hotel"],
            "Industrial": ["Warehouse", "Manufacturing Plant", "Distribution Center"],
            "Agricultural": ["Farmhouse", "Barn", "Greenhouse"],
            "Mixed Use": ["Residential/Retail", "Office/Retail"],
            "Public": ["School", "Hospital", "Government Building", "Park Facility"]
        }
        
        land_use = random.choice(land_uses)
        purpose = random.choice(building_purposes[land_use])
        
        feat = {
            "type": "Feature",
            "id": f"P-{i}-{j}",
            "properties": {
                "id": f"P-{i}-{j}",
                "parcel_id": f"P-{i}-{j}",
                "area_sqm": random.randint(800, 3000),
                "land_use": land_use,
                "purpose_of_building": purpose,
                "owner_name": random.choice(["Sharma Holdings", "Rajasthan State", "Private Individual", "Gupta Enterprises", "Municipal Corp"]),
                "zoning_code": f"Z-{random.randint(1, 9)}",
                "year_built": random.randint(1980, 2024),
                "property_tax_status": random.choice(["Paid", "Pending", "Overdue"]),
                "last_survey_date": f"202{random.randint(0,4)}-{random.randint(1,12):02d}-{random.randint(1,28):02d}"
            },
            "geometry": {
                "type": "Polygon",
                "coordinates": [[
                    [lng, lat],
                    [lng_end, lat],
                    [lng_end, lat_end],
                    [lng, lat_end],
                    [lng, lat]
                ]]
            }
        }
        features.append(feat)

geojson = {
    "type": "FeatureCollection",
    "features": features
}

with open('jaipur_parcels.geojson', 'w') as f:
    json.dump(geojson, f)

print(f"Generated {len(features)} parcels in jaipur_parcels.geojson")
