import os
import json
from google import genai
from google.genai import types
from fastapi import HTTPException

# Initialize gemini client using environment variable GEMINI_API_KEY
def get_client():
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        print("WARNING: GEMINI_API_KEY not found in environment.")
        return None
    return genai.Client()

async def generate_verdict_draft(aspect_scores: dict, cinematic_lore: dict) -> str:
    """
    Feeds the 17 quantitative precision scores and the 4 cinematic lore text blocks
    into a Gemini Flash model to synthesize a sophisticated, film-critic style draft verdict.
    """
    client = get_client()
    if not client:
        return "The Sanctuary Oracle is offline. (Missing GEMINI_API_KEY). Please add your key to the .env file to enable AI drafting."

    # Construct a highly structured prompt context
    prompt = f"""
You are the master archivist of 'The Sanctuary: Cinema Archive', an elite, highly aesthetics-focused movie review platform.
Your tone is authoritative, deeply analytical, and slightly poetic. You write with the precision of a master film critic.

A user has just scored a film across 17 distinct architectural aspects out of 10.
Here is the quantitative structural DNA of the film:
{json.dumps(aspect_scores, indent=2)}

Additionally, they have provided 'Cinematic Lore' (deep subjective details if available):
{json.dumps(cinematic_lore, indent=2)}

YOUR TASK:
Synthesize all of this data into a single, cohesive, 3-to-4 sentence summary verdict paragraph. 
Do not explicitly say "The score is 8" or list the aspects. Instead, organically weave the highs and lows.
If the narrative scores are low but visuals are a 10, write about how the film is a "hollow visual triumph."
If dialogues and acting are phenomenal, highlight the profound human resonance.
End with a definitive, stylized summary statement. Let it sound eloquent and profound.

Return ONLY the final draft paragraph, absolutely nothing else. No markdown, no quotes.
"""

    try:
        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=prompt,
        )
        return response.text.strip()
    except Exception as e:
        print(f"Error engaging AI Oracle: {str(e)}")
        raise HTTPException(status_code=500, detail="Oracle Synthesis Failed. The neural link was severed.")
