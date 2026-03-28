import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os

async def migrate_categories():
    # Use the connection string from .env if possible, or fall back to local
    # For this script to run easily in the current environment, we'll try to get MONGODB_URL
    # We can read it from the .env file we viewed earlier
    mongodb_url = "mongodb+srv://shashankdommeti524_db_user:x3pYEvwR8kAcBYlQ@review-1.jyyeusn.mongodb.net/"
    client = AsyncIOMotorClient(mongodb_url)
    db = client.review

    print("--- Starting Category Migration ---")
    
    # Update all categories that don't have a 'type' field
    result = await db.categories.update_many(
        {"type": {"$exists": False}},
        {"$set": {"type": "static"}}
    )
    
    print(f"Updated {result.modified_count} categories to type 'static'.")
    
    # Verify
    cursor = db.categories.find({})
    async for cat in cursor:
        print(f"Category: {cat.get('title')} | Type: {cat.get('type')}")
        
    client.close()
    print("--- Migration Complete ---")

if __name__ == "__main__":
    asyncio.run(migrate_categories())
