from motor.motor_asyncio import AsyncIOMotorClient
import asyncio
import certifi
import json

async def test_query():
    uri = "mongodb+srv://shashankdommeti524_db_user:x3pYEvwR8kAcBYlQ@review-1.jyyeusn.mongodb.net/"
    client = AsyncIOMotorClient(uri, tlsCAFile=certifi.where())
    db = client["review"]
    
    # Simulate CategoryService logic for "Top 20 Rated International"
    query = {"status": "published"}
    query["language"] = {"$nin": ["hi", "te", "ml", "ta"]}
    
    count = await db.reviews.count_documents(query)
    print(f"Query for International: {json.dumps(query, default=str)}")
    print(f"Results count: {count}")
    
    # Check if there are any other filters applied in CategoryService?
    # No.
    
    # Wait, what if I search for EXPLICIT "en"?
    count_en = await db.reviews.count_documents({"status": "published", "language": "en"})
    print(f"Count for language='en': {count_en}")

    # Check "Thriller Chiils" - tags ["Thriller"]
    count_thriller = await db.reviews.count_documents({"status": "published", "tags": {"$in": ["Thriller"]}})
    print(f"Count for tags=['Thriller']: {count_thriller}")

if __name__ == "__main__":
    asyncio.run(test_query())
