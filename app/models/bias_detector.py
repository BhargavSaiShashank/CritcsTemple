from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Dict, Any
from datetime import datetime

class CategoryBias(BaseModel):
    category: str
    average_rating: float
    deviation_score: float  # (category_avg - user_avg)
    count: int

class UserBiasBase(BaseModel):
    user_id: str = "default_user"
    overall_average: float = 0.0
    
    # Bias scores
    genre_bias: List[CategoryBias] = []
    director_bias: List[CategoryBias] = []
    actor_bias: List[CategoryBias] = []
    
    repetition_bias_score: float = 0.0
    hype_bias_score: float = 0.0
    
    last_updated: datetime = Field(default_factory=datetime.utcnow)

class Insight(BaseModel):
    type: str  # genre, hype, volatility
    message: str
    intensity: float  # 0 to 1 scale

class UserBiasInDB(UserBiasBase):
    id: Optional[str] = Field(None, alias="_id")
    insights: List[Insight] = []

    model_config = ConfigDict(populate_by_name=True)
