from motor.motor_asyncio import AsyncIOMotorClient
import asyncio
import certifi

async def insert_mock_timeline():
    mongodb_url = "mongodb+srv://shashankdommeti524_db_user:x3pYEvwR8kAcBYlQ@review-1.jyyeusn.mongodb.net/"
    database_name = "review"
    ca = certifi.where()
    client = AsyncIOMotorClient(mongodb_url, tls=True, tlsCAFile=ca)
    db = client[database_name]
    
    rating_data = {
        "movie_id": 0,
        "current_rating": 8.6,
        "timeline": [
            {"date": "2021-10-22", "rating": 8.0, "event": "Initial Release"},
            {"date": "2021-11-05", "rating": 8.2, "event": "Critical Acclaim"},
            {"date": "2022-03-27", "rating": 8.6, "event": "Oscar Win"}
        ]
    }
    
    await db.ratings.update_one(
        {"movie_id": 0},
        {"$set": rating_data},
        upsert=True
    )
    print("Inserted mock timeline for movie_id: 0")
        
    client.close()

if __name__ == "__main__":
    asyncio.run(insert_mock_timeline())
