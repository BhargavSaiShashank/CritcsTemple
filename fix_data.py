import asyncio
from app.db.mongodb import connect_to_mongo, close_mongo_connection, get_database
from app.models.review import ReviewInDB, Verdict
from app.services.review_service import review_service

async def fix_verdicts():
    await connect_to_mongo()
    db = get_database()
    
    cursor = db.reviews.find({})
    reviews = await cursor.to_list(length=None)
    
    for r in reviews:
        doc = review_service.serialize_doc(r)
        
        # Check verdict
        verdict = doc.get("verdict")
        valid_verdicts = [v.value for v in Verdict]
        
        needs_update = False
        new_verdict = verdict
        
        if verdict not in valid_verdicts and verdict is not None:
            print(f"Bad verdict found: '{verdict}' for review {doc.get('_id')} - {doc.get('movie_title')}")
            # Try to map common issues
            if verdict == "" or verdict == "null":
                new_verdict = None
                needs_update = True
            elif isinstance(verdict, str):
                # Capitalize nicely
                cap_verdict = verdict.strip().capitalize()
                if cap_verdict in valid_verdicts:
                    new_verdict = cap_verdict
                    needs_update = True
                else:
                    print(f"Unmappable verdict: '{verdict}'")
                    # Set to something neutral or handle it
                    
        if needs_update:
            print(f"Updating {doc.get('_id')} verdict from '{verdict}' to '{new_verdict}'")
            from bson import ObjectId
            await db.reviews.update_one({"_id": ObjectId(doc["_id"])}, {"$set": {"verdict": new_verdict}})
            
    await close_mongo_connection()
    print("Done")

if __name__ == "__main__":
    asyncio.run(fix_verdicts())
