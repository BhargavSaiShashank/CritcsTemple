import asyncio
import os
import sys

# Add project root to sys.path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.db.mongodb import connect_to_mongo, close_mongo_connection, get_database

async def check_bias_doc():
    await connect_to_mongo()
    db = get_database()
    doc = await db.user_bias.find_one({"user_id": "default_user"})
    if doc:
        print(f"DATABASE_BIAS_VALUE: {doc.get('overall_average')}")
    else:
        print("DATABASE_BIAS_VALUE: NOT_FOUND")
    await close_mongo_connection()

if __name__ == "__main__":
    asyncio.run(check_bias_doc())
