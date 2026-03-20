import numpy as np
from typing import List, Dict, Any, Optional
from datetime import datetime
from app.models.dynamic_rating import DynamicRatingInDB, RatingPhase
from app.db.mongodb import get_database

class RatingService:
    @staticmethod
    def calculate_metrics(phases: Dict[str, RatingPhase]):
        scores = [p.score for p in phases.values()]
        if not scores:
            return 0.0, 0.0, 1.0
        
        # Drift: Last - First (based on phase order initial -> reflection -> rewatch)
        ordered_phases = ["initial", "reflection", "rewatch"]
        present_phases = [p for p in ordered_phases if p in phases]
        
        if len(present_phases) < 2:
            drift = 0.0
        else:
            first_score = phases[present_phases[0]].score
            last_score = phases[present_phases[-1]].score
            drift = last_score - first_score
            
        # Volatility: Standard Deviation
        volatility = float(np.std(scores)) if len(scores) > 1 else 0.0
        
        # Consistency: Inverse of volatility
        consistency = 1.0 / (1.0 + volatility)
        
        return drift, volatility, consistency

    @staticmethod
    async def update_rating(movie_id: Any, phase_name: str, score: float, metadata: Optional[Dict] = None):
        db = get_database()
        collection = db.dynamic_ratings
        
        # Find existing or create new
        existing = await collection.find_one({"movie_id": movie_id})
        
        if existing:
            rating = DynamicRatingInDB(**existing)
        else:
            rating = DynamicRatingInDB(movie_id=movie_id, phases={})
            
        # Update phase
        rating.phases[phase_name] = RatingPhase(score=score, metadata=metadata)
        
        # Recalculate metrics
        drift, volatility, consistency = RatingService.calculate_metrics(rating.phases)
        rating.drift = drift
        rating.volatility = volatility
        rating.consistency_index = consistency
        rating.updated_at = datetime.utcnow()
        
        # Save to DB
        update_data = rating.model_dump(exclude={"id"}, by_alias=True)
        if existing:
            await collection.update_one(
                {"_id": existing["_id"]},
                {"$set": update_data}
            )
        else:
            await collection.insert_one(update_data)
            
        return rating

    @staticmethod
    async def get_rating_timeline(movie_id: str):
        db = get_database()
        return await db.dynamic_ratings.find_one({"movie_id": movie_id})

    @staticmethod
    async def reset_rating(movie_id: str):
        db = get_database()
        await db.dynamic_ratings.delete_one({"movie_id": movie_id})
        return True
