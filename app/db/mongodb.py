from motor.motor_asyncio import AsyncIOMotorClient
import certifi
import ssl
from app.core.config import get_settings

settings = get_settings()

class Database:
    client: AsyncIOMotorClient = None
    db = None

db = Database()

async def connect_to_mongo():
    try:
        print(f"Connecting to MongoDB: {settings.DATABASE_NAME}...")
        ca = certifi.where()
        
        # Explicitly configure SSL context for maximum compatibility
        ssl_ctx = ssl.create_default_context(cafile=ca)
        ssl_ctx.minimum_version = ssl.TLSVersion.TLSv1_2
        
        db.client = AsyncIOMotorClient(
            settings.MONGODB_URL, 
            tls=True,
            tlsCAFile=ca,
            connect=False, # Prevent blocking startup
            serverSelectionTimeoutMS=10000,
            tlsAllowInvalidCertificates=False
        )
        
        # Verify the connection with a quick command
        await db.client.admin.command('ismaster')
        db.db = db.client[settings.DATABASE_NAME]
        print(f"Connected to MongoDB Atlas: {settings.DATABASE_NAME}")
    except Exception as e:
        print(f"Standard MongoDB connection failed: {e}")
        # Try fallback for restricted environments
        try:
            print("Attempting fallback connection...")
            db.client = AsyncIOMotorClient(
                settings.MONGODB_URL,
                tlsAllowInvalidCertificates=True,
                serverSelectionTimeoutMS=10000,
                connect=False
            )
            await db.client.admin.command('ismaster')
            db.db = db.client[settings.DATABASE_NAME]
            print("Connected to MongoDB Atlas (Fallback - Insecure TLS)")
        except Exception as e2:
             print(f"All MongoDB connection attempts failed: {e2}")
             db.db = None

async def close_mongo_connection():
    db.client.close()
    print("Closed MongoDB connection")

def get_database():
    return db.db
