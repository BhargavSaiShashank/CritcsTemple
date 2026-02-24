import pytest
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from app.core.config import get_settings

settings = get_settings()

@pytest.fixture(scope="session")
def event_loop():
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()

@pytest.fixture(scope="session")
async def db_client():
    client = AsyncIOMotorClient(settings.MONGODB_URL)
    yield client
    client.close()

@pytest.fixture(scope="session")
def db(db_client):
    return db_client[settings.DATABASE_NAME + "_test"]

@pytest.fixture(scope="session")
def anyio_backend():
    return "asyncio"
