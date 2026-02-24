from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import JSONResponse
from typing import List, Optional
from app.db.mongodb import get_database
from app.models.review import Verdict
from pymongo import DESCENDING, ASCENDING

router = APIRouter()

def serialize_doc(doc: dict) -> dict:
    """Convert MongoDB document _id ObjectId to string."""
    if doc and "_id" in doc:
        doc["_id"] = str(doc["_id"])
    return doc

@router.get("/reviews")
async def get_latest_reviews(
    limit: int = 10,
    offset: int = 0,
    tag: Optional[str] = None,
    verdict: Optional[str] = None,
    search: Optional[str] = None,
    sort_by: Optional[str] = "date",
    order: Optional[str] = "desc",
    db = Depends(get_database)
):
    query: dict = {"status": "published"}
    if tag:
        query["tags"] = tag
    
    # Check if verdict is a single string or multiple
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
    return [serialize_doc(r) for r in reviews]

@router.get("/reviews/{slug}")
async def get_review_by_slug(slug: str, db = Depends(get_database)):
    review = await db.reviews.find_one({"slug": slug, "status": "published"})
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")
    return serialize_doc(review)

@router.get("/masterpieces")
async def get_masterpieces(db = Depends(get_database)):
    cursor = db.reviews.find({"verdict": Verdict.MASTERPIECE.value, "status": "published"}).sort("published_at", DESCENDING)
    reviews = await cursor.to_list(length=20)
    return [serialize_doc(r) for r in reviews]

@router.get("/movie/{imdb_id}")
async def get_movie_details(imdb_id: str, db = Depends(get_database)):
    movie = await db.movies.find_one({"imdb_id": imdb_id})
    if not movie:
        raise HTTPException(status_code=404, detail="Movie not found in our database")
    return serialize_doc(movie)
