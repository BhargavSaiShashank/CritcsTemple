from motor.motor_asyncio import AsyncIOMotorClient
import asyncio
import certifi

async def check_status():
    uri = "mongodb+srv://shashankdommeti524_db_user:x3pYEvwR8kAcBYlQ@review-1.jyyeusn.mongodb.net/"
    client = AsyncIOMotorClient(uri, tlsCAFile=certifi.where())
    db = client["review"]
    
    # Get distinct statuses
    statuses = await db.reviews.distinct("status")
    print(f"Workflow Statuses: {statuses}")

    # Counts by status
    for s in statuses:
        count = await db.reviews.count_documents({"status": s})
        print(f"Status '{s}': {count} reviews")

if __name__ == "__main__":
    asyncio.run(check_status())
