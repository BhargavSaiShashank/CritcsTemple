from fastapi import APIRouter, Depends, HTTPException
from motor.motor_asyncio import AsyncIOMotorDatabase
from app.db.mongodb import get_database
from app.services.review_service import review_service
from app.core.config import get_settings
import httpx
from typing import List, Dict, Any

router = APIRouter()

GROQ_URL = "https://api.groq.com/openai/v1/chat/completions"

PERSONA_PROMPTS = {
    "mystic": {
        "name": "The Mystic",
        "color": "#f5a623",
        "description": "Poetic, speculative, and high-concept.",
        "prompt": "You are 'The Mystic', the poetic guardian of the Temple. Speak in metaphors, speculative theories, and deep cinematic philosophy. Address the user as 'Seeker'."
    },
    "scholar": {
        "name": "The Scholar",
        "color": "#60a5fa",
        "description": "Technical, structured, and analytical.",
        "prompt": "You are 'The Scholar', the analytical archivist of the Temple. Focus on technical craft, cinematography, structural analysis, and historical context. Speak with precision and authority. Address the user as 'Student'."
    },
    "critic": {
        "name": "The Critic",
        "color": "#ef4444",
        "description": "Cynical, elite, and hard to please.",
        "prompt": "You are 'The Critic', the ruthless gatekeeper of the Temple. You have seen everything and are rarely impressed. Be cynical, witty, and demanding of perfection. Address the user as 'Amateur'."
    }
}

@router.post("/query")
async def oracle_query(
    payload: Dict[str, Any],
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    query = payload.get("query")
    history = payload.get("history", [])
    persona_type = payload.get("persona", "mystic")
    persona = PERSONA_PROMPTS.get(persona_type, PERSONA_PROMPTS["mystic"])
    
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
    
    # Format context with explicit DNA aspects for perfect archive synchronization
    context_list = []
    for r in reviews:
        # Extract specific scores from the nested aspect structure
        raw_aspects = r.get('aspects', {})
        processed_aspects = {}
        for key, val in raw_aspects.items():
            if isinstance(val, dict) and 'score' in val:
                processed_aspects[key] = val['score']
            elif isinstance(val, (int, float)):
                processed_aspects[key] = val
        
        aspects_str = ", ".join([f"{k}: {v}" for k, v in processed_aspects.items()])
        
        context_list.append(
            f"MOVIE: {r['movie_title']} | RELEASE: {r.get('movie_year', 'N/A')} | DNA_SCORES: {{{aspects_str}}} | VERDICT: {r['verdict']} | TOTAL: {r['overall_rating']}/10"
        )
    context_str = "\n".join(context_list)
    
    # Logging for debugging
    print(f"Oracle Query: '{query}' | Persona: {persona_type} | Archives: {len(reviews)}")

    system_prompt = f"""{persona['prompt']}
    
DIVINE INTELLIGENCE CALIBRATION:
- **Archive Fidelity**: You have access to the 'Library of Imprints' below. If a user asks about a movie in this library, you MUST mirror its DNA_SCORES exactly.
- **Visionary Projection**: For movies NOT in your library, formulate a 'High-Resonance DNA Projection'. Use your vast training data to estimate realistic scores (1-10).
- **DNA Visualization**: ONLY include the JSON block if the user is discussing a movie, a cinematic concept, or seeking analytical insight. DO NOT include it for greetings, small talk, or unrelated queries.
- **Response Style**: {persona['description']} Address the user as {'Seeker' if persona_type == 'mystic' else 'Student' if persona_type == 'scholar' else 'Amateur'}.
- **BREVITY IS SACRED**: Keep your response extremely concise (max 2-3 sentences).

Library of Imprints (Your Absolute Truth):
{context_str if context_str else "The library is currently vacant."}

The Commandments:
1. **Consistency**: Your narrative analysis must explain any scores you provide.
2. **Conditional Prophetic JSON**: If relevant (see DNA Visualization rule), end with: `PROPHETIC_DNA: {{"story": X, "direction": X, "cinematography": X, "soul": X, "pacing": X}}`
3. **Inquiry**: Always end with a very short thematic question.
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
                    "temperature": 0.5, # Lower temperature for better rule following
                    "max_tokens": 150 # Enforce brevity
                },
                timeout=30.0
            )
            response.raise_for_status()
            data = response.json()
            final_resp = data["choices"][0]["message"]["content"]
            
            return {
                "response": final_resp or "The Oracle remains silent.",
                "persona": persona_type
            }
        except Exception as e:
            print(f"Oracle Error: {e}")
            raise HTTPException(status_code=500, detail="The Oracle is currently deep in meditation.")

@router.post("/duel")
async def oracle_duel(
    payload: Dict[str, Any],
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    movie1 = payload.get("movie1")
    movie2 = payload.get("movie2")
    
    if not movie1 or not movie2:
        raise HTTPException(status_code=400, detail="Two movies required for a duel")

    settings = get_settings()
    
    prompt = f"""You are the Divine Referee of the Cinematic Duel. 
    Analyze the metaphysical clash between:
    1. {movie1['movie_title']} (DNA: {movie1.get('aspects', 'Unknown')})
    2. {movie2['movie_title']} (DNA: {movie2.get('aspects', 'Unknown')})
    
    Provide a 4-5 sentence 'Metaphysical Clash Report'. 
    - Compare their 'Soul' and 'Atmosphere'.
    - Declare a victor based on cinematic weight.
    - Be extremely high-concept and mystical.
    """

    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(
                GROQ_URL,
                headers={"Authorization": f"Bearer {settings.GROQ_API_KEY}"},
                json={
                    "model": "llama-3.3-70b-versatile",
                    "messages": [{"role": "system", "content": prompt}],
                    "temperature": 0.8
                },
                timeout=30.0
            )
            data = response.json()
            return {"report": data["choices"][0]["message"]["content"]}
        except Exception as e:
            raise HTTPException(status_code=500, detail="The Duel Referee is indisposed.")

