import asyncio
import os
import sys

# Add project root to sys.path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.db.mongodb import connect_to_mongo, close_mongo_connection, get_database

async def audit_ratings():
    await connect_to_mongo()
    db = get_database()
    
    cursor = db.reviews.find({})
    print("| Title | overall_rating | rating_temple |")
    print("| :--- | :--- | :--- |")
    
    async for r in cursor:
        title = r.get('movie_title')
        ov_rating = r.get('overall_rating')
        if isinstance(ov_rating, dict):
            ov_rating = ov_rating.get('score')
        rt_rating = r.get('rating_temple')
        print(f"| {title} | {ov_rating} | {rt_rating} |")

    await close_mongo_connection()

if __name__ == "__main__":
    asyncio.run(audit_ratings())
