import asyncio
from app.db.mongodb import connect_to_mongo, get_database

async def run():
    await connect_to_mongo()
    db = get_database()
    
    # Get all movie IDs with Science Fiction genre
    movies = await db.movies.find({"genres": "Science Fiction"}).to_list(100)
    sci_fi_tmdb_ids = [m.get('tmdb_id') for m in movies]
    sci_fi_imdb_ids = [m.get('imdb_id') for m in movies]
    
    print(f"Science Fiction TMDB IDs: {sci_fi_tmdb_ids}")
    
    # Get reviews for these movies
    reviews = await db.reviews.find({
        "$or": [
            {"movie_id": {"$in": sci_fi_tmdb_ids}},
            {"movie_id": {"$in": sci_fi_imdb_ids}}
        ]
    }).to_list(100)
    
    print("\nScience Fiction Reviews Found:")
    for r in reviews:
        print(f"- {r.get('movie_title')}: {r.get('overall_rating')}")

if __name__ == "__main__":
    asyncio.run(run())
