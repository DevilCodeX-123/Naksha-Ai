import os

content = open('naksha_backend/main.py', encoding='utf-8').read()
content = content.replace('roads_gdf = gpd.read_file(r"C:\\Users\\Dell\\Documents\\Naksha Ai\\jaipur_roads.geojson")', 'with open(r"C:\\Users\\Dell\\Documents\\Naksha Ai\\jaipur_roads.geojson", "r") as f:\n        roads_fallback = json.load(f)\n    roads_gdf = None')
content = content.replace('roads_fallback = json.loads(roads_gdf.to_json())', '')
content = content.replace('municipal_gdf = gpd.read_file(r"C:\\Users\\Dell\\Documents\\Naksha Ai\\municipal_records.geojson")', 'with open(r"C:\\Users\\Dell\\Documents\\Naksha Ai\\municipal_records.geojson", "r") as f:\n        municipal_fallback = json.load(f)\n    municipal_gdf = None')
content = content.replace('municipal_fallback = json.loads(municipal_gdf.to_json())', '')
content = content.replace('revenue_gdf = gpd.read_file(r"C:\\Users\\Dell\\Documents\\Naksha Ai\\revenue_records.geojson")', 'with open(r"C:\\Users\\Dell\\Documents\\Naksha Ai\\revenue_records.geojson", "r") as f:\n        revenue_fallback = json.load(f)\n    revenue_gdf = None')
content = content.replace('revenue_fallback = json.loads(revenue_gdf.to_json())', '')
content = content.replace('parcels_gdf = gpd.read_file(r"C:\\Users\\Dell\\Documents\\Naksha Ai\\jaipur_parcels.geojson")', 'with open(r"C:\\Users\\Dell\\Documents\\Naksha Ai\\jaipur_parcels.geojson", "r") as f:\n        parcels_fallback = json.load(f)\n    parcels_gdf = gpd.GeoDataFrame.from_features(parcels_fallback["features"]) if "features" in parcels_fallback else None')
content = content.replace('parcels_fallback = json.loads(parcels_gdf.to_json())', '')
open('naksha_backend/main.py', 'w', encoding='utf-8').write(content)
