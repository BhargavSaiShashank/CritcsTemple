from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime

class CategoryBase(BaseModel):
    title: str = Field(..., description="The title of the category, e.g., 'Sci-Fi Masterpieces'")
    description: Optional[str] = None
    rank: int = Field(default=0, description="Display order of the category")
    items: List[str] = Field(default_factory=list, description="List of review slugs in this category")

class CategoryCreate(CategoryBase):
    pass

class CategoryUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    rank: Optional[int] = None
    items: Optional[List[str]] = None

class CategoryInDB(CategoryBase):
    id: Optional[str] = Field(None, alias="_id")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        populate_by_name = True
