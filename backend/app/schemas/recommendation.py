from pydantic import BaseModel
from typing import Optional
from app.schemas.ai_interface import HistoryItem

# ─────────────────────────────────────────
# 추천 요청 (프론트 → 백엔드)
# ─────────────────────────────────────────

class RecommendationRequest(BaseModel):
    domain: str                        # movie / book / music
    content_id: str
    title: str
    metadata: dict
    history: list[HistoryItem] = []
    exclude_domains: list[str] = []

class RecommendationRefreshRequest(BaseModel):
    domain: str
    content_id: str
    title: str
    metadata: dict
    history: list[HistoryItem] = []
    exclude_domains: list[str] = []

# ─────────────────────────────────────────
# 추천 응답 (백엔드 → 프론트)
# ─────────────────────────────────────────

class RecommendationItem(BaseModel):
    domain: str
    title: str
    reason: str
    tags: list[str]

class RecommendationResponse(BaseModel):
    recommendations: list[RecommendationItem]
    map_title: Optional[str] = None