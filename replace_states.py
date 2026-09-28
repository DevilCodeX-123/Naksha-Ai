import json
import random

all_states = [
    "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
    "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka",
    "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram",
    "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu",
    "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal",
    "Andaman and Nicobar Islands", "Chandigarh", "Dadra and Nagar Haveli and Daman and Diu",
    "Delhi", "Jammu and Kashmir", "Ladakh", "Lakshadweep", "Puducherry"
]

images = [
    "https://images.unsplash.com/photo-1599661046289-e31897846e41?auto=format&fit=crop&w=600&q=80",
    "https://images.unsplash.com/photo-1570168007204-dfb528c6958f?auto=format&fit=crop&w=600&q=80",
    "https://images.unsplash.com/photo-1609946782701-7ac42674e2a8?auto=format&fit=crop&w=600&q=80",
    "https://images.unsplash.com/photo-1582510003544-4d00b7f74220?auto=format&fit=crop&w=600&q=80",
    "https://images.unsplash.com/photo-1560179406-1c6c60e0dc26?auto=format&fit=crop&w=600&q=80",
    "https://images.unsplash.com/photo-1623345805780-8f01f714e65f?auto=format&fit=crop&w=600&q=80"
]

states_json = []

for s in all_states:
    # Use existing data if matches
    if s == "Rajasthan":
        coverage, dist, mapped, pend, status, datasets = 72, 50, "246,380", "95,859", "Partial Survey Coverage", {"ORI": True, "parcels": True, "gnss": False, "groundTruth": False, "buildings": True}
        img = images[0]
    elif s == "Maharashtra":
        coverage, dist, mapped, pend, status, datasets = 85, 36, "261,375", "46,125", "High Coverage", {"ORI": True, "parcels": True, "gnss": True, "groundTruth": True, "buildings": True}
        img = images[1]
    elif s == "Madhya Pradesh":
        coverage, dist, mapped, pend, status, datasets = 58, 55, "178,700", "129,540", "Ongoing Survey", {"ORI": True, "parcels": True, "gnss": False, "groundTruth": False, "buildings": False}
        img = images[2]
    elif s == "Karnataka":
        coverage, dist, mapped, pend, status, datasets = 64, 31, "122,700", "69,000", "Moderate Coverage", {"ORI": True, "parcels": True, "gnss": False, "groundTruth": True, "buildings": False}
        img = images[3]
    else:
        coverage = random.randint(10, 95)
        dist = random.randint(1, 75)
        mapped = f"{random.randint(10, 300)},{random.randint(100, 999)}"
        pend = f"{random.randint(5, 100)},{random.randint(100, 999)}"
        if coverage > 80: status = "High Coverage"
        elif coverage > 50: status = "Moderate Coverage"
        elif coverage > 30: status = "Partial Survey Coverage"
        else: status = "Low Coverage"
        datasets = {
            "ORI": random.choice([True, False]),
            "parcels": random.choice([True, False]),
            "gnss": random.choice([True, False]),
            "groundTruth": random.choice([True, False]),
            "buildings": random.choice([True, False])
        }
        img = random.choice(images)
        
    obj = {
        "id": s[:2].upper(),
        "name": s,
        "coverage": coverage,
        "districts": dist,
        "mappedArea": mapped,
        "pendingArea": pend,
        "status": status,
        "image": img,
        "datasets": datasets
    }
    # Ensure unique ID
    obj["id"] = s[:4].upper().replace(" ", "")
    states_json.append(obj)

content = open('naksha_frontend/src/data/mockData.js', 'r', encoding='utf-8').read()
import re
new_data = json.dumps(states_json, indent=2)
# Replace export const STATE_DATA = [ ... ];
content = re.sub(r'export const STATE_DATA = \[.*?\];', f'export const STATE_DATA = {new_data};', content, flags=re.DOTALL)
open('naksha_frontend/src/data/mockData.js', 'w', encoding='utf-8').write(content)
