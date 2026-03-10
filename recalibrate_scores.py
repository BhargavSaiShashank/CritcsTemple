import asyncio
import os
from motor.motor_asyncio import AsyncIOMotorClient
import certifi

# Adjust the path so we can import app modules directly
import sys
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.core.config import get_settings
from app.core.utils import calculate_overall_score
from app.models.review import AspectRatings

async def recalibrate():
    print("Initializing Database Connection...")
    settings = get_settings()
    ca = certifi.where()
    
    # Establish connection mirroring app behavior
    client = AsyncIOMotorClient(
        settings.MONGODB_URL, 
        tls=True,
        tlsCAFile=ca,
        serverSelectionTimeoutMS=10000,
        tlsAllowInvalidCertificates=False
    )
    
    db = client[settings.DATABASE_NAME]
    collection = db.reviews

    print(f"Connected to {settings.DATABASE_NAME}. Fetching reviews for recalibration...")
    
    cursor = collection.find({})
    reviews_updated = 0
    total_reviews = 0
    
    async for review_data in cursor:
        total_reviews += 1
        movie_title = review_data.get('movie_title', 'Unknown Title')
        
        if 'aspects' in review_data and review_data['aspects']:
            try:
                # Calculate the new weighted score using the exact same logic as utils.py
                aspects_model = AspectRatings(**review_data['aspects'])
                new_score = calculate_overall_score(aspects_model)
                
                # Check if an update is genuinely needed
                old_score = review_data.get('overall_rating')
                if old_score != new_score:
                    await collection.update_one(
                        {"_id": review_data["_id"]},
                        {"$set": {"overall_rating": new_score}}
                    )
                    reviews_updated += 1
                    print(f"[\u2713] Updated '{movie_title}': {old_score} -> {new_score}")
            except Exception as e:
                print(f"[!] Error processing review '{movie_title}': {e}")
                
    print(f"\nRecalibration complete. Checked {total_reviews} reviews. {reviews_updated} required updates.")
    client.close()

if __name__ == "__main__":
    asyncio.run(recalibrate())
