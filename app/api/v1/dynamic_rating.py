from fastapi import APIRouter, HTTPException, Depends
from typing import Any, Optional
from app.models.dynamic_rating import DynamicRatingCreate, DynamicRatingInDB
from app.services.rating_service import RatingService

router = APIRouter()

@router.post("", response_model=DynamicRatingInDB)
async def update_movie_rating(rating_data: DynamicRatingCreate):
    try:
        return await RatingService.update_rating(
            movie_id=rating_data.movie_id,
            phase_name=rating_data.phase_name,
            score=rating_data.score,
            metadata=rating_data.metadata
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{movie_id}/timeline", response_model=DynamicRatingInDB)
async def get_rating_timeline(movie_id: str):
    rating = await RatingService.get_rating_timeline(movie_id)
    if not rating:
        raise HTTPException(status_code=404, detail="Rating timeline not found")
    return DynamicRatingInDB(**rating)

@router.delete("/{movie_id}")
async def reset_rating_timeline(movie_id: str):
    await RatingService.reset_rating(movie_id)
    return {"message": "Rating timeline reset successfully"}
