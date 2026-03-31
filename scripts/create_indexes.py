import asyncio
import os
import sys
import certifi
import ssl
from motor.motor_asyncio import AsyncIOMotorClient
import pymongo
from dotenv import load_dotenv

# Add the project root to the python path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

async def create_indexes():
    # Load environment variables from .env file if it exists
    load_dotenv()
    
    mongodb_url = os.getenv("MONGODB_URL")
    database_name = os.getenv("DATABASE_NAME", "review")
    
    if not mongodb_url:
        print("Error: MONGODB_URL not found in environment variables.")
        return

    print(f"Connecting to MongoDB: {database_name}...")
    ca = certifi.where()
    
    # Simple connection for script usage
    client = AsyncIOMotorClient(
        mongodb_url,
        tls=True,
        tlsCAFile=ca,
        serverSelectionTimeoutMS=10000
    )
    
    db = client[database_name]
    
    try:
        print("Creating text index on reviews collection...")
        # Creation of text index for search
        result = await db.reviews.create_index([
            ("published_at", pymongo.DESCENDING)
        ], name="test_index")
        print(f"Text index created: {result}")
        
        print("Creating performance indexes...")
        await db.reviews.create_index([("published_at", pymongo.DESCENDING)])
        await db.reviews.create_index([("overall_rating", pymongo.DESCENDING)])
        await db.reviews.create_index([("oscar_rank", pymongo.ASCENDING)])
        await db.reviews.create_index([("slug", pymongo.ASCENDING)], unique=True)
        
        print("Indexes created successfully.")
    except Exception as e:
        import traceback
        print(f"Error creating indexes: {e}")
        if hasattr(e, 'details'):
            print(f"Error details: {e.details}")
        traceback.print_exc()
    finally:
        client.close()

if __name__ == "__main__":
    asyncio.run(create_indexes())
