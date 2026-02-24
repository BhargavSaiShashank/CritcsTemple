import pytest
from motor.motor_asyncio import AsyncIOMotorClient
from app.core.config import get_settings

settings = get_settings()

@pytest.fixture()
async def db_client():
    client = AsyncIOMotorClient(settings.MONGODB_URL)
    yield client
    client.close()

@pytest.fixture()
def db(db_client):
    return db_client[settings.DATABASE_NAME + "_test"]
