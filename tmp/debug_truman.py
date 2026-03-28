import asyncio
import os
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

load_dotenv()

async def debug_truman():
    client = AsyncIOMotorClient(os.getenv("MONGODB_URL"))
    db = client[os.getenv("DATABASE_NAME", "review")]
    
    review = await db.reviews.find_one({"movie_title": {"$regex": "The Truman Show", "$options": "i"}})
    
    if review:
        print(f"Review ID: {review.get('_id')}")
        print(f"Movie Title: {review.get('movie_title')}")
        print(f"Overall Rating: {review.get('overall_rating')}")
        print(f"Status: {review.get('status')}")
        print(f"Aspects: {review.get('aspects')}")
    else:
        print("Review not found for 'The Truman Show'")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(debug_truman())
