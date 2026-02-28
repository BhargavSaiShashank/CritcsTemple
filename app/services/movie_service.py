from motor.motor_asyncio import AsyncIOMotorDatabase
from app.services.tmdb import tmdb_service
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
            print(f"MovieService: Fetching details for term: {search_term}")
            movie_data = await tmdb_service.fetch_movie_details(search_term)
            print(f"MovieService: Successfully fetched details for: {movie_data.title}")
            
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
                filtered_existing: dict = {k: v for k, v in existing.items() if k in expected_fields}
                
                # Ensure core fields
                if "imdb_id" not in filtered_existing: filtered_existing["imdb_id"] = movie_data.imdb_id
                if "title" not in filtered_existing: filtered_existing["title"] = movie_data.title
                
                return MovieCreate(**filtered_existing)

            # Save to DB
            print(f"MovieService: Saving {movie_data.title} to database...")
            # Use mode='json' in Pydantic v2 to ensure no special objects (like datetime or models) remain
            if hasattr(movie_data, "model_dump"):
                movie_dict = movie_data.model_dump(mode='json')
            else:
                import json
                movie_dict = json.loads(movie_data.json())
                
            await db.movies.insert_one(movie_dict)
            print(f"MovieService: Finished saving {movie_data.title}")
            return movie_data

        except HTTPException as he:
            raise he
        except Exception as e:
            traceback.print_exc()
            raise HTTPException(status_code=500, detail=f"Movie Service Error: {str(e)}")

movie_service = MovieService()
