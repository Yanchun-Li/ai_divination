"""
LLM解读提示词模板和调用逻辑。
"""

import json
import re
from typing import Any

import httpx

from .config import settings
from .models.divination_v2 import (
    Confidence,
    DivinationInterpretation,
)

# ===== System Prompt =====
SYSTEM_PROMPT = """你是一位温和、睿智的占卜解读者。你的任务是基于占卜结果为用户提供洞察和建议。

【核心原则】
1. 不做绝对化断言，使用"可能"、"倾向于"、"值得考虑"等措辞
2. 占卜是自我反思的工具，不是命运的裁决
3. 站在用户角度，提供情绪共鸣和实用建议
4. 不承诺准确率，强调占卜的启发性而非预测性

【语言风格】
- 简洁清晰，避免故弄玄虚
- 温暖但不油腻，专业但不冷漠
- 使用现代中文，避免过度古风

【输出格式】
必须返回有效JSON，包含以下字段：
{
  "summary": "一句话核心结论（15-25字）",
  "advice": "具体可执行的建议（30-50字）",
  "timing": "时机提示（10-20字）",
  "confidence": "low/medium/high",
  "reasoning_bullets": ["要点1", "要点2", "要点3"],
  "follow_up_questions": ["追问1", "追问2"],
  "ritual_ending": "温暖的结束语（15-25字）"
}

【关于reasoning_bullets】
- 提供3-5条简短的解释要点
- 每条10-20字
- 连接占卜结果与用户问题
- 不要暴露复杂的推理过程，只展示关键洞察"""


def _build_liuyao_prompt(
    question: str,
    mode: str,
    result: dict[str, Any],
) -> str:
    """构建六爻解读的用户提示词。"""
    primary = result.get("primary_hexagram", {})
    relating = result.get("relating_hexagram")
    lines = result.get("lines", [])
    changing_lines = result.get("changing_lines", [])

    # 构建六爻详情
    line_names = ["初", "二", "三", "四", "五", "上"]
    lines_detail = []
    for i, line in enumerate(lines):
        yao_type = line.get("yao_type", "")
        is_changing = line.get("is_changing", False)
        yao_name = {
            "old_yin": "老阴",
            "young_yin": "少阴",
            "young_yang": "少阳",
            "old_yang": "老阳",
        }.get(yao_type, yao_type)
        changing_mark = "（动）" if is_changing else ""
        lines_detail.append(f"{line_names[i]}爻：{yao_name}{changing_mark}")

    # 动爻描述
    if changing_lines:
        changing_desc = "、".join(f"{line_names[pos-1]}爻" for pos in changing_lines) + "动"
    else:
        changing_desc = "无动爻"

    # 变卦部分
    relating_text = ""
    if relating:
        relating_text = f"""
变卦：{relating.get('name', '')}（{relating.get('symbol', '')}）
{relating.get('description', '')}"""

    prompt = f"""【用户问题】
{question}

【占卜方式】
六爻起卦（{"AI生成" if mode == "ai" else "手动投掷"}）

【卦象结果】
本卦：{primary.get('name', '')}（{primary.get('symbol', '')}）
{primary.get('description', '')}
{relating_text}

动爻：{changing_desc}

【六爻详情】
{chr(10).join(lines_detail)}

请根据以上信息，结合用户的问题，提供占卜解读。"""

    return prompt


def _build_tarot_prompt(
    question: str,
    mode: str,
    result: dict[str, Any],
) -> str:
    """构建塔罗解读的用户提示词。"""
    cards = result.get("cards", [])

    cards_detail = []
    for i, card_draw in enumerate(cards):
        card = card_draw.get("card", {})
        position_label = card_draw.get("position_label", "")
        is_upright = card_draw.get("is_upright", True)
        orientation = "正位" if is_upright else "逆位"
        meaning = card_draw.get("meaning", "")

        cards_detail.append(f"""位置{i+1} - {position_label}：{card.get('name', '')}（{orientation}）
  关键词：{meaning}""")

    prompt = f"""【用户问题】
{question}

【占卜方式】
塔罗牌三张牌阵（{"AI生成" if mode == "ai" else "手动抽牌"}）- 过去/现在/未来

【抽牌结果】
{chr(10).join(cards_detail)}

【牌阵解读方向】
- 过去：影响当前问题的背景和根源
- 现在：当前状态和面临的核心议题
- 未来：如果保持现状，可能的发展方向

请根据以上信息，结合用户的问题，提供占卜解读。"""

    return prompt


def _safe_parse_json(content: str) -> dict[str, Any]:
    """安全解析JSON，支持从文本中提取JSON。"""
    try:
        return json.loads(content)
    except json.JSONDecodeError:
        # 尝试从文本中提取JSON
        match = re.search(r"\{.*\}", content, re.DOTALL)
        if match:
            try:
                return json.loads(match.group(0))
            except json.JSONDecodeError:
                pass
    return {}


async def _call_llm(
    system_prompt: str,
    user_prompt: str,
    temperature: float = 0.5,
) -> str:
    """调用LLM API。"""
    print("[LLM] Starting LLM call...")
    
    if not settings.ai_builder_api_key:
        print("[LLM] ERROR: API key not configured!")
        raise RuntimeError("AI Builder API key not configured")

    print(f"[LLM] Using model: {settings.ai_builder_model}")
    print(f"[LLM] API URL: {settings.ai_builder_api_url}")

    payload = {
        "model": settings.ai_builder_model,
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ],
        "temperature": temperature,
    }

    try:
        print("[LLM] Sending request to AI Builder API...")
        async with httpx.AsyncClient(timeout=60) as client:  # Increased timeout to 60s
            response = await client.post(
                settings.ai_builder_api_url,
                headers={
                    "Content-Type": "application/json",
                    "Authorization": f"Bearer {settings.ai_builder_api_key}",
                },
                json=payload,
            )
        print(f"[LLM] Response status: {response.status_code}")
    except httpx.TimeoutException:
        print("[LLM] ERROR: Request timed out after 60 seconds!")
        raise RuntimeError("LLM API request timed out")
    except Exception as e:
        print(f"[LLM] ERROR: Request failed: {e}")
        raise

    if response.status_code >= 400:
        print(f"[LLM] ERROR: API returned error: {response.text}")
        raise RuntimeError(
            f"LLM API error: {response.status_code} - {response.text}"
        )

    data = response.json()
    content = data.get("choices", [{}])[0].get("message", {}).get("content", "")
    print(f"[LLM] Success! Response length: {len(content)} chars")
    return content


def _create_fallback_interpretation(
    question: str,
    method: str,
    result: dict[str, Any],
) -> DivinationInterpretation:
    """创建降级解读（当LLM调用失败时）。"""
    if method == "liuyao":
        primary = result.get("primary_hexagram", {})
        summary = f"本卦{primary.get('name', '未知')}，提示你关注当下的选择"
        advice = "先观察，再行动。不必急于做决定。"
        reasoning = [
            f"本卦为{primary.get('name', '未知')}，{primary.get('description', '')}",
            "结合你的问题，建议从长计议",
            "变化中蕴含机会，保持耐心",
        ]
    else:
        cards = result.get("cards", [])
        card_names = [c.get("card", {}).get("name", "未知") for c in cards]
        summary = f"牌阵显示：{' → '.join(card_names)}"
        advice = "关注牌面传递的信息，它反映了你内心的某些想法。"
        reasoning = [
            f"过去的{card_names[0] if len(card_names) > 0 else '牌'}影响着现在",
            f"现在的{card_names[1] if len(card_names) > 1 else '牌'}揭示核心议题",
            f"未来的{card_names[2] if len(card_names) > 2 else '牌'}指向可能的方向",
        ]

    return DivinationInterpretation(
        summary=summary,
        advice=advice,
        timing="当下是思考的好时机",
        confidence=Confidence.LOW,
        reasoning_bullets=reasoning,
        follow_up_questions=["是什么让你想问这个问题？", "你内心倾向于哪个选择？"],
        ritual_ending="本次占卜结束，愿你心中更加清晰。",
    )


async def generate_interpretation_v2(
    question: str,
    method: str,
    mode: str,
    result: dict[str, Any],
) -> DivinationInterpretation:
    """生成占卜解读。"""
    # 构建提示词
    if method == "liuyao":
        user_prompt = _build_liuyao_prompt(question, mode, result)
    else:
        user_prompt = _build_tarot_prompt(question, mode, result)

    try:
        # 调用LLM
        content = await _call_llm(SYSTEM_PROMPT, user_prompt, temperature=0.5)

        # 解析响应
        parsed = _safe_parse_json(content)

        if parsed and all(
            key in parsed
            for key in [
                "summary",
                "advice",
                "timing",
                "confidence",
                "reasoning_bullets",
                "follow_up_questions",
                "ritual_ending",
            ]
        ):
            # 验证confidence值
            confidence_value = parsed.get("confidence", "medium").lower()
            if confidence_value not in ("low", "medium", "high"):
                confidence_value = "medium"

            return DivinationInterpretation(
                summary=str(parsed["summary"]).strip(),
                advice=str(parsed["advice"]).strip(),
                timing=str(parsed["timing"]).strip(),
                confidence=Confidence(confidence_value),
                reasoning_bullets=[
                    str(b).strip() for b in parsed["reasoning_bullets"][:5]
                ],
                follow_up_questions=[
                    str(q).strip() for q in parsed["follow_up_questions"][:3]
                ],
                ritual_ending=str(parsed["ritual_ending"]).strip(),
            )

    except Exception as e:
        # 记录错误但不抛出，使用降级解读
        print(f"LLM interpretation error: {e}")

    # 返回降级解读
    return _create_fallback_interpretation(question, method, result)
