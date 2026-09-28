import json

with open('naksha_backend/main.py', 'a', encoding='utf-8') as f:
    f.write('''
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
''')
