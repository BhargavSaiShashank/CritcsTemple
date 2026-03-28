from motor.motor_asyncio import AsyncIOMotorClient
import asyncio
import os
import certifi

async def check_data():
    uri = "mongodb+srv://shashankdommeti524_db_user:x3pYEvwR8kAcBYlQ@review-1.jyyeusn.mongodb.net/"
    client = AsyncIOMotorClient(uri, tlsCAFile=certifi.where())
    db = client["review"]
    
    # International (not hi, te, ml, ta)
    intl_count = await db.reviews.count_documents({
        "status": "published",
        "language": {"$nin": ["hi", "te", "ml", "ta"]}
    })
    print(f"International count: {intl_count}")

    # Indian (specifically hi, te, ml, ta)
    indian_count = await db.reviews.count_documents({
        "status": "published",
        "language": {"$in": ["hi", "te", "ml", "ta"]}
    })
    print(f"Indian count: {indian_count}")

if __name__ == "__main__":
    asyncio.run(check_data())
