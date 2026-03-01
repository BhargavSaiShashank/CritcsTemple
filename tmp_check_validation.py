import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv

load_dotenv()

async def check_validation():
    mongodb_url = os.getenv("MONGODB_URL")
    database_name = os.getenv("DATABASE_NAME", "review")
    
    print(f"Connecting to {mongodb_url}...")
    client = AsyncIOMotorClient(mongodb_url)
    db = client[database_name]
    
    cursor = db.reviews.find({})
    async for doc in cursor:
        title = doc.get('movie_title', 'Unknown')
        _id = str(doc.get('_id'))
        
        missing = []
        if 'aspects' not in doc: missing.append('aspects')
        if 'movie_id' not in doc: missing.append('movie_id')
        if 'slug' not in doc: missing.append('slug')
        
        if missing:
            print(f"ERROR: '{title}' ({_id}) is MISSING: {', '.join(missing)}")
        else:
            print(f"OK: '{title}' ({_id}) is fully valid.")

if __name__ == "__main__":
    asyncio.run(check_validation())
