from app.schemas.recommendation import RecommendationRequest
from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional

router = APIRouter(prefix="/maps", tags=["map"])


# 요청/응답 스키마 (간단한 것은 여기서 바로 정의)
class MapCreateRequest(BaseModel):
    title: Optional[str] = None        # 없으면 자동 생성

class MapTitleUpdateRequest(BaseModel):
    title: str

class NodeSaveRequest(BaseModel):
    domain: str
    external_id: Optional[str] = None
    title: str
    description: Optional[str] = None
    image_url: Optional[str] = None
    emotion_tags: Optional[list[str]] = None
    is_root: bool = False
    step_order: int
    metadata: Optional[dict] = None

class EdgeSaveRequest(BaseModel):
    source_node_id: str
    target_node_id: str
    reason: Optional[str] = None


# ─────────────────────────────────────────
# 지도 엔드포인트
# ─────────────────────────────────────────

@router.post("")
async def create_map(request: MapCreateRequest):
    """
    새 지도 생성
    TODO M3: DB에 map 레코드 생성
    """
    pass


@router.get("")
async def get_maps():
    """
    내 지도 목록 전체 조회
    TODO M3: 로그인한 사용자의 지도 목록 반환
    """
    pass


@router.get("/{map_id}")
async def get_map(map_id: str):
    """
    특정 지도 상세 조회 (노드 + 엣지 포함)
    TODO M3: map_id로 노드/엣지 전체 조회
    """
    pass


@router.patch("/{map_id}")
async def update_map_title(map_id: str, request: MapTitleUpdateRequest):
    """
    지도 이름 수정
    TODO M3: map title 업데이트
    """
    pass


@router.post("/{map_id}/continue")
async def continue_map(map_id: str, request: RecommendationRequest):
    """
    기존 지도 이어서 탐색
    TODO M3: 기존 지도의 history 불러와서 추천 요청
    """
    pass


# ─────────────────────────────────────────
# 노드 / 엣지 엔드포인트
# ─────────────────────────────────────────

@router.post("/{map_id}/nodes")
async def save_node(map_id: str, request: NodeSaveRequest):
    """
    노드 저장 (사용자가 추천 선택 시)
    TODO M3: DB에 node 레코드 생성
    """
    pass


@router.post("/{map_id}/edges")
async def save_edge(map_id: str, request: EdgeSaveRequest):
    """
    엣지 저장 (노드 간 연결)
    TODO M3: DB에 edge 레코드 생성
    """
    pass