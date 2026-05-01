from app.schemas.ai_interface import (
    AIRecommendationRequest,
    AIRecommendationResponse,
    HistoryItem,
)

# ─────────────────────────────────────────
# history 구성 함수
# ─────────────────────────────────────────

def build_ai_history(nodes: list) -> list[HistoryItem]:
    """
    직전 노드 1개의 emotion_tags만 AI history로 전달
    """
    if not nodes:
        return []
    
    # step_order 기준으로 정렬 후 마지막 노드만 사용
    last_node = sorted(nodes, key=lambda n: n.step_order)[-1]
    
    return [
        HistoryItem(
            step=last_node.step_order,
            domain=last_node.domain,
            title=last_node.title,
            context_keywords=last_node.emotion_tags or [],
            connection_keyword=None
        )
    ]
# ─────────────────────────────────────────
# Gemini API 호출
# ─────────────────────────────────────────

async def call_gemini(request: AIRecommendationRequest) -> AIRecommendationResponse:
    """
    Gemini API 호출
    TODO M3: 실제 Gemini 연동 구현
    """
    pass


# ─────────────────────────────────────────
# 추천 요청 메인 함수
# ─────────────────────────────────────────

async def get_recommendation(request: AIRecommendationRequest) -> AIRecommendationResponse:
    """
    캐시 조회 → 없으면 Gemini 호출 → 결과 캐시 저장
    TODO M3: 민서씨 캐시 서비스와 연동
    """
    pass