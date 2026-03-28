import asyncio
import os
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
from app.core.utils import calculate_overall_score
from app.models.review import AspectRatings

load_dotenv()

async def verify_calculation():
    client = AsyncIOMotorClient(os.getenv("MONGODB_URL"))
    db = client[os.getenv("DATABASE_NAME", "review")]
    
    review = await db.reviews.find_one({"movie_title": {"$regex": "The Truman Show", "$options": "i"}})
    
    if review:
        print(f"Current Overall Rating in DB: {review.get('overall_rating')}")
        aspects_data = review.get('aspects', {})
        aspects_obj = AspectRatings(**aspects_data)
        
        calculated = calculate_overall_score(aspects_obj)
        print(f"Backend Calculated Rating (V8.0 Unified): {calculated}")
        
    else:
        print("Review not found for 'The Truman Show'")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(verify_calculation())
