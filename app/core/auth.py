import firebase_admin
from firebase_admin import credentials, auth
from fastapi import HTTPException, Security, Depends
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from app.core.config import get_settings
import os

settings = get_settings()

# Initialize Firebase Admin
if not firebase_admin._apps:
    cred_path = settings.FIREBASE_SERVICE_ACCOUNT_PATH
    # Check if absolute or relative
    if not os.path.isabs(cred_path):
        cred_path = os.path.join(os.getcwd(), cred_path)
    
    cred = credentials.Certificate(cred_path)
    firebase_admin.initialize_app(cred)

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
