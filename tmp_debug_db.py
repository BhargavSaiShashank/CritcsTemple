import asyncio
from app.db.mongodb import connect_to_mongo, get_database, close_mongo_connection

async def check_db():
    await connect_to_mongo()
    db = get_database()
    
    print("--- Dynamic Ratings ---")
    ratings_cursor = db.dynamic_ratings.find()
    ratings_count = 0
    async for r in ratings_cursor:
        ratings_count += 1
        print(f"Movie ID: {r.get('movie_id')} (Type: {type(r.get('movie_id'))})")
    
    if ratings_count == 0:
        print("No dynamic ratings found.")
        
    print("\n--- Reviews Sample ---")
    reviews_cursor = db.reviews.find().limit(5)
    async for rev in reviews_cursor:
        print(f"Slug: {rev.get('slug')}, Movie ID: {rev.get('movie_id')} (Type: {type(rev.get('movie_id'))})")
        
    await close_mongo_connection()

if __name__ == "__main__":
    asyncio.run(check_db())
