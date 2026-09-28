import json
content = open('mongo_seed.py', encoding='utf-8').read()
replacement = """    # Load states
    print("Loading states.json...")
    if os.path.exists("states.json"):
        with open("states.json", "r", encoding="utf-8") as f:
            states = json.load(f)
            if states:
                db.states.drop()
                db.states.insert_many(states)
                print(f"Successfully seeded {len(states)} states.")
    print("MongoDB seeding complete!")"""
content = content.replace('print("MongoDB seeding complete!")', replacement)
open('mongo_seed.py', 'w', encoding='utf-8').write(content)
