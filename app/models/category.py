from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Dict, Any
from datetime import datetime

class CategoryBase(BaseModel):
    title: str = Field(..., description="The title of the category, e.g., 'Sci-Fi Masterpieces'")
    description: Optional[str] = None
    rank: int = Field(default=0, description="Display order of the category")
    type: str = Field(default="static", description="Either 'static' for manual list or 'dynamic' for query-based list")
    items: List[str] = Field(default_factory=list, description="List of review slugs (for static type)")
    dynamic_criteria: Optional[Dict[str, Any]] = Field(default=None, description="Criteria for dynamic type (e.g. {tags: ['horror']})")
    show_rankings: bool = Field(default=False, description="Whether to show 1, 2, 3... ranking badges")

class CategoryCreate(CategoryBase):
    pass

class CategoryUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    rank: Optional[int] = None
    type: Optional[str] = None
    items: Optional[List[str]] = None
    dynamic_criteria: Optional[Dict[str, Any]] = None
    show_rankings: Optional[bool] = None

class CategoryInDB(CategoryBase):
    id: Optional[str] = Field(None, alias="_id")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    model_config = ConfigDict(populate_by_name=True)
