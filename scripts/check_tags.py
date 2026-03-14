import asyncio
import os
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

async def check_data():
    load_dotenv()
    mongodb_url = os.getenv("MONGODB_URL")
    db_name = os.getenv("DATABASE_NAME", "review")
    
    client = AsyncIOMotorClient(mongodb_url)
    db = client[db_name]
    
    print(f"Checking database: {db_name}")
    
    languages = ['English', 'Telugu', 'Hindi', 'Tamil', 'Malayalam', 'Kannada', 'Spanish', 'Korean', 'Japanese']
    print("\nLanguage Check (via Tags):")
    for lang in languages:
        count = await db.reviews.count_documents({"tags": {"$regex": f"^{lang}$", "$options": "i"}})
        print(f"- {lang}: {count}")
    
    # Check if any review has language field
    lang_field_count = await db.reviews.count_documents({"language": {"$exists": True}})
    print(f"\nReviews with explicit 'language' field: {lang_field_count}")
    
    if lang_field_count > 0:
        lang_values = await db.reviews.distinct("language")
        print("Language values found:", lang_values)

    client.close()

if __name__ == "__main__":
    asyncio.run(check_data())
