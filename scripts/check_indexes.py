import asyncio
import os
import certifi
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

async def check_indexes():
    load_dotenv()
    mongodb_url = os.getenv("MONGODB_URL")
    database_name = os.getenv("DATABASE_NAME", "review")
    
    if not mongodb_url:
        print("Error: MONGODB_URL not found.")
        return

    ca = certifi.where()
    client = AsyncIOMotorClient(mongodb_url, tls=True, tlsCAFile=ca)
    db = client[database_name]
    
    try:
        print(f"Checking indexes for collection 'reviews' in '{database_name}'...")
        async for index in db.reviews.list_indexes():
            print(f"Index: {index}")
    except Exception as e:
        print(f"Error checking indexes: {e}")
    finally:
        client.close()

if __name__ == "__main__":
    asyncio.run(check_indexes())
