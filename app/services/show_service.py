from motor.motor_asyncio import AsyncIOMotorDatabase
from app.services.tmdb import tmdb_service
from app.models.show import ShowCreate
from fastapi import HTTPException
import traceback

class ShowService:
    async def fetch_and_save_show(self, db: AsyncIOMotorDatabase, tmdb_id: str) -> ShowCreate:
        """
        Fetches TV show details from TMDb and saves to local database if not present.
        """
        if db is None:
            raise HTTPException(status_code=503, detail="Database Offline")
            
        try:
            print(f"ShowService: Fetching details for ID: {tmdb_id}")
            show_data = await tmdb_service.fetch_show_details(tmdb_id)
            print(f"ShowService: Successfully fetched details for: {show_data.title}")
            
            existing = await db.shows.find_one({"tmdb_id": int(tmdb_id)})
            if existing:
                # Filter expected fields
                expected_fields = ShowCreate.model_fields.keys() if hasattr(ShowCreate, "model_fields") else ShowCreate.__fields__.keys()
                filtered_existing: dict = {k: v for k, v in existing.items() if k in expected_fields}
                
                # Ensure core fields
                if "tmdb_id" not in filtered_existing: filtered_existing["tmdb_id"] = show_data.tmdb_id
                if "title" not in filtered_existing: filtered_existing["title"] = show_data.title
                
                return ShowCreate(**filtered_existing)

            # Save to DB
            print(f"ShowService: Saving {show_data.title} to database...")
            if hasattr(show_data, "model_dump"):
                show_dict = show_data.model_dump(mode='json')
            else:
                import json
                show_dict = json.loads(show_data.json())
                
            await db.shows.insert_one(show_dict)
            print(f"ShowService: Finished saving {show_data.title}")
            return show_data

        except HTTPException as he:
            raise he
        except Exception as e:
            traceback.print_exc()
            raise HTTPException(status_code=500, detail=f"Show Service Error: {str(e)}")

show_service = ShowService()
