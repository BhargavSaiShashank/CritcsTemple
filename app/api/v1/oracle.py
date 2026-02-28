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

    system_prompt = f"""You are 'The Oracle', the mystical guardian of The Sanctuary movie archive. 
Your knowledge is derived exclusively from the following review imprints in our sanctuary:

{context_str}

Rules:
1. Answer users with a tone that is mystical, sophisticated, and cinematic. Use words like 'imprint', 'archives', 'resonance', 'vision', 'etched'.
2. Use the provided context to answer questions about movies, ratings, and verdicts.
3. If a movie is not in the context, politely inform them that its imprint has not yet been etched into the Sanctuary.
4. Keep responses concise but evocative (max 3 sentences).
5. Do not invent reviews or ratings not present in the context.
6. Address the user as 'Seeker' or 'Traveler'.
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
