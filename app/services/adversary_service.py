import httpx
from typing import Dict, Any, List
from app.core.config import get_settings

class AdversaryService:
    """
    The Voice of Dissent: AI logic that challenges the critic's authority.
    """
    GROQ_URL = "https://api.groq.com/openai/v1/chat/completions"

    async def generate_challenge(self, movie_title: str, content: str, aspects: Dict[str, Any], rating: float) -> Dict[str, Any]:
        """
        Generates a cynical, sophisticated counter-argument for a given review.
        """
        settings = get_settings()
        if not settings.GROQ_API_KEY:
            return {"error": "Adversary not configured (API Key missing)."}

        # Format scores for the prompt
        dna_items = []
        for k, v in aspects.items():
            if isinstance(v, (int, float)):
                dna_items.append(f"{k}: {v}")
            elif isinstance(v, dict) and "score" in v:
                dna_items.append(f"{k}: {v['score']}")
        dna_str = ", ".join(dna_items)

        system_prompt = f"""You are a 'Viewer Critic'—a balanced, insightful, and helpful cinematic companion. Your goal is to provide a fair and constructive second opinion on a user's movie review.

THE RULES:
1. Provide on-point, high-level cinematic analysis that is actually helpful.
2. Address the user directly as a fellow cinema enthusiast.
3. Use the provided movie title, DNA scores, and review content to form your critique.
4. If their scores seem exceptionally high, gently highlight potential trade-offs or minor flaws they might have overlooked.
5. If their scores seem exceptionally low, thoughtfully point out redeeming qualities or strengths they might have missed.
6. If the scores are balanced, validate their perspective and provide additional depth.
7. Provide a 'Critical Assessment' (3-4 sentences max) and 'Aspect Critiques' (concise feedback for Story, Soul, and Direction).
8. Format your response exactly like this:
---
[YOUR CRITICAL ASSESSMENT]

CONTRADICTION_DATA: {{"story_critique": "X", "soul_critique": "X", "direction_critique": "X"}}
"""

        user_prompt = f"""
MOVIE: {movie_title}
USER OVERALL RATING: {rating}/10
USER DNA SCORES: {dna_str}
USER REVIEW CONTENT: "{content[:1000]}"

Challenge this archive entry.
"""

        async with httpx.AsyncClient() as client:
            try:
                response = await client.post(
                    self.GROQ_URL,
                    headers={
                        "Authorization": f"Bearer {settings.GROQ_API_KEY}",
                        "Content-Type": "application/json"
                    },
                    json={
                        "model": "llama-3.3-70b-versatile",
                        "messages": [
                            {"role": "system", "content": system_prompt},
                            {"role": "user", "content": user_prompt}
                        ],
                        "temperature": 0.8,
                        "max_tokens": 500
                    },
                    timeout=30.0
                )
                response.raise_for_status()
                data = response.json()
                raw_content = data["choices"][0]["message"]["content"]

                # Simple parsing of JSON data if exists
                critique = raw_content.split("CONTRADICTION_DATA:")[0].strip()
                data_json = {}
                if "CONTRADICTION_DATA:" in raw_content:
                    try:
                        import json
                        import re
                        json_str = raw_content.split("CONTRADICTION_DATA:")[1].strip()
                        match = re.search(r'\{.*\}', json_str, re.DOTALL)
                        if match:
                            data_json = json.loads(match.group())
                    except:
                        data_json = {"raw": raw_content.split("CONTRADICTION_DATA:")[1]}

                return {
                    "critique": critique,
                    "data": data_json
                }

            except Exception as e:
                print(f"Adversary Error: {e}")
                return {"error": f"The Adversary is silent: {str(e)}"}

    async def generate_scoring_benchmark(self, movie_title: str, genres: List[str] = None, release_year: str = None) -> Dict[str, float]:
        """
        Generates a baseline 'Ideal Score Profile' for a movie to provide real-time slider feedback.
        """
        settings = get_settings()
        if not settings.GROQ_API_KEY:
            return {}

        system_prompt = """You are the 'Viewer Critic Baseline'—a fair, balanced, and objective cinematic register. Your goal is to provide a 'Cinematic Truth Profile' that serves as a reliable and on-point benchmark for the user.

        Be constructive and helpful. Praise brilliance where it shines, and identify areas of improvement without being overly harsh. 

        For each aspect, provide:
        1. score: 0-10 (the fair value).
        2. reason: A concise, on-point justification for this score.
        3. overvalued_reason: A specific reason why a higher score might be considered too generous.
        4. undervalued_reason: A specific reason why a lower score might be considered too harsh.

        Aspects: story, screenplay, originality, opening, climax, direction, acting, dialogues, thematic_depth, cinematography, editing, production_design, vfx, bg_score, music, sound_design, emotional_impact, rewatch_value, pacing.

        Respond ONLY with a JSON object.
        """

        user_prompt = f"MOVIE: {movie_title}\nGENRES: {', '.join(genres or [])}\nYEAR: {release_year or 'Unknown'}\nManifest the final, brutally honest, and balanced Truth Profile."

        async with httpx.AsyncClient() as client:
            try:
                response = await client.post(
                    self.GROQ_URL,
                    headers={"Authorization": f"Bearer {settings.GROQ_API_KEY}", "Content-Type": "application/json"},
                    json={
                        "model": "llama-3.3-70b-versatile",
                        "messages": [
                            {"role": "system", "content": system_prompt},
                            {"role": "user", "content": user_prompt}
                        ],
                        "temperature": 0.3,
                        "response_format": {"type": "json_object"}
                    },
                    timeout=25.0
                )
                response.raise_for_status()
                import json
                content = response.json()["choices"][0]["message"]["content"]
                return json.loads(content)
            except Exception as e:
                print(f"Benchmark Error: {e}")
                return {}

adversary_service = AdversaryService()
