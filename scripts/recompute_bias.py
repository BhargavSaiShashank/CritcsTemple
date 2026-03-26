import asyncio
import os
import sys

# Add project root to sys.path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.services.bias_service import BiasService
from app.db.mongodb import connect_to_mongo, close_mongo_connection

async def force_recompute():
    await connect_to_mongo()
    print("--- Recomputing Bias Analytics ---")
    result = await BiasService.calculate_bias("default_user")
    if result:
        print(f"  Success! New Total Average: {result.overall_average:.2f}")
    else:
        print("  Failed: No reviews or movies matched.")
    await close_mongo_connection()

if __name__ == "__main__":
    asyncio.run(force_recompute())
