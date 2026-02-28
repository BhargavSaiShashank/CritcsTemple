from fastapi import FastAPI, Depends, HTTPException, Request
from fastapi.responses import JSONResponse
import traceback
from datetime import datetime
from fastapi.middleware.cors import CORSMiddleware
from app.db.mongodb import connect_to_mongo, close_mongo_connection, get_database
from app.api.v1 import public, admin, oracle

app = FastAPI(title="The Critic's Temple")

# CORS Setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost:3000",
        "http://localhost:3001",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000",
        "https://critiquetemple.vercel.app",
        "https://temple-admin-dashboard.vercel.app",
        "https://critiquetemplesanctuary.vercel.app"
    ],
    allow_origin_regex=r"^https:\/\/.*\.vercel\.app$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup_db_client():
    await connect_to_mongo()

@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    return JSONResponse(
        status_code=exc.status_code,
        content={"success": False, "error": exc.detail},
    )

@app.exception_handler(Exception)
async def generic_exception_handler(request: Request, exc: Exception):
    error_msg = f"GLOBAL ERROR: {str(exc)}\n{traceback.format_exc()}"
    print(error_msg)
    try:
        with open("server_errors.log", "a") as f:
            f.write(f"\n--- {datetime.now()} ---\n{error_msg}\n")
    except:
        pass
        
    return JSONResponse(
        status_code=500,
        content={"success": False, "error": "Internal Server Error", "details": str(exc)},
    )

@app.on_event("shutdown")
async def shutdown_db_client():
    await close_mongo_connection()

# Include Routers
app.include_router(public.router, prefix="/api/v1", tags=["Public"])
app.include_router(admin.router, prefix="/api/v1/admin", tags=["Admin"])
app.include_router(oracle.router, prefix="/api/v1/oracle", tags=["Oracle"])

@app.get("/")
async def root():
    return {"message": "Welcome to The Critic's Temple API"}
