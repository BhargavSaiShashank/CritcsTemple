import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime
import certifi

async def check_all_reviews_detailed():
    try:
        uri = "mongodb+srv://shashankdommeti524_db_user:x3pYEvwR8kAcBYlQ@review-1.jyyeusn.mongodb.net/"
        client = AsyncIOMotorClient(uri, tlsCAFile=certifi.where())
        db = client.review
        
        print("--- DETAILED REVIEW CHECK ---")
        now = datetime.utcnow()
        cursor = db.reviews.find({})
        async for doc in cursor:
            is_published = doc.get("status") == "published"
            scheduled_date = doc.get("scheduled_date")
            is_scheduled = doc.get("status") == "scheduled" and scheduled_date and scheduled_date <= now
            visible = is_published or is_scheduled
            print(f"Title: {doc.get('movie_title')}")
            print(f"  Status: {doc.get('status')}")
            print(f"  Visible: {visible}")
            print(f"  PublishedAt: {doc.get('published_at')}")
            print(f"  ScheduledDate: {scheduled_date}")
            print("-" * 20)

    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    asyncio.run(check_all_reviews_detailed())
