import requests
import json

def test_api_full():
    url = "https://temple-backend-zgu3.onrender.com/api/v1/reviews?search=once&limit=6"
    try:
        response = requests.get(url)
        print(f"Status: {response.status_code}")
        data = response.json()
        print(f"Count: {len(data)}")
        if data:
            print(f"First Title: {data[0].get('movie_title')}")
            print(f"Verification: {'Once Upon a Time' in data[0].get('movie_title')}")
    except Exception as e:
        print(f"Failed: {e}")

if __name__ == "__main__":
    test_api_full()
