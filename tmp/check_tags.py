from motor.motor_asyncio import AsyncIOMotorClient
import asyncio
import os
import certifi

async def check_data():
    uri = "mongodb+srv://shashankdommeti524_db_user:x3pYEvwR8kAcBYlQ@review-1.jyyeusn.mongodb.net/"
    client = AsyncIOMotorClient(uri, tlsCAFile=certifi.where())
    db = client["review"]
    
    # Check "Thriller" reviews
    thriller_count = await db.reviews.count_documents({"tags": "Thriller", "status": "published"})
    print(f"Published reviews with 'Thriller' tag: {thriller_count}")

    thriller_lower_count = await db.reviews.count_documents({"tags": "thriller", "status": "published"})
    print(f"Published reviews with 'thriller' (lowercase) tag: {thriller_lower_count}")
    
    # Check some reviews
    reviews = await db.reviews.find({"status": "published"}).to_list(100)
    all_tags = set()
    for r in reviews:
        tags = r.get("tags", [])
        if isinstance(tags, list):
           for t in tags: all_tags.add(t)
    print(f"All available tags in published reviews: {sorted(list(all_tags))}")

if __name__ == "__main__":
    asyncio.run(check_data())
