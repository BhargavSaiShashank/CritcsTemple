from motor.motor_asyncio import AsyncIOMotorClient
import asyncio
import certifi

async def find_valid_timeline():
    mongodb_url = "mongodb+srv://shashankdommeti524_db_user:x3pYEvwR8kAcBYlQ@review-1.jyyeusn.mongodb.net/"
    database_name = "review"
    ca = certifi.where()
    client = AsyncIOMotorClient(mongodb_url, tls=True, tlsCAFile=ca)
    db = client[database_name]
    
    # Find a rating with more than 1 entry in timeline
    rating = await db.ratings.find_one({"timeline.1": {"$exists": True}})
    if rating:
        print(f"Found rating with timeline: {rating.get('movie_id')}")
        # Find the corresponding review
        review = await db.reviews.find_one({"movie_id": rating.get('movie_id')})
        if not review:
            # Try searching by imdb_id or tmdb_id if those fields exist in some reviews
            review = await db.reviews.find_one({"imdb_id": rating.get('movie_id')})
        
        if review:
            print(f"Found review for timeline: {review.get('slug')} (ID: {rating.get('movie_id')})")
        else:
            print(f"No review found for ID {rating.get('movie_id')}")
    else:
        print("No ratings with timelines found")
        
    client.close()

if __name__ == "__main__":
    asyncio.run(find_valid_timeline())
