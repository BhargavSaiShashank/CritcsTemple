import asyncio
import os
import certifi
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

async def check_data_types():
    load_dotenv()
    mongodb_url = os.getenv("MONGODB_URL")
    database_name = os.getenv("DATABASE_NAME", "review")
    
    ca = certifi.where()
    client = AsyncIOMotorClient(mongodb_url, tls=True, tlsCAFile=ca)
    db = client[database_name]
    
    try:
        print("Checking first document...")
        doc = await db.reviews.find_one()
        if not doc:
            print("No documents found.")
            return
            
        fields_to_check = ["movie_title", "verdict", "summary", "content", "tags"]
        for field in fields_to_check:
            val = doc.get(field)
            print(f"Field '{field}': type={type(val)}, value={val}")
            
    except Exception as e:
        print(f"Error checking data types: {e}")
    finally:
        client.close()

if __name__ == "__main__":
    asyncio.run(check_data_types())
