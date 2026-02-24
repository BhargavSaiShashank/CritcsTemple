from fastapi import APIRouter, Depends, HTTPException, Body, File, UploadFile, Query
from fastapi.responses import Response
import re
import json
import traceback
from typing import List, Any, Optional, Dict
from app.db.mongodb import get_database
from app.models.review import ReviewCreate, ReviewUpdate, ReviewInDB
from app.models.movie import MovieCreate, MovieInDB
from app.services.omdb import omdb_service
from app.services.movie_service import movie_service
from app.services.analytics_service import analytics_service
from app.services.review_service import review_service
from app.services.images import image_service
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
    return await omdb_service.search_movies(title)

@router.get("/movies/latest")
async def get_latest_movies(
    category: str = Query("english"),
    admin = Depends(get_current_admin)
):
    return await omdb_service.get_discovery(category)

@router.post("/movies/fetch", response_model=MovieCreate)
async def fetch_and_save_movie(
    search_term: str = Body(..., embed=True), 
    db = Depends(get_database),
    admin = Depends(get_current_admin)
):
    return await movie_service.fetch_and_save_movie(db, search_term)

@router.post("/reviews", response_model=ReviewInDB)
async def create_review(
    review: ReviewCreate, 
    db = Depends(get_database),
    admin = Depends(get_current_admin)
):
    review_dict = review.dict()
    
    # Auto-calculate overall rating if not provided or to ensure accuracy
    if review_dict.get("overall_rating") is None or review_dict.get("overall_rating") == 0:
        review_dict["overall_rating"] = calculate_overall_score(review.aspects)
        
    review_dict["created_at"] = datetime.utcnow()
    review_dict["updated_at"] = datetime.utcnow()
    
    if review.status == "published":
        review_dict["published_at"] = datetime.utcnow()

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
    
    update_dict = update_data.dict(exclude_unset=True)
    update_dict["updated_at"] = datetime.utcnow()
    
    # Track history
    history_entry = {
        "timestamp": existing.get("updated_at"),
        "changes": {k: existing.get(k) for k in update_dict.keys() if k != "updated_at"}
    }
    
    if update_data.status == "published" and existing.get("status") != "published":
        update_dict["published_at"] = datetime.utcnow()

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

@router.post("/ai/draft-verdict")
async def draft_verdict(
    payload: dict = Body(...),
    admin = Depends(get_current_admin)
):
    """
    The Sanctuary Oracle (AI LLM Engine).
    Passes Structural DNA + Cinematic Lore to Gemini for a highly bespoke draft critique.
    """
    aspects = payload.get("aspects", {})
    lore = {
        "cast_performances": payload.get("cast_performances", ""),
        "director_trademarks": payload.get("director_trademarks", ""),
        "viewing_context": payload.get("viewing_context", ""),
        "trivia_and_details": payload.get("trivia_and_details", "")
    }
    
    # Prune empty lore
    active_lore = {k: v for k, v in lore.items() if v and v.strip()}
    
    # We call the external Oracle Service 
    from app.services.ai import generate_verdict_draft
    final_draft = await generate_verdict_draft(aspect_scores=aspects, cinematic_lore=active_lore)
    
    return {"draft": final_draft}

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
