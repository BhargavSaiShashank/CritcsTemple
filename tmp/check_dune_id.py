from motor.motor_asyncio import AsyncIOMotorClient
import asyncio
import certifi

async def check_dune():
    mongodb_url = "mongodb+srv://shashankdommeti524_db_user:x3pYEvwR8kAcBYlQ@review-1.jyyeusn.mongodb.net/"
    database_name = "review"
    ca = certifi.where()
    client = AsyncIOMotorClient(mongodb_url, tls=True, tlsCAFile=ca)
    db = client[database_name]
    
    doc = await db.reviews.find_one({"slug": "dune-part-one"})
    if doc:
        print(f"Dune doc: {doc}")
        # Check if any ratings exist for this ID or others
        rating = await db.ratings.find_one({"movie_id": doc.get('movie_id')})
        print(f"Rating for {doc.get('movie_id')}: {rating}")
        
    client.close()

if __name__ == "__main__":
    asyncio.run(check_dune())
