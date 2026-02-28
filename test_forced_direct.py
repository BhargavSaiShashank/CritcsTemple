import asyncio
import certifi
from motor.motor_asyncio import AsyncIOMotorClient

async def test_forced_direct():
    user = "shashankdommeti524_db_user"
    pw = "RXIykmGS9BoSTK9U"
    host = "ac-mjttkat-shard-00-00.jrtglai.mongodb.net"
    db_name = "review"
    
    # Adding directConnection=true is the key here
    uri = f"mongodb://{user}:{pw}@{host}:27017/{db_name}?authSource=admin&tls=true&directConnection=true"
    
    print(f"Testing FORCED DIRECT connection to: {host}")
    
    try:
        client = AsyncIOMotorClient(
            uri,
            tlsCAFile=certifi.where(),
            serverSelectionTimeoutMS=10000 # Increased timeout
        )
        print("Pinging shard directly...")
        await client.admin.command('ping')
        print("SUCCESS: Forced direct path works!")
        
        db = client[db_name]
        print(f"Collections: {await db.list_collection_names()}")
        
    except Exception as e:
        print(f"FAILED: Forced direct path failed. Error: {e}")

if __name__ == "__main__":
    asyncio.run(test_forced_direct())
