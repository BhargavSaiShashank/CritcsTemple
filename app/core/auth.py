import firebase_admin
from firebase_admin import credentials, auth
from fastapi import HTTPException, Security, Depends
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from app.core.config import get_settings
import os

settings = get_settings()

# Initialize Firebase Admin
try:
    if not firebase_admin._apps:
        # Priority 1: JSON string from environment (for HF Spaces/CI)
        if settings.FIREBASE_CREDENTIALS_JSON:
            import json
            try:
                # Handle potential escaping of newlines in the private key
                cred_dict = json.loads(settings.FIREBASE_CREDENTIALS_JSON)
                if "private_key" in cred_dict:
                     cred_dict["private_key"] = cred_dict["private_key"].replace("\\n", "\n")
                
                cred = credentials.Certificate(cred_dict)
                firebase_admin.initialize_app(cred)
                print("Firebase Admin initialized using FIREBASE_CREDENTIALS_JSON.")
            except Exception as e:
                print(f"Failed to initialize Firebase from JSON string: {e}")
        
        # Priority 2: File path (Local development)
        elif settings.FIREBASE_SERVICE_ACCOUNT_PATH:
            cred_path = settings.FIREBASE_SERVICE_ACCOUNT_PATH
            if not os.path.isabs(cred_path):
                cred_path = os.path.join(os.getcwd(), cred_path)
            
            if os.path.exists(cred_path):
                cred = credentials.Certificate(cred_path)
                firebase_admin.initialize_app(cred)
                print(f"Firebase Admin initialized using file: {cred_path}")
            else:
                print(f"Firebase credentials file not found: {cred_path}")
    
    if not firebase_admin._apps:
        print("WARNING: Firebase Admin could not be initialized. Authentication features will fail.")

except Exception as e:
    print(f"CRITICAL ERROR during Firebase initialization: {e}")

security = HTTPBearer()

async def get_current_admin(res: HTTPAuthorizationCredentials = Security(security)):
    token = res.credentials
    try:
        decoded_token = auth.verify_id_token(token)
        # You can add email verification here if you want to lock it to YOUR email
        # if decoded_token.get('email') != "your_official_email@gmail.com":
        #     raise HTTPException(status_code=403, detail="Unauthorized Email")
        return decoded_token
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Invalid Authentication: {str(e)}")

async def get_current_user(res: HTTPAuthorizationCredentials = Security(security)):
    token = res.credentials
    try:
        decoded_token = auth.verify_id_token(token)
        return decoded_token
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Invalid Authentication: {str(e)}")
