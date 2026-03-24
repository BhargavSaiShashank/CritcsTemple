from app.models.review import AspectRatings

def calculate_overall_score(aspects: AspectRatings) -> float:
    """
    Calculates the advanced metric-based overall score with boosts and penalties.
    """
    aspect_dict = aspects.dict()
    
    categories = {
        'Narrative': {'keys': ['story', 'screenplay', 'originality', 'opening', 'climax', 'themes_depth'], 'weight': 0.25},
        'Direction': {'keys': ['direction', 'acting', 'blocking_staging'], 'weight': 0.25},
        'Soul': {'keys': ['pacing', 'emotional_impact', 'rewatch_value', 'immersion'], 'weight': 0.20},
        'Visuals': {'keys': ['cinematography', 'editing', 'production_design', 'vfx', 'visual_storytelling'], 'weight': 0.15},
        'Audio': {'keys': ['bg_score', 'music', 'sound_design'], 'weight': 0.15}
    }

    cat_averages = {}
    weighted_score = 0.0
    active_weight_total = 0.0
    craft_penalty = 0.0

    # Step 1: Base Score & Craft Penalty
    for cat_name, info in categories.items():
        cat_scores = []
        for key in info['keys']:
            val = aspect_dict.get(key)
            if val and val.get('score') is not None:
                try:
                    score_val = float(val['score'])
                    if score_val > 0:
                        cat_scores.append(score_val)
                        if score_val <= 4.5:
                            craft_penalty += 0.03
                except ValueError:
                    pass
        
        if cat_scores:
            cat_avg = sum(cat_scores) / len(cat_scores)
            cat_averages[cat_name] = cat_avg
            weighted_score += (cat_avg * info['weight'])
            active_weight_total += info['weight']

    if active_weight_total == 0:
        return 0.0

    base_score = weighted_score / active_weight_total

    # Step 2: Variance Penalty
    cat_vals = list(cat_averages.values())
    variance_penalty = 0.0
    if cat_vals:
        variance = max(cat_vals) - min(cat_vals)
        if variance >= 3:
            variance_penalty = 0.10
        elif variance >= 2:
            variance_penalty = 0.05

    # Step 3: Foundation Penalty
    foundation_penalty = 0.0
    if 'Narrative' in cat_averages and cat_averages['Narrative'] < 6.5:
        foundation_penalty += 0.10
    if 'Direction' in cat_averages and cat_averages['Direction'] < 6.5:
        foundation_penalty += 0.05

    # Step 4: Category Boosts
    above_85 = sum(1 for v in cat_vals if v >= 8.5)
    above_83 = sum(1 for v in cat_vals if v >= 8.3)
    boost = 0.0
    if above_85 >= 4:
        boost = 0.10
    elif above_83 >= 3:
        boost = 0.05

    # Step 5: Emotion Adjustment
    emotion_adj = 0.0
    ei_data = aspect_dict.get('emotional_impact')
    if ei_data and ei_data.get('score') is not None:
        try:
            ei_score = float(ei_data['score'])
            if ei_score > 0:
                narrative_avg = cat_averages.get('Narrative', 0)
                if ei_score >= 8.5 and narrative_avg >= 7.0:
                    emotion_adj = 0.05
                elif ei_score <= 5.5:
                    emotion_adj = -0.05
        except ValueError:
            pass

    # Step 6: Final Score Calculation
    final_score = base_score + boost + emotion_adj - variance_penalty - foundation_penalty - craft_penalty
    
    # Optional clamp to ensure we stay within a standard 0-10 metric gracefully
    if final_score > 10.0:
        final_score = 10.0
    elif final_score < 0.0:
        final_score = 0.0

    return round(final_score, 2)
