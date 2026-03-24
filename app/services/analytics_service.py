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
                "story", "screenplay", "originality", "opening", "climax", "themes_depth",
                "direction", "acting", "blocking_staging",
                "cinematography", "editing", "production_design", "vfx", "visual_storytelling",
                "bg_score", "music", "sound_design",
                "pacing", "emotional_impact", "rewatch_value", "immersion"
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

    async def get_engagement_intelligence(self, db: AsyncIOMotorDatabase) -> Dict[str, Any]:
        """
        Returns trending data and reaction consensus metrics.
        """
        if db is None:
            raise HTTPException(status_code=503, detail="Database Offline")

        try:
            # Top 5 Trending by Claps
            trending_cursor = db.reviews.find({"status": "published"}).sort("claps", -1).limit(5)
            trending_list = await trending_cursor.to_list(5)
            trending = [
                {
                    "title": r.get("movie_title"),
                    "slug": r.get("slug"),
                    "claps": r.get("claps", 0),
                    "verdict": r.get("verdict"),
                    "poster": r.get("movie_poster_url")
                } for r in trending_list
            ]

            # Top 5 Reaction Consensus
            # We calculate total reactions: agree + disagree + havent_seen
            pipeline = [
                {"$match": {"status": "published"}},
                {
                    "$addFields": {
                        "total_reactions": {
                            "$add": [
                                {"$ifNull": ["$reactions.agree", 0]},
                                {"$ifNull": ["$reactions.disagree", 0]},
                                {"$ifNull": ["$reactions.havent_seen", 0]}
                            ]
                        }
                    }
                },
                {"$sort": {"total_reactions": -1}},
                {"$limit": 5}
            ]
            
            consensus_cursor = db.reviews.aggregate(pipeline)
            consensus_list = await consensus_cursor.to_list(5)
            consensus = [
                {
                    "title": r.get("movie_title"),
                    "slug": r.get("slug"),
                    "reactions": r.get("reactions", {"agree": 0, "disagree": 0, "havent_seen": 0}),
                    "total": r.get("total_reactions", 0),
                    "poster": r.get("movie_poster_url")
                } for r in consensus_list
            ]

            return {
                "trending": trending,
                "consensus": consensus
            }
        except Exception as e:
            traceback.print_exc()
            raise HTTPException(status_code=500, detail=f"Engagement Analytics Error: {str(e)}")

analytics_service = AnalyticsService()
