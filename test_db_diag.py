import asyncio
import os
import certifi
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

async def test_conn():
    load_dotenv()
    url = os.getenv("MONGODB_URL")
    db_name = os.getenv("DATABASE_NAME")
    
    print(f"Testing connection to: {url}")
    print(f"Using certifi: {certifi.where()}")
    
    try:
        client = AsyncIOMotorClient(
            url, 
            tlsCAFile=certifi.where(),
            serverSelectionTimeoutMS=5000
        )
        print("Pinging...")
        await client.admin.command('ping')
        print("Done Ping successful!")
        
        db = client[db_name]
        print(f"Listing collections in {db_name}...")
        cols = await db.list_collection_names()
        print(f"Done Collections: {cols}")
        
    except Exception as e:
        print(f"Error Connection failed: {e}")
        
    try:
        print("Attempting fallback (insecure)...")
        client = AsyncIOMotorClient(
            url,
            tlsAllowInvalidCertificates=True,
            serverSelectionTimeoutMS=5000
        )
        await client.admin.command('ping')
        print("Done Fallback Ping successful!")
    except Exception as e:
        print(f"Error Fallback failed: {e}")

if __name__ == "__main__":
    asyncio.run(test_conn())
