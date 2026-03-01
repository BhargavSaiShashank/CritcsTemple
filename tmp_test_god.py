import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import certifi

async def test_god_search():
    try:
        uri = "mongodb+srv://shashankdommeti524_db_user:x3pYEvwR8kAcBYlQ@review-1.jyyeusn.mongodb.net/"
        client = AsyncIOMotorClient(uri, tlsCAFile=certifi.where())
        db = client.review
        
        search_term = "god"
        query = {
            "$or": [
                {"movie_title": {"$regex": search_term, "$options": "i"}},
                {"verdict": {"$regex": search_term, "$options": "i"}},
                {"tags": {"$regex": search_term, "$options": "i"}}
            ]
        }
        
        print(f"Searching for: '{search_term}'")
        count = await db.reviews.count_documents(query)
        print(f"Results count: {count}")
        
        async for doc in db.reviews.find(query):
            print(f"Found: {doc.get('movie_title')} (Status: {doc.get('status')})")

    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    asyncio.run(test_god_search())
