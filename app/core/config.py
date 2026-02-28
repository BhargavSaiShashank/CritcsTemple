from pydantic_settings import BaseSettings, SettingsConfigDict
from functools import lru_cache

class Settings(BaseSettings):
    # App Settings
    APP_NAME: str = "The Critic's Temple"
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    
    # MongoDB
    MONGODB_URL: str
    DATABASE_NAME: str
    
    # TMDb
    TMDB_API_KEY: str
    TMDB_READ_TOKEN: str
    
    # Firebase
    FIREBASE_SERVICE_ACCOUNT_PATH: str
    
    # Cloudinary
    CLOUDINARY_CLOUD_NAME: str
    CLOUDINARY_API_KEY: str
    CLOUDINARY_API_SECRET: str
    CLOUDINARY_URL: str

    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

@lru_cache()
def get_settings():
    return Settings()
