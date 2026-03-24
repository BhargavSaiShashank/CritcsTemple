from pydantic import BaseModel, Field, validator, ConfigDict
from typing import List, Optional, Dict, Any, Union
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
    # Narrative (5)
    story: Optional[AspectRating] = None
    screenplay: Optional[AspectRating] = None
    originality: Optional[AspectRating] = None
    opening: Optional[AspectRating] = None
    climax: Optional[AspectRating] = None
    
    # Execution (4)
    direction: Optional[AspectRating] = None
    acting: Optional[AspectRating] = None
    dialogues: Optional[AspectRating] = None
    thematic_depth: Optional[AspectRating] = None
    
    # Visuals (4)
    cinematography: Optional[AspectRating] = None
    editing: Optional[AspectRating] = None
    production_design: Optional[AspectRating] = None
    vfx: Optional[AspectRating] = None
    
    # Audio (3)
    bg_score: Optional[AspectRating] = None
    music: Optional[AspectRating] = None
    sound_design: Optional[AspectRating] = None
    
    # Soul (3)
    pacing: Optional[AspectRating] = None
    emotional_impact: Optional[AspectRating] = None
    rewatch_value: Optional[AspectRating] = None

class Reactions(BaseModel):
    agree: int = 0
    disagree: int = 0
    havent_seen: int = 0

class ReviewBase(BaseModel):
    movie_id: Any  # Can be TMDB ID (int) or IMDB ID (str)
    content_type: str = "movie" # movie, tv
    movie_title: Optional[str] = None
    movie_poster_url: Optional[str] = None
    status: str = "draft" # draft, published
    slug: str
    overall_rating: Union[float, Dict[str, Any]] = Field(0.0)
    verdict: Optional[Verdict] = None
    micro_calibration: Optional[str] = None # None, "Soul", "Narrative"
    oscar_rank: Optional[int] = None
    summary: Optional[str] = None
    language: Optional[str] = None # Manual Linguistic DNA override
    content: Optional[str] = None # Markdown
    spoiler_section: Optional[str] = None
    cast_performances: Optional[str] = None
    director_trademarks: Optional[str] = None
    viewing_context: Optional[str] = None
    trivia_and_details: Optional[str] = None
    favourite_dialogues: List[str] = []
    cinematic_moments: List[str] = []
    aspects: AspectRatings = Field(default_factory=AspectRatings)
    tags: List[str] = []
    is_featured: bool = False
    is_must_watch: bool = False
    author: Optional[str] = None
    watch_links: Optional[str] = None
    trailer_url: Optional[str] = None
    movie_year: Optional[int] = None
    claps: int = 0
    scheduled_date: Optional[datetime] = None
    reactions: Reactions = Field(default_factory=Reactions)

class ReviewCreate(ReviewBase):
    pass

class ReviewUpdate(BaseModel):
    status: Optional[str] = None
    content_type: Optional[str] = None
    overall_rating: Optional[Union[float, Dict[str, Any]]] = None
    verdict: Optional[Verdict] = None
    micro_calibration: Optional[str] = None
    oscar_rank: Optional[int] = None
    summary: Optional[str] = None
    language: Optional[str] = None
    content: Optional[str] = None
    spoiler_section: Optional[str] = None
    cast_performances: Optional[str] = None
    director_trademarks: Optional[str] = None
    viewing_context: Optional[str] = None
    trivia_and_details: Optional[str] = None
    favourite_dialogues: Optional[List[str]] = None
    cinematic_moments: Optional[List[str]] = None
    aspects: Optional[AspectRatings] = None
    tags: Optional[List[str]] = None
    is_featured: Optional[bool] = None
    is_must_watch: Optional[bool] = None
    author: Optional[str] = None
    movie_poster_url: Optional[str] = None
    watch_links: Optional[str] = None
    trailer_url: Optional[str] = None
    movie_year: Optional[int] = None
    scheduled_date: Optional[datetime] = None

class ReviewInDB(ReviewBase):
    id: Optional[str] = Field(None, alias="_id")
    published_at: Optional[datetime] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    history: List[Dict] = []

    model_config = ConfigDict(populate_by_name=True)
