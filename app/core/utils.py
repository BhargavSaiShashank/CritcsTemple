from app.models.review import AspectRatings
from typing import Optional

def calculate_overall_score(aspects: AspectRatings, micro_calibration: Optional[str] = None) -> float:
    """
    Calculates the Divine Overall Rating (0-10) using the Final Efficient Logic (Locked).
    Synchronized for Protocol V7.2 (19-Aspect Matrix).
    """
    aspect_dict = aspects.model_dump()
    
    # 1. CATEGORY WEIGHTS (19-Aspect Matrix)
    categories = {
        'Narrative': {'keys': ['story', 'screenplay', 'originality', 'opening', 'climax'], 'weight': 0.35},
        'Execution': {'keys': ['direction', 'acting', 'dialogues', 'thematic_depth'], 'weight': 0.25},
        'Visuals': {'keys': ['cinematography', 'editing', 'production_design', 'vfx'], 'weight': 0.15},
        'Audio': {'keys': ['bg_score', 'music', 'sound_design'], 'weight': 0.10},
        'Soul': {'keys': ['pacing', 'emotional_impact', 'rewatch_value'], 'weight': 0.15}
    }

    cat_averages = {}
    weighted_score = 0.0
    active_weight_total = 0.0

    # Step 1: Category Averages & Base Weighted Score
    for cat_name, info in categories.items():
        cat_scores = []
        for key in info['keys']:
            val = aspect_dict.get(key)
            if val and val.get('score') is not None:
                try:
                    score_val = float(val['score'])
                    if score_val > 0:
                        cat_scores.append(score_val)
                except (ValueError, TypeError):
                    pass
        
        if cat_scores:
            cat_avg = sum(cat_scores) / len(cat_scores)
            cat_averages[cat_name] = cat_avg
            weighted_score += (cat_avg * info['weight'])
            active_weight_total += info['weight']

    if active_weight_total == 0:
        return 0.0

    # Step 2: Base Score
    base_score = weighted_score / active_weight_total
    final_score = base_score

    # 4. PENALTIES (REFINED)
    narrative_avg = cat_averages.get('Narrative', 0)
    execution_avg = cat_averages.get('Execution', 0)
    soul_avg = cat_averages.get('Soul', 0)

    # Foundation Penalty (Strict)
    if narrative_avg < 6.5: final_score -= 0.15
    if execution_avg < 6.5: final_score -= 0.10
    
    # Soul Penalty
    if soul_avg < 6.0: final_score -= 0.05

    # Variance Penalty (Consistency Check)
    cat_vals = [v for v in cat_averages.values()]
    if cat_vals and min(cat_vals) < 7.0:
        gap = max(cat_vals) - min(cat_vals)
        if gap >= 3.0:
            final_score -= 0.10
        elif gap >= 2.0:
            final_score -= 0.05

    # 5. BOOSTS (CONTROLLED)
    all_cat_names = ['Narrative', 'Execution', 'Visuals', 'Audio', 'Soul']
    ready_cats = [cat_averages[c] for c in all_cat_names if c in cat_averages]
    
    boost = 0.0
    if len(ready_cats) == 5:
        if all(a >= 8.5 for a in ready_cats):
            boost += 0.07  # Legendary Harmony
        elif sum(1 for a in ready_cats if a >= 8.3) >= 3:
            boost += 0.03  # Synergy Boost
    
    final_score += boost

    # 6. MICRO-CALIBRATION
    if micro_calibration == "Soul" and soul_avg >= 9.0:
        final_score += 0.02
    elif micro_calibration == "Narrative" and narrative_avg >= 9.0:
        final_score += 0.02

    # 7. SOUL GATE (Essential Quality Check)
    if soul_avg < 7.0 and final_score > 8.5:
        final_score = 8.5

    # Final Ceiling
    if final_score > 9.70:
        final_score = 9.70

    # Clamp 0-10
    final_score = max(0.0, min(10.0, final_score))

    return round(final_score, 2)
