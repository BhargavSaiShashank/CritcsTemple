import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def main():
    mongodb_url = "mongodb+srv://shashankdommeti524_db_user:x3pYEvwR8kAcBYlQ@review-1.jyyeusn.mongodb.net/"
    client = AsyncIOMotorClient(mongodb_url)
    db = client.review
    
    pipeline = [
        {"$match": {"status": "published"}},
        {"$group": {"_id": "$language", "count": {"$sum": 1}}}
    ]
    results = await db.reviews.aggregate(pipeline).to_list(100)
    print("Published Reviews by Language:")
    for res in results:
        print(f"Language: {res['_id']} | Count: {res['count']}")
        
    client.close()

if __name__ == "__main__":
    asyncio.run(main())
