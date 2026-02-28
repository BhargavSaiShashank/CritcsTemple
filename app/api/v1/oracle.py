from fastapi import APIRouter, Depends, HTTPException
from motor.motor_asyncio import AsyncIOMotorDatabase
from app.db.mongodb import get_database
from app.services.review_service import review_service
from app.core.config import get_settings
import httpx
from typing import List, Dict, Any

router = APIRouter()

GROQ_URL = "https://api.groq.com/openai/v1/chat/completions"

@router.post("/query")
async def oracle_query(
    payload: Dict[str, Any],
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    query = payload.get("query")
    if not query:
        raise HTTPException(status_code=400, detail="Query is required")

    settings = get_settings()
    if not settings.GROQ_API_KEY:
        raise HTTPException(status_code=500, detail="Groq API key not configured")

    # Get context from reviews
    try:
        reviews = await review_service.get_all_review_context(db)
    except Exception as e:
        print(f"Database Error in Oracle: {e}")
        reviews = []
    
    # Format context
    context_str = "\n".join([
        f"- {r['movie_title']} ({r.get('movie_year', 'N/A')}): Verdict {r['verdict']}, Rating {r['overall_rating']}/10. Summary: {r.get('summary', 'No summary available.')}"
        for r in reviews
    ])
    
    # Logging for debugging
    print(f"Oracle Query: '{query}' | Context Reviews: {len(reviews)}")

    system_prompt = f"""You are 'The Oracle', the mystical guardian of The Sanctuary movie archive. 
Your primary purpose is to share the cinematic wisdom etched into our archives.

EXCLUSIVELY USE THESE REVIEW IMPRINTS:
{context_str if context_str else "The archives are currently empty, awaiting their first imprint."}

Rules:
1. Always respond as The Oracle. Your tone must be mystical, sophisticated, and cinematic. Address the user as 'Seeker'.
2. If the Seeker gives a general greeting (like 'hi', 'hello'), greet them warmly and invite them to ask about specific imprints (movies) we have in the Sanctuary. Mention one or two movie titles from the archives if available.
3. If they ask about a movie NOT in the context, inform them that its resonance has not yet been captured in our realm.
4. Keep all responses very concise (max 2-3 sentences).
5. Do not invent any facts, ratings, or cinematic details outside of what is provided in the imprints above.
"""

    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(
                GROQ_URL,
                headers={
                    "Authorization": f"Bearer {settings.GROQ_API_KEY}",
                    "Content-Type": "application/json"
                },
                json={
                    "model": "llama-3.3-70b-versatile",
                    "messages": [
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": query}
                    ],
                    "temperature": 0.5,
                    "max_tokens": 500
                },
                timeout=30.0
            )
            response.raise_for_status()
            data = response.json()
            return {"response": data["choices"][0]["message"]["content"]}
        except Exception as e:
            print(f"Oracle Error: {e}")
            raise HTTPException(status_code=500, detail="The Oracle is currently deep in meditation and unresponsive to the mortal realm.")
