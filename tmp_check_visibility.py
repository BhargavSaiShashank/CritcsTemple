import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime
import certifi

async def check_visibility():
    try:
        uri = "mongodb+srv://shashankdommeti524_db_user:x3pYEvwR8kAcBYlQ@review-1.jyyeusn.mongodb.net/"
        client = AsyncIOMotorClient(uri, tlsCAFile=certifi.where())
        db = client.review
        
        doc = await db.reviews.find_one({"movie_title": {"$regex": "Once Upon a Time", "$options": "i"}})
        if doc:
            now = datetime.utcnow()
            print(f"Title: {doc.get('movie_title')}")
            print(f"Status: {doc.get('status')}")
            print(f"Published At: {doc.get('published_at')}")
            print(f"Current Time (UTC): {now}")
            
            # Replicate the publication query
            is_published = doc.get("status") == "published"
            is_scheduled = doc.get("status") == "scheduled" and doc.get("scheduled_date") <= now
            print(f"Visible to public: {is_published or is_scheduled}")
        else:
            print("Document not found!")

    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    asyncio.run(check_visibility())
