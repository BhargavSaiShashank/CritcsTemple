from app.models.review import AspectRatings
from typing import Optional

def calculate_overall_score(aspects: AspectRatings, micro_calibration: Optional[str] = None) -> float:
    """
    Calculates the Divine Overall Rating (0-10) using Protocol V8.0.
    Universal Viewer-Critic Optimized Matrix (19-Aspect precision).
    """
    aspect_dict = aspects.model_dump()
    
    # 1. INDIVIDUAL ASPECT WEIGHTS (Sum = 1.0)
    # Grouped by Pillar for Organization, but calculated individually.
    weights = {
        # Narrative (25%)
        'screenplay': 0.09, 'story': 0.08, 'originality': 0.04, 'opening': 0.02, 'climax': 0.02,
        # Execution (25%)
        'direction': 0.10, 'acting': 0.08, 'dialogues': 0.04, 'thematic_depth': 0.03,
        # Visuals (23%)
        'cinematography': 0.09, 'editing': 0.07, 'production_design': 0.04, 'vfx': 0.03,
        # Audio (13%)
        'sound_design': 0.06, 'bg_score': 0.04, 'music': 0.03,
        # Soul (14%)
        'emotional_impact': 0.08, 'rewatch_value': 0.03, 'pacing': 0.03
    }

    weighted_sum = 0.0
    active_weight_total = 0.0
    pillar_scores = {
        'Narrative': [], 'Execution': [], 'Visuals': [], 'Audio': [], 'Soul': []
    }
    
    # Reverse mapping for pillar calculations
    pillar_map = {
        'screenplay': 'Narrative', 'story': 'Narrative', 'originality': 'Narrative', 'opening': 'Narrative', 'climax': 'Narrative',
        'direction': 'Execution', 'acting': 'Execution', 'dialogues': 'Execution', 'thematic_depth': 'Execution',
        'cinematography': 'Visuals', 'editing': 'Visuals', 'production_design': 'Visuals', 'vfx': 'Visuals',
        'sound_design': 'Audio', 'bg_score': 'Audio', 'music': 'Audio',
        'emotional_impact': 'Soul', 'rewatch_value': 'Soul', 'pacing': 'Soul'
    }

    # Step 1: Calculate Weighted Base Score
    for key, weight in weights.items():
        val = aspect_dict.get(key)
        if val and val.get('score') is not None:
            try:
                score_val = float(val['score'])
                if score_val > 0:
                    weighted_sum += (score_val * weight)
                    active_weight_total += weight
                    # Categorize for pillar-based refinements
                    pillar_scores[pillar_map[key]].append(score_val)
            except (ValueError, TypeError):
                pass

    if active_weight_total == 0:
        return 0.0

    # Normalize Base Score
    base_score = weighted_sum / active_weight_total
    final_score = base_score

    # Step 2: Calculate Pillar Averages for Refinements
    pillar_avgs = {p: (sum(s)/len(s)) if s else 0 for p, s in pillar_scores.items()}
    
    narrative_avg = pillar_avgs['Narrative']
    execution_avg = pillar_avgs['Execution']
    soul_avg = pillar_avgs['Soul']

    # 3. DYNAMIC REFINEMENTS (Protocol V8.0)
    
    # Gradient Foundation Penalties (The Hammer)
    # Scales according to severity of failure
    if narrative_avg < 6.5 and narrative_avg > 0:
        final_score -= (6.5 - narrative_avg) * 0.25
        
    if execution_avg < 6.5 and execution_avg > 0:
        final_score -= (6.5 - execution_avg) * 0.15

    # Gradient Soul Penalty
    if soul_avg < 6.0 and soul_avg > 0:
        final_score -= (6.0 - soul_avg) * 0.10

    # Variance / Consistency Penalty
    active_avgs = [v for v in pillar_avgs.values() if v > 0]
    if len(active_avgs) >= 3:
        gap = max(active_avgs) - min(active_avgs)
        if gap >= 2.5:
            final_score -= (gap - 2.0) * 0.15

    # 4. ZENITH SYNERGY (The Appreciation)
    # If Core departments (Narrative/Execution) are elite, they boost each other
    if narrative_avg >= 9.0 and execution_avg >= 9.0:
        synergy_bonus = ( (narrative_avg + execution_avg) / 2 - 9.0 ) * 0.5
        final_score += min(0.15, synergy_bonus)

    # All-Rounder Harmony
    if len(active_avgs) == 5 and all(a >= 8.5 for a in active_avgs):
        final_score += 0.10

    # 5. SOUL GATE (Archival Shimmer)
    # Note: V8.0 relaxes the hard cap into a soft pressure if Soul is missing
    if soul_avg < 7.0 and soul_avg > 0 and final_score > 9.0:
        final_score = 9.0 # Symbolic Cap for Cold Masterpieces

    # 6. ABSOLUTE CEILING (THE 9.70 BARRIER)
    if final_score > 9.70:
        final_score = 9.70

    # Final Clamp & Rounding
    final_score = max(0.0, min(10.0, final_score))
    return round(final_score, 2)
