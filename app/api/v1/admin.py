from fastapi import APIRouter, Depends, HTTPException, Body, File, UploadFile, Query
from fastapi.responses import Response
import re
import json
import traceback
from typing import List, Any, Optional, Dict
from app.db.mongodb import get_database
from app.models.review import ReviewCreate, ReviewUpdate, ReviewInDB, Verdict
from app.models.movie import MovieCreate, MovieInDB
from app.models.show import ShowCreate
from app.models.category import CategoryCreate, CategoryUpdate, CategoryInDB
from app.models.prediction import UpcomingMovieCreate, UpcomingMovieInDB
from app.models.settings import GlobalSettings
from app.services.tmdb import tmdb_service
from app.services.movie_service import movie_service
from app.services.show_service import show_service
from app.services.analytics_service import analytics_service
from app.services.review_service import review_service
from app.services.images import image_service
from app.services.category_service import category_service
from app.services.prediction_service import prediction_service
from app.core.auth import get_current_admin
from app.core.utils import calculate_overall_score
from app.services.adversary_service import adversary_service
import os
import shutil
from slugify import slugify
from datetime import datetime

router = APIRouter()

@router.get("/export/vault")
async def export_data_vault(db = Depends(get_database), admin = Depends(get_current_admin)):
    """Exports the entire library of reviews as a JSON Array."""
    cursor = db.reviews.find({})
    reviews = await cursor.to_list(length=None)
    reviews = [review_service.serialize_doc(r) for r in reviews]
    
    response_data = json.dumps(reviews, default=str)
    return Response(
        content=response_data,
        media_type="application/json",
        headers={"Content-Disposition": f"attachment; filename=sanctuary_vault_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"}
    )

@router.get("/movies/search")
async def search_movies(
    title: str = Query(...), 
    admin = Depends(get_current_admin)
):
    return await tmdb_service.search_movies(title)

@router.get("/movies/latest")
async def get_latest_movies(
    category: str = Query("english"),
    admin = Depends(get_current_admin)
):
    return await tmdb_service.get_discovery(category)

@router.post("/movies/fetch", response_model=MovieCreate)
async def fetch_and_save_movie(
    search_term: str = Body(..., embed=True), 
    db = Depends(get_database),
    admin = Depends(get_current_admin)
):
    return await movie_service.fetch_and_save_movie(db, search_term)

@router.get("/shows/search")
async def search_shows(
    title: str = Query(...), 
    admin = Depends(get_current_admin)
):
    return await tmdb_service.search_shows(title)

@router.post("/shows/fetch", response_model=ShowCreate)
async def fetch_and_save_show(
    tmdb_id: str = Body(..., embed=True), 
    db = Depends(get_database),
    admin = Depends(get_current_admin)
):
    return await show_service.fetch_and_save_show(db, tmdb_id)

@router.post("/reviews", response_model=ReviewInDB)
async def create_review(
    review: ReviewCreate, 
    db = Depends(get_database),
    admin = Depends(get_current_admin)
):
    review_dict = review.model_dump()
    
    # Auto-calculate overall rating if not provided or to ensure accuracy
    if review_dict.get("overall_rating") is None or review_dict.get("overall_rating") == 0:
        review_dict["overall_rating"] = calculate_overall_score(review.aspects, review.micro_calibration)
        
    review_dict["created_at"] = datetime.utcnow()
    review_dict["updated_at"] = datetime.utcnow()
    
    if review.status == "published":
        review_dict["published_at"] = datetime.utcnow()
    elif review.status == "scheduled":
        # Ensure published_at is None for scheduled
        review_dict["published_at"] = None

    result = await db.reviews.insert_one(review_dict)
    review_id = str(result.inserted_id)
    review_dict["_id"] = review_id


    return review_dict

from bson import ObjectId
from bson.errors import InvalidId

@router.put("/reviews/{id}", response_model=ReviewInDB)
async def update_review(
    id: str,
    update_data: ReviewUpdate,
    db = Depends(get_database),
    admin = Depends(get_current_admin)
):
    try:
        obj_id = ObjectId(id)
    except InvalidId:
        obj_id = id

    existing = await db.reviews.find_one({"_id": obj_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Review not found")
    
    update_dict = update_data.model_dump(exclude_unset=True)
    update_dict["updated_at"] = datetime.utcnow()
    
    # Auto-calculate overall rating if aspects are updated but rating is not explicitly provided
    if "aspects" in update_dict and "overall_rating" not in update_dict:
        from app.models.review import AspectRatings
        aspects_obj = AspectRatings(**update_dict["aspects"])
        # Use micro_calibration from update_data if present, else from existing review
        m_cal = update_data.micro_calibration if update_data.micro_calibration is not None else existing.get("micro_calibration")
        update_dict["overall_rating"] = calculate_overall_score(aspects_obj, m_cal)
    elif update_dict.get("overall_rating") == 0 and "aspects" in update_dict:
        # If rating is explicitly 0 but aspects are provided, recalculate
        from app.models.review import AspectRatings
        aspects_obj = AspectRatings(**update_dict["aspects"])
        m_cal = update_data.micro_calibration if update_data.micro_calibration is not None else existing.get("micro_calibration")
        update_dict["overall_rating"] = calculate_overall_score(aspects_obj, m_cal)
    
    # Track history
    history_entry = {
        "timestamp": existing.get("updated_at"),
        "changes": {k: existing.get(k) for k in update_dict.keys() if k != "updated_at"}
    }
    
    # Logic for setting published_at when status changes
    new_status = update_data.status
    old_status = existing.get("status")

    if new_status == "published" and old_status != "published":
        # If moving TO published, set published_at to now
        update_dict["published_at"] = datetime.utcnow()
    elif new_status in ["draft", "scheduled"] and old_status == "published":
        # If moving AWAY from published, clear published_at
        update_dict["published_at"] = None
    elif new_status == "scheduled":
        # If explicitly setting/updating scheduled status, ensure published_at is None
        update_dict["published_at"] = None

    await db.reviews.update_one(
        {"_id": obj_id},
        {"$set": update_dict, "$push": {"history": history_entry}}
    )
    

    updated = await db.reviews.find_one({"_id": obj_id})
    if updated and "_id" in updated:
        updated["_id"] = str(updated["_id"])
    return updated

@router.get("/reviews/{id}", response_model=ReviewInDB)
async def get_review(
    id: str,
    db = Depends(get_database),
    admin = Depends(get_current_admin)
):
    try:
        obj_id = ObjectId(id)
    except InvalidId:
        obj_id = id

    review = await db.reviews.find_one({"_id": obj_id})
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")
        
    review["_id"] = str(review["_id"])
    return review

@router.get("/analytics/engagement")
async def get_engagement_intelligence(
    db = Depends(get_database), 
    admin = Depends(get_current_admin)
):
    return await analytics_service.get_engagement_intelligence(db)

@router.delete("/reviews/{id}")
async def delete_review(
    id: str,
    db = Depends(get_database),
    admin = Depends(get_current_admin)
):
    print(f"ADMIN: Attempting to delete review with ID: {id}")
    try:
        obj_id = ObjectId(id)
        print(f"ADMIN: Successfully parsed ObjectId: {obj_id}")
    except InvalidId:
        print(f"ADMIN: InvalidId exception, falling back to string ID: {id}")
        obj_id = id

    result = await db.reviews.delete_one({"_id": obj_id})
    print(f"ADMIN: Delete result deleted_count: {result.deleted_count}")
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Review not found")
        
    return {"status": "success", "message": "Review deleted"}

@router.get("/reviews", response_model=List[ReviewInDB])
async def list_reviews(
    status: Optional[str] = Query(None),
    db = Depends(get_database),
    admin = Depends(get_current_admin)
):
    try:
        query = {}
        if status:
            query["status"] = status
        
        # Sort by published_at or created_at
        reviews = await db.reviews.find(query).sort("created_at", -1).to_list(1000)
        return [review_service.serialize_doc(r) for r in reviews]
    except Exception as e:
        error_msg = f"ADMIN ERROR in list_reviews: {str(e)}\n{traceback.format_exc()}"
        print(error_msg)
        try:
            with open("server_errors.log", "a") as f:
                f.write(f"\n--- {datetime.now()} [ADMIN] ---\n{error_msg}\n")
        except:
            pass
        raise HTTPException(status_code=500, detail=f"Database Query Error: {str(e)}")

@router.get("/analytics/dna")
async def get_dna_analytics(
    db = Depends(get_database),
    admin = Depends(get_current_admin)
):
    return await analytics_service.get_dna_analytics(db)

@router.put("/oscar-rankings")
async def update_oscar_rankings(
    rankings: List[Dict[str, Any]] = Body(...), # [{'id': '...', 'rank': 1}]
    db = Depends(get_database),
    admin = Depends(get_current_admin)
):
    import pymongo
    requests = []
    
    # Reset all oscar_ranks to null first and strip the oscar tag to confidently map the new state
    await db.reviews.update_many(
        {"tags": "oscar"}, 
        {"$set": {"oscar_rank": None}, "$pull": {"tags": "oscar"}}
    )
    
    for item in rankings:
        try:
            obj_id = ObjectId(item["id"])
        except InvalidId:
            obj_id = item["id"]
        
        # We push "oscar" tag to ensure it appears in the specific lists, and set the rank
        requests.append(
            pymongo.UpdateOne(
                {"_id": obj_id}, 
                {"$set": {"oscar_rank": item["rank"]}, "$addToSet": {"tags": "oscar"}}
            )
        )
    
    if requests:
        await db.reviews.bulk_write(requests)
        
    return {"status": "success", "message": "Oscar hierarchy updated"}



@router.post("/upload")
async def upload_file(
    file: UploadFile = File(...),
    admin = Depends(get_current_admin)
):
    temp_path = f"temp_{file.filename}"
    with open(temp_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    try:
        url = await image_service.upload_image(temp_path)
        if not url:
            raise HTTPException(status_code=500, detail="Image upload failed")
        return {"url": url}
    finally:
        if os.path.exists(temp_path):
            os.remove(temp_path)

@router.post("/categories")
async def create_category(
    data: CategoryCreate, 
    db = Depends(get_database),
    admin = Depends(get_current_admin)
):
    return await category_service.create_category(db, data)

@router.get("/categories")
async def get_all_categories(
    db = Depends(get_database),
    admin = Depends(get_current_admin)
):
    return await category_service.get_all_categories(db)

@router.put("/categories/{category_id}")
async def update_category(
    category_id: str,
    data: CategoryUpdate,
    db = Depends(get_database),
    admin = Depends(get_current_admin)
):
    return await category_service.update_category(db, category_id, data)

@router.delete("/categories/{category_id}")
async def delete_category(
    category_id: str,
    db = Depends(get_database),
    admin = Depends(get_current_admin)
):
    return await category_service.delete_category(db, category_id)

@router.post("/upcoming-movies", response_model=UpcomingMovieInDB)
async def create_upcoming_movie(
    movie_data: UpcomingMovieCreate,
    db = Depends(get_database),
    admin = Depends(get_current_admin)
):
    return await prediction_service.create_upcoming_movie(db, movie_data)

@router.get("/upcoming-movies", response_model=List[UpcomingMovieInDB])
async def list_all_upcoming_movies(
    db = Depends(get_database),
    admin = Depends(get_current_admin)
):
    return await prediction_service.list_all_upcoming_movies(db)

@router.patch("/upcoming-movies/{movie_id}/resolve")
async def resolve_upcoming_movie(
    movie_id: str,
    actual_verdict: Verdict = Body(..., embed=True),
    db = Depends(get_database),
    admin = Depends(get_current_admin)
):
    return await prediction_service.resolve_upcoming_movie(db, movie_id, actual_verdict)

@router.delete("/upcoming-movies/{movie_id}")
async def delete_upcoming_movie(
    movie_id: str,
    db = Depends(get_database),
    admin = Depends(get_current_admin)
):
    return await prediction_service.delete_upcoming_movie(db, movie_id)

@router.get("/settings", response_model=GlobalSettings)
async def get_settings(db = Depends(get_database), admin = Depends(get_current_admin)):
    settings = await db.settings.find_one({"_id": "global"})
    if not settings:
        return GlobalSettings()
    return settings

@router.put("/settings", response_model=GlobalSettings)
async def update_settings(settings: GlobalSettings, db = Depends(get_database), admin = Depends(get_current_admin)):
    settings_dict = settings.model_dump()
    await db.settings.update_one(
        {"_id": "global"},
        {"$set": settings_dict},
        upsert=True
    )
    return settings

import httpx
from fastapi.responses import StreamingResponse

@router.get("/proxy-image")
async def proxy_image(url: str = Query(...)):
    """Proxies an image to bypass CORS and network blocks."""
    # Safety check lifted to accommodate global third-party hosting platforms
    # if not url.startswith("https://image.tmdb.org/t/p/"):
    #     raise HTTPException(status_code=400, detail="Invalid image source")

    async with httpx.AsyncClient(verify=False) as client:
        try:
            response = await client.get(url, timeout=10.0)
            response.raise_for_status()
            
            return StreamingResponse(
                iter([response.content]), 
                media_type=response.headers.get("content-type", "image/jpeg"),
                headers={
                    "Cache-Control": "public, max-age=86400",
                    "Access-Control-Allow-Origin": "*"
                }
            )
        except Exception as e:
            raise HTTPException(status_code=502, detail=f"Failed to fetch image: {str(e)}")

@router.post("/challenge")
async def challenge_review(
    payload: Dict[str, Any],
    admin: dict = Depends(get_current_admin)
):
    """
    Summon the Adversary to challenge the critic's current draft.
    """
    movie_title = payload.get("movie_title", "Untitled Movie")
    content = payload.get("content", "")
    aspects = payload.get("aspects", {})
    rating = payload.get("overall_rating", 5.0)

    challenge = await adversary_service.generate_challenge(
        movie_title=movie_title,
        content=content,
        aspects=aspects,
        rating=rating
    )
    
    if "error" in challenge:
        raise HTTPException(status_code=500, detail=challenge["error"])
        
    return challenge

@router.post("/benchmark")
async def get_scoring_benchmark(
    payload: Dict[str, Any],
    db = Depends(get_database),
    admin: dict = Depends(get_current_admin)
):
    """
    Get the AI's 'Truth Profile'. Generates once and persists forever for a movie.
    """
    movie_title = payload.get("movie_title")
    genres = payload.get("genres", [])
    release_year = payload.get("release_year")

    if not movie_title:
        raise HTTPException(status_code=400, detail="Movie title required")

    # Check for existing benchmark (Immutable Record)
    # Using title and year as a unique key for benchmarks
    benchmark_id = f"benchmark_{slugify(movie_title)}_{release_year or 'na'}"
    existing = await db.benchmarks.find_one({"_id": benchmark_id})
    if existing:
        return existing["data"]

    # Generate new benchmark (The First Manifestation)
    benchmark_data = await adversary_service.generate_scoring_benchmark(
        movie_title=movie_title,
        genres=genres,
        release_year=release_year
    )
    
    if benchmark_data:
        await db.benchmarks.insert_one({
            "_id": benchmark_id,
            "movie_title": movie_title,
            "release_year": release_year,
            "data": benchmark_data,
            "created_at": datetime.utcnow()
        })
    
    return benchmark_data
