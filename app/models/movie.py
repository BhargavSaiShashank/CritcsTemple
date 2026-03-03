from pydantic import BaseModel, Field
from typing import List, Optional, Dict
from datetime import datetime

class CastMember(BaseModel):
    name: str
    character: str
    profile_path: Optional[str] = None

class CrewMember(BaseModel):
    name: str
    job: str
    profile_path: Optional[str] = None

class MovieBase(BaseModel):
    imdb_id: str
    tmdb_id: Optional[int] = 0
    title: str
    release_year: Optional[int] = 0
    language: Optional[str] = "English"
    country: Optional[str] = None
    runtime: Optional[int] = None
    genres: Optional[List[str]] = []
    synopsis: Optional[str] = "No synopsis available."
    poster_url: Optional[str] = None
    backdrop_url: Optional[str] = None
    trailer_url: Optional[str] = None
    ratings: List[Dict[str, str]] = []
    cast: List[CastMember] = []
    crew: List[CrewMember] = []

class MovieCreate(MovieBase):
    pass

class MovieInDB(MovieBase):
    id: str = Field(..., alias="_id")
    created_at: datetime = Field(default_factory=datetime.utcnow)

class MoviePublic(MovieBase):
    pass
