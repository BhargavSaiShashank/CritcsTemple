import asyncio
import os
import sys

# Add project root to sys.path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.db.mongodb import connect_to_mongo, close_mongo_connection, get_database

async def hotpatch_bias():
    await connect_to_mongo()
    db = get_database()
    # Forces the value to 8.12 for all users (or just default_user)
    result = await db.user_bias.update_many(
        {}, 
        {"$set": {"overall_average": 8.12}}
    )
    print(f"HOTPATCH_SUCCESS: Updated {result.modified_count} bias profiles to 8.12")
    await close_mongo_connection()

if __name__ == "__main__":
    asyncio.run(hotpatch_bias())
