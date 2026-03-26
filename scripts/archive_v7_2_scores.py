import asyncio
import os
import sys

# Add project root to sys.path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.db.mongodb import connect_to_mongo, close_mongo_connection, get_database

def calculate_v7_2(r):
    # LITE version of V7.2 logic for archival purposes
    aspects = r.get('aspects', {})
    getS = lambda k: float(aspects.get(k, {}).get('score', 0)) if isinstance(aspects.get(k), dict) else float(aspects.get(k, 0))
    
    categories = {
        'Narrative': { 'keys': ['story', 'screenplay', 'originality', 'opening', 'climax'], 'weights': [0.09, 0.08, 0.05, 0.08, 0.05] },
        'Execution': { 'keys': ['direction', 'acting', 'dialogues', 'thematic_depth'], 'weights': [0.10, 0.07, 0.03, 0.05] },
        'Visuals': { 'keys': ['cinematography', 'editing', 'production_design', 'vfx'], 'weights': [0.06, 0.04, 0.03, 0.02] },
        'Audio': { 'keys': ['bg_score', 'music', 'sound_design'], 'weights': [0.04, 0.03, 0.03] },
        'Soul': { 'keys': ['pacing', 'emotional_impact', 'rewatch_value'], 'weights': [0.05, 0.06, 0.04] }
    }
    
    base_score = 0.0
    for name, cat in categories.items():
        for i, key in enumerate(cat['keys']):
            base_score += getS(key) * cat['weights'][i]
            
    # Simple V7.2 modifiers (Simplified for archival visibility)
    # 1. Narrative guardrail
    n_avg = sum(getS(k) for k in categories['Narrative']['keys']) / 5
    if n_avg < 7.5 and base_score > 8.3: base_score = 8.3
    
    return round(base_score, 2)

async def archive_legacy():
    await connect_to_mongo()
    db = get_database()
    
    cursor = db.reviews.find({})
    count = 0
    async for r in cursor:
        v7_score = calculate_v7_2(r)
        await db.reviews.update_one(
            {"_id": r["_id"]},
            {"$set": {"legacy_score_v7_2": v7_score}}
        )
        count += 1
        print(f"Archived V7.2 Score for {r.get('movie_title')}: {v7_score}")

    print(f"\nSuccessfully archived {count} legacy ratings.")
    await close_mongo_connection()

if __name__ == "__main__":
    asyncio.run(archive_legacy())
