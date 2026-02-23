from app.models.review import AspectRatings

def calculate_overall_score(aspects: AspectRatings) -> float:
    """
    Calculates an average score from all provided aspect ratings.
    """
    scores = []
    aspect_dict = aspects.dict()
    
    for key, value in aspect_dict.items():
        if value and value.get('score') is not None:
            scores.append(value['score'])
    
    if not scores:
        return 0.0
    
    return round(sum(scores) / len(scores), 1)
