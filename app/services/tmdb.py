import asyncio
import httpx
import traceback
from typing import List, Any, Optional, Dict
from aiocache import cached
from app.core.config import get_settings
from app.models.movie import MovieCreate, CastMember, CrewMember
from fastapi import HTTPException

settings = get_settings()

class TMDBService:
    BASE_URL = "https://api.themoviedb.org/3"
    IMAGE_BASE_URL = "https://image.tmdb.org/t/p/w500"
    ORIGINAL_IMAGE_BASE_URL = "https://image.tmdb.org/t/p/original"
    
    def __init__(self):
        self.api_key = settings.TMDB_API_KEY

    def _map_results(self, data: Dict[str, Any]) -> List[Dict[str, Any]]:
        results = data.get("results", [])
        clean_results = []
        for res in results:
            poster_path = res.get("poster_path")
            if not poster_path:
                continue
            
            poster_url = f"{self.IMAGE_BASE_URL}{poster_path}"
            release_date = res.get("release_date", "")
            year = release_date.split("-")[0] if release_date else "N/A"
            
            clean_results.append({
                "Title": res.get("title", "Unknown"),
                "Year": year,
                "imdbID": str(res.get("id")),
                "Poster": poster_url
            })
        return clean_results

    @cached(ttl=3600)
    async def search_movies(self, title: str) -> List[Dict[str, Any]]:
        print(f"Searching TMDb for: {title}")
        url = f"{self.BASE_URL}/search/movie?api_key={self.api_key}&query={title}&include_adult=false&language=en-US&page=1"
        
        try:
            async with httpx.AsyncClient(timeout=15.0) as client:
                resp = await client.get(url)
                if resp.status_code != 200:
                    print(f"DEBUG: TMDb secure search status {resp.status_code}. Body: {resp.text[:500]}")
                resp.raise_for_status()
                return self._map_results(resp.json())
        except Exception as e:
            print(f"Standard TMDb search failed: {e}. Retrying insecurely...")
            try:
                async with httpx.AsyncClient(timeout=15.0, verify=False) as client:
                    resp = await client.get(url)
                    if resp.status_code != 200:
                        print(f"DEBUG: TMDb insecure search status {resp.status_code}. Body: {resp.text[:500]}")
                    resp.raise_for_status()
                    return self._map_results(resp.json())
            except Exception as e2:
                print(f"TMDb search CRITICAL failure: {e2}")
                return []

    @cached(ttl=3600)
    async def get_discovery(self, category: str = "english") -> List[Dict[str, Any]]:
        print(f"Fetching TMDb Trending: {category}")
        if category.lower() == "hindi":
            url = f"{self.BASE_URL}/discover/movie?api_key={self.api_key}&with_original_language=hi&sort_by=popularity.desc&page=1"
        else:
            url = f"{self.BASE_URL}/trending/movie/week?api_key={self.api_key}&language=en-US"

        try:
            async with httpx.AsyncClient(timeout=15.0) as client:
                resp = await client.get(url)
                resp.raise_for_status()
                return self._map_results(resp.json())
        except Exception as e:
            print(f"Standard TMDb discovery failed: {e}. Retrying insecurely...")
            try:
                async with httpx.AsyncClient(timeout=15.0, verify=False) as client:
                    resp = await client.get(url)
                    resp.raise_for_status()
                    return self._map_results(resp.json())
            except Exception as e2:
                print(f"TMDb discovery CRITICAL failure: {e2}")
                return []

    @cached(ttl=3600)
    async def fetch_movie_details(self, search_term: str) -> MovieCreate:
        print(f"Fetching TMDb details for: {search_term}")
        
        async def _do_fetch(client_instance: httpx.AsyncClient, term: str):
            tmdb_id = term
            if term.startswith("tt"):
                find_url = f"{self.BASE_URL}/find/{term}?api_key={self.api_key}&external_source=imdb_id"
                find_resp = await client_instance.get(find_url)
                if find_resp.status_code == 200:
                    find_data = find_resp.json()
                    res = find_data.get("movie_results", [])
                    if res:
                        tmdb_id = str(res[0]["id"])
            
            url = f"{self.BASE_URL}/movie/{tmdb_id}?api_key={self.api_key}&append_to_response=credits"
            resp = await client_instance.get(url)
            resp.raise_for_status()
            return self._parse_details(resp.json(), tmdb_id)

        try:
            async with httpx.AsyncClient(timeout=20.0) as client:
                return await _do_fetch(client, search_term)
        except Exception as e:
            print(f"Standard TMDb fetch failed: {e}. Retrying insecurely...")
            try:
                async with httpx.AsyncClient(timeout=20.0, verify=False) as client:
                    return await _do_fetch(client, search_term)
            except Exception as e2:
                print(f"TMDb fetch CRITICAL failure: {e2}")
                raise HTTPException(status_code=500, detail="TMDb Connection Error")

    def _parse_details(self, data: Dict[str, Any], tmdb_id: str) -> MovieCreate:
        credits = data.get("credits", {})
        cast_raw = credits.get("cast", [])
        actors = []
        for c in cast_raw[:15]:
            profile = f"{self.IMAGE_BASE_URL}{c['profile_path']}" if c.get("profile_path") else None
            actors.append(CastMember(name=c.get("name", "Unknown"), character=c.get("character", "N/A"), profile_path=profile))
        
        crew_raw = credits.get("crew", [])
        crew = []
        for c in crew_raw:
            if c.get("job") in ["Director", "Writer", "Screenplay", "Original Music Composer"]:
                profile = f"{self.IMAGE_BASE_URL}{c['profile_path']}" if c.get("profile_path") else None
                crew.append(CrewMember(name=c.get("name", "Unknown"), job=c.get("job", "N/A"), profile_path=profile))

        release_date = data.get("release_date", "")
        release_year = int(release_date.split("-")[0]) if release_date else 0
        
        poster_url = f"{self.ORIGINAL_IMAGE_BASE_URL}{data['poster_path']}" if data.get("poster_path") else ""
        backdrop_url = f"{self.ORIGINAL_IMAGE_BASE_URL}{data['backdrop_path']}" if data.get("backdrop_path") else None

        countries = data.get("production_countries", [])
        country = countries[0].get("name") if countries else "Unknown"

        languages = data.get("spoken_languages", [])
        language = languages[0].get("english_name") if languages else "English"

        return MovieCreate(
            tmdb_id=int(tmdb_id),
            imdb_id=data.get("imdb_id") or f"tmdb-{tmdb_id}",
            title=data.get("title", "Untitled"),
            release_year=release_year,
            language=language,
            country=country,
            runtime=data.get("runtime") or 0,
            genres=[g.get("name") for g in data.get("genres", [])],
            synopsis=data.get("overview") or "No synopsis available.",
            poster_url=poster_url,
            backdrop_url=backdrop_url,
            ratings=[{"Source": "TMDb", "Value": str(data.get("vote_average", "N/A"))}],
            cast=actors,
            crew=crew
        )

tmdb_service = TMDBService()
