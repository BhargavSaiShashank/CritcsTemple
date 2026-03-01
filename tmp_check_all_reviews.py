import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime
import certifi

async def check_all_reviews():
    try:
        uri = "mongodb+srv://shashankdommeti524_db_user:x3pYEvwR8kAcBYlQ@review-1.jyyeusn.mongodb.net/"
        client = AsyncIOMotorClient(uri, tlsCAFile=certifi.where())
        db = client.review
        
        print("--- ALL REVIEWS IN DB ---")
        async for doc in db.reviews.find({}):
            print(f"Title: {doc.get('movie_title')}, Status: {doc.get('status')}, PublishedAt: {doc.get('published_at')}")

    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    asyncio.run(check_all_reviews())
