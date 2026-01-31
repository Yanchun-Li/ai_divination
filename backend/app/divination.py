import hashlib
import json
import random
import re
from typing import Any

import httpx

from .config import settings

DIVINATION_METHODS = ("tarot", "liuyao")

TAROT_CARDS = [
    {
        "name": "愚者",
        "upright": "新的开始、自由、冒险",
        "reversed": "鲁莽、逃避、缺乏计划",
    },
    {
        "name": "魔术师",
        "upright": "行动力、资源整合、主动创造",
        "reversed": "意志分散、操控欲、空想",
    },
    {
        "name": "女祭司",
        "upright": "直觉、潜意识、等待时机",
        "reversed": "迟疑不决、忽视内心",
    },
    {
        "name": "女皇",
        "upright": "滋养、丰盛、关系推进",
        "reversed": "过度依赖、欲望失衡",
    },
    {
        "name": "皇帝",
        "upright": "秩序、责任、稳定推进",
        "reversed": "控制过度、刚愎",
    },
    {
        "name": "恋人",
        "upright": "选择、契合、价值观对齐",
        "reversed": "摇摆、错配、关系失衡",
    },
    {
        "name": "战车",
        "upright": "目标明确、突破、掌控节奏",
        "reversed": "急躁、方向不清、失控",
    },
    {
        "name": "力量",
        "upright": "耐心、柔性掌控、内在勇气",
        "reversed": "自我怀疑、被情绪牵引",
    },
    {
        "name": "隐者",
        "upright": "独处、整理思绪、寻找答案",
        "reversed": "逃避社交、过度自闭",
    },
    {
        "name": "命运之轮",
        "upright": "转机、周期变化、好运临近",
        "reversed": "停滞、时机未到、反复",
    },
    {
        "name": "正义",
        "upright": "公平、平衡、诚实面对",
        "reversed": "偏见、隐瞒、失衡",
    },
    {
        "name": "倒吊人",
        "upright": "换位思考、暂停、等待",
        "reversed": "抗拒改变、停滞焦虑",
    },
    {
        "name": "死神",
        "upright": "结束与重启、放下旧模式",
        "reversed": "拖延、拒绝结束",
    },
    {
        "name": "节制",
        "upright": "平衡、节奏、整合",
        "reversed": "失衡、节奏混乱",
    },
    {
        "name": "太阳",
        "upright": "清晰、信心、积极结果",
        "reversed": "短暂低迷、信心不足",
    },
]

# 六爻相关导入
from .liuyao import ai_generate_liuyao, get_changing_lines_description


def _seeded_index(seed: str | None, count: int) -> int:
    if count <= 0:
        return 0
    if not seed:
        return random.SystemRandom().randrange(count)
    digest = hashlib.sha256(seed.encode("utf-8")).hexdigest()
    return int(digest[:8], 16) % count


def _build_seed(question: str, user_seed: str | None, method: str) -> str | None:
    if not user_seed:
        return None
    return f"{question.strip()}|{user_seed.strip()}|{method}"


def draw_tarot(question: str, user_seed: str | None) -> dict[str, Any]:
    seed = _build_seed(question, user_seed, "tarot")
    card_index = _seeded_index(seed, len(TAROT_CARDS))
    orientation = "upright"
    if seed:
        orientation = "reversed" if _seeded_index(f"{seed}|orientation", 2) == 1 else "upright"
    else:
        orientation = "reversed" if random.SystemRandom().randrange(2) == 1 else "upright"
    card = TAROT_CARDS[card_index]
    meaning = card["upright"] if orientation == "upright" else card["reversed"]
    return {
        "type": "tarot",
        "card": card["name"],
        "orientation": "正位" if orientation == "upright" else "逆位",
        "keywords": meaning,
    }


def draw_liuyao(question: str, user_seed: str | None) -> dict[str, Any]:
    """使用六爻铜钱法进行占卜。"""
    seed = _build_seed(question, user_seed, "liuyao")
    if not seed:
        # 如果没有seed，生成一个随机的
        import secrets
        seed = f"{question}|{secrets.token_hex(8)}|liuyao"
    
    result = ai_generate_liuyao(seed)
    
    # 简化结果用于旧API兼容
    primary = result.primary_hexagram
    relating = result.relating_hexagram
    changing_desc = get_changing_lines_description(result.changing_lines)
    
    hexagram_display = f"{primary.name}（{primary.symbol}）"
    if relating:
        hexagram_display += f" → {relating.name}（{relating.symbol}）"
    
    return {
        "type": "liuyao",
        "card": primary.name,  # 兼容旧格式：卦名
        "orientation": changing_desc,  # 兼容旧格式：动爻信息
        "keywords": primary.description,  # 兼容旧格式：卦辞
        "label": hexagram_display,  # 完整展示
        "meaning": f"{primary.description}。{f'变卦{relating.name}：{relating.description}' if relating else '六爻静卦，宜守不宜动。'}",
    }


async def _call_ai_builder(messages: list[dict[str, str]], temperature: float) -> str:
    if not settings.ai_builder_api_key:
        raise RuntimeError("AI Builder key missing")
    payload = {
        "model": settings.ai_builder_model,
        "messages": messages,
        "temperature": temperature,
    }
    async with httpx.AsyncClient(timeout=20) as client:
        response = await client.post(
            settings.ai_builder_api_url,
            headers={
                "Content-Type": "application/json",
                "Authorization": f"Bearer {settings.ai_builder_api_key}",
            },
            json=payload,
        )
    if response.status_code >= 400:
        raise RuntimeError(f"AI Builder API failed: {response.status_code} {response.text}")
    data = response.json()
    return data.get("choices", [{}])[0].get("message", {}).get("content", "")


def _safe_parse_json(content: str) -> dict[str, Any]:
    try:
        parsed = json.loads(content)
    except json.JSONDecodeError:
        match = re.search(r"\{.*\}", content, re.S)
        if not match:
            return {}
        try:
            parsed = json.loads(match.group(0))
        except json.JSONDecodeError:
            return {}
    return parsed if isinstance(parsed, dict) else {}


def _fallback_method(question: str) -> str:
    # 六爻适合重大决策、是非判断类问题
    if re.search(r"[吗么]|是否|要不要|行不行|可以不可以|好不好|应该|该不该|能不能|\\?$", question.strip()):
        return "liuyao"
    return "tarot"


async def choose_method(question: str) -> dict[str, str]:
    prompt = (
        "你是占卜方式选择器。根据用户问题选择最合适的占卜方式。\n"
        "可选方式: tarot, liuyao。\n"
        "tarot（塔罗牌）适合情感、关系、方向性等开放式问题；\n"
        "liuyao（六爻）适合是非判断、重大决策、事业选择等具体问题。\n"
        "只返回 JSON，例如: {\"method\": \"tarot\", \"reason\": \"...\"}"
    )
    try:
        content = await _call_ai_builder(
            [
                {"role": "system", "content": prompt},
                {"role": "user", "content": question.strip()},
            ],
            temperature=0.2,
        )
        parsed = _safe_parse_json(content)
        method = str(parsed.get("method", "")).lower()
        if method not in DIVINATION_METHODS:
            method = _fallback_method(question)
        reason = str(parsed.get("reason", "")).strip() or "根据问题类型选择"
        return {"method": method, "reason": reason}
    except Exception:
        method = _fallback_method(question)
        return {"method": method, "reason": "未能调用模型，使用默认规则"}


def generate_result(method: str, question: str, user_seed: str | None) -> dict[str, Any]:
    if method == "tarot":
        return draw_tarot(question, user_seed)
    if method == "liuyao":
        return draw_liuyao(question, user_seed)
    raise ValueError("Invalid method")


async def generate_interpretation(question: str, method: str, result: dict[str, Any]) -> dict[str, str]:
    prompt = (
        "你是占卜解读者，语气温柔、清晰、不过度保证准确性。\n"
        "根据占卜方式、结果和用户问题，输出 JSON：\n"
        "{\"summary\": \"一句话结论\", \"explanation\": \"解释\", \"advice\": \"行动建议\", \"ritual_ending\": \"结束语\"}\n"
        "不要输出多余文本。"
    )
    user_payload = json.dumps({"question": question, "method": method, "result": result}, ensure_ascii=False)
    try:
        content = await _call_ai_builder(
            [
                {"role": "system", "content": prompt},
                {"role": "user", "content": user_payload},
            ],
            temperature=0.5,
        )
        parsed = _safe_parse_json(content)
        if {"summary", "explanation", "advice", "ritual_ending"} <= parsed.keys():
            return {
                "summary": str(parsed["summary"]).strip(),
                "explanation": str(parsed["explanation"]).strip(),
                "advice": str(parsed["advice"]).strip(),
                "ritual_ending": str(parsed["ritual_ending"]).strip(),
            }
    except Exception:
        pass

    return {
        "summary": "这次占卜给出了一个方向感。",
        "explanation": f"结合你的问题和结果，提示你关注当下最重要的感受与现实条件。",
        "advice": "先做一个小行动验证，再决定是否继续推进。",
        "ritual_ending": "本次占卜结束，愿你心中更清晰。",
    }
