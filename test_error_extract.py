import asyncio
import ssl
import certifi
import pymongo
from motor.motor_asyncio import AsyncIOMotorClient

async def test_error_extract():
    user = "shashankdommeti524_db_user"
    pw = "RXIykmGS9BoSTK9U"
    host = "ac-mjttkat-shard-00-00.jrtglai.mongodb.net"
    db_name = "review"
    
    uri = f"mongodb://{user}:{pw}@{host}:27017/{db_name}?authSource=admin&tls=true&directConnection=true"
    
    print(f"Investigating error for: {host}")
    
    client = AsyncIOMotorClient(
        uri,
        tlsCAFile=certifi.where(),
        serverSelectionTimeoutMS=5000
    )
    
    try:
        await client.admin.command('ping')
    except Exception as e:
        print(f"Caught top-level error: {e}")
        
        # Dig into the topology
        topology = client.delegate._topology
        for server in topology.description.servers.values():
            print(f"\n--- Server: {server.address} ---")
            print(f"Type: {server.server_type_name}")
            if server.error:
                print(f"Detailed Error: {server.error}")
                print(f"Error Type: {type(server.error)}")
            else:
                print("No error found on this server object (yet).")

if __name__ == "__main__":
    asyncio.run(test_error_extract())
