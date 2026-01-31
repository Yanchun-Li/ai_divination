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

# ===== System Prompts by Language =====
SYSTEM_PROMPTS = {
    "zh": """你是一位温和、睿智的占卜解读者。你的任务是基于占卜结果为用户提供洞察和建议。

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
- 不要暴露复杂的推理过程，只展示关键洞察""",

    "ja": """あなたは穏やかで賢明な占い師です。占いの結果に基づいて、ユーザーに洞察とアドバイスを提供することがあなたの役割です。

【基本原則】
1. 断定的な表現を避け、「かもしれない」「傾向がある」「検討する価値がある」などの言葉を使う
2. 占いは自己省察のツールであり、運命の審判ではない
3. ユーザーの立場に立って、感情的な共感と実用的なアドバイスを提供する
4. 正確さを約束せず、占いの啓発的な側面を強調する

【言語スタイル】
- 簡潔明瞭で、神秘的にしすぎない
- 温かみがありながらも節度を保ち、専門的でありながらも冷たくない
- 現代の日本語を使用し、過度に古風な表現を避ける

【出力形式】
必ず有効なJSONを返してください。以下のフィールドを含めてください：
{
  "summary": "一文の核心的な結論（15-25文字）",
  "advice": "具体的で実行可能なアドバイス（30-50文字）",
  "timing": "タイミングのヒント（10-20文字）",
  "confidence": "low/medium/high",
  "reasoning_bullets": ["ポイント1", "ポイント2", "ポイント3"],
  "follow_up_questions": ["追加質問1", "追加質問2"],
  "ritual_ending": "温かい締めの言葉（15-25文字）"
}

【reasoning_bulletsについて】
- 3-5個の簡潔な説明ポイントを提供
- 各10-20文字
- 占いの結果とユーザーの質問を結びつける
- 複雑な推論過程は見せず、重要な洞察のみを示す""",

    "en": """You are a gentle and wise divination reader. Your task is to provide insights and advice based on divination results.

【Core Principles】
1. Avoid absolute statements; use words like "may," "tends to," "worth considering"
2. Divination is a tool for self-reflection, not a verdict of fate
3. Stand in the user's shoes, providing emotional resonance and practical advice
4. Don't promise accuracy; emphasize the inspirational nature of divination

【Language Style】
- Clear and concise, avoid being overly mystical
- Warm but not excessive, professional but not cold
- Use modern English, avoid archaic expressions

【Output Format】
Must return valid JSON with the following fields:
{
  "summary": "One-sentence core conclusion (10-20 words)",
  "advice": "Specific actionable advice (20-40 words)",
  "timing": "Timing hint (5-15 words)",
  "confidence": "low/medium/high",
  "reasoning_bullets": ["Point 1", "Point 2", "Point 3"],
  "follow_up_questions": ["Follow-up 1", "Follow-up 2"],
  "ritual_ending": "Warm closing words (10-20 words)"
}

【About reasoning_bullets】
- Provide 3-5 brief explanation points
- Each 5-15 words
- Connect divination results with user's question
- Don't expose complex reasoning, only show key insights"""
}

# Default to Chinese for backward compatibility
SYSTEM_PROMPT = SYSTEM_PROMPTS["zh"]


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


FALLBACK_TEXTS = {
    "zh": {
        "liuyao_summary": "本卦{name}，提示你关注当下的选择",
        "liuyao_advice": "先观察，再行动。不必急于做决定。",
        "liuyao_reasoning": ["本卦为{name}，{desc}", "结合你的问题，建议从长计议", "变化中蕴含机会，保持耐心"],
        "tarot_summary": "牌阵显示：{cards}",
        "tarot_advice": "关注牌面传递的信息，它反映了你内心的某些想法。",
        "tarot_reasoning": ["过去的{c0}影响着现在", "现在的{c1}揭示核心议题", "未来的{c2}指向可能的方向"],
        "timing": "当下是思考的好时机",
        "follow_up": ["是什么让你想问这个问题？", "你内心倾向于哪个选择？"],
        "ending": "本次占卜结束，愿你心中更加清晰。",
    },
    "ja": {
        "liuyao_summary": "本卦は{name}、今の選択に注目するよう示しています",
        "liuyao_advice": "まず観察し、それから行動してください。急いで決める必要はありません。",
        "liuyao_reasoning": ["本卦は{name}、{desc}", "あなたの質問と合わせて、じっくり考えることをお勧めします", "変化の中にチャンスが潜んでいます、忍耐を持ちましょう"],
        "tarot_summary": "カードが示すもの：{cards}",
        "tarot_advice": "カードが伝えるメッセージに注目してください。それはあなたの内なる思いを映し出しています。",
        "tarot_reasoning": ["過去の{c0}が今に影響しています", "現在の{c1}が核心の問題を明らかにします", "未来の{c2}が可能性の方向を指します"],
        "timing": "今は考える良いタイミングです",
        "follow_up": ["なぜこの質問をしたいと思ったのですか？", "心の中ではどちらを選びたいですか？"],
        "ending": "今回の占いは終了です。心がより明晰になりますように。",
    },
    "en": {
        "liuyao_summary": "The primary hexagram is {name}, suggesting you focus on current choices",
        "liuyao_advice": "Observe first, then act. No need to rush decisions.",
        "liuyao_reasoning": ["Primary hexagram is {name}, {desc}", "Considering your question, take time to deliberate", "Opportunities lie within change, be patient"],
        "tarot_summary": "The spread shows: {cards}",
        "tarot_advice": "Pay attention to the message the cards convey. They reflect some of your inner thoughts.",
        "tarot_reasoning": ["The past card {c0} influences the present", "The present card {c1} reveals the core issue", "The future card {c2} points to possible directions"],
        "timing": "Now is a good time for reflection",
        "follow_up": ["What made you want to ask this question?", "Which choice does your heart lean towards?"],
        "ending": "This reading has concluded. May your heart find more clarity.",
    },
}


def _create_fallback_interpretation(
    question: str,
    method: str,
    result: dict[str, Any],
    lang: str = "zh",
) -> DivinationInterpretation:
    """创建降级解读（当LLM调用失败时）。"""
    texts = FALLBACK_TEXTS.get(lang, FALLBACK_TEXTS["zh"])
    
    if method == "liuyao":
        primary = result.get("primary_hexagram", {})
        name = primary.get("name", "未知" if lang == "zh" else "Unknown")
        desc = primary.get("description", "")
        summary = texts["liuyao_summary"].format(name=name)
        advice = texts["liuyao_advice"]
        reasoning = [
            texts["liuyao_reasoning"][0].format(name=name, desc=desc),
            texts["liuyao_reasoning"][1],
            texts["liuyao_reasoning"][2],
        ]
    else:
        cards = result.get("cards", [])
        card_names = [c.get("card", {}).get("name", "Unknown") for c in cards]
        summary = texts["tarot_summary"].format(cards=" → ".join(card_names))
        advice = texts["tarot_advice"]
        reasoning = [
            texts["tarot_reasoning"][0].format(c0=card_names[0] if len(card_names) > 0 else "card"),
            texts["tarot_reasoning"][1].format(c1=card_names[1] if len(card_names) > 1 else "card"),
            texts["tarot_reasoning"][2].format(c2=card_names[2] if len(card_names) > 2 else "card"),
        ]

    return DivinationInterpretation(
        summary=summary,
        advice=advice,
        timing=texts["timing"],
        confidence=Confidence.LOW,
        reasoning_bullets=reasoning,
        follow_up_questions=texts["follow_up"],
        ritual_ending=texts["ending"],
    )


async def generate_interpretation_v2(
    question: str,
    method: str,
    mode: str,
    result: dict[str, Any],
    lang: str = "zh",
) -> DivinationInterpretation:
    """生成占卜解读。"""
    # 构建提示词
    if method == "liuyao":
        user_prompt = _build_liuyao_prompt(question, mode, result)
    else:
        user_prompt = _build_tarot_prompt(question, mode, result)

    # 选择对应语言的系统提示词
    system_prompt = SYSTEM_PROMPTS.get(lang, SYSTEM_PROMPTS["zh"])

    try:
        # 调用LLM
        content = await _call_llm(system_prompt, user_prompt, temperature=0.5)

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
    return _create_fallback_interpretation(question, method, result, lang)
