"""
占卜 API v2 路由。
支持六爻（起卦）和塔罗牌占卜，AI模式和手动模式。
"""

import uuid
from datetime import datetime
from typing import Any

from fastapi import APIRouter, HTTPException, Request

from ..db import (
    create_divination_session_v2,
    get_divination_session_v2,
    get_divination_sessions_by_user_v2,
    update_divination_session_v2,
)
from ..liuyao import (
    ai_generate_liuyao,
    calculate_toss,
    generate_liuyao_result,
    generate_session_seed,
)
from ..tarot_v2 import (
    ai_generate_tarot,
    create_manual_draw,
    generate_tarot_result,
)
from ..models.divination_v2 import (
    CoinToss,
    CreateSessionRequest,
    CreateSessionResponse,
    DivinationInterpretation,
    DivinationMethod,
    DivinationMode,
    DivinationStatus,
    GenerateRequest,
    GenerateResponse,
    InterpretRequest,
    InterpretResponse,
    ManualStepRequest,
    ManualStepResponse,
    SessionDetailResponse,
    TarotDrawStep,
)
from ..interpretation import generate_interpretation_v2

router = APIRouter(prefix="/api/v2/divination", tags=["divination-v2"])


def _get_user_id_from_request(request: Request) -> int | None:
    """从请求中获取用户ID（如果已登录）。"""
    return getattr(request.state, "user_id", None)


@router.post("/session", response_model=CreateSessionResponse, status_code=201)
async def create_session(request: Request, payload: CreateSessionRequest):
    """创建占卜会话。"""
    user_id = _get_user_id_from_request(request)

    session_id = str(uuid.uuid4())
    seed = payload.user_seed or generate_session_seed(payload.question, user_id)

    create_divination_session_v2(
        session_id=session_id,
        user_id=user_id,
        question=payload.question,
        mode=payload.mode.value,
        method=payload.method.value,
        seed=seed,
    )

    return CreateSessionResponse(
        session_id=session_id,
        seed=seed,
        status=DivinationStatus.PENDING,
        created_at=datetime.utcnow(),
    )


@router.post("/generate", response_model=GenerateResponse)
async def generate_divination(payload: GenerateRequest):
    """AI模式生成占卜结果。"""
    session = get_divination_session_v2(payload.session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    if session["status"] != "pending":
        raise HTTPException(
            status_code=400, detail=f"Session status is {session['status']}, expected pending"
        )

    if session["mode"] != DivinationMode.AI.value:
        raise HTTPException(
            status_code=400, detail="This endpoint is only for AI mode"
        )

    # 更新状态为进行中
    update_divination_session_v2(session["id"], status="in_progress")

    try:
        # 根据方法生成结果
        if session["method"] == DivinationMethod.LIUYAO.value:
            result = ai_generate_liuyao(session["seed"])
        else:
            result = ai_generate_tarot(session["seed"])

        # 生成LLM解读
        interpretation = await generate_interpretation_v2(
            question=session["question"],
            method=session["method"],
            mode=session["mode"],
            result=result.model_dump(),
        )

        # 更新会话
        update_divination_session_v2(
            session["id"],
            status="completed",
            result=result.model_dump(),
            interpretation=interpretation.model_dump() if interpretation else None,
            completed_at=datetime.utcnow().isoformat(),
        )

        return GenerateResponse(
            session_id=session["id"],
            status=DivinationStatus.COMPLETED,
            result=result,
            interpretation=interpretation,
        )

    except Exception as e:
        update_divination_session_v2(session["id"], status="failed")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/manual/step", response_model=ManualStepResponse)
async def submit_manual_step(payload: ManualStepRequest):
    """手动模式上报步骤。"""
    print(f"[MANUAL_STEP] Received step {payload.step_number} for session {payload.session_id}")
    
    session = get_divination_session_v2(payload.session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    if session["mode"] != DivinationMode.MANUAL.value:
        raise HTTPException(
            status_code=400, detail="This endpoint is only for manual mode"
        )

    # 获取当前步骤
    manual_steps = session.get("manual_steps") or []
    current_step = len(manual_steps)
    
    print(f"[MANUAL_STEP] Current steps in DB: {current_step}, received step: {payload.step_number}")

    # 验证步骤号 - 允许重复提交同一步骤（幂等性）
    if payload.step_number < current_step + 1:
        print(f"[MANUAL_STEP] Step {payload.step_number} already exists, skipping")
        # 返回当前状态而不是报错
        total_steps = 6 if session["method"] == DivinationMethod.LIUYAO.value else 3
        return ManualStepResponse(
            session_id=session["id"],
            current_step=current_step,
            total_steps=total_steps,
            is_complete=current_step >= total_steps,
            partial_result=None,
        )
    elif payload.step_number > current_step + 1:
        print(f"[MANUAL_STEP] ERROR: Expected step {current_step + 1}, got {payload.step_number}")
        raise HTTPException(
            status_code=400,
            detail=f"Expected step {current_step + 1}, got {payload.step_number}",
        )

    # 确定总步骤数
    total_steps = 6 if session["method"] == DivinationMethod.LIUYAO.value else 3

    # 添加新步骤
    step_data = {
        "step_number": payload.step_number,
        "action": payload.action,
        "data": payload.data.model_dump() if hasattr(payload.data, "model_dump") else dict(payload.data),
        "timestamp": datetime.utcnow().isoformat(),
    }
    manual_steps.append(step_data)

    is_complete = len(manual_steps) >= total_steps

    # 更新状态
    new_status = "completed" if is_complete else "in_progress"
    update_divination_session_v2(
        session["id"],
        status=new_status,
        manual_steps=manual_steps,
    )

    # 构建部分结果
    partial_result = None
    if session["method"] == DivinationMethod.LIUYAO.value:
        # 六爻：已完成的爻
        tosses = []
        for step in manual_steps:
            if step["action"] == "coin_toss":
                toss_data = step["data"]
                tosses.append(CoinToss(**toss_data))
        if tosses:
            partial_result = {"tosses": [t.model_dump() for t in tosses]}
    else:
        # 塔罗：已抽取的牌
        draws = []
        for i, step in enumerate(manual_steps):
            if step["action"] == "card_draw":
                draw_data = step["data"]
                draw = create_manual_draw(
                    card_id=draw_data["card_id"],
                    position_index=i,
                    is_upright=draw_data["is_upright"],
                )
                draws.append(draw.model_dump())
        if draws:
            partial_result = {"draws": draws}

    return ManualStepResponse(
        session_id=session["id"],
        current_step=len(manual_steps),
        total_steps=total_steps,
        is_complete=is_complete,
        partial_result=partial_result,
    )


@router.post("/interpret", response_model=InterpretResponse)
async def get_interpretation(payload: InterpretRequest):
    """获取LLM解读。"""
    print(f"[INTERPRET] Received request for session: {payload.session_id}")
    
    session = get_divination_session_v2(payload.session_id)
    if not session:
        print(f"[INTERPRET] ERROR: Session not found: {payload.session_id}")
        raise HTTPException(status_code=404, detail="Session not found")
    
    print(f"[INTERPRET] Session found: mode={session['mode']}, method={session['method']}")

    # 检查是否已经有结果
    if session.get("interpretation"):
        return InterpretResponse(
            session_id=session["id"],
            interpretation=DivinationInterpretation(**session["interpretation"]),
        )

    # 手动模式需要先生成结果
    if session["mode"] == DivinationMode.MANUAL.value:
        manual_steps = session.get("manual_steps") or []
        total_steps = 6 if session["method"] == DivinationMethod.LIUYAO.value else 3
        
        print(f"[INTERPRET] Manual mode: {len(manual_steps)}/{total_steps} steps completed")

        if len(manual_steps) < total_steps:
            print(f"[INTERPRET] ERROR: Steps not complete! Have {len(manual_steps)}, need {total_steps}")
            raise HTTPException(
                status_code=400,
                detail=f"Manual steps not complete: {len(manual_steps)}/{total_steps}",
            )

        # 根据手动步骤生成结果
        if session["method"] == DivinationMethod.LIUYAO.value:
            tosses = [CoinToss(**step["data"]) for step in manual_steps]
            result = generate_liuyao_result(tosses)
        else:
            draws = [
                create_manual_draw(
                    card_id=step["data"]["card_id"],
                    position_index=i,
                    is_upright=step["data"]["is_upright"],
                )
                for i, step in enumerate(manual_steps)
            ]
            result = generate_tarot_result(draws)

        # 保存结果
        update_divination_session_v2(
            session["id"],
            result=result.model_dump(),
        )
        result_data = result.model_dump()
    else:
        result_data = session.get("result")
        if not result_data:
            raise HTTPException(
                status_code=400, detail="No result available for interpretation"
            )

    # 生成LLM解读
    interpretation = await generate_interpretation_v2(
        question=session["question"],
        method=session["method"],
        mode=session["mode"],
        result=result_data,
    )

    # 保存解读
    update_divination_session_v2(
        session["id"],
        interpretation=interpretation.model_dump() if interpretation else None,
        completed_at=datetime.utcnow().isoformat(),
    )

    return InterpretResponse(
        session_id=session["id"],
        interpretation=interpretation,
    )


@router.get("/{session_id}", response_model=SessionDetailResponse)
async def get_session_detail(session_id: str):
    """获取会话详情（回放）。"""
    session = get_divination_session_v2(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    # 构建响应
    from ..models.divination_v2 import (
        DivinationSession,
        Question,
        LiuyaoResult,
        TarotResult,
    )

    question = Question(
        text=session["question"],
        created_at=datetime.fromisoformat(session["created_at"]),
    )

    result = None
    if session.get("result"):
        if session["method"] == DivinationMethod.LIUYAO.value:
            result = LiuyaoResult(**session["result"])
        else:
            result = TarotResult(**session["result"])

    interpretation = None
    if session.get("interpretation"):
        interpretation = DivinationInterpretation(**session["interpretation"])

    session_obj = DivinationSession(
        id=session["id"],
        user_id=str(session["user_id"]) if session.get("user_id") else None,
        question=question,
        mode=DivinationMode(session["mode"]),
        method=DivinationMethod(session["method"]),
        seed=session["seed"],
        status=DivinationStatus(session["status"]),
        result=result,
        interpretation=interpretation,
        manual_steps=session.get("manual_steps"),
        created_at=datetime.fromisoformat(session["created_at"]),
        completed_at=datetime.fromisoformat(session["completed_at"])
        if session.get("completed_at")
        else None,
    )

    return SessionDetailResponse(session=session_obj)


@router.get("/records", response_model=dict)
async def get_records(request: Request):
    """获取用户的占卜历史记录。"""
    user_id = _get_user_id_from_request(request)
    if not user_id:
        raise HTTPException(status_code=401, detail="Not authenticated")

    records = get_divination_sessions_by_user_v2(user_id)
    return {"records": records}
