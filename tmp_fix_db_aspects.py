import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv

load_dotenv()

async def fix_database():
    mongodb_url = os.getenv("MONGODB_URL")
    database_name = os.getenv("DATABASE_NAME", "review")
    
    print(f"Connecting to {mongodb_url}...")
    client = AsyncIOMotorClient(mongodb_url)
    db = client[database_name]
    
    default_aspects = {
        "story": {"score": 5.0},
        "screenplay": {"score": 5.0},
        "direction": {"score": 5.0},
        "acting": {"score": 5.0},
        "cinematography": {"score": 5.0},
        "editing": {"score": 5.0},
        "bg_score": {"score": 5.0},
        "music": {"score": 5.0},
        "production_design": {"score": 5.0},
        "vfx": {"score": 5.0},
        "originality": {"score": 5.0},
        "pacing": {"score": 5.0},
        "dialogues": {"score": 5.0},
        "climax": {"score": 5.0},
        "opening": {"score": 5.0},
        "emotional_impact": {"score": 5.0},
        "rewatch_value": {"score": 5.0}
    }
    
    # 1. Fix missing aspects
    result = await db.reviews.update_many(
        {"aspects": {"$exists": False}},
        {"$set": {"aspects": default_aspects}}
    )
    print(f"Updated {result.modified_count} reviews with missing 'aspects'")

    # 2. Fix missing movie_id (set to 0 if unknown)
    result = await db.reviews.update_many(
        {"movie_id": {"$exists": False}},
        {"$set": {"movie_id": 0}}
    )
    print(f"Updated {result.modified_count} reviews with missing 'movie_id'")

    # 3. Ensure reactions exist
    result = await db.reviews.update_many(
        {"reactions": {"$exists": False}},
        {"$set": {"reactions": {"agree": 0, "disagree": 0, "havent_seen": 0}}}
    )
    print(f"Updated {result.modified_count} reviews with missing 'reactions'")

if __name__ == "__main__":
    asyncio.run(fix_database())
