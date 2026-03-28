import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def main():
    mongodb_url = "mongodb+srv://shashankdommeti524_db_user:x3pYEvwR8kAcBYlQ@review-1.jyyeusn.mongodb.net/"
    client = AsyncIOMotorClient(mongodb_url)
    db = client.review
    await db.categories.update_one({'title': 'Top 20 Rated International'}, {'$set': {'dynamic_criteria.language': 'en'}})
    await db.categories.update_one({'title': 'Top 20 Rated Indian'}, {'$set': {'dynamic_criteria.language': 'indian'}})
    print('Migrated categories to use new lang filter strings')
    client.close()

if __name__ == "__main__":
    asyncio.run(main())
