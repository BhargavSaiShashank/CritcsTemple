from motor.motor_asyncio import AsyncIOMotorClient
import asyncio
import certifi

async def check_langs():
    uri = "mongodb+srv://shashankdommeti524_db_user:x3pYEvwR8kAcBYlQ@review-1.jyyeusn.mongodb.net/"
    client = AsyncIOMotorClient(uri, tlsCAFile=certifi.where())
    db = client["review"]
    
    # Get distinct languages
    langs = await db.reviews.distinct("language", {"status": "published"})
    print(f"Linguistic DNA values: {langs}")

    # Counts by language
    for l in langs:
        count = await db.reviews.count_documents({"status": "published", "language": l})
        print(f"Language '{l}': {count} reviews")

if __name__ == "__main__":
    asyncio.run(check_langs())
