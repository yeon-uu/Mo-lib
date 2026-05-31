from fastapi import APIRouter
from pydantic import BaseModel
from typing import Any
from app.services.llm import run_stage1, run_stage2

router = APIRouter(prefix="/recommend", tags=["recommend"])


class HistoryItem(BaseModel):
    step: int
    domain: str
    title: str
    context_keywords: list[str] = []
    connection_keyword: str | None = None


class RecommendRequest(BaseModel):
    domain: str
    content_id: str
    title: str
    metadata: dict[str, Any] = {}
    history: list[HistoryItem] = []
    exclude_domains: list[str] = []


@router.post("")
async def recommend(req: RecommendRequest):
    metadata = dict(req.metadata)
    metadata["title"] = req.title

    stage1_result = await run_stage1(req.domain, metadata)
    if "error" in stage1_result:
        return stage1_result

    analysis = stage1_result.get("analysis", {})

    history = [item.model_dump(exclude_none=False) for item in req.history]

    exclude_domains = [d for d in req.exclude_domains if d]

    stage2_result = await run_stage2(
        analysis=analysis,
        history=history,
        exclude_domains=exclude_domains,
        exclude_title=req.title,
        input_domain=req.domain,
    )

    return stage2_result