import asyncio
import ssl
import certifi
from motor.motor_asyncio import AsyncIOMotorClient

async def test_direct():
    # Direct connection string to one shard
    # Format: mongodb://user:pass@host:27017/db?authSource=admin&replicaSet=...
    # Based on the SRV, the username is shashankdommeti524_db_user
    # Password RXIykmGS9BoSTK9U
    # Shard host: ac-mjttkat-shard-00-00.jrtglai.mongodb.net:27017
    
    user = "shashankdommeti524_db_user"
    pw = "RXIykmGS9BoSTK9U"
    host = "ac-mjttkat-shard-00-00.jrtglai.mongodb.net"
    db_name = "review"
    
    uri = f"mongodb://{user}:{pw}@{host}:27017/{db_name}?authSource=admin&tls=true"
    
    print(f"Testing DIRECT connection to: {host}")
    
    try:
        client = AsyncIOMotorClient(
            uri,
            tlsCAFile=certifi.where(),
            serverSelectionTimeoutMS=5000
        )
        print("Pinging shard...")
        await client.admin.command('ping')
        print("SUCCESS: Direct path works!")
    except Exception as e:
        print(f"FAILED: Direct path failed. Error: {e}")

if __name__ == "__main__":
    asyncio.run(test_direct())
