import requests
from app.core.config import get_settings
import warnings
warnings.filterwarnings('ignore', message='Unverified HTTPS request')

settings = get_settings()

def test_tmdb_insecure():
    token = settings.TMDB_READ_TOKEN
    base_url = "https://api.themoviedb.org/3"
    title = "Inception"
    
    print(f"--- Testing TMDb INSECURE ---")
    
    headers = {
        "Authorization": f"Bearer {token}",
        "accept": "application/json"
    }
    url = f"{base_url}/search/movie?query={title}&include_adult=false&language=en-US&page=1"
    
    try:
        print("Requesting with verify=False...")
        r = requests.get(url, headers=headers, timeout=10, verify=False)
        print(f"Status: {r.status_code}")
        if r.status_code == 200:
            print(f"Success! {len(r.json().get('results', []))} results found.")
        else:
            print(f"Failed: {r.text}")
    except Exception as e:
        print(f"Insecure Request Error: {str(e)}")

if __name__ == "__main__":
    test_tmdb_insecure()
