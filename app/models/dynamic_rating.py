from pydantic import BaseModel, Field, ConfigDict, BeforeValidator
from typing import List, Optional, Dict, Any, Annotated
from datetime import datetime

PyObjectId = Annotated[str, BeforeValidator(str)]

class RatingPhase(BaseModel):
    score: float = Field(..., ge=0, le=10)
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    metadata: Optional[Dict[str, Any]] = None

class DynamicRatingBase(BaseModel):
    movie_id: PyObjectId  # TMDB ID or IMDB ID
    user_id: Optional[str] = "default_user"  # Or reference to User model
    phases: Dict[str, RatingPhase] = {}  # Keys: initial, reflection, rewatch
    
    # Computed metrics
    drift: float = 0.0
    volatility: float = 0.0
    consistency_index: float = 1.0

class DynamicRatingCreate(BaseModel):
    movie_id: PyObjectId
    phase_name: str  # initial, reflection, rewatch
    score: float = Field(..., ge=0, le=10)
    metadata: Optional[Dict[str, Any]] = None

class DynamicRatingInDB(DynamicRatingBase):
    id: Optional[PyObjectId] = Field(None, alias="_id")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    model_config = ConfigDict(populate_by_name=True)
