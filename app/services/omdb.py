import asyncio
import httpx
import re
import traceback
from typing import List, Any, Optional, Dict
from datetime import datetime
from aiocache import cached
from app.core.config import get_settings
from app.models.movie import MovieCreate, CastMember, CrewMember
from fastapi import HTTPException

settings = get_settings()

class OMDBService:
    BASE_URL = "https://www.omdbapi.com/"
    
    def __init__(self):
        self.api_key = settings.OMDB_API_KEY

    @cached(ttl=3600)
    async def search_movies(self, title: str) -> List[Any]:
        """
        Search for movies by title and return a list of matches.
        """
        print(f"Searching OMDb for: {title}")
        async with httpx.AsyncClient(timeout=30.0) as client:
            try:
                url = f"{self.BASE_URL}?s={title}&apikey={self.api_key}&type=movie"
                resp = await client.get(url)
                resp.raise_for_status()
                data = resp.json()
                
                if data.get("Response") == "False":
                    return []
                
                results = data.get("Search", [])
                
                # Sanctuary Quality Check & Title Cleaning
                clean_results = []
                for res in results:
                    poster = res.get("Poster", "")
                    if poster == "N/A" or "BMjA3Njg2NjYxM15BMl5BanBnXkFtZTYwNjc3NjA5" in poster or "W15BMl5BanBnXkFtZTYwNlc3NjA5" in poster:
                        continue
                    
                    res["Title"] = self._clean_title(res["Title"])
                    clean_results.append(res)
                    
                return clean_results
            except Exception as e:
                print(f"Error searching OMDb: {str(e)}")
                return []
        return []

    def _clean_title(self, title: str) -> str:
        """
        Cleans OMDb titles by stripping years, dates, and extra metadata.
        """
        title = re.sub(r'\(.*?\)', '', title)
        # Remove common year patterns
        title = re.sub(r'\b(202\d|201\d)\b', '', title)
        # Remove everything after a colon if it looks like extra info
        if ':' in title:
            parts = title.split(':')
            if any(x in parts[1].lower() for x in ['release', 'part', 'chapter', '202', 'beyond', 'run']):
                title = parts[0]
        return title.strip()

    @cached(ttl=3600)
    async def get_discovery(self, category: str = "english") -> List[Any]:
        """
        Discovery engine with Sanctuary Quality Control.
        """
        seeds = {
            "english": [
                "Wuthering Heights Margot", "Send Help Movie", "GOAT 2026", 
                "Crime 101 Hemsworth", "Zootopia 2", "Avatar Fire",
                "Scream 7", "Sonic Hedgehog 3", "Dracula 2026",
                "The Strangers Chapter", "Cold Storage 2026", "Pillion 2026",
                "Solo Mio 2026", "How to Make a Killing", "Bad News Movie"
            ],
            "hindi": [
                "O Romeo Tripti", "Mardaani 3", "Border 2", 
                "Tu Yaa Main", "Vadh 2", "Do Deewane Seher",
                "Kennedy Sunny", "Veer Murarbaji", "Assi Movie",
                "Bhabiji Ghar Par Hain", "Sardar 2", "Golmaal Five",
                "The Kerala Story 2", "Paro Pinaki", "Emergency Kangana"
            ]
        }
        
        target_titles = seeds.get(category, seeds["english"])
        all_results = []
        seen_ids = set()
        
        # Known generic placeholder posters to avoid (common OMDb production placeholders)
        placeholders = [
            "W15BMl5BanBnXkFtZTYwNlc3NjA5", 
            "BMjA3Njg2NjYxM15BMl5BanBnXkFtZTYwNjc3NjA5", # Clapperboard placeholder
            "N/A"
        ]
        
        async with httpx.AsyncClient(timeout=30.0) as client:
            # We add a few more "certain" hits to ensure we reach 20
            # English additions
            if category == "english":
                target_titles.extend(["Superman 2025", "Fantastic Four Marvel", "Tron Ares", "Blade Marvel"])
            else:
                target_titles.extend(["Singham Again", "Bhool Bhulaiyaa 3", "Emergency Movie", "Stree 2"])

            for title in target_titles:
                try:
                    url = f"{self.BASE_URL}?s={title}&apikey={self.api_key}&type=movie"
                    resp = await client.get(url)
                    if resp.status_code == 200:
                        data = resp.json()
                        if data.get("Response") == "True":
                            results = data.get("Search", [])
                            for res in results:
                                # Sanctuary Quality Check
                                poster = res.get("Poster", "")
                                if poster == "N/A": continue
                                if any(p in poster for p in placeholders): continue
                                
                                # Proactive Poster Verification
                                try:
                                    poster_check = await client.head(poster, timeout=2.0)
                                    if poster_check.status_code != 200:
                                        continue
                                except:
                                    continue

                                if res["imdbID"] in seen_ids: continue
                                
                                # Clean the title for the sanctuary view
                                res["Title"] = self._clean_title(res["Title"])
                                
                                all_results.append(res)
                                seen_ids.add(res["imdbID"])
                                if len(all_results) >= 20: break
                except Exception as e:
                    print(f"Discovery error for {title}: {str(e)}")
                if len(all_results) >= 20: break
        
        return all_results[:20]

    @cached(ttl=3600)
    async def fetch_movie_details(self, search_term: str) -> MovieCreate:
        """
        search_term can be an IMDb ID (starts with 'tt') or a Movie Title.
        """
        print(f"Fetching OMDb details for: {search_term}")
        
        async with httpx.AsyncClient(timeout=30.0) as client:
            try:
                # Determine if search_term is ID or Title
                param = "i" if search_term.startswith("tt") else "t"
                # Use a cleaner search term if it contains non-alphanumeric at start/end
                clean_term = search_term.strip()
                url = f"{self.BASE_URL}?{param}={clean_term}&apikey={self.api_key}&plot=full"
                
                print(f"Requesting OMDb URL: {url.replace(self.api_key, '***')}")
                resp = await client.get(url, follow_redirects=True)
                
                if resp.status_code != 200:
                    print(f"OMDb Error Status: {resp.status_code}")
                    print(f"OMDb Error Body: {resp.text}")
                
                resp.raise_for_status()
                data = resp.json()

                if data.get("Response") == "False":
                    error_msg = data.get('Error', 'Unknown error')
                    print(f"OMDb API Error: {error_msg}")
                    raise HTTPException(status_code=404, detail=f"Movie not found: {error_msg}")

                # Map OMDb data to our MovieCreate model with robust guards
                actor_names = data.get("Actors", "")
                if not actor_names or actor_names == "N/A":
                    actors = []
                else:
                    actors = [CastMember(name=name.strip(), character="N/A", profile_path=None) 
                             for name in actor_names.split(",") if name.strip()]
                
                crew = []
                director_names = data.get("Director", "")
                if director_names and director_names != "N/A":
                    for d in director_names.split(","):
                        if d.strip():
                            crew.append(CrewMember(name=d.strip(), job="Director", profile_path=None))
                
                writer_names = data.get("Writer", "")
                if writer_names and writer_names != "N/A":
                    for w in writer_names.split(","):
                        if w.strip():
                            crew.append(CrewMember(name=w.strip(), job="Writer", profile_path=None))

                # OMDb runtime is like "148 min"
                runtime_raw = data.get("Runtime", "0")
                if runtime_raw and " " in runtime_raw:
                    runtime_str = runtime_raw.split(" ")[0]
                    runtime = int(runtime_str) if runtime_str.isdigit() else 0
                elif runtime_raw and runtime_raw.isdigit():
                    runtime = int(runtime_raw)
                else:
                    runtime = 0

                # Genres are comma string
                genre_names = data.get("Genre", "")
                if not genre_names or genre_names == "N/A":
                    genres = []
                else:
                    genres = [g.strip() for g in genre_names.split(",") if g.strip()]

                # Year parsing - OMDb can return "2024–", "2024–2025", or just "2024"
                year_raw = data.get("Year", "0")
                if year_raw:
                    year_match = re.search(r'\d{4}', str(year_raw))
                    release_year = int(year_match.group()) if year_match else 0
                else:
                    release_year = 0

                # Proactive Poster Verification
                poster_url = data.get("Poster")
                if poster_url and poster_url != "N/A":
                    try:
                        poster_check = await client.head(poster_url, timeout=3.0)
                        if poster_check.status_code != 200:
                            print(f"OMDb Poster 404 for {poster_url}, using placeholder")
                            poster_url = "https://images.unsplash.com/photo-1485846234645-a62644f84728?q=30&w=1000"
                    except Exception as e:
                        print(f"OMDb Poster verification failed: {e}")
                        poster_url = "https://images.unsplash.com/photo-1485846234645-a62644f84728?q=30&w=1000"
                else:
                    poster_url = "https://images.unsplash.com/photo-1485846234645-a62644f84728?q=30&w=1000"

                return MovieCreate(
                    tmdb_id=0,
                    imdb_id=data.get("imdbID") or clean_term,
                    title=data.get("Title", "Untitled"),
                    release_year=release_year,
                    language=data.get("Language", "English").split(",")[0].strip() if data.get("Language") else "English",
                    country=data.get("Country", "Unknown").split(",")[0].strip() if data.get("Country") else "Unknown",
                    runtime=runtime,
                    genres=genres,
                    synopsis=data.get("Plot") or "No synopsis available.",
                    poster_url=poster_url,
                    backdrop_url=None,
                    ratings=data.get("Ratings", []),
                    cast=actors[:15],
                    crew=crew
                )
            except HTTPException as he:
                raise he
            except Exception as e:
                print(f"INTERNAL ERROR in OMDBService: {str(e)}")
                traceback.print_exc()
                raise HTTPException(status_code=500, detail=f"Failed to fetch from OMDb: {str(e)}")

omdb_service = OMDBService()
