import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from app.services.category_service import category_service

async def verify():
    mongodb_url = "mongodb+srv://shashankdommeti524_db_user:x3pYEvwR8kAcBYlQ@review-1.jyyeusn.mongodb.net/"
    client = AsyncIOMotorClient(mongodb_url)
    db = client.review

    print("--- Fetching Populated Categories ---")
    results = await category_service.get_populated_categories(db)
    
    for cat in results:
        if cat.get("type") == "dynamic":
            print(f"Dynamic Category: {cat['title']}")
            print(f"Items Count: {len(cat['items'])}")
            for i, item in enumerate(cat['items'][:3]): # show top 3
                print(f"  {i+1}. {item.get('movie_title')} | Rating: {item.get('overall_rating')} | Lang: {item.get('language')}")
            print("-" * 30)

    client.close()

if __name__ == "__main__":
    asyncio.run(verify())
