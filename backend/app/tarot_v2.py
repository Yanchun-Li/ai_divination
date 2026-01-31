"""
塔罗牌核心逻辑和22张大阿尔克那数据。
"""

import random
from typing import Any

from .models.divination_v2 import (
    TarotCard,
    TarotDraw,
    TarotPosition,
    TarotResult,
)
from .liuyao import seeded_random

# ===== 22张大阿尔克那塔罗牌数据 =====
MAJOR_ARCANA_DATA: list[dict[str, Any]] = [
    {
        "id": 0,
        "name": "愚者",
        "name_en": "The Fool",
        "upright": ["新的开始", "自由", "冒险", "天真", "可能性"],
        "reversed": ["鲁莽", "逃避", "缺乏计划", "不成熟", "冒进"],
    },
    {
        "id": 1,
        "name": "魔术师",
        "name_en": "The Magician",
        "upright": ["行动力", "创造", "资源整合", "意志力", "主动"],
        "reversed": ["意志分散", "操控", "空想", "欺骗", "能力不足"],
    },
    {
        "id": 2,
        "name": "女祭司",
        "name_en": "The High Priestess",
        "upright": ["直觉", "潜意识", "内在智慧", "神秘", "等待"],
        "reversed": ["迟疑不决", "忽视内心", "表面", "秘密", "被动"],
    },
    {
        "id": 3,
        "name": "女皇",
        "name_en": "The Empress",
        "upright": ["丰盛", "滋养", "创造力", "自然", "母性"],
        "reversed": ["过度依赖", "创意枯竭", "停滞", "控制", "忽视自我"],
    },
    {
        "id": 4,
        "name": "皇帝",
        "name_en": "The Emperor",
        "upright": ["权威", "秩序", "稳定", "领导力", "规则"],
        "reversed": ["控制过度", "刚愎自用", "暴政", "缺乏纪律", "僵化"],
    },
    {
        "id": 5,
        "name": "教皇",
        "name_en": "The Hierophant",
        "upright": ["传统", "指导", "精神信仰", "教育", "智慧"],
        "reversed": ["打破常规", "个人信念", "反叛", "挑战权威", "自由"],
    },
    {
        "id": 6,
        "name": "恋人",
        "name_en": "The Lovers",
        "upright": ["爱情", "选择", "和谐", "价值观", "关系"],
        "reversed": ["摇摆不定", "关系失衡", "错误选择", "分离", "内心冲突"],
    },
    {
        "id": 7,
        "name": "战车",
        "name_en": "The Chariot",
        "upright": ["胜利", "决心", "掌控", "前进", "克服障碍"],
        "reversed": ["失控", "缺乏方向", "攻击性", "受阻", "自大"],
    },
    {
        "id": 8,
        "name": "力量",
        "name_en": "Strength",
        "upright": ["勇气", "耐心", "内在力量", "柔和", "自律"],
        "reversed": ["自我怀疑", "软弱", "失去信心", "粗暴", "控制不住"],
    },
    {
        "id": 9,
        "name": "隐者",
        "name_en": "The Hermit",
        "upright": ["内省", "独处", "指引", "智慧", "寻找真理"],
        "reversed": ["孤立", "逃避", "偏执", "过度退缩", "拒绝帮助"],
    },
    {
        "id": 10,
        "name": "命运之轮",
        "name_en": "Wheel of Fortune",
        "upright": ["转机", "好运", "命运", "周期", "变化"],
        "reversed": ["厄运", "抗拒改变", "失控", "停滞", "坏运气"],
    },
    {
        "id": 11,
        "name": "正义",
        "name_en": "Justice",
        "upright": ["公平", "真相", "因果", "平衡", "责任"],
        "reversed": ["不公正", "逃避责任", "偏见", "欺骗", "失衡"],
    },
    {
        "id": 12,
        "name": "倒吊人",
        "name_en": "The Hanged Man",
        "upright": ["牺牲", "等待", "换位思考", "放下", "新视角"],
        "reversed": ["拖延", "抗拒", "无意义的牺牲", "自私", "僵持"],
    },
    {
        "id": 13,
        "name": "死神",
        "name_en": "Death",
        "upright": ["结束", "转变", "放下过去", "重生", "新开始"],
        "reversed": ["抗拒改变", "停滞", "无法放下", "恐惧", "拖延结束"],
    },
    {
        "id": 14,
        "name": "节制",
        "name_en": "Temperance",
        "upright": ["平衡", "耐心", "调和", "适度", "目标"],
        "reversed": ["失衡", "过度", "缺乏耐心", "极端", "冲突"],
    },
    {
        "id": 15,
        "name": "恶魔",
        "name_en": "The Devil",
        "upright": ["束缚", "诱惑", "物质", "阴影面", "执念"],
        "reversed": ["解脱", "打破束缚", "觉醒", "恢复自由", "放下"],
    },
    {
        "id": 16,
        "name": "塔",
        "name_en": "The Tower",
        "upright": ["突变", "崩塌", "觉醒", "真相揭露", "解放"],
        "reversed": ["灾难延迟", "抗拒改变", "恐惧", "避免最坏", "内在转变"],
    },
    {
        "id": 17,
        "name": "星星",
        "name_en": "The Star",
        "upright": ["希望", "信念", "平静", "灵感", "疗愈"],
        "reversed": ["失望", "缺乏信心", "悲观", "脱离现实", "空虚"],
    },
    {
        "id": 18,
        "name": "月亮",
        "name_en": "The Moon",
        "upright": ["直觉", "幻象", "不确定", "潜意识", "恐惧"],
        "reversed": ["混乱", "欺骗揭露", "焦虑释放", "清晰", "面对恐惧"],
    },
    {
        "id": 19,
        "name": "太阳",
        "name_en": "The Sun",
        "upright": ["成功", "快乐", "活力", "清晰", "积极"],
        "reversed": ["短暂低迷", "缺乏热情", "延迟成功", "自负", "倦怠"],
    },
    {
        "id": 20,
        "name": "审判",
        "name_en": "Judgement",
        "upright": ["觉醒", "重生", "反思", "召唤", "决断"],
        "reversed": ["自我怀疑", "拒绝改变", "无法原谅", "逃避", "错失机会"],
    },
    {
        "id": 21,
        "name": "世界",
        "name_en": "The World",
        "upright": ["完成", "整合", "成就", "圆满", "新旅程"],
        "reversed": ["未完成", "停滞", "缺乏闭环", "延迟", "不圆满"],
    },
]

# 牌阵位置
SPREAD_POSITIONS = [
    {"id": TarotPosition.PAST, "label": "过去", "meaning": "影响当前问题的背景和根源"},
    {"id": TarotPosition.PRESENT, "label": "现在", "meaning": "当前状态和面临的核心议题"},
    {"id": TarotPosition.FUTURE, "label": "未来", "meaning": "如果保持现状，可能的发展方向"},
]


def get_card_by_id(card_id: int) -> TarotCard:
    """根据ID获取塔罗牌。"""
    for card_data in MAJOR_ARCANA_DATA:
        if card_data["id"] == card_id:
            return TarotCard(
                id=card_data["id"],
                name=card_data["name"],
                name_en=card_data["name_en"],
                arcana="major",
                suit=None,
                upright_keywords=card_data["upright"],
                reversed_keywords=card_data["reversed"],
            )
    raise ValueError(f"Card not found: {card_id}")


def get_card_meaning(card: TarotCard, is_upright: bool) -> str:
    """获取牌的含义文本。"""
    keywords = card.upright_keywords if is_upright else card.reversed_keywords
    return "、".join(keywords)


def shuffle_cards(rng: random.Random | None = None) -> list[int]:
    """洗牌，返回打乱顺序的牌ID列表。"""
    card_ids = [card["id"] for card in MAJOR_ARCANA_DATA]
    if rng:
        rng.shuffle(card_ids)
    else:
        random.shuffle(card_ids)
    return card_ids


def draw_cards(
    count: int = 3, rng: random.Random | None = None
) -> list[TarotDraw]:
    """抽取指定数量的牌。"""
    shuffled = shuffle_cards(rng)
    draws = []

    for i in range(min(count, len(SPREAD_POSITIONS))):
        card_id = shuffled[i]
        card = get_card_by_id(card_id)
        position_info = SPREAD_POSITIONS[i]

        is_upright = (rng.random() if rng else random.random()) > 0.5

        draw = TarotDraw(
            card=card,
            position=position_info["id"],
            position_label=position_info["label"],
            is_upright=is_upright,
            meaning=get_card_meaning(card, is_upright),
        )
        draws.append(draw)

    return draws


def generate_tarot_result(draws: list[TarotDraw]) -> TarotResult:
    """生成完整的塔罗结果。"""
    return TarotResult(
        type="tarot",
        spread_type="three_card",
        spread_name="过去-现在-未来",
        cards=draws,
        deck_version="major_22",
        draw_sequence=[d.card.id for d in draws],
    )


def ai_generate_tarot(seed: str) -> TarotResult:
    """AI模式：使用seed生成塔罗结果。"""
    rng = seeded_random(seed)
    draws = draw_cards(3, rng)
    return generate_tarot_result(draws)


def create_manual_draw(
    card_id: int,
    position_index: int,
    is_upright: bool,
) -> TarotDraw:
    """手动模式：创建单张抽牌结果。"""
    card = get_card_by_id(card_id)
    position_info = SPREAD_POSITIONS[position_index]

    return TarotDraw(
        card=card,
        position=position_info["id"],
        position_label=position_info["label"],
        is_upright=is_upright,
        meaning=get_card_meaning(card, is_upright),
    )


# ===== 辅助函数 =====


def get_orientation_text(is_upright: bool) -> str:
    """获取正逆位文本。"""
    return "正位" if is_upright else "逆位"


def format_card_description(draw: TarotDraw) -> str:
    """格式化牌的完整描述。"""
    orientation = get_orientation_text(draw.is_upright)
    return f"{draw.card.name}（{orientation}）"


def format_spread_description(draws: list[TarotDraw]) -> str:
    """格式化牌阵描述。"""
    return " | ".join(
        f"{d.position_label}：{format_card_description(d)}" for d in draws
    )
