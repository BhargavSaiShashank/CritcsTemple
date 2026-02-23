from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import JSONResponse
from typing import List, Optional
from app.db.mongodb import get_database
from app.models.review import Verdict
from pymongo import DESCENDING

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
    verdict: Optional[Verdict] = None,
    db = Depends(get_database)
):
    query = {"status": "published"}
    if tag:
        query["tags"] = tag
    if verdict:
        query["verdict"] = verdict.value
    
    cursor = db.reviews.find(query).sort("published_at", DESCENDING).skip(offset).limit(limit)
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
