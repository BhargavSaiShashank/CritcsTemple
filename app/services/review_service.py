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
        query: dict = {"status": "published"}
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
        review = await db.reviews.find_one({"slug": slug, "status": "published"})
        if not review:
            raise HTTPException(status_code=404, detail="Review not found")
        return self.serialize_doc(review)

    async def get_masterpieces(self, db: AsyncIOMotorDatabase) -> List[Dict[str, Any]]:
        cursor = db.reviews.find({"verdict": Verdict.MASTERPIECE.value, "status": "published"}).sort("published_at", DESCENDING)
        reviews = await cursor.to_list(length=20)
        return [self.serialize_doc(r) for r in reviews]

    async def increment_claps(self, db: AsyncIOMotorDatabase, slug: str) -> Dict[str, Any]:
        result = await db.reviews.update_one(
            {"slug": slug, "status": "published"},
            {"$inc": {"claps": 1}}
        )
        if result.modified_count == 0:
            raise HTTPException(status_code=404, detail="Review not found")
        
        review = await db.reviews.find_one({"slug": slug})
        return self.serialize_doc(review)

    async def decrement_claps(self, db: AsyncIOMotorDatabase, slug: str) -> Dict[str, Any]:
        # Only decrement if current claps > 0 to prevent negative values
        result = await db.reviews.update_one(
            {"slug": slug, "status": "published", "claps": {"$gt": 0}},
            {"$inc": {"claps": -1}}
        )
        # We don't throw 404 if it didn't modify, maybe it was already at 0.
        review = await db.reviews.find_one({"slug": slug})
        if not review:
            raise HTTPException(status_code=404, detail="Review not found")
        return self.serialize_doc(review)

    async def get_related_reviews(self, db: AsyncIOMotorDatabase, slug: str) -> List[Dict[str, Any]]:
        target = await db.reviews.find_one({"slug": slug, "status": "published"})
        if not target:
            raise HTTPException(status_code=404, detail="Review not found")
        
        tags = target.get("tags", [])
        verdict = target.get("verdict")
        
        query = {
            "slug": {"$ne": slug},
            "status": "published",
            "$or": [
                {"tags": {"$in": tags}},
                {"verdict": verdict}
            ]
        }
        
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

review_service = ReviewService()
