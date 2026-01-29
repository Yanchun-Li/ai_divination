import json
import logging
from typing import Literal

from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel

from ..auth import get_user_by_session
from ..db import create_divination_record, get_divination_records_by_user
from ..divination import choose_method, generate_interpretation, generate_result

router = APIRouter(prefix="/api", tags=["divination"])
logger = logging.getLogger(__name__)

DivinationMethod = Literal["tarot", "roulette"]
DivinationMode = Literal["ai", "self"]


class DivinationRequest(BaseModel):
    question: str
    mode: DivinationMode = "ai"
    method: DivinationMethod | None = None
    user_seed: str | None = None


@router.post("/divination")
async def divination(payload: DivinationRequest, request: Request):
    question = payload.question.strip()
    if not question:
        raise HTTPException(status_code=400, detail="Question is required")

    selection = {"tool": "user", "reason": "用户选择"}  # default for self mode
    method = payload.method

    if payload.mode == "ai":
        choice = await choose_method(question)
        method = choice["method"]
        selection = {"tool": "choose_method", "reason": choice["reason"]}
    elif not method:
        raise HTTPException(status_code=400, detail="Method is required for self mode")

    try:
        result = generate_result(method, question, payload.user_seed)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid method")

    explanation = await generate_interpretation(question, method, result)
    response_payload = {
        "mode": payload.mode,
        "method": method,
        "selection": selection,
        "result": result,
        "explanation": explanation,
    }

    token = request.cookies.get("session")
    user = get_user_by_session(token) if token else None
    if user:
        try:
            create_divination_record(
                user_id=user["id"],
                session_id=None,
                question=question,
                mode=payload.mode,
                method=method,
                raw_result=result,
                interpretation=explanation,
            )
        except Exception:
            logger.exception("Failed to persist divination record")

    return response_payload


@router.get("/divination/records")
def list_records(request: Request, limit: int = 20):
    token = request.cookies.get("session")
    if not token:
        raise HTTPException(status_code=401, detail="Unauthorized")

    user = get_user_by_session(token)
    if not user:
        raise HTTPException(status_code=401, detail="Unauthorized")

    records = get_divination_records_by_user(user["id"], limit=limit)
    formatted = []
    for record in records:
        interpretation = record.get("interpretation")
        if interpretation:
            try:
                interpretation = json.loads(interpretation)
            except json.JSONDecodeError:
                pass
        formatted.append(
            {
                "id": record["id"],
                "question": record["question"],
                "method": record["method"],
                "created_at": record["created_at"],
                "interpretation": interpretation,
            }
        )
    return {"records": formatted}
