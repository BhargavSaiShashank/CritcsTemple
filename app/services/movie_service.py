from motor.motor_asyncio import AsyncIOMotorDatabase
from app.services.omdb import omdb_service
from app.models.movie import MovieCreate
from fastapi import HTTPException
import traceback

class MovieService:
    async def fetch_and_save_movie(self, db: AsyncIOMotorDatabase, search_term: str) -> MovieCreate:
        """
        Fetches movie details from OMDb and saves to local database if not present.
        """
        if db is None:
            raise HTTPException(status_code=503, detail="Database Offline")
            
        try:
            movie_data = await omdb_service.fetch_movie_details(search_term)
            
            existing = await db.movies.find_one({"imdb_id": movie_data.imdb_id})
            if existing:
                # Proactive Poster Recovery
                current_poster = existing.get("poster_url")
                if not current_poster or "unsplash.com" in current_poster or "N/A" in current_poster:
                    await db.movies.update_one(
                        {"imdb_id": movie_data.imdb_id},
                        {"$set": {"poster_url": movie_data.poster_url}}
                    )
                    existing["poster_url"] = movie_data.poster_url

                # Filter expected fields
                expected_fields = MovieCreate.model_fields.keys() if hasattr(MovieCreate, "model_fields") else MovieCreate.__fields__.keys()
                filtered_existing = {k: v for k, v in existing.items() if k in expected_fields}
                
                # Ensure core fields
                if "imdb_id" not in filtered_existing: filtered_existing["imdb_id"] = movie_data.imdb_id
                if "title" not in filtered_existing: filtered_existing["title"] = movie_data.title
                
                return MovieCreate(**filtered_existing)

            # Save to DB
            movie_dict = movie_data.model_dump() if hasattr(movie_data, "model_dump") else movie_data.dict()
            await db.movies.insert_one(movie_dict)
            return movie_data

        except HTTPException as he:
            raise he
        except Exception as e:
            traceback.print_exc()
            raise HTTPException(status_code=500, detail=f"Movie Service Error: {str(e)}")

movie_service = MovieService()
