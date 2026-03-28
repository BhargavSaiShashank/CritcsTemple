from motor.motor_asyncio import AsyncIOMotorClient
import asyncio
import os
import certifi

async def migrate():
    uri = "mongodb+srv://shashankdommeti524_db_user:x3pYEvwR8kAcBYlQ@review-1.jyyeusn.mongodb.net/"
    client = AsyncIOMotorClient(uri, tlsCAFile=certifi.where())
    db = client["review"]
    
    # Fetch all dynamic categories
    categories = await db.categories.find({"type": "dynamic"}).to_list(length=100)
    
    for cat in categories:
        print(f"Syncing Dynamic Category: {cat['title']}")
        criteria = cat.get("dynamic_criteria", {})
        limit = criteria.get("limit", 20)
        tags = criteria.get("tags", [])
        language = criteria.get("language")
        content_type = criteria.get("content_type")
        
        query = {"status": "published"}
        if tags and len(tags) > 0:
            query["tags"] = {"$in": tags}
        
        if language:
            if language == 'en':
                query["language"] = {"$nin": ["hi", "te", "ml", "ta"]}
            elif language == 'indian':
                query["language"] = {"$in": ["hi", "te", "ml", "ta"]}
            elif language == 'all':
                pass
            elif isinstance(language, list):
                query["language"] = {"$in": language}
            else:
                query["language"] = language
        
        if content_type:
            query["content_type"] = content_type
            
        # Get slugs of top reviews
        reviews = await db.reviews.find(query).sort("overall_rating", -1).limit(limit).to_list(length=limit)
        slugs = [r["slug"] for r in reviews]
        
        # PERSIST the slugs to the "items" field so even old backends see them
        await db.categories.update_one(
            {"_id": cat["_id"]},
            {"$set": {"items": slugs}}
        )
        print(f"  -> Synced {len(slugs)} items.")

    # Fix typo "Chiils" to "Chills" while we are at it
    res = await db.categories.update_one(
        {"title": "Thriller Chiils"},
        {"$set": {"title": "Thriller Chills"}}
    )
    if res.modified_count > 0:
        print("Fixed typo: 'Thriller Chiils' -> 'Thriller Chills'")

if __name__ == "__main__":
    asyncio.run(migrate())
