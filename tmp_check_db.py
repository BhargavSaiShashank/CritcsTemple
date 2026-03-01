import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv

load_dotenv()

async def check_search():
    mongodb_url = os.getenv("MONGODB_URL")
    database_name = os.getenv("DATABASE_NAME", "review")
    
    print(f"Connecting to {mongodb_url}...")
    client = AsyncIOMotorClient(mongodb_url)
    db = client[database_name]
    
    search_term = "once"
    query = {
        "$or": [
            {"movie_title": {"$regex": search_term, "$options": "i"}},
            {"verdict": {"$regex": search_term, "$options": "i"}},
            {"tags": {"$regex": search_term, "$options": "i"}}
        ]
    }
    
    count = await db.reviews.count_documents(query)
    print(f"Found {count} reviews matching '{search_term}'")
    
    if count > 0:
        cursor = db.reviews.find(query).limit(5)
        async for doc in cursor:
            print(f"- {doc.get('movie_title')} (Status: {doc.get('status')})")
            
    # Also check publication query
    from datetime import datetime
    now = datetime.utcnow()
    pub_query = {
        "$or": [
            {"status": "published"},
            {
                "status": "scheduled",
                "scheduled_date": {"$lte": now}
            }
        ]
    }
    
    combined_query = {"$and": [pub_query, query]}
    pub_count = await db.reviews.count_documents(combined_query)
    print(f"Found {pub_count} PUBLISHED reviews matching '{search_term}'")

if __name__ == "__main__":
    asyncio.run(check_search())
