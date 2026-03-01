from fastapi import APIRouter, Depends, HTTPException, Body, File, UploadFile, Query
from fastapi.responses import Response
import re
import json
import traceback
from typing import List, Any, Optional, Dict
from app.db.mongodb import get_database
from app.models.review import ReviewCreate, ReviewUpdate, ReviewInDB
from app.models.movie import MovieCreate, MovieInDB
from app.models.show import ShowCreate
from app.models.category import CategoryCreate, CategoryUpdate, CategoryInDB
from app.services.tmdb import tmdb_service
from app.services.movie_service import movie_service
from app.services.show_service import show_service
from app.services.analytics_service import analytics_service
from app.services.review_service import review_service
from app.services.images import image_service
from app.services.category_service import category_service
from app.core.auth import get_current_admin
from app.core.utils import calculate_overall_score
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
        review_dict["overall_rating"] = calculate_overall_score(review.aspects)
        
    review_dict["created_at"] = datetime.utcnow()
    review_dict["updated_at"] = datetime.utcnow()
    
    if review.status == "published":
        review_dict["published_at"] = datetime.utcnow()
    elif review.status == "scheduled":
        # Ensure published_at is None for scheduled
        review_dict["published_at"] = None

    result = await db.reviews.insert_one(review_dict)
    review_dict["_id"] = str(result.inserted_id)
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
        update_dict["overall_rating"] = calculate_overall_score(aspects_obj)
    elif update_dict.get("overall_rating") == 0 and "aspects" in update_dict:
        # If rating is explicitly 0 but aspects are provided, recalculate
        from app.models.review import AspectRatings
        aspects_obj = AspectRatings(**update_dict["aspects"])
        update_dict["overall_rating"] = calculate_overall_score(aspects_obj)
    
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
        print(f"ADMIN ERROR in list_reviews: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Database Query Error: {str(e)}")

@router.get("/analytics/dna")
async def get_dna_analytics(
    db = Depends(get_database),
    admin = Depends(get_current_admin)
):
    return await analytics_service.get_dna_analytics(db)



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

@router.post("/categories", response_model=CategoryInDB)
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

@router.put("/categories/{category_id}", response_model=CategoryInDB)
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

import httpx
from fastapi.responses import StreamingResponse

@router.get("/proxy-image")
async def proxy_image(url: str = Query(...)):
    """Proxies an image to bypass CORS and network blocks."""
    # Safety check - only allow TMDb images
    if not url.startswith("https://image.tmdb.org/t/p/"):
        raise HTTPException(status_code=400, detail="Invalid image source")

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
