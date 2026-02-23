from fastapi import APIRouter, Depends, HTTPException, Body, File, UploadFile, Query
import re
import traceback
from typing import List, Any, Optional, Dict
from app.db.mongodb import get_database
from app.models.review import ReviewCreate, ReviewUpdate, ReviewInDB
from app.models.movie import MovieCreate, MovieInDB
from app.services.omdb import omdb_service
from app.services.images import image_service
from app.core.auth import get_current_admin
from app.core.utils import calculate_overall_score
import os
import shutil
from slugify import slugify
from datetime import datetime

router = APIRouter()

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
    print(f"ADMIN: Fetching movie details for: {search_term}")
    
    try:
        # Fetch from OMDb
        movie_data = await omdb_service.fetch_movie_details(search_term)
        
        # Check if movie already exists by imdb_id
        existing = await db.movies.find_one({"imdb_id": movie_data.imdb_id})
        if existing:
            print(f"ADMIN: Movie {movie_data.imdb_id} already exists in Sanctuary DB")
            # Filter keys to only those expected by MovieCreate to avoid validation errors
            # Using Pydantic V2 syntax
            expected_fields = MovieCreate.model_fields.keys() if hasattr(MovieCreate, "model_fields") else MovieCreate.__fields__.keys()
            filtered_existing = {k: v for k, v in existing.items() if k in expected_fields}
            return MovieCreate(**filtered_existing)

        # Save to DB - ensure we use the model's dict for clean insertion
        movie_dict = movie_data.model_dump() if hasattr(movie_data, "model_dump") else movie_data.dict()
        await db.movies.insert_one(movie_dict)
        print(f"ADMIN: Successfully saved movie {movie_data.imdb_id} to DB")
        return movie_data

    except HTTPException as he:
        # Pass through expected HTTP exceptions (like 404 Movie Not Found)
        raise he
    except Exception as e:
        print(f"ADMIN ERROR in fetch_and_save_movie: {str(e)}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Sanctuary Fetch Engine Error: {str(e)}")

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
    query = {}
    if status:
        query["status"] = status
    
    # Sort by published_at or created_at
    reviews = await db.reviews.find(query).sort("created_at", -1).to_list(1000)
    
    # Convert ObjectIds to strings for JSON serialization
    for review in reviews:
        if "_id" in review:
            review["_id"] = str(review["_id"])
            
    return reviews

@router.get("/analytics/dna")
async def get_dna_analytics(
    db = Depends(get_database),
    admin = Depends(get_current_admin)
):
    # Fetch all published reviews to build the DNA profile
    reviews = await db.reviews.find({"status": "published"}).to_list(1000)
    
    # Use a fixed order for the radar chart to keep it consistent
    aspect_keys = [
        "story", "screenplay", "direction", "acting", "cinematography",
        "editing", "bg_score", "music", "production_design", "vfx",
        "originality", "pacing", "dialogues", "climax", "opening",
        "emotional_impact", "rewatch_value"
    ]

    if not reviews:
        # Default empty aspects to show the chart structure at least
        return [{"subject": k.replace("_", " ").title(), "A": 0, "fullMark": 10} for k in aspect_keys]
        
    aspect_totals = {}
    aspect_counts = {}
    
    for r in reviews:
        aspects = r.get("aspects", {})
        if not aspects:
            continue
            
        # Aspects is a dict where keys are aspect names and values are dicts with 'score'
        # e.g., {'story': {'score': 8}, ...}, but DB could also have {'story': None}
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

@router.post("/ai/draft-verdict")
async def draft_verdict(
    aspects: dict = Body(...),
    admin = Depends(get_current_admin)
):
    """
    Sophisticated Lexical Heuristic Engine.
    Translates 0.1 precision scores into a nuanced cinematic critique.
    """
    # Logic to generate a draft from aspects
    narrative_score = sum([aspects.get(k, {}).get("score", 0) for k in ["story", "screenplay", "originality"]]) / 3
    visual_score = sum([aspects.get(k, {}).get("score", 0) for k in ["cinematography", "vfx", "production_design"]]) / 3
    audio_score = sum([aspects.get(k, {}).get("score", 0) for k in ["bg_score", "music"]]) / 2
    soul_score = sum([aspects.get(k, {}).get("score", 0) for k in ["emotional_impact", "pacing", "rewatch_value"]]) / 3
    
    # Simple templates based on scores
    templates = {
        "masterpiece": "A transcendental cinematic achievement that redefines the medium. Every structural element resonates with absolute precision.",
        "great": "A formidable entry into the cinematic lexicon. While minor fractures exist, the overall impact is undeniable and authoritative.",
        "average": "A safe, competent assembly of tropes. It fulfills its purpose without ever truly piercing the veil of mediocrity.",
        "poor": "A hollow exercise in missed potential. Structural failures in the narrative and direction lead to a fragmented, unearned experience."
    }
    
    score = (narrative_score + visual_score + audio_score + soul_score) / 4
    
    if score >= 9: base_draft = templates["masterpiece"]
    elif score >= 7.5: base_draft = templates["great"]
    elif score >= 5: base_draft = templates["average"]
    else: base_draft = templates["poor"]
    
    # Nuance based on sub-categories
    nuance = []
    if visual_score > narrative_score + 2:
        nuance.append("Visually arresting but narratively fragile.")
    if audio_score > 8.5:
        nuance.append("Anchored by a masterful and dominant sonic landscape.")
    if soul_score < 4:
        nuance.append("Technically proficient yet emotionally vacant.")
        
    final_draft = f"{base_draft} {' '.join(nuance)}"
    
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
