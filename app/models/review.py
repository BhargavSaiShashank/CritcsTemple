from pydantic import BaseModel, Field, validator
from typing import List, Optional, Dict
from datetime import datetime
from enum import Enum

class Verdict(str, Enum):
    LEGENDARY = "Legendary"
    MASTERPIECE = "Masterpiece"
    ESSENTIAL = "Essential"
    ELITE = "Elite"
    GREAT = "Great"
    GOOD = "Good"
    DECENT = "Decent"
    AVERAGE = "Average"
    MEDIOCRE = "Mediocre"
    POOR = "Poor"
    BAD = "Bad"
    TERRIBLE = "Terrible"
    DISASTER = "Disaster"
    ABOMINATION = "Abomination"
    UNWATCHABLE = "Unwatchable"

class AspectRating(BaseModel):
    score: float = Field(..., ge=0, le=10)
    comment: Optional[str] = None

class AspectRatings(BaseModel):
    story: Optional[AspectRating] = None
    screenplay: Optional[AspectRating] = None
    direction: Optional[AspectRating] = None
    acting: Optional[AspectRating] = None
    cinematography: Optional[AspectRating] = None
    editing: Optional[AspectRating] = None
    bg_score: Optional[AspectRating] = None
    music: Optional[AspectRating] = None
    production_design: Optional[AspectRating] = None
    vfx: Optional[AspectRating] = None
    originality: Optional[AspectRating] = None
    pacing: Optional[AspectRating] = None
    dialogues: Optional[AspectRating] = None
    climax: Optional[AspectRating] = None
    opening: Optional[AspectRating] = None
    emotional_impact: Optional[AspectRating] = None
    rewatch_value: Optional[AspectRating] = None

class ReviewBase(BaseModel):
    movie_id: int # TMDB ID for easy mapping
    movie_title: Optional[str] = None
    movie_poster_url: Optional[str] = None
    status: str = "draft" # draft, published
    slug: str
    overall_rating: float = Field(..., ge=0, le=10)
    verdict: Verdict
    summary: str
    content: str # Markdown
    spoiler_section: Optional[str] = None
    cast_performances: Optional[str] = None
    director_trademarks: Optional[str] = None
    viewing_context: Optional[str] = None
    trivia_and_details: Optional[str] = None
    favourite_dialogues: List[str] = []
    cinematic_moments: List[str] = []
    aspects: AspectRatings
    tags: List[str] = []
    is_featured: bool = False

class ReviewCreate(ReviewBase):
    pass

class ReviewUpdate(BaseModel):
    status: Optional[str] = None
    overall_rating: Optional[float] = None
    verdict: Optional[Verdict] = None
    summary: Optional[str] = None
    content: Optional[str] = None
    aspects: Optional[AspectRatings] = None
    is_featured: Optional[bool] = None

class ReviewInDB(ReviewBase):
    id: Optional[str] = Field(None, alias="_id")
    published_at: Optional[datetime] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    history: List[Dict] = []

    class Config:
        populate_by_name = True
