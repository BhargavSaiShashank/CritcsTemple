from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
from datetime import datetime
from app.models.review import Verdict

class UserProfile(BaseModel):
    firebase_uid: str
    display_name: Optional[str] = None
    email: Optional[str] = None
    level: int = 1
    correct_predictions: int = 0
    badges: List[str] = []
    created_at: datetime = Field(default_factory=datetime.utcnow)

class UserProfileInDB(UserProfile):
    id: Optional[str] = Field(None, alias="_id")
    
    model_config = ConfigDict(populate_by_name=True)

class UpcomingMovieBase(BaseModel):
    title: str
    poster_url: Optional[str] = None
    release_date: Optional[datetime] = None
    status: str = "open" # "open", "resolved"
    actual_verdict: Optional[Verdict] = None

class UpcomingMovieCreate(UpcomingMovieBase):
    pass

class UpcomingMovieInDB(UpcomingMovieBase):
    id: Optional[str] = Field(None, alias="_id")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    resolved_at: Optional[datetime] = None
    
    model_config = ConfigDict(populate_by_name=True)

class PredictionBase(BaseModel):
    user_uid: str
    upcoming_movie_id: str
    predicted_verdict: Verdict
    status: str = "pending" # "pending", "correct", "incorrect"

class PredictionCreate(BaseModel):
    upcoming_movie_id: str
    predicted_verdict: Verdict

class PredictionInDB(PredictionBase):
    id: Optional[str] = Field(None, alias="_id")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    resolved_at: Optional[datetime] = None
    
    model_config = ConfigDict(populate_by_name=True)
