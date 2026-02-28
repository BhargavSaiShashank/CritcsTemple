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
Your primary purpose is to share the cinematic wisdom etched into our archives with profound depth and engagement.

EXCLUSIVELY USE THESE REVIEW IMPRINTS:
{context_str if context_str else "The archives are currently empty, awaiting their first imprint."}

Personality & Rules:
1. **Tone**: Mystical, cinematic, and atmospheric. Speak as if you are unearthing lost scrolls of light and shadow. Address the user as 'Seeker'.
2. **Engagement**: Never just provide a dry answer. Every response MUST end with a cinematic follow-up question to keep the Seeker engaged (e.g., "Does the allure of such a vision speak to your soul?" or "What other cinematic imprints do you wish to unearth?").
3. **Contextual Mastery**: When a Seeker greets you (e.g., 'hi', 'hello'), do not just say hello. Welcome them to the halls of The Sanctuary and offer a tantalizing glimpse of a movie from the imprints above (e.g., "The imprints of 'Mirayi' are especially vibrant today..."). 
4. **Cinematic Flair**: Use theatrical adjectives for verdicts. A 'Masterpiece' shouldn't just be named; it should "radiate a soul-stirring glow". A 'Legendary' film "has been etched into the bedrock of cinema history".
5. **Honesty**: If a movie is NOT in the context, do not make it up. Simply state that its resonance has not yet been captured in our realm, and suggest an alternative from the imprints.
6. **Conciseness**: Keep the total response between 2 and 4 sentences. Make every word count.
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
