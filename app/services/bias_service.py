from typing import List, Dict, Any, Optional
from datetime import datetime
import pandas as pd
from app.models.bias_detector import UserBiasInDB, CategoryBias, Insight
from app.db.mongodb import get_database

class BiasService:
    @staticmethod
    async def get_user_bias(user_id: str = "default_user") -> UserBiasInDB:
        db = get_database()
        bias_doc = await db.user_bias.find_one({"user_id": user_id})
        if bias_doc:
            if "_id" in bias_doc:
                bias_doc["_id"] = str(bias_doc["_id"])
            return UserBiasInDB(**bias_doc)
        return UserBiasInDB(user_id=user_id)

    @staticmethod
    async def calculate_bias(user_id: str = "default_user"):
        db = get_database()
        
        # 1. Fetch all reviews for this user
        query = {"author": user_id}
        if user_id == "default_user":
            # Fallback: if default_user, just take all reviews (single-admin system)
            query = {}
            
        cursor = db.reviews.find(query)
        reviews = await cursor.to_list(length=1000)
        
        if not reviews:
            return None
            
        df_reviews = pd.DataFrame(reviews)
        # 2. Fetch movie details for categories (genre, director, actor)
        # Filter out invalid IDs that cause data pollution
        df_reviews = df_reviews[df_reviews['movie_id'].notna() & (df_reviews['movie_id'] != 0) & (df_reviews['movie_id'] != '0')]
        
        movie_ids = df_reviews['movie_id'].unique().tolist()
        movies_cursor = db.movies.find({
            "$and": [
                {"tmdb_id": {"$nin": [0, "0", None]}},
                {"$or": [
                    {"tmdb_id": {"$in": movie_ids}},
                    {"imdb_id": {"$in": movie_ids}}
                ]}
            ]
        })
        movies = await movies_cursor.to_list(length=1000)
        
        if not movies:
            return None
            
        df_movies = pd.DataFrame(movies)
        
        # Merge reviews with movie metadata
        if 'tmdb_id' in df_movies.columns:
            df = pd.merge(df_reviews, df_movies, left_on='movie_id', right_on='tmdb_id', suffixes=('_rev', '_mov'))
        elif 'imdb_id' in df_movies.columns:
            df = pd.merge(df_reviews, df_movies, left_on='movie_id', right_on='imdb_id', suffixes=('_rev', '_mov'))
        else:
            return None

        # Filter for published reviews and calculate the "Global Divine Average" from the full set
        df_published = df_reviews[df_reviews['status'] == 'published']
        if df_published.empty:
            return None
        
        overall_avg = df_published['overall_rating'].mean()

        # Merge reviews with movie metadata for detailed category analysis
        
        # 3. Compute Genre Bias
        genre_data = []
        # Normalization map for fragmented genres
        GENRE_MAP = {
            "Science Fiction": "Sci-Fi",
            "Action & Adventure": "Action",
            "N/A": None,
            "null": None
        }

        # Explode genres if it's a list
        df_genres = df.explode('genres')
        if not df_genres.empty and 'genres' in df_genres.columns:
            # Apply normalization
            df_genres['genres'] = df_genres['genres'].apply(lambda g: GENRE_MAP.get(g, g))
            df_genres = df_genres[df_genres['genres'].notna()]
            
            genre_stats = df_genres.groupby('genres')['overall_rating'].agg(['mean', 'count']).reset_index()
            for _, row in genre_stats.iterrows():
                if row['count'] >= 1: # Minimum 1 movie for chart visibility
                    genre_data.append(CategoryBias(
                        category=row['genres'],
                        average_rating=float(row['mean']),
                        deviation_score=float(row['mean'] - overall_avg),
                        count=int(row['count'])
                    ))
        
        # 4. Compute Director Bias
        director_data = []
        def get_directors(crew):
            return [c['name'] for c in crew if c['job'] == 'Director']
        
        df['directors'] = df['crew'].apply(get_directors)
        df_directors = df.explode('directors')
        if not df_directors.empty and 'directors' in df_directors.columns:
            dir_stats = df_directors.groupby('directors')['overall_rating'].agg(['mean', 'count']).reset_index()
            for _, row in dir_stats.iterrows():
                if row['count'] >= 1:
                    director_data.append(CategoryBias(
                        category=row['directors'],
                        average_rating=float(row['mean']),
                        deviation_score=float(row['mean'] - overall_avg),
                        count=int(row['count'])
                    ))
                    
        # 5. Hype Bias (Initial vs Reflection)
        # We need to reach into dynamic_ratings for this
        dynamic_cursor = db.dynamic_ratings.find({"user_id": user_id})
        dynamic_ratings = await dynamic_cursor.to_list(length=1000)
        
        hype_bias_score = 0.0
        if dynamic_ratings:
            hype_drops = []
            for dr in dynamic_ratings:
                phases = dr.get('phases', {})
                if 'initial' in phases and 'reflection' in phases:
                    drop = phases['initial']['score'] - phases['reflection']['score']
                    if drop > 0:
                        hype_drops.append(drop)
            if hype_drops:
                hype_bias_score = sum(hype_drops) / len(hype_drops)

        # 6. Generate Insights
        insights = []
        # Genre Insights - Filter for significance (count >= 2) to avoid single-movie bias noise
        significant_genres = [gb for gb in genre_data if gb.count >= 2]
        
        for gb in sorted(significant_genres, key=lambda x: abs(x.deviation_score), reverse=True)[:3]:
            if gb.deviation_score > 0.5:
                insights.append(Insight(
                    type="genre",
                    message=f"You rate {gb.category} movies {gb.deviation_score:.1f} points higher than your average.",
                    intensity=min(gb.deviation_score / 2.0, 1.0)
                ))
            elif gb.deviation_score < -0.5:
                insights.append(Insight(
                    type="genre",
                    message=f"You are tougher on {gb.category} movies, rating them {abs(gb.deviation_score):.1f} points lower.",
                    intensity=min(abs(gb.deviation_score) / 2.0, 1.0)
                ))
                
        if hype_bias_score > 0.5:
             insights.append(Insight(
                type="hype",
                message="High hype influence detected. Your ratings tend to drop significantly after reflection.",
                intensity=min(hype_bias_score / 4.0, 1.0)
            ))

        # 7. Save results
        bias_obj = UserBiasInDB(
            user_id=user_id,
            overall_average=float(overall_avg),
            genre_bias=genre_data,
            director_bias=director_data,
            hype_bias_score=float(hype_bias_score),
            insights=insights,
            last_updated=datetime.utcnow()
        )
        
        await db.user_bias.update_one(
            {"user_id": user_id},
            {"$set": bias_obj.dict(exclude={"id"}, by_alias=True)},
            upsert=True
        )
        
        return bias_obj
