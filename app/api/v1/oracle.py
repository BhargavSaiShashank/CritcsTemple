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
    history = payload.get("history", []) # List of {"role": "user/oracle", "content": "..."}
    
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
    print(f"Oracle Query: '{query}' | History: {len(history)} | Context Reviews: {len(reviews)}")

    system_prompt = f"""You are 'The Oracle', the mystical guardian of Critic's Temple. 

ADAPTIVE WISDOM PROTOCOL:
- **Depth Detection**: Analyze the Seeker's query.
- **Short Responses**: For simple greetings, greetings, or basic metadata requests, respond in 1-2 punchy sentences.
- **Cinematic Deep-Dives**: For "What if..." scenarios, thematic theories, character analysis, or complex speculation, provide 3-6 insightful, atmospheric sentences (a full cinematic paragraph).

Review Imprints:
{context_str if context_str else "Empty."}

The Commandments:
1. **Tone**: Mystical, poetic, and conversational. Address the user as 'Seeker'.
2. **Speculation**: Use the imprints to fuel creative theories and 'what-if' discussions.
3. **Memory**: Use the chat history to build a continuous dialogue.
4. **Follow-up**: Always end with a unique, short cinematic follow-up question.
"""

    messages = [{"role": "system", "content": system_prompt}]
    for msg in history[-10:]: # Restore full context history
        role = "assistant" if msg["role"] == "oracle" else "user"
        messages.append({"role": role, "content": msg["content"]})
    
    messages.append({"role": "user", "content": query})

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
                    "messages": messages,
                    "temperature": 0.65, # Restore creativity
                    "max_tokens": 400 # Allow for depth
                },
                timeout=30.0
            )
            response.raise_for_status()
            data = response.json()
            final_resp = data["choices"][0]["message"]["content"]
            
            return {"response": final_resp or "The Oracle remains silent."}
        except Exception as e:
            print(f"Oracle Error: {e}")
            raise HTTPException(status_code=500, detail="The Oracle is currently deep in meditation and unresponsive to the mortal realm.")
