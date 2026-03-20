from fastapi import APIRouter, HTTPException
from app.services.bias_service import BiasService
from app.models.bias_detector import UserBiasInDB

router = APIRouter()

@router.get("/", response_model=UserBiasInDB)
async def get_bias_metrics(user_id: str = "default_user"):
    bias = await BiasService.get_user_bias(user_id)
    return bias

@router.post("/recompute")
async def recompute_bias(user_id: str = "default_user"):
    try:
        bias = await BiasService.calculate_bias(user_id)
        if not bias:
            raise HTTPException(status_code=404, detail="No reviews found for user")
        return bias
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
