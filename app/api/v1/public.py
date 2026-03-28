from fastapi.responses import StreamingResponse, RedirectResponse
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
    content_type: Optional[str] = None, # "movie" or "tv"
    year: Optional[int] = None,
    must_watch: Optional[bool] = None,
    sort_by: Optional[str] = "date",
    order: Optional[str] = "desc",
    db = Depends(get_database)
):
    return await review_service.get_latest_reviews(
        db, limit, offset, tag, verdict, search, content_type, sort_by, order, year, must_watch
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

@router.get("/tv/{tmdb_id}")
async def get_show_details(tmdb_id: str, db = Depends(get_database)):
    show = await db.shows.find_one({"tmdb_id": int(tmdb_id)})
    if not show:
        raise HTTPException(status_code=404, detail="TV Show not found in our database")
    return review_service.serialize_doc(show)

@router.get("/proxy-image")
async def proxy_image(url: str, quality: str = None):
    """Bypass heavyweight server proxying by redirecting the client directly to the optimized TMDB/external CDN."""
    if quality and "image.tmdb.org/t/p/" in url:
        for size in ['/original/', '/w1280/', '/w780/', '/w500/', '/w300/', '/w154/', '/w92/']:
            if size in url:
                if quality == 'Micro':
                    url = url.replace(size, '/w92/')
                elif quality == 'Low':
                    url = url.replace(size, '/w300/')
                elif quality == 'Medium':
                    url = url.replace(size, '/w500/')
                elif quality == 'High':
                    url = url.replace(size, '/original/')
                break

    # 302 Redirect lets the browser handle the heavy download directly from the high-speed CDN
    return RedirectResponse(url=url)

@router.get("/settings")
async def get_public_settings(db = Depends(get_database)):
    settings = await db.settings.find_one({"_id": "global"})
    if not settings:
        return {"active_oscar_year": 2026}
    return settings

@router.get("/oscar-years")
async def get_oscar_years(db = Depends(get_database)):
    return await review_service.get_oscar_years(db)

