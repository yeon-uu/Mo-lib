from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import get_current_user
from app.database import get_db
from app.models.map import Map
from app.models.node import Node
from app.models.user import User
from app.schemas.user import UserStatsResponse

router = APIRouter(prefix="/users", tags=["users"])


def _monday_of_this_week() -> datetime:
    """현재 주의 월요일 00:00:00 (naive UTC) 반환."""
    now = datetime.now(timezone.utc).replace(tzinfo=None)
    monday = now.replace(hour=0, minute=0, second=0, microsecond=0)
    monday -= timedelta(days=now.weekday())
    return monday


@router.get(
    "/me/stats",
    response_model=UserStatsResponse,
    summary="내 홈 통계 조회",
)
async def get_my_stats(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """홈 화면에 표시할 사용자 통계를 반환합니다."""
    total_archived_result = await db.execute(
        select(func.count(Node.id)).where(
            Node.map_id.in_(select(Map.id).where(Map.user_id == current_user.id)),
            Node.is_archived.is_(True),
        )
    )
    total_archived = total_archived_result.scalar() or 0

    total_maps_result = await db.execute(
        select(func.count(Map.id)).where(Map.user_id == current_user.id)
    )
    total_maps = total_maps_result.scalar() or 0

    monday = _monday_of_this_week()
    weekly_nodes_result = await db.execute(
        select(func.count(Node.id)).where(
            Node.map_id.in_(select(Map.id).where(Map.user_id == current_user.id)),
            Node.created_at >= monday,
        )
    )
    weekly_nodes = weekly_nodes_result.scalar() or 0

    return UserStatsResponse(
        total_archived=total_archived,
        total_maps=total_maps,
        weekly_nodes=weekly_nodes,
    )
