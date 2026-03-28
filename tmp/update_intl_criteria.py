import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def main():
    mongodb_url = "mongodb+srv://shashankdommeti524_db_user:x3pYEvwR8kAcBYlQ@review-1.jyyeusn.mongodb.net/"
    client = AsyncIOMotorClient(mongodb_url)
    db = client.review
    await db.categories.update_one(
        {'title': 'Top 20 Rated International'}, 
        {'$set': {'dynamic_criteria.language': {'$nin': ['hi', 'te', 'ml', 'ta']}}}
    )
    print('International criteria updated to NIN Indian langs')
    client.close()

if __name__ == "__main__":
    asyncio.run(main())
