import asyncio
import os
import json
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
from app.core.utils import calculate_overall_score
from app.models.review import AspectRatings

load_dotenv()

async def deep_debug():
    client = AsyncIOMotorClient(os.getenv("MONGODB_URL"))
    db = client[os.getenv("DATABASE_NAME", "review")]
    
    review = await db.reviews.find_one({"movie_title": {"$regex": "The Truman Show", "$options": "i"}})
    
    if review:
        print(f"--- TRUMAN SHOW DEBUG ---")
        print(f"Stored Overall Rating: {review.get('overall_rating')}")
        aspects_data = review.get('aspects', {})
        print(f"Aspects Data Keys: {list(aspects_data.keys())}")
        
        # Manually calculate to see what's happening
        weights = {
            'screenplay': 0.09, 'story': 0.08, 'originality': 0.04, 'opening': 0.02, 'climax': 0.02,
            'direction': 0.10, 'acting': 0.08, 'dialogues': 0.04, 'thematic_depth': 0.03,
            'cinematography': 0.09, 'editing': 0.07, 'production_design': 0.04, 'vfx': 0.03,
            'sound_design': 0.06, 'bg_score': 0.04, 'music': 0.03,
            'emotional_impact': 0.08, 'rewatch_value': 0.03, 'pacing': 0.03
        }
        
        weighted_sum = 0
        for k, w in weights.items():
            score = aspects_data.get(k, {}).get('score', 0)
            weighted_sum += score * w
            if score > 0:
                print(f"  {k}: {score} * {w} = {score*w}")
        
        print(f"Manual Weighted Sum: {weighted_sum}")
        
        aspects_obj = AspectRatings(**aspects_data)
        calc = calculate_overall_score(aspects_obj)
        print(f"calculate_overall_score result: {calc}")
        
    else:
        print("Not found")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(deep_debug())
