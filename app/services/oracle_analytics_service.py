from motor.motor_asyncio import AsyncIOMotorDatabase
from typing import List, Dict, Any
import httpx
import asyncio
from app.core.config import get_settings
from datetime import datetime, timedelta
import pandas as pd
import numpy as np

class OracleAnalyticsService:
    def __init__(self):
        self.settings = get_settings()
        self.tmdb_url = "https://api.themoviedb.org/3/movie/"
        self.lang_map = {
            'en': 'English', 'te': 'Telugu', 'hi': 'Hindi', 'ta': 'Tamil', 
            'ml': 'Malayalam', 'kn': 'Kannada', 'es': 'Spanish', 'ko': 'Korean', 
            'ja': 'Japanese', 'fr': 'French', 'it': 'Italian', 'de': 'German',
            'ru': 'Russian', 'pt': 'Portuguese', 'zh': 'Chinese', 'ar': 'Arabic'
        }
        self.common_genres = [
            "Action", "Adventure", "Animation", "Comedy", "Crime", "Documentary", 
            "Drama", "Family", "Fantasy", "History", "Horror", "Music", "Mystery", 
            "Romance", "Science Fiction", "Thriller", "War", "Western", "Sci-Fi"
        ]

    async def fetch_tmdb_language(self, client: httpx.AsyncClient, movie_id: Any) -> str:
        """Fetch original language from TMDB using either TMDB ID or IMDB ID."""
        if not self.settings.TMDB_API_KEY or not movie_id or movie_id == 0:
            return "en"
        
        try:
            # Handle IMDB ID (strings starting with 'tt')
            if isinstance(movie_id, str) and movie_id.startswith("tt"):
                response = await client.get(
                    f"https://api.themoviedb.org/3/find/{movie_id}",
                    params={
                        "api_key": self.settings.TMDB_API_KEY,
                        "external_source": "imdb_id"
                    },
                    timeout=5.0
                )
                if response.status_code == 200:
                    data = response.json()
                    # Check movie or tv results
                    results = data.get("movie_results", []) or data.get("tv_results", [])
                    if results:
                        return results[0].get("original_language", "en")
            
            # Default to TMDB ID lookup
            response = await client.get(
                f"{self.tmdb_url}{movie_id}",
                params={"api_key": self.settings.TMDB_API_KEY},
                timeout=5.0
            )
            if response.status_code == 200:
                return response.json().get("original_language", "en")
        except Exception:
            pass
        return "en"

    async def get_legacy_stats(self, db: AsyncIOMotorDatabase) -> Dict[str, Any]:
        cursor = db.reviews.find({"status": "published"})
        reviews = await cursor.to_list(length=2000)
        
        if not reviews:
            return {"error": "No data found"}

        # Resolve languages from TMDB for unique movie IDs
        movie_ids = {r.get("movie_id") for r in reviews if r.get("movie_id")}
        id_to_lang = {}
        
        async with httpx.AsyncClient() as client:
            tasks = {mid: self.fetch_tmdb_language(client, mid) for mid in movie_ids}
            if tasks:
                results = await asyncio.gather(*tasks.values())
                id_to_lang = dict(zip(tasks.keys(), results))

        df_list = []
        for r in reviews:
            mid = r.get("movie_id")
            # 1. Detect Language (Field -> ID Map -> Tags -> Default)
            lang = r.get("language")
            if not lang:
                lang = id_to_lang.get(mid)
                
            if not lang or lang == "en":
                # Try tags or content if ID lookup failed or returned default 'en'
                tags = [t.lower() for t in r.get("tags", [])]
                text_to_scan = (r.get("content", "") + " " + r.get("summary", "") + " " + r.get("movie_title", "")).lower()
                
                found_lang = None
                # Check mapping (check both code and full name)
                for code, full_name in self.lang_map.items():
                    if code.lower() in tags or full_name.lower() in tags or full_name.lower() in text_to_scan:
                        found_lang = code
                        break
                
                if found_lang:
                    lang = found_lang
            
            if not lang:
                lang = "en"
            
            # Normalize display name
            # If lang is already a full name (e.g. from manual entry), try to keep it or map it
            display_lang = self.lang_map.get(lang)
            if not display_lang:
                # Check if 'lang' itself is one of our values
                inv_map = {v.lower(): v for v in self.lang_map.values()}
                display_lang = inv_map.get(lang.lower(), lang.upper())
            
            # 2. Extract Genre
            genre = "Other"
            tags = r.get("tags", [])
            for g in self.common_genres:
                if g in tags:
                    genre = g
                    break

            row = {
                "id": str(r["_id"]),
                "overall_rating": float(r.get("overall_rating", 0)),
                "published_at": r.get("published_at") or r.get("created_at") or datetime.now(),
                "language": display_lang,
                "genre": genre
            }
            
            # 3. Aspects
            aspects = r.get("aspects", {})
            for aspect_name, rating_data in aspects.items():
                val = 0
                if isinstance(rating_data, dict):
                    val = rating_data.get("score", 0)
                else:
                    try: val = float(rating_data)
                    except: val = 0
                row[aspect_name.lower()] = val
            
            # 3b. Synthetic 'Soul' Score (Average of Pacing, Emotional Impact, and Rewatch Value)
            # This matches the 'Soul' group in ReviewForm.jsx
            pacing = row.get('pacing', 0)
            ei = row.get('emotional_impact', 0)
            rv = row.get('rewatch_value', 0)
            soul_aspects = [v for v in [pacing, ei, rv] if v > 0]
            row['soul'] = sum(soul_aspects) / len(soul_aspects) if soul_aspects else 0
                    
            df_list.append(row)
            
        df = pd.DataFrame(df_list)
        
        # 1. Language DNA
        lang_group = df.groupby('language')['overall_rating'].agg(['count', 'mean']).reset_index()
        lang_dna = lang_group.rename(columns={'mean': 'avg_score'}).to_dict('records')

        # 2. Aspect Correlation
        # We explicitly include 'soul' in the correlation list now
        aspect_cols = ["story", "direction", "cinematography", "soul", "pacing", "acting", "screenplay"]
        correlations = {}
        for col in aspect_cols:
            if col in df.columns and df[col].std() > 0:
                correlations[col] = float(df[col].corr(df["overall_rating"]))
            else:
                correlations[col] = 0.0
        
        # 3. Prime Radar
        prime_radar = {}
        for col in ["story", "direction", "cinematography", "soul", "pacing"]:
            if col in df.columns:
                prime_radar[col] = float(df[col].mean())
            else:
                prime_radar[col] = 5.0

        # 4. Temporal Imprints
        df['date'] = pd.to_datetime(df['published_at'])
        df['month'] = df['date'].dt.strftime('%Y-%m')
        end_date = datetime.now()
        start_date = end_date - timedelta(days=365)
        all_months = pd.date_range(start=start_date, end=end_date, freq='MS').strftime('%Y-%m').tolist()
        temporal_counts = df.groupby('month').size()
        temporal = {m: int(temporal_counts.get(m, 0)) for m in all_months}

        # 5. Genre DNA
        genre_dna = df.groupby('genre')['overall_rating'].mean().to_dict()

        # Signature
        avg_score = df['overall_rating'].mean()
        signature = "The Critical Nomad"
        if avg_score > 8.5: signature = "The Celestial Curator"
        elif avg_score >= 7.0: signature = "The Narrative Architect"
        elif prime_radar.get("soul", 0) > 8: signature = "The Atmospheric Poet"

        return {
            "total_imprints": len(reviews),
            "language_dna": lang_dna,
            "aspect_correlation": correlations,
            "prime_radar": prime_radar,
            "temporal_imprints": temporal,
            "genre_dna": genre_dna,
            "master_signature": signature
        }

oracle_analytics = OracleAnalyticsService()
