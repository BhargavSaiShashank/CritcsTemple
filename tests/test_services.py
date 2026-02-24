import pytest
from app.services.movie_service import movie_service
from app.models.movie import MovieCreate

@pytest.mark.anyio
async def test_fetch_and_save_movie_integration(db):
    # This is an integration test that hits OMDb (depends on API key being valid)
    # We use a well-known IMDb ID to ensure stability
    imdb_id = "tt1375666" # Inception
    
    # Clean up any existing data in test DB
    await db.movies.delete_many({"imdb_id": imdb_id})
    
    # 1. First fetch - should save to DB
    movie = await movie_service.fetch_and_save_movie(db, imdb_id)
    assert movie.imdb_id == imdb_id
    assert movie.title == "Inception"
    
    # Check if it's in DB
    saved = await db.movies.find_one({"imdb_id": imdb_id})
    assert saved is not None
    assert saved["title"] == "Inception"
    
    # 2. Second fetch - should return from DB (with updated poster logic)
    movie_2 = await movie_service.fetch_and_save_movie(db, imdb_id)
    assert movie_2.imdb_id == imdb_id
    assert movie_2.title == "Inception"
    
@pytest.mark.anyio
async def test_get_dna_analytics_empty(db):
    from app.services.analytics_service import analytics_service
    # Clear reviews for test
    await db.reviews.delete_many({})
    
    results = await analytics_service.get_dna_analytics(db)
    assert len(results) > 0
    assert all(r["A"] == 0 for r in results)
