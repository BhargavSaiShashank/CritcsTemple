import pymongo
import certifi
import ssl

def test_tls_fix():
    # Stripped URL
    uri = "mongodb+srv://shashankdommeti524_db_user:RXIykmGS9BoSTK9U@review.jrtglai.mongodb.net/"
    print(f"Testing connection with TLS 1.2+ forced...")
    
    try:
        client = pymongo.MongoClient(
            uri,
            tlsCAFile=certifi.where(),
            # Explicitly force TLS version
            tls=True,
            serverSelectionTimeoutMS=5000
        )
        print("Pinging...")
        client.admin.command('ping')
        print("SUCCESS: Forced TLS works!")
    except Exception as e:
        print(f"FAILED: Forced TLS failed. Error: {e}")

if __name__ == "__main__":
    test_tls_fix()
