from fastapi import APIRouter
from app.schemas.recommendation import (
    RecommendationRequest,
    RecommendationRefreshRequest,
    RecommendationResponse,
)

router = APIRouter(prefix="/recommendations", tags=["recommendation"])


@router.post("", response_model=RecommendationResponse)
async def get_recommendation(request: RecommendationRequest):
    """
    콘텐츠 입력 시 크로스 도메인 추천 요청
    - history가 비어있으면 첫 추천
    - history가 있으면 누적 맥락 반영 추천
    TODO M3: 캐시 조회 → Gemini 호출 구현
    """
    pass


@router.post("/refresh", response_model=RecommendationResponse)
async def refresh_recommendation(request: RecommendationRefreshRequest):
    """
    같은 콘텐츠에 대해 새로운 추천 요청
    TODO M3: 새로고침 로직 구현
    """
    pass