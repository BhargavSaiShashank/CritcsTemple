import asyncio
import os
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

load_dotenv()

async def debug_truman_full():
    client = AsyncIOMotorClient(os.getenv("MONGODB_URL"))
    db = client[os.getenv("DATABASE_NAME", "review")]
    
    review = await db.reviews.find_one({"movie_title": {"$regex": "The Truman Show", "$options": "i"}})
    
    if review:
        print(f"Overall Rating: {review.get('overall_rating')}")
        print(f"Micro Calibration: {review.get('micro_calibration')}")
        print(f"Legacy Score V7.2: {review.get('legacy_score_v7_2')}")
        print(f"Aspects: {review.get('aspects')}")
    else:
        print("Not found")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(debug_truman_full())
