from motor.motor_asyncio import AsyncIOMotorClient
import asyncio
import certifi

async def set_must_watch():
    # Credentials from .env
    mongodb_url = "mongodb+srv://shashankdommeti524_db_user:x3pYEvwR8kAcBYlQ@review-1.jyyeusn.mongodb.net/"
    database_name = "review"
    
    ca = certifi.where()
    client = AsyncIOMotorClient(mongodb_url, tls=True, tlsCAFile=ca)
    db = client[database_name]
    
    # Update the most recent published review to be must_watch
    doc = await db.reviews.find_one_and_update(
        {"status": "published"},
        {"$set": {"is_must_watch": True}},
        sort=[("created_at", -1)],
        return_document=True
    )
    
    if doc:
        print(f"Successfully flagged review '{doc.get('movie_title')}' as Must Watch")
    else:
        print("No published reviews found to flag")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(set_must_watch())
