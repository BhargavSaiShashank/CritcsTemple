import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def convert():
    mongodb_url = "mongodb+srv://shashankdommeti524_db_user:x3pYEvwR8kAcBYlQ@review-1.jyyeusn.mongodb.net/"
    client = AsyncIOMotorClient(mongodb_url)
    db = client.review

    print("--- Converting Categories to Dynamic ---")
    
    # 1. Top 20 Rated International
    await db.categories.update_one(
        {"title": "Top 20 Rated International"},
        {
            "$set": {
                "type": "dynamic",
                "dynamic_criteria": {
                    "language": "en",
                    "limit": 20
                }
            }
        }
    )
    print("Converted: Top 20 Rated International (Language: en)")

    # 2. Top 20 Rated Indian
    await db.categories.update_one(
        {"title": "Top 20 Rated Indian"},
        {
            "$set": {
                "type": "dynamic",
                "dynamic_criteria": {
                    "language": {"$in": ["hi", "te", "ml", "ta"]},
                    "limit": 20
                }
            }
        }
    )
    print("Converted: Top 20 Rated Indian (Languages: hi, te, ml, ta)")
    
    # Verify
    cursor = db.categories.find({"type": "dynamic"})
    async for cat in cursor:
        print(f"Dynamic Category: {cat['title']} | Criteria: {cat['dynamic_criteria']}")
        
    client.close()
    print("--- Conversion Complete ---")

if __name__ == "__main__":
    asyncio.run(convert())
