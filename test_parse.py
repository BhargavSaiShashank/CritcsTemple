import asyncio
from app.db.mongodb import connect_to_mongo, close_mongo_connection, get_database
from app.api.v1.admin import list_reviews
from app.models.review import ReviewInDB
from app.services.review_service import review_service

async def test_validation():
    await connect_to_mongo()
    db = get_database()
    
    cursor = db.reviews.find({}).sort("created_at", -1)
    reviews = []
    async for r in cursor:
        reviews.append(r)
        
    print(f"Loaded {len(reviews)} reviews from DB")
    
    for r in reviews:
        doc = review_service.serialize_doc(r)
        try:
            validated = ReviewInDB(**doc)
        except Exception as e:
            print(f"Validation failed for review {doc.get('_id', 'unknown')} | Title: {doc.get('movie_title')}")
            print(e)
            
    await close_mongo_connection()

if __name__ == "__main__":
    asyncio.run(test_validation())
