import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from app.models.review import ReviewInDB

async def test():
    client = AsyncIOMotorClient('mongodb+srv://shashankdommeti524_db_user:RXIykmGS9BoSTK9U@review.jrtglai.mongodb.net/?appName=review')
    db = client['review']
    reviews = await db.reviews.find({}).to_list(1000)
    
    for r in reviews:
        try:
            r['_id'] = str(r['_id'])
            ReviewInDB(**r)
        except Exception as e:
            print(f"Error on review ID {r.get('_id')}: {e}")

asyncio.run(test())
