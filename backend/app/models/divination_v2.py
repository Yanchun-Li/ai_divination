"""
Pydantic models for divination v2 API.
"""

from datetime import datetime
from enum import Enum
from typing import Any, Literal

from pydantic import BaseModel, Field


# ===== 枚举类型 =====
class DivinationMode(str, Enum):
    AI = "ai"
    MANUAL = "manual"


class DivinationMethod(str, Enum):
    LIUYAO = "liuyao"
    TAROT = "tarot"


class DivinationStatus(str, Enum):
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    FAILED = "failed"


class YaoType(str, Enum):
    OLD_YIN = "old_yin"  # 老阴(6)=动爻阴变阳
    YOUNG_YIN = "young_yin"  # 少阴(8)=不动阴
    YOUNG_YANG = "young_yang"  # 少阳(7)=不动阳
    OLD_YANG = "old_yang"  # 老阳(9)=动爻阳变阴


class TarotPosition(str, Enum):
    PAST = "past"
    PRESENT = "present"
    FUTURE = "future"


class Confidence(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"


# ===== 六爻相关模型 =====
class CoinToss(BaseModel):
    """铜钱投掷结果"""

    coins: tuple[int, int, int] = Field(..., description="三枚铜钱结果：2(反)或3(正)")
    sum: int = Field(..., ge=6, le=9, description="三枚相加：6/7/8/9")
    yao_type: YaoType
    is_changing: bool = Field(..., description="是否动爻")


class LiuyaoLine(BaseModel):
    """单爻数据"""

    position: int = Field(..., ge=1, le=6, description="爻位：1-6，从下往上")
    yao_type: YaoType
    is_yang: bool = Field(..., description="本卦是否为阳爻")
    is_changing: bool
    changed_yang: bool | None = Field(None, description="变卦后是否为阳爻（仅动爻有）")


class Hexagram(BaseModel):
    """卦象数据"""

    id: int = Field(..., ge=1, le=64, description="卦序号 1-64")
    name: str = Field(..., description="卦名，如'乾'")
    symbol: str = Field(..., description="卦符号，如'☰☰'")
    description: str = Field(..., description="卦辞")
    upper_trigram: str = Field(..., description="上卦名")
    lower_trigram: str = Field(..., description="下卦名")


class LiuyaoResult(BaseModel):
    """六爻结果"""

    type: Literal["liuyao"] = "liuyao"
    lines: list[LiuyaoLine] = Field(..., min_length=6, max_length=6)
    changing_lines: list[int] = Field(default_factory=list, description="动爻位置列表")
    primary_hexagram: Hexagram
    relating_hexagram: Hexagram | None = Field(None, description="变卦（无动爻时为null）")
    raw_tosses: list[CoinToss] = Field(..., min_length=6, max_length=6)


# ===== 塔罗相关模型 =====
class TarotCard(BaseModel):
    """塔罗牌数据"""

    id: int = Field(..., ge=0, le=21)
    name: str
    name_en: str
    arcana: Literal["major", "minor"] = "major"
    suit: Literal["wands", "cups", "swords", "pentacles"] | None = None
    upright_keywords: list[str]
    reversed_keywords: list[str]


class TarotDraw(BaseModel):
    """单张抽牌结果"""

    card: TarotCard
    position: TarotPosition
    position_label: str = Field(..., description="'过去'/'现在'/'未来'")
    is_upright: bool = Field(..., description="是否正位")
    meaning: str = Field(..., description="根据正逆位的解释")


class TarotResult(BaseModel):
    """塔罗结果"""

    type: Literal["tarot"] = "tarot"
    spread_type: Literal["three_card"] = "three_card"
    spread_name: str = "过去-现在-未来"
    cards: list[TarotDraw] = Field(..., min_length=3, max_length=3)
    deck_version: str = "major_22"
    draw_sequence: list[int] = Field(..., description="抽牌顺序（card id列表）")


# ===== LLM解读结果 =====
class DivinationInterpretation(BaseModel):
    """占卜解读结果"""

    summary: str = Field(..., description="一句话结论")
    advice: str = Field(..., description="行动建议")
    timing: str = Field(..., description="时机提示")
    confidence: Confidence = Field(..., description="置信度")
    reasoning_bullets: list[str] = Field(..., description="解释要点（3-5条）")
    follow_up_questions: list[str] = Field(..., description="追问建议（2-3个）")
    ritual_ending: str = Field(..., description="结束语")


# ===== 手动步骤 =====
class ManualStep(BaseModel):
    """手动模式步骤记录"""

    step_number: int = Field(..., ge=1)
    action: Literal["coin_toss", "card_draw"]
    data: dict[str, Any]
    timestamp: datetime


class TarotDrawStep(BaseModel):
    """塔罗抽牌步骤数据"""

    card_id: int = Field(..., ge=0, le=21)
    position: TarotPosition
    is_upright: bool


# ===== 会话模型 =====
class Question(BaseModel):
    """问题"""

    text: str = Field(..., min_length=1)
    created_at: datetime


class DivinationSession(BaseModel):
    """占卜会话"""

    id: str = Field(..., description="UUID")
    user_id: str | None = None
    question: Question
    mode: DivinationMode
    method: DivinationMethod
    seed: str = Field(..., description="用于AI模式的随机种子")
    status: DivinationStatus
    result: LiuyaoResult | TarotResult | None = None
    interpretation: DivinationInterpretation | None = None
    manual_steps: list[ManualStep] | None = None
    created_at: datetime
    completed_at: datetime | None = None


# ===== API请求/响应模型 =====
class CreateSessionRequest(BaseModel):
    """创建会话请求"""

    question: str = Field(..., min_length=1, max_length=500)
    mode: DivinationMode
    method: DivinationMethod
    user_seed: str | None = None


class CreateSessionResponse(BaseModel):
    """创建会话响应"""

    session_id: str
    seed: str
    status: DivinationStatus
    created_at: datetime


class GenerateRequest(BaseModel):
    """AI生成请求"""

    session_id: str


class GenerateResponse(BaseModel):
    """AI生成响应"""

    session_id: str
    status: DivinationStatus
    result: LiuyaoResult | TarotResult
    interpretation: DivinationInterpretation


class ManualStepRequest(BaseModel):
    """手动步骤请求"""

    session_id: str
    step_number: int = Field(..., ge=1)
    action: Literal["coin_toss", "card_draw"]
    data: CoinToss | TarotDrawStep


class ManualStepResponse(BaseModel):
    """手动步骤响应"""

    session_id: str
    current_step: int
    total_steps: int
    is_complete: bool
    partial_result: dict[str, Any] | None = None


class InterpretRequest(BaseModel):
    """解读请求"""

    session_id: str


class InterpretResponse(BaseModel):
    """解读响应"""

    session_id: str
    interpretation: DivinationInterpretation


class SessionDetailResponse(BaseModel):
    """会话详情响应"""

    session: DivinationSession
