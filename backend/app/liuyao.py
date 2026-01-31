"""
六爻（起卦）核心逻辑和64卦数据。
"""

import hashlib
import random
from typing import Any

from .models.divination_v2 import (
    CoinToss,
    Hexagram,
    LiuyaoLine,
    LiuyaoResult,
    YaoType,
)

# ===== 铜钱法规则 =====
# 正面（有字）= 3，反面（无字）= 2
# 三枚相加：6=老阴, 7=少阳, 8=少阴, 9=老阳

YAO_TYPE_MAP: dict[int, YaoType] = {
    6: YaoType.OLD_YIN,
    7: YaoType.YOUNG_YANG,
    8: YaoType.YOUNG_YIN,
    9: YaoType.OLD_YANG,
}

YAO_NAMES: dict[YaoType, str] = {
    YaoType.OLD_YIN: "老阴",
    YaoType.YOUNG_YIN: "少阴",
    YaoType.YOUNG_YANG: "少阳",
    YaoType.OLD_YANG: "老阳",
}

# ===== 64卦数据 =====
HEXAGRAMS_DATA: list[dict[str, Any]] = [
    {"id": 1, "name": "乾", "symbol": "☰☰", "description": "元亨利贞，刚健进取", "upper": "乾", "lower": "乾"},
    {"id": 2, "name": "坤", "symbol": "☷☷", "description": "厚德载物，包容承载", "upper": "坤", "lower": "坤"},
    {"id": 3, "name": "屯", "symbol": "☵☳", "description": "万物始生，艰难初创", "upper": "坎", "lower": "震"},
    {"id": 4, "name": "蒙", "symbol": "☶☵", "description": "启蒙教育，循序渐进", "upper": "艮", "lower": "坎"},
    {"id": 5, "name": "需", "symbol": "☵☰", "description": "等待时机，蓄势待发", "upper": "坎", "lower": "乾"},
    {"id": 6, "name": "讼", "symbol": "☰☵", "description": "争讼纷争，宜和为贵", "upper": "乾", "lower": "坎"},
    {"id": 7, "name": "师", "symbol": "☷☵", "description": "行师出征，纪律严明", "upper": "坤", "lower": "坎"},
    {"id": 8, "name": "比", "symbol": "☵☷", "description": "亲比辅助，和睦相处", "upper": "坎", "lower": "坤"},
    {"id": 9, "name": "小畜", "symbol": "☴☰", "description": "小有积蓄，密云不雨", "upper": "巽", "lower": "乾"},
    {"id": 10, "name": "履", "symbol": "☰☱", "description": "小心行事，履虎尾", "upper": "乾", "lower": "兑"},
    {"id": 11, "name": "泰", "symbol": "☷☰", "description": "天地交泰，通达亨通", "upper": "坤", "lower": "乾"},
    {"id": 12, "name": "否", "symbol": "☰☷", "description": "天地不交，闭塞不通", "upper": "乾", "lower": "坤"},
    {"id": 13, "name": "同人", "symbol": "☰☲", "description": "志同道合，和睦共处", "upper": "乾", "lower": "离"},
    {"id": 14, "name": "大有", "symbol": "☲☰", "description": "大有所获，富有充盈", "upper": "离", "lower": "乾"},
    {"id": 15, "name": "谦", "symbol": "☷☶", "description": "谦虚恭让，获益多多", "upper": "坤", "lower": "艮"},
    {"id": 16, "name": "豫", "symbol": "☳☷", "description": "欢乐愉悦，顺势而为", "upper": "震", "lower": "坤"},
    {"id": 17, "name": "随", "symbol": "☱☳", "description": "随顺变通，灵活应对", "upper": "兑", "lower": "震"},
    {"id": 18, "name": "蛊", "symbol": "☶☴", "description": "整顿弊病，革故鼎新", "upper": "艮", "lower": "巽"},
    {"id": 19, "name": "临", "symbol": "☷☱", "description": "居高临下，亲近民众", "upper": "坤", "lower": "兑"},
    {"id": 20, "name": "观", "symbol": "☴☷", "description": "观察审视，以身作则", "upper": "巽", "lower": "坤"},
    {"id": 21, "name": "噬嗑", "symbol": "☲☳", "description": "明断狱讼，赏罚分明", "upper": "离", "lower": "震"},
    {"id": 22, "name": "贲", "symbol": "☶☲", "description": "文饰修养，内外兼修", "upper": "艮", "lower": "离"},
    {"id": 23, "name": "剥", "symbol": "☶☷", "description": "剥落衰败，顺势而退", "upper": "艮", "lower": "坤"},
    {"id": 24, "name": "复", "symbol": "☷☳", "description": "一阳来复，万象更新", "upper": "坤", "lower": "震"},
    {"id": 25, "name": "无妄", "symbol": "☰☳", "description": "无妄之福，顺应天道", "upper": "乾", "lower": "震"},
    {"id": 26, "name": "大畜", "symbol": "☶☰", "description": "大有积蓄，厚积薄发", "upper": "艮", "lower": "乾"},
    {"id": 27, "name": "颐", "symbol": "☶☳", "description": "颐养正道，自食其力", "upper": "艮", "lower": "震"},
    {"id": 28, "name": "大过", "symbol": "☱☴", "description": "过犹不及，把握分寸", "upper": "兑", "lower": "巽"},
    {"id": 29, "name": "坎", "symbol": "☵☵", "description": "重重险阻，坚持信念", "upper": "坎", "lower": "坎"},
    {"id": 30, "name": "离", "symbol": "☲☲", "description": "光明依附，柔顺中正", "upper": "离", "lower": "离"},
    {"id": 31, "name": "咸", "symbol": "☱☶", "description": "感应相通，真诚交流", "upper": "兑", "lower": "艮"},
    {"id": 32, "name": "恒", "symbol": "☳☴", "description": "恒久坚持，持之以恒", "upper": "震", "lower": "巽"},
    {"id": 33, "name": "遁", "symbol": "☰☶", "description": "退避隐遁，明哲保身", "upper": "乾", "lower": "艮"},
    {"id": 34, "name": "大壮", "symbol": "☳☰", "description": "刚健有力，适可而止", "upper": "震", "lower": "乾"},
    {"id": 35, "name": "晋", "symbol": "☲☷", "description": "日出地上，光明进取", "upper": "离", "lower": "坤"},
    {"id": 36, "name": "明夷", "symbol": "☷☲", "description": "光明受损，韬光养晦", "upper": "坤", "lower": "离"},
    {"id": 37, "name": "家人", "symbol": "☴☲", "description": "家道正和，齐家治国", "upper": "巽", "lower": "离"},
    {"id": 38, "name": "睽", "symbol": "☲☱", "description": "睽违背离，异中求同", "upper": "离", "lower": "兑"},
    {"id": 39, "name": "蹇", "symbol": "☵☶", "description": "艰难险阻，知难而退", "upper": "坎", "lower": "艮"},
    {"id": 40, "name": "解", "symbol": "☳☵", "description": "解除困难，雷雨交作", "upper": "震", "lower": "坎"},
    {"id": 41, "name": "损", "symbol": "☶☱", "description": "损下益上，有所舍得", "upper": "艮", "lower": "兑"},
    {"id": 42, "name": "益", "symbol": "☴☳", "description": "损上益下，利民兴业", "upper": "巽", "lower": "震"},
    {"id": 43, "name": "夬", "symbol": "☱☰", "description": "决断果敢，刚决柔", "upper": "兑", "lower": "乾"},
    {"id": 44, "name": "姤", "symbol": "☰☴", "description": "不期而遇，柔遇刚", "upper": "乾", "lower": "巽"},
    {"id": 45, "name": "萃", "symbol": "☱☷", "description": "聚集汇合，择善而从", "upper": "兑", "lower": "坤"},
    {"id": 46, "name": "升", "symbol": "☷☴", "description": "积小成大，升进发展", "upper": "坤", "lower": "巽"},
    {"id": 47, "name": "困", "symbol": "☱☵", "description": "困厄穷境，守正待时", "upper": "兑", "lower": "坎"},
    {"id": 48, "name": "井", "symbol": "☵☴", "description": "井养不穷，取之有道", "upper": "坎", "lower": "巽"},
    {"id": 49, "name": "革", "symbol": "☱☲", "description": "革故鼎新，顺时而变", "upper": "兑", "lower": "离"},
    {"id": 50, "name": "鼎", "symbol": "☲☴", "description": "鼎新革故，调和五味", "upper": "离", "lower": "巽"},
    {"id": 51, "name": "震", "symbol": "☳☳", "description": "雷声震动，慎言慎行", "upper": "震", "lower": "震"},
    {"id": 52, "name": "艮", "symbol": "☶☶", "description": "止而后动，静定生慧", "upper": "艮", "lower": "艮"},
    {"id": 53, "name": "渐", "symbol": "☴☶", "description": "循序渐进，稳步发展", "upper": "巽", "lower": "艮"},
    {"id": 54, "name": "归妹", "symbol": "☳☱", "description": "归妹出嫁，知行合一", "upper": "震", "lower": "兑"},
    {"id": 55, "name": "丰", "symbol": "☳☲", "description": "丰盛光明，宜日中", "upper": "震", "lower": "离"},
    {"id": 56, "name": "旅", "symbol": "☲☶", "description": "旅途漂泊，小心谨慎", "upper": "离", "lower": "艮"},
    {"id": 57, "name": "巽", "symbol": "☴☴", "description": "顺从柔和，谦逊入微", "upper": "巽", "lower": "巽"},
    {"id": 58, "name": "兑", "symbol": "☱☱", "description": "喜悦和乐，言语得当", "upper": "兑", "lower": "兑"},
    {"id": 59, "name": "涣", "symbol": "☴☵", "description": "涣散离析，济险脱困", "upper": "巽", "lower": "坎"},
    {"id": 60, "name": "节", "symbol": "☵☱", "description": "节制有度，适可而止", "upper": "坎", "lower": "兑"},
    {"id": 61, "name": "中孚", "symbol": "☴☱", "description": "诚信感动，真诚待人", "upper": "巽", "lower": "兑"},
    {"id": 62, "name": "小过", "symbol": "☳☶", "description": "小有过越，谨小慎微", "upper": "震", "lower": "艮"},
    {"id": 63, "name": "既济", "symbol": "☵☲", "description": "事已成就，守成保业", "upper": "坎", "lower": "离"},
    {"id": 64, "name": "未济", "symbol": "☲☵", "description": "事未完成，继续努力", "upper": "离", "lower": "坎"},
]

# 八卦到二进制的映射
TRIGRAM_TO_BINARY: dict[str, str] = {
    "乾": "111",
    "坤": "000",
    "震": "100",
    "坎": "010",
    "艮": "001",
    "巽": "011",
    "离": "101",
    "兑": "110",
}

# 构建查找表：二进制 -> 卦ID
HEXAGRAM_LOOKUP: dict[str, int] = {}


def _build_hexagram_lookup() -> None:
    """构建卦象查找表。"""
    for hex_data in HEXAGRAMS_DATA:
        upper_binary = TRIGRAM_TO_BINARY.get(hex_data["upper"], "")
        lower_binary = TRIGRAM_TO_BINARY.get(hex_data["lower"], "")
        if upper_binary and lower_binary:
            full_binary = lower_binary + upper_binary
            HEXAGRAM_LOOKUP[full_binary] = hex_data["id"]


_build_hexagram_lookup()


def _get_hexagram_by_id(hex_id: int) -> Hexagram:
    """根据ID获取卦象。"""
    for hex_data in HEXAGRAMS_DATA:
        if hex_data["id"] == hex_id:
            return Hexagram(
                id=hex_data["id"],
                name=hex_data["name"],
                symbol=hex_data["symbol"],
                description=hex_data["description"],
                upper_trigram=hex_data["upper"],
                lower_trigram=hex_data["lower"],
            )
    raise ValueError(f"Hexagram not found: {hex_id}")


def _lookup_hexagram(binary: str) -> Hexagram:
    """根据二进制字符串查找卦象。"""
    hex_id = HEXAGRAM_LOOKUP.get(binary)
    if hex_id is None:
        raise ValueError(f"Invalid hexagram binary: {binary}")
    return _get_hexagram_by_id(hex_id)


# ===== 随机数生成 =====


def seeded_random(seed: str) -> random.Random:
    """基于seed创建确定性随机数生成器。"""
    hash_value = int(hashlib.sha256(seed.encode()).hexdigest()[:16], 16)
    rng = random.Random(hash_value)
    return rng


def generate_session_seed(question: str, user_id: int | None = None) -> str:
    """生成会话种子。"""
    import secrets
    import time

    timestamp = int(time.time() * 1000)
    random_part = secrets.token_hex(8)
    base = f"q_{question[:20]}_t_{timestamp}_r_{random_part}"
    if user_id:
        base += f"_u_{user_id}"
    return base


# ===== 铜钱投掷 =====


def toss_coin(rng: random.Random | None = None) -> int:
    """投掷一枚铜钱，返回2（反）或3（正）。"""
    if rng:
        return 3 if rng.random() > 0.5 else 2
    return 3 if random.random() > 0.5 else 2


def toss_three_coins(rng: random.Random | None = None) -> tuple[int, int, int]:
    """投掷三枚铜钱。"""
    return (toss_coin(rng), toss_coin(rng), toss_coin(rng))


def calculate_toss(coins: tuple[int, int, int]) -> CoinToss:
    """根据铜钱结果计算爻类型。"""
    total = sum(coins)
    yao_type = YAO_TYPE_MAP[total]
    return CoinToss(
        coins=coins,
        sum=total,
        yao_type=yao_type,
        is_changing=total == 6 or total == 9,
    )


def is_yang_yao(yao_type: YaoType) -> bool:
    """判断是否为阳爻。"""
    return yao_type in (YaoType.YOUNG_YANG, YaoType.OLD_YANG)


# ===== 卦象生成 =====


def tosses_to_binary(tosses: list[CoinToss]) -> str:
    """将投掷序列转换为二进制字符串。"""
    return "".join("1" if is_yang_yao(t.yao_type) else "0" for t in tosses)


def generate_relating_binary(tosses: list[CoinToss], primary_binary: str) -> str:
    """生成变卦的二进制（动爻阴阳互换）。"""
    result = []
    for i, toss in enumerate(tosses):
        if not toss.is_changing:
            result.append(primary_binary[i])
        else:
            result.append("0" if primary_binary[i] == "1" else "1")
    return "".join(result)


def build_lines(tosses: list[CoinToss]) -> list[LiuyaoLine]:
    """构建六爻线条数据。"""
    lines = []
    for i, toss in enumerate(tosses):
        is_yang = is_yang_yao(toss.yao_type)
        line = LiuyaoLine(
            position=i + 1,
            yao_type=toss.yao_type,
            is_yang=is_yang,
            is_changing=toss.is_changing,
            changed_yang=not is_yang if toss.is_changing else None,
        )
        lines.append(line)
    return lines


def generate_hexagrams(
    tosses: list[CoinToss],
) -> tuple[Hexagram, Hexagram | None]:
    """根据投掷序列生成本卦和变卦。"""
    primary_binary = tosses_to_binary(tosses)
    primary = _lookup_hexagram(primary_binary)

    has_changing = any(t.is_changing for t in tosses)
    relating = None
    if has_changing:
        relating_binary = generate_relating_binary(tosses, primary_binary)
        relating = _lookup_hexagram(relating_binary)

    return primary, relating


def generate_liuyao_result(tosses: list[CoinToss]) -> LiuyaoResult:
    """生成完整的六爻结果。"""
    if len(tosses) != 6:
        raise ValueError("Must have exactly 6 tosses")

    primary, relating = generate_hexagrams(tosses)
    lines = build_lines(tosses)
    changing_lines = [line.position for line in lines if line.is_changing]

    return LiuyaoResult(
        type="liuyao",
        lines=lines,
        changing_lines=changing_lines,
        primary_hexagram=primary,
        relating_hexagram=relating,
        raw_tosses=tosses,
    )


def ai_generate_liuyao(seed: str) -> LiuyaoResult:
    """AI模式：使用seed生成完整六爻。"""
    rng = seeded_random(seed)
    tosses = []
    for _ in range(6):
        coins = toss_three_coins(rng)
        tosses.append(calculate_toss(coins))
    return generate_liuyao_result(tosses)


# ===== 辅助函数 =====


def get_yao_name(yao_type: YaoType) -> str:
    """获取爻的名称。"""
    return YAO_NAMES[yao_type]


def get_position_name(position: int) -> str:
    """获取爻位名称。"""
    names = ["初", "二", "三", "四", "五", "上"]
    return names[position - 1] if 1 <= position <= 6 else ""


def get_changing_lines_description(changing_lines: list[int]) -> str:
    """获取动爻描述。"""
    if not changing_lines:
        return "无动爻"
    names = [f"{get_position_name(pos)}爻" for pos in changing_lines]
    return "、".join(names) + "动"
