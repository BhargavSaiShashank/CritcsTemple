from motor.motor_asyncio import AsyncIOMotorDatabase
from typing import List, Optional, Dict, Any
from app.models.review import Verdict
from pymongo import DESCENDING, ASCENDING, ReturnDocument
from fastapi import HTTPException

class ReviewService:
    @staticmethod
    def serialize_doc(doc: dict) -> dict:
        """Lightweight serialization of MongoDB documents for API responses."""
        if not doc:
            return doc
        
        # Convert ObjectId to string for JSON compatibility
        if "_id" in doc:
            doc["_id"] = str(doc["_id"])
            
        # Ensure 'aspects' dictionary exists for UI consistency
        if "aspects" not in doc:
            doc["aspects"] = {}
            
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
        content_type: Optional[str] = None,
        sort_by: Optional[str] = "date",
        order: Optional[str] = "desc",
        year: Optional[int] = None,
        must_watch: Optional[bool] = None
    ) -> List[Dict[str, Any]]:
        publication_query = self._get_publication_query()
        filters = [publication_query]
        
        if tag:
            filters.append({"tags": tag})
        
        if verdict and verdict.strip():
            filters.append({"verdict": verdict.strip()})
            
        if content_type:
            filters.append({"content_type": content_type})

        if year:
            filters.append({"movie_year": year})

        if must_watch is not None:
            filters.append({"is_must_watch": must_watch})
            
        if search and search.strip():
            # Robust Search Logic: Using $regex for maximum compatibility across MongoDB tiers (Free Tier issues with index building).
            # We search across: movie_title, verdict, summary, content, and tags.
            search_regex = {"$regex": search.strip(), "$options": "i"}
            filters.append({
                "$or": [
                    {"movie_title": search_regex},
                    {"verdict": search_regex},
                    {"summary": search_regex},
                    {"content": search_regex},
                    {"tags": search_regex}
                ]
            })
            
        query = {"$and": filters} if len(filters) > 1 else filters[0]
            
        if sort_by == "score":
            sort_field = "overall_rating"
        elif sort_by == "oscar_rank":
            sort_field = "oscar_rank"
        else:
            sort_field = "published_at"
            
        sort_direction = ASCENDING if (order or "desc").lower() == "asc" else DESCENDING
        
        cursor = db.reviews.find(query).sort(sort_field, sort_direction).skip(offset).limit(limit)
        reviews = await cursor.to_list(length=limit)
        return [self.serialize_doc(r) for r in reviews]

    async def get_oscar_years(self, db) -> List[int]:
        """Returns a sorted list of unique years that have oscar reviews."""
        years = await db.reviews.distinct("movie_year", {"tags": "oscar"})
        return sorted([y for y in years if y is not None], reverse=True)

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
        
        review = await db.reviews.find_one_and_update(
            query,
            {"$inc": {"claps": 1}},
            return_document=ReturnDocument.AFTER
        )
        
        if not review:
            raise HTTPException(status_code=404, detail="Review not found")
        
        return self.serialize_doc(review)

    async def decrement_claps(self, db: AsyncIOMotorDatabase, slug: str) -> Dict[str, Any]:
        query = self._get_publication_query()
        query["slug"] = slug
        query["claps"] = {"$gt": 0}
        
        # Only decrement if current claps > 0 to prevent negative values
        review = await db.reviews.find_one_and_update(
            query,
            {"$inc": {"claps": -1}},
            return_document=ReturnDocument.AFTER
        )
        
        if not review:
            # We don't throw 404 if it didn't modify, as it might've been zero already.
            # But we check for existence separately to be accurate.
            exists = await db.reviews.find_one({"slug": slug})
            if not exists:
                 raise HTTPException(status_code=404, detail="Review not found")
            return self.serialize_doc(exists)
            
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
        related: list = await cursor.to_list(length=3)
        
        # If we didn't get enough related, pad with latest
        if len(related) < 3:
            exclude_slugs = [slug] + [r["slug"] for r in related]
            fallback_query = {
                "slug": {"$nin": exclude_slugs},
                "status": "published"
            }
            fallback_cursor = db.reviews.find(fallback_query).sort("published_at", DESCENDING).limit(3 - len(related))
            fallback: list = await fallback_cursor.to_list(length=3 - len(related))
            related.extend(fallback)
            
        return [self.serialize_doc(r) for r in related]

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

        # Try to update in a single atomical operation
        review = await db.reviews.find_one_and_update(
            query,
            {"$inc": updates},
            return_document=ReturnDocument.AFTER
        )
        
        if not review:
            # Maybe the reactions object doesn't exist yet (for older reviews)
            # We initialize it carefully.
            await db.reviews.update_one(
                query,
                {"$set": {"reactions": {"agree": 0, "disagree": 0, "havent_seen": 0}}}
            )
            review = await db.reviews.find_one_and_update(
                query,
                {"$inc": {f"reactions.{reaction_type}": 1}},
                return_document=ReturnDocument.AFTER
            )
            
        if not review:
            raise HTTPException(status_code=404, detail="Review not found")
            
        return self.serialize_doc(review)

    async def get_all_review_context(self, db: AsyncIOMotorDatabase) -> List[Dict[str, Any]]:
        query = self._get_publication_query()
        cursor = db.reviews.find(query, {
            "movie_title": 1,
            "verdict": 1,
            "overall_rating": 1,
            "summary": 1,
            "tags": 1,
            "slug": 1,
            "movie_year": 1,
            "aspects": 1
        })
        reviews = await cursor.to_list(length=100)
        return [self.serialize_doc(r) for r in reviews]

    async def get_movie_by_imdb(self, db: AsyncIOMotorDatabase, imdb_id: str) -> Dict[str, Any]:
        """Fetch a movie record by IMDB ID with service-level serialization."""
        movie = await db.movies.find_one({"imdb_id": imdb_id})
        if not movie:
            raise HTTPException(status_code=404, detail="Movie not found")
        return self.serialize_doc(movie)

    async def get_show_by_tmdb(self, db: AsyncIOMotorDatabase, tmdb_id: str) -> Dict[str, Any]:
        """Fetch a TV show record by TMDB ID with proper type coercion."""
        try:
            tid = int(tmdb_id)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid TMDB ID format")
            
        show = await db.shows.find_one({"tmdb_id": tid})
        if not show:
            raise HTTPException(status_code=404, detail="TV Show not found")
        return self.serialize_doc(show)

review_service = ReviewService()
