import pymongo
import certifi
import ssl

def test_sync():
    uri = "mongodb+srv://shashankdommeti524_db_user:RXIykmGS9BoSTK9U@review.jrtglai.mongodb.net/?appName=review"
    print(f"Testing SYNC connection to Atlas...")
    
    try:
        client = pymongo.MongoClient(
            uri,
            tlsCAFile=certifi.where(),
            serverSelectionTimeoutMS=5000
        )
        print("Pinging...")
        client.admin.command('ping')
        print("SUCCESS: Sync path works!")
        
        db = client["review"]
        print(f"Collections: {db.list_collection_names()}")
        
    except Exception as e:
        print(f"FAILED: Sync path failed. Error: {e}")
        
    print("\nAttempting with NO SSL validation...")
    try:
        client = pymongo.MongoClient(
            uri,
            tlsAllowInvalidCertificates=True,
            serverSelectionTimeoutMS=5000
        )
        client.admin.command('ping')
        print("SUCCESS: Insecure Sync path works!")
    except Exception as e:
        print(f"FAILED: Insecure Sync path failed. Error: {e}")

if __name__ == "__main__":
    test_sync()
