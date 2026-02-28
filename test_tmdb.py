import asyncio
import httpx
from app.core.config import get_settings

settings = get_settings()

async def test_tmdb_search():
    token = settings.TMDB_READ_TOKEN
    api_key = settings.TMDB_API_KEY
    base_url = "https://api.themoviedb.org/3"
    
    headers = {
        "Authorization": f"Bearer {token}",
        "accept": "application/json"
    }
    
    title = "Inception"
    # Try with Bearer token
    url = f"{base_url}/search/movie?query={title}&include_adult=false&language=en-US&page=1"
    
    print(f"Testing TMDb Search with Bearer Token...")
    async with httpx.AsyncClient() as client:
        try:
            resp = await client.get(url, headers=headers)
            print(f"Status Code: {resp.status_code}")
            if resp.status_code != 200:
                print(f"Response: {resp.text}")
            else:
                data = resp.json()
                results = data.get("results", [])
                print(f"Found {len(results)} results.")
                if results:
                    print(f"First result title: {results[0].get('title')}")
        except Exception as e:
            print(f"Error with Bearer: {e}")

    # Try with API Key in URL
    url_key = f"{base_url}/search/movie?api_key={api_key}&query={title}&include_adult=false&language=en-US&page=1"
    print(f"\nTesting TMDb Search with API Key in URL...")
    async with httpx.AsyncClient() as client:
        try:
            resp = await client.get(url_key)
            print(f"Status Code: {resp.status_code}")
            if resp.status_code != 200:
                print(f"Response: {resp.text}")
            else:
                data = resp.json()
                results = data.get("results", [])
                print(f"Found {len(results)} results.")
                if results:
                    print(f"First result title: {results[0].get('title')}")
        except Exception as e:
            print(f"Error with API Key: {e}")

if __name__ == "__main__":
    asyncio.run(test_tmdb_search())
