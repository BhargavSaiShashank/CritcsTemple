from fastapi import APIRouter, Depends, HTTPException, Body
from fastapi.responses import StreamingResponse
import httpx
from typing import Optional
from app.db.mongodb import get_database
from app.services.review_service import review_service
from app.services.category_service import category_service

router = APIRouter()

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
    return await review_service.get_latest_reviews(
        db, limit, offset, tag, verdict, search, sort_by, order
    )

@router.get("/reviews/{slug}")
async def get_review_by_slug(slug: str, db = Depends(get_database)):
    return await review_service.get_review_by_slug(db, slug)

@router.post("/reviews/{slug}/clap")
async def clap_for_review(slug: str, db = Depends(get_database)):
    return await review_service.increment_claps(db, slug)

@router.delete("/reviews/{slug}/clap")
async def unclap_for_review(slug: str, db = Depends(get_database)):
    return await review_service.decrement_claps(db, slug)

@router.post("/reviews/{slug}/react")
async def react_to_review(
    slug: str, 
    payload: dict = Body(...), 
    db = Depends(get_database)
):
    reaction_type = payload.get("reaction_type")
    previous_type = payload.get("previous_type")
    
    valid_reactions = ["agree", "disagree", "havent_seen", None]
    if reaction_type not in valid_reactions or previous_type not in valid_reactions:
        raise HTTPException(status_code=400, detail="Invalid reaction type")
        
    return await review_service.submit_reaction(db, slug, reaction_type, previous_type)

@router.get("/reviews/{slug}/related")
async def get_related_reviews(slug: str, db = Depends(get_database)):
    return await review_service.get_related_reviews(db, slug)

@router.get("/masterpieces")
async def get_masterpieces(db = Depends(get_database)):
    return await review_service.get_masterpieces(db)

@router.get("/categories")
async def get_public_categories(db = Depends(get_database)):
    return await category_service.get_populated_categories(db)

@router.get("/movie/{imdb_id}")
async def get_movie_details(imdb_id: str, db = Depends(get_database)):
    movie = await db.movies.find_one({"imdb_id": imdb_id})
    if not movie:
        raise HTTPException(status_code=404, detail="Movie not found in our database")
    return review_service.serialize_doc(movie)

@router.get("/proxy-image")
async def proxy_image(url: str):
    """Proxy an external image to bypass CORS limits for html2canvas downloading."""
    async def stream_image():
        async with httpx.AsyncClient() as client:
            async with client.stream("GET", url) as response:
                if response.status_code != 200:
                    raise HTTPException(status_code=response.status_code, detail="Failed to fetch image")
                async for chunk in response.aiter_bytes():
                    yield chunk
    return StreamingResponse(stream_image(), media_type="image/jpeg")
