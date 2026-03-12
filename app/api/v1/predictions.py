from fastapi import APIRouter, Depends, HTTPException, Body
from typing import List, Optional
from app.db.mongodb import get_database
from app.core.auth import get_current_user
from app.models.prediction import PredictionCreate, PredictionInDB, UpcomingMovieInDB, UserProfile
from app.services.prediction_service import prediction_service

router = APIRouter()

@router.get("/me", response_model=UserProfile)
async def get_my_profile(
    user = Depends(get_current_user),
    db = Depends(get_database)
):
    # Ensure user exists in our DB, or create them
    uid = user.get("uid")
    email = user.get("email")
    name = user.get("name")
    return await prediction_service.get_or_create_user(db, uid, email, name)

@router.get("/upcoming", response_model=List[UpcomingMovieInDB])
async def list_open_movies(db = Depends(get_database)):
    # Optionally, we might want this to be public, or require auth. 
    # For now, let's keep it public so people can see what to predict on.
    return await prediction_service.list_open_movies(db)

@router.post("/", response_model=PredictionInDB)
async def make_prediction(
    prediction: PredictionCreate,
    user = Depends(get_current_user),
    db = Depends(get_database)
):
    uid = user.get("uid")
    return await prediction_service.make_prediction(db, uid, prediction)

@router.get("/my-predictions", response_model=List[PredictionInDB])
async def get_my_predictions(
    user = Depends(get_current_user),
    db = Depends(get_database)
):
    uid = user.get("uid")
    return await prediction_service.get_user_predictions(db, uid)
