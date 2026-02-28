import requests
from app.core.config import get_settings

settings = get_settings()

def test_tmdb_simple():
    token = settings.TMDB_READ_TOKEN
    api_key = settings.TMDB_API_KEY
    base_url = "https://api.themoviedb.org/3"
    
    title = "Inception"
    
    print(f"--- Testing TMDb Simple ---")
    
    # Method 1: Bearer Token
    print(f"Testing with Bearer Token...")
    headers = {
        "Authorization": f"Bearer {token}",
        "accept": "application/json"
    }
    url = f"{base_url}/search/movie?query={title}&include_adult=false&language=en-US&page=1"
    
    try:
        r = requests.get(url, headers=headers, timeout=10)
        print(f"Status: {r.status_code}")
        if r.status_code == 200:
            print(f"Success! Results: {len(r.json().get('results', []))}")
        else:
            print(f"Failed: {r.text}")
    except Exception as e:
        print(f"Request Error (Bearer): {str(e)}")

    # Method 2: API Key
    print(f"\nTesting with API Key...")
    url_key = f"{base_url}/search/movie?api_key={api_key}&query={title}&include_adult=false&language=en-US&page=1"
    try:
        r = requests.get(url_key, timeout=10)
        print(f"Status: {r.status_code}")
        if r.status_code == 200:
            print(f"Success! Results: {len(r.json().get('results', []))}")
        else:
            print(f"Failed: {r.text}")
    except Exception as e:
        print(f"Request Error (API Key): {str(e)}")

if __name__ == "__main__":
    test_tmdb_simple()
