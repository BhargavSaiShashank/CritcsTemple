from pydantic import BaseModel, Field
from typing import List, Optional, Dict
from datetime import datetime
from .movie import CastMember, CrewMember

class ShowBase(BaseModel):
    tmdb_id: Optional[int] = 0
    title: str
    first_air_year: Optional[int] = 0
    last_air_year: Optional[int] = None
    language: Optional[str] = "English"
    country: Optional[str] = None
    episode_run_time: Optional[int] = None
    seasons_count: Optional[int] = 0
    episodes_count: Optional[int] = 0
    status: Optional[str] = None # e.g., "Ended", "Returning Series"
    genres: Optional[List[str]] = []
    synopsis: Optional[str] = "No synopsis available."
    poster_url: Optional[str] = None
    backdrop_url: Optional[str] = None
    trailer_url: Optional[str] = None
    ratings: List[Dict[str, str]] = []
    cast: List[CastMember] = []
    crew: List[CrewMember] = []

class ShowCreate(ShowBase):
    pass

class ShowInDB(ShowBase):
    id: str = Field(..., alias="_id")
    created_at: datetime = Field(default_factory=datetime.utcnow)

class ShowPublic(ShowBase):
    pass
