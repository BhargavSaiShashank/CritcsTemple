from motor.motor_asyncio import AsyncIOMotorDatabase
from typing import List, Dict, Any
from fastapi import HTTPException
import traceback

class AnalyticsService:
    async def get_dna_analytics(self, db: AsyncIOMotorDatabase) -> List[Dict[str, Any]]:
        """
        Calculates the average aspect scores from published reviews to build the DNA profile.
        """
        if db is None:
            raise HTTPException(status_code=503, detail="Database Offline")
            
        try:
            reviews = await db.reviews.find({"status": "published"}).to_list(1000)
            
            aspect_keys = [
                "story", "screenplay", "direction", "acting", "cinematography",
                "editing", "bg_score", "music", "production_design", "vfx",
                "originality", "pacing", "dialogues", "climax", "opening",
                "emotional_impact", "rewatch_value"
            ]

            if not reviews:
                return [{"subject": k.replace("_", " ").title(), "A": 0, "fullMark": 10} for k in aspect_keys]
                
            aspect_totals = {}
            aspect_counts = {}
            
            for r in reviews:
                aspects = r.get("aspects", {})
                if not aspects:
                    continue
                    
                for field, data in aspects.items():
                    if data and isinstance(data, dict) and "score" in data:
                        score = data["score"]
                        aspect_totals[field] = aspect_totals.get(field, 0) + score
                        aspect_counts[field] = aspect_counts.get(field, 0) + 1
                        
            results: List[Dict[str, Any]] = []
            
            for k in aspect_keys:
                total = aspect_totals.get(k, 0)
                count = aspect_counts.get(k, 0)
                avg = float(f"{total / count:.1f}") if count > 0 else 0.0
                results.append({
                    "subject": k.replace("_", " ").title(),
                    "A": avg,
                    "fullMark": 10
                })
                
            return results
        except Exception as e:
            traceback.print_exc()
            raise HTTPException(status_code=500, detail=f"Analytics Service Error: {str(e)}")

analytics_service = AnalyticsService()
