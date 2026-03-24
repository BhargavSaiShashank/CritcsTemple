from app.models.review import AspectRatings
from typing import Optional

def calculate_overall_score(aspects: AspectRatings, micro_calibration: Optional[str] = None) -> float:
    """
    Calculates the Divine Overall Rating (0-10) using the Final Efficient Logic (Locked).
    """
    aspect_dict = aspects.dict()
    
    # 1. CATEGORY WEIGHTS (LOCKED)
    categories = {
        'Narrative': {'keys': ['story', 'screenplay', 'originality', 'opening', 'climax', 'themes_depth'], 'weight': 0.35},
        'Direction': {'keys': ['direction', 'acting', 'blocking_staging'], 'weight': 0.25},
        'Visuals': {'keys': ['cinematography', 'editing', 'production_design', 'vfx', 'visual_storytelling'], 'weight': 0.15},
        'Audio': {'keys': ['bg_score', 'music', 'sound_design'], 'weight': 0.10},
        'Soul': {'keys': ['pacing', 'emotional_impact', 'rewatch_value', 'immersion'], 'weight': 0.15}
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
    direction_avg = cat_averages.get('Direction', 0)
    soul_avg = cat_averages.get('Soul', 0)

    # Foundation Penalty
    if narrative_avg < 6.5: final_score -= 0.15
    if direction_avg < 6.5: final_score -= 0.10
    
    # Soul Penalty
    if soul_avg < 6.0: final_score -= 0.05

    # Variance Penalty (Tweak)
    cat_vals = list(cat_averages.values())
    if cat_vals and min(cat_vals) < 7.0:
        gap = max(cat_vals) - min(cat_vals)
        if gap >= 3.0:
            final_score -= 0.10
        elif gap >= 2.0:
            final_score -= 0.05

    # 5. BOOSTS (CONTROLLED)
    all_cat_names = ['Narrative', 'Direction', 'Visuals', 'Audio', 'Soul']
    ready_cats = [cat_averages[c] for c in all_cat_names if c in cat_averages]
    
    boost = 0.0
    if len(ready_cats) == 5:
        if all(a >= 8.5 for a in ready_cats):
            boost += 0.07
        elif sum(1 for a in ready_cats if a >= 8.3) >= 3:
            boost += 0.03
    
    final_score += boost

    # 6. MICRO-CALIBRATION (NEW)
    # If Soul >= 9.0 or Narrative >= 9.0, allow +0.02 adjustment
    if micro_calibration == "Soul" and soul_avg >= 9.0:
        final_score += 0.02
    elif micro_calibration == "Narrative" and narrative_avg >= 9.0:
        final_score += 0.02

    # 7. SOUL GATE
    # If Soul < 7.0 -> film cannot exceed 8.5 overall
    if soul_avg < 7.0 and final_score > 8.5:
        final_score = 8.5

    # Final Ceiling
    if final_score > 9.70:
        final_score = 9.70

    # Clamp 0-10
    final_score = max(0.0, min(10.0, final_score))

    return round(final_score, 2)
