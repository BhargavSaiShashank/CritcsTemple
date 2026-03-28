import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def main():
    mongodb_url = "mongodb+srv://shashankdommeti524_db_user:x3pYEvwR8kAcBYlQ@review-1.jyyeusn.mongodb.net/"
    client = AsyncIOMotorClient(mongodb_url)
    db = client.review
    langs = await db.reviews.distinct('language')
    tags = await db.reviews.distinct('tags')
    print("Languages:", langs)
    print("Tags:", tags)
    client.close()

if __name__ == "__main__":
    asyncio.run(main())
