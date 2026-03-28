from motor.motor_asyncio import AsyncIOMotorClient
import asyncio
import os
import certifi
import json

async def check_data():
    uri = "mongodb+srv://shashankdommeti524_db_user:x3pYEvwR8kAcBYlQ@review-1.jyyeusn.mongodb.net/"
    client = AsyncIOMotorClient(uri, tlsCAFile=certifi.where())
    db = client["review"]
    
    # Check "Top 20 Rated International"
    cat = await db.categories.find_one({"title": "Top 20 Rated International"})
    print(f"Top 20 Rated International: {json.dumps(cat, default=str, indent=2)}")

    # Check "Thriller Chiils"
    cat2 = await db.categories.find_one({"title": "Thriller Chiils"})
    print(f"Thriller Chiils: {json.dumps(cat2, default=str, indent=2)}")

if __name__ == "__main__":
    asyncio.run(check_data())
