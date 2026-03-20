from pydantic import BaseModel, Field
from typing import Optional

class GlobalSettings(BaseModel):
    active_oscar_year: int = Field(default=2026)
