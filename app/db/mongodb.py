from motor.motor_asyncio import AsyncIOMotorClient
import certifi
import ssl
from app.core.config import get_settings
import pymongo

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
             
        if db.db is not None:
            await ensure_indexes(db.db)

async def ensure_indexes(database):
    """Ensures that all necessary database indexes exist."""
    try:
        print("Ensuring database indexes...")
        # Text index for search functionality
        await database.reviews.create_index([
            ("movie_title", pymongo.TEXT),
            ("verdict", pymongo.TEXT),
            ("summary", pymongo.TEXT),
            ("content", pymongo.TEXT),
            ("tags", pymongo.TEXT)
        ], name="review_search_text_index")
        
        # Performance indexes for sorting and filtering
        await database.reviews.create_index([("published_at", pymongo.DESCENDING)])
        await database.reviews.create_index([("overall_rating", pymongo.DESCENDING)])
        await database.reviews.create_index([("oscar_rank", pymongo.ASCENDING)])
        await database.reviews.create_index([("slug", pymongo.ASCENDING)], unique=True)
        
        print("Database indexes ensured successfully.")
    except Exception as e:
        print(f"Failed to ensure indexes: {e}")

async def close_mongo_connection():
    db.client.close()
    print("Closed MongoDB connection")

def get_database():
    return db.db
