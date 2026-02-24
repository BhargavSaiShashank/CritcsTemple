from motor.motor_asyncio import AsyncIOMotorClient
from app.core.config import get_settings

settings = get_settings()

class Database:
    client: AsyncIOMotorClient = None
    db = None

db = Database()

async def connect_to_mongo():
    try:
        import certifi
        db.client = AsyncIOMotorClient(
            settings.MONGODB_URL, 
            tlsCAFile=certifi.where() if "certifi" in globals() or "certifi" in locals() else None,
            tlsAllowInvalidCertificates=True,
            serverSelectionTimeoutMS=5000
        )
        # Verify the connection with a quick command
        await db.client.admin.command('ismaster')
        db.db = db.client[settings.DATABASE_NAME]
        print("Connected to MongoDB Atlas (Validated)")
    except Exception as e:
        print(f"CRITICAL: Failed to connect to MongoDB: {e}")
        # Try fallback without certifi
        try:
            db.client = AsyncIOMotorClient(
                settings.MONGODB_URL,
                tlsAllowInvalidCertificates=True,
                serverSelectionTimeoutMS=5000
            )
            await db.client.admin.command('ismaster')
            db.db = db.client[settings.DATABASE_NAME]
            print("Connected to MongoDB Atlas (Fallback - No Certifi)")
        except Exception as e2:
             print(f"CRITICAL: Fallback connection also failed: {e2}")
             db.db = None

async def close_mongo_connection():
    db.client.close()
    print("Closed MongoDB connection")

def get_database():
    return db.db
