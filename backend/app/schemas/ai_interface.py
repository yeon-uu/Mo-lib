from pydantic import BaseModel
from typing import Optional

# ─────────────────────────────────────────
# 도메인별 metadata 스키마
# ─────────────────────────────────────────

class FilmMetadata(BaseModel):
    genre: Optional[str] = None
    synopsis: Optional[str] = None
    year: Optional[int] = None
    director: Optional[str] = None

class BookMetadata(BaseModel):
    genre: Optional[str] = None
    description: Optional[str] = None
    author: Optional[str] = None

class MusicMetadata(BaseModel):
    genre: Optional[str] = None
    artist: Optional[str] = None
    mood_tags: Optional[list[str]] = None

# ─────────────────────────────────────────
# history 항목 스키마
# ─────────────────────────────────────────

class HistoryItem(BaseModel):
    step: int
    domain: str
    title: str
    context_keywords: list[str]        # emotion_tags를 그대로 사용
    connection_keyword: Optional[str] = None  # 1단계는 None

# ─────────────────────────────────────────
# AI 요청 스키마 (백엔드 → AI)
# ─────────────────────────────────────────

class AIRecommendationRequest(BaseModel):
    schema_version: str = "1.0"
    domain: str                        # movie / book / music
    content_id: str                    # 외부 API ID
    title: str
    metadata: dict                     # FilmMetadata | BookMetadata | MusicMetadata
    history: list[HistoryItem] = []    # 첫 노드면 빈 배열
    exclude_domains: list[str] = []    # 필터링 제외 도메인

# ─────────────────────────────────────────
# AI 응답 스키마 (AI → 백엔드)
# ─────────────────────────────────────────

class AIRecommendationItem(BaseModel):
    domain: str
    title: str
    reason: str                        # 추천 이유
    tags: list[str]                    # 감성 태그 → DB emotion_tags에 저장

class AIRecommendationResponse(BaseModel):
    recommendations: list[AIRecommendationItem]
    map_title: Optional[str] = None    # 노드 2개 이상일 때만 반환