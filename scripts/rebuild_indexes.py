import asyncio
import os
import certifi
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

async def cleanup_and_create_indexes():
    load_dotenv()
    mongodb_url = os.getenv("MONGODB_URL")
    database_name = os.getenv("DATABASE_NAME", "review")
    
    ca = certifi.where()
    client = AsyncIOMotorClient(mongodb_url, tls=True, tlsCAFile=ca)
    db = client[database_name]
    
    try:
        print("Dropping existing indexes (except _id)...")
        await db.reviews.drop_indexes()
        
        print("Creating text index...")
        import pymongo
        await db.reviews.create_index([
            ("movie_title", pymongo.TEXT),
            ("verdict", pymongo.TEXT),
            ("summary", pymongo.TEXT),
            ("content", pymongo.TEXT),
            ("tags", pymongo.TEXT)
        ], name="review_search_v1")
        
        print("Creating performance indexes...")
        await db.reviews.create_index([("published_at", pymongo.DESCENDING)])
        await db.reviews.create_index([("overall_rating", pymongo.DESCENDING)])
        await db.reviews.create_index([("oscar_rank", pymongo.ASCENDING)])
        await db.reviews.create_index([("slug", pymongo.ASCENDING)], unique=True)
        
        print("All indexes created successfully.")
    except Exception as e:
        print(f"Error: {e}")
        if hasattr(e, 'details'):
            print(f"Details: {e.details}")
    finally:
        client.close()

if __name__ == "__main__":
    asyncio.run(cleanup_and_create_indexes())
