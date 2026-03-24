import asyncio
from app.db.mongodb import get_database, connect_to_mongo
import pandas as pd

async def debug_data():
    await connect_to_mongo()
    db = get_database()
    
    # 1. Inspect Reviews
    reviews = await db.reviews.find({}).to_list(None)
    print(f"Total Reviews: {len(reviews)}")
    
    rev_data = []
    for r in reviews:
        rev_data.append({
            "title": r.get('title'),
            "movie_id": r.get('movie_id'),
            "status": r.get('status'),
            "rating": r.get('overall_rating')
        })
    df_rev = pd.DataFrame(rev_data)
    print("\n--- REVIEWS SAMPLE ---")
    print(df_rev.head(20))
    
    # 2. Inspect Movies (Metadata)
    movies = await db.movies.find({}).to_list(None)
    print(f"\nTotal Movies in Metadata Cache: {len(movies)}")
    
    mov_data = []
    for m in movies:
        mov_data.append({
            "tmdb_id": m.get('tmdb_id'),
            "title": m.get('title'),
            "genres": m.get('genres')
        })
    df_mov = pd.DataFrame(mov_data)
    print("\n--- MOVIES METADATA SAMPLE ---")
    print(df_mov.head(20))
    
    # 3. Analyze Genre Distribution
    all_genres = []
    for m in movies:
        if m.get('genres'):
            all_genres.extend(m.get('genres'))
    
    print("\n--- GENRE FREQUENCY IN DB ---")
    print(pd.Series(all_genres).value_counts())

if __name__ == "__main__":
    asyncio.run(debug_data())
