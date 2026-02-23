from pydantic_settings import BaseSettings
from functools import lru_cache

class Settings(BaseSettings):
    # App Settings
    APP_NAME: str = "The Critic's Temple"
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    
    # MongoDB
    MONGODB_URL: str
    DATABASE_NAME: str
    
    # OMDb
    OMDB_API_KEY: str
    
    # Firebase
    FIREBASE_SERVICE_ACCOUNT_PATH: str
    
    # Cloudinary
    CLOUDINARY_CLOUD_NAME: str
    CLOUDINARY_API_KEY: str
    CLOUDINARY_API_SECRET: str
    CLOUDINARY_URL: str

    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60

    class Config:
        env_file = ".env"
        extra = "ignore"

@lru_cache()
def get_settings():
    return Settings()
