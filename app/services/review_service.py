from motor.motor_asyncio import AsyncIOMotorDatabase
from typing import List, Optional, Dict, Any
from app.models.review import Verdict
from pymongo import DESCENDING, ASCENDING
from fastapi import HTTPException

class ReviewService:
    @staticmethod
    def serialize_doc(doc: dict) -> dict:
        if doc and "_id" in doc:
            doc["_id"] = str(doc["_id"])
        return doc

    def _get_publication_query(self) -> dict:
        """Helper to get the query for reviews that should be visible to public."""
        from datetime import datetime
        now = datetime.utcnow()
        return {
            "$or": [
                {"status": "published"},
                {
                    "status": "scheduled",
                    "scheduled_date": {"$lte": now}
                }
            ]
        }

    async def get_latest_reviews(
        self, 
        db: AsyncIOMotorDatabase,
        limit: int = 10,
        offset: int = 0,
        tag: Optional[str] = None,
        verdict: Optional[str] = None,
        search: Optional[str] = None,
        sort_by: Optional[str] = "date",
        order: Optional[str] = "desc"
    ) -> List[Dict[str, Any]]:
        query = self._get_publication_query()
        if tag:
            query["tags"] = tag
        
        if verdict and verdict.strip():
            query["verdict"] = verdict.strip()
            
        if search and search.strip():
            query["$or"] = [
                {"movie_title": {"$regex": search.strip(), "$options": "i"}},
                {"verdict": {"$regex": search.strip(), "$options": "i"}},
                {"tags": {"$regex": search.strip(), "$options": "i"}}
            ]
            
        sort_field = "overall_rating" if sort_by == "score" else "published_at"
        sort_direction = ASCENDING if (order or "desc").lower() == "asc" else DESCENDING
        
        cursor = db.reviews.find(query).sort(sort_field, sort_direction).skip(offset).limit(limit)
        reviews = await cursor.to_list(length=limit)
        return [self.serialize_doc(r) for r in reviews]

    async def get_review_by_slug(self, db: AsyncIOMotorDatabase, slug: str) -> Dict[str, Any]:
        query = self._get_publication_query()
        query["slug"] = slug
        review = await db.reviews.find_one(query)
        if not review:
            raise HTTPException(status_code=404, detail="Review not found")
        return self.serialize_doc(review)

    async def get_masterpieces(self, db: AsyncIOMotorDatabase) -> List[Dict[str, Any]]:
        query = self._get_publication_query()
        query["verdict"] = Verdict.MASTERPIECE.value
        cursor = db.reviews.find(query).sort("published_at", DESCENDING)
        reviews = await cursor.to_list(length=20)
        return [self.serialize_doc(r) for r in reviews]

    async def increment_claps(self, db: AsyncIOMotorDatabase, slug: str) -> Dict[str, Any]:
        query = self._get_publication_query()
        query["slug"] = slug
        result = await db.reviews.update_one(
            query,
            {"$inc": {"claps": 1}}
        )
        if result.modified_count == 0:
            raise HTTPException(status_code=404, detail="Review not found")
        
        review = await db.reviews.find_one({"slug": slug})
        return self.serialize_doc(review)

    async def decrement_claps(self, db: AsyncIOMotorDatabase, slug: str) -> Dict[str, Any]:
        query = self._get_publication_query()
        query["slug"] = slug
        query["claps"] = {"$gt": 0}
        # Only decrement if current claps > 0 to prevent negative values
        result = await db.reviews.update_one(
            query,
            {"$inc": {"claps": -1}}
        )
        # We don't throw 404 if it didn't modify, maybe it was already at 0.
        review = await db.reviews.find_one({"slug": slug})
        if not review:
            raise HTTPException(status_code=404, detail="Review not found")
        return self.serialize_doc(review)

    async def get_related_reviews(self, db: AsyncIOMotorDatabase, slug: str) -> List[Dict[str, Any]]:
        target_query = self._get_publication_query()
        target_query["slug"] = slug
        target = await db.reviews.find_one(target_query)
        if not target:
            raise HTTPException(status_code=404, detail="Review not found")
        
        tags = target.get("tags", [])
        verdict = target.get("verdict")
        
        query = self._get_publication_query()
        query["slug"] = {"$ne": slug}
        query["$or"] = [
            {"tags": {"$in": tags}},
            {"verdict": verdict}
        ]
        
        cursor = db.reviews.find(query).sort("published_at", DESCENDING).limit(3)
        related = await cursor.to_list(length=3)
        
        # If we didn't get enough related, pad with latest
        if len(related) < 3:
            exclude_slugs = [slug] + [r["slug"] for r in related]
            fallback_query = {
                "slug": {"$nin": exclude_slugs},
                "status": "published"
            }
            fallback_cursor = db.reviews.find(fallback_query).sort("published_at", DESCENDING).limit(3 - len(related))
            fallback = await fallback_cursor.to_list(length=3 - len(related))
            related.extend(fallback)
            
        return [self.serialize_doc(r) for r in related]

<<<<<<< HEAD
    async def submit_reaction(self, db: AsyncIOMotorDatabase, slug: str, reaction_type: Optional[str] = None, previous_type: Optional[str] = None) -> Dict[str, Any]:
        query = self._get_publication_query()
        query["slug"] = slug

        updates = {}
        if previous_type:
            updates[f"reactions.{previous_type}"] = -1
        if reaction_type:
            updates[f"reactions.{reaction_type}"] = 1
        
        if not updates:
            return {"status": "no-op"}

        result = await db.reviews.update_one(
            query,
            {"$inc": updates}
=======
    async def submit_reaction(self, db: AsyncIOMotorDatabase, slug: str, reaction_type: str) -> Dict[str, Any]:
        query = self._get_publication_query()
        query["slug"] = slug
        
        result = await db.reviews.update_one(
            query,
            {"$inc": {f"reactions.{reaction_type}": 1}}
>>>>>>> 92339b316786a5f174f406f49387b7d349e1d812
        )
        
        if result.modified_count == 0:
            # Maybe the reactions object doesn't exist yet (for older reviews)
            await db.reviews.update_one(
                query,
                {"$set": {"reactions": {"agree": 0, "disagree": 0, "havent_seen": 0}}}
            )
            await db.reviews.update_one(
                query,
                {"$inc": {f"reactions.{reaction_type}": 1}}
            )
            
        review = await db.reviews.find_one({"slug": slug})
        return self.serialize_doc(review)

review_service = ReviewService()
