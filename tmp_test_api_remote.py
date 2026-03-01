import requests
import json

def test_api():
    base_url = "https://temple-backend-zgu3.onrender.com/api/v1/reviews"
    params = {"search": "once", "limit": 6}
    
    try:
        print(f"Calling API: {base_url} with params {params}")
        response = requests.get(base_url, params=params)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print("API Response Content:")
            print(json.dumps(data, indent=2))
        else:
            print(f"Error: {response.text}")
            
    except Exception as e:
        print(f"Request failed: {e}")

if __name__ == "__main__":
    test_api()
