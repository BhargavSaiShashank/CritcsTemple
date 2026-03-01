import requests

def test_search_api():
    url = "https://temple-backend-zgu3.onrender.com/api/v1/reviews"
    params = {
        "limit": 6,
        "offset": 0,
        "search": "once"
    }
    
    print(f"Calling API: {url} with params {params}")
    response = requests.get(url, params=params)
    
    print(f"Status Code: {response.status_code}")
    if response.status_code == 200:
        data = response.json()
        print(f"Results count: {len(data)}")
        for item in data:
            print(f"- {item.get('movie_title')}")
    else:
        print(f"Error: {response.text}")

if __name__ == "__main__":
    test_search_api()
