import type {
  TarotCard,
  TarotDraw,
  TarotResult,
  TarotPosition,
} from "../types/divination";
import { seededRandom } from "./liuyao";

// ===== 22张大阿尔克那塔罗牌数据 =====
export const MAJOR_ARCANA: TarotCard[] = [
  {
    id: 0,
    name: "愚者",
    name_en: "The Fool",
    arcana: "major",
    suit: null,
    upright_keywords: ["新的开始", "自由", "冒险", "天真", "可能性"],
    reversed_keywords: ["鲁莽", "逃避", "缺乏计划", "不成熟", "冒进"],
    upright_keywords_en: ["New beginnings", "Freedom", "Adventure", "Innocence", "Possibility"],
    reversed_keywords_en: ["Recklessness", "Avoidance", "Lack of planning", "Immaturity", "Impulsive"],
    upright_keywords_ja: ["新たな始まり", "自由", "冒険", "無邪気", "可能性"],
    reversed_keywords_ja: ["無謀", "逃避", "計画性の欠如", "未熟", "衝動的"],
  },
  {
    id: 1,
    name: "魔术师",
    name_en: "The Magician",
    arcana: "major",
    suit: null,
    upright_keywords: ["行动力", "创造", "资源整合", "意志力", "主动"],
    reversed_keywords: ["意志分散", "操控", "空想", "欺骗", "能力不足"],
    upright_keywords_en: ["Action", "Creation", "Resourcefulness", "Willpower", "Initiative"],
    reversed_keywords_en: ["Scattered will", "Manipulation", "Fantasy", "Deception", "Lack of skill"],
    upright_keywords_ja: ["行動力", "創造", "資源活用", "意志力", "主導"],
    reversed_keywords_ja: ["意志散漫", "操作", "空想", "欺瞞", "能力不足"],
  },
  {
    id: 2,
    name: "女祭司",
    name_en: "The High Priestess",
    arcana: "major",
    suit: null,
    upright_keywords: ["直觉", "潜意识", "内在智慧", "神秘", "等待"],
    reversed_keywords: ["迟疑不决", "忽视内心", "表面", "秘密", "被动"],
    upright_keywords_en: ["Intuition", "Subconscious", "Inner wisdom", "Mystery", "Patience"],
    reversed_keywords_en: ["Hesitation", "Ignoring inner voice", "Superficial", "Secrets", "Passive"],
    upright_keywords_ja: ["直感", "潜在意識", "内なる知恵", "神秘", "待機"],
    reversed_keywords_ja: ["優柔不断", "内心を無視", "表面的", "秘密", "受動的"],
  },
  {
    id: 3,
    name: "女皇",
    name_en: "The Empress",
    arcana: "major",
    suit: null,
    upright_keywords: ["丰盛", "滋养", "创造力", "自然", "母性"],
    reversed_keywords: ["过度依赖", "创意枯竭", "停滞", "控制", "忽视自我"],
    upright_keywords_en: ["Abundance", "Nurturing", "Creativity", "Nature", "Motherhood"],
    reversed_keywords_en: ["Over-dependence", "Creative block", "Stagnation", "Control", "Self-neglect"],
    upright_keywords_ja: ["豊かさ", "養育", "創造力", "自然", "母性"],
    reversed_keywords_ja: ["過度の依存", "創造力の枯渇", "停滞", "支配", "自己無視"],
  },
  {
    id: 4,
    name: "皇帝",
    name_en: "The Emperor",
    arcana: "major",
    suit: null,
    upright_keywords: ["权威", "秩序", "稳定", "领导力", "规则"],
    reversed_keywords: ["控制过度", "刚愎自用", "暴政", "缺乏纪律", "僵化"],
    upright_keywords_en: ["Authority", "Order", "Stability", "Leadership", "Structure"],
    reversed_keywords_en: ["Over-control", "Stubbornness", "Tyranny", "Lack of discipline", "Rigidity"],
    upright_keywords_ja: ["権威", "秩序", "安定", "リーダーシップ", "規則"],
    reversed_keywords_ja: ["過度の支配", "頑固", "暴政", "規律の欠如", "硬直"],
  },
  {
    id: 5,
    name: "教皇",
    name_en: "The Hierophant",
    arcana: "major",
    suit: null,
    upright_keywords: ["传统", "指导", "精神信仰", "教育", "智慧"],
    reversed_keywords: ["打破常规", "个人信念", "反叛", "挑战权威", "自由"],
    upright_keywords_en: ["Tradition", "Guidance", "Spirituality", "Education", "Wisdom"],
    reversed_keywords_en: ["Breaking rules", "Personal beliefs", "Rebellion", "Challenging authority", "Freedom"],
    upright_keywords_ja: ["伝統", "指導", "精神性", "教育", "知恵"],
    reversed_keywords_ja: ["常識打破", "個人の信念", "反抗", "権威への挑戦", "自由"],
  },
  {
    id: 6,
    name: "恋人",
    name_en: "The Lovers",
    arcana: "major",
    suit: null,
    upright_keywords: ["爱情", "选择", "和谐", "价值观", "关系"],
    reversed_keywords: ["摇摆不定", "关系失衡", "错误选择", "分离", "内心冲突"],
    upright_keywords_en: ["Love", "Choice", "Harmony", "Values", "Relationships"],
    reversed_keywords_en: ["Indecision", "Imbalanced relationship", "Wrong choice", "Separation", "Inner conflict"],
    upright_keywords_ja: ["愛", "選択", "調和", "価値観", "関係"],
    reversed_keywords_ja: ["優柔不断", "関係の不均衡", "誤った選択", "別離", "内面の葛藤"],
  },
  {
    id: 7,
    name: "战车",
    name_en: "The Chariot",
    arcana: "major",
    suit: null,
    upright_keywords: ["胜利", "决心", "掌控", "前进", "克服障碍"],
    reversed_keywords: ["失控", "缺乏方向", "攻击性", "受阻", "自大"],
    upright_keywords_en: ["Victory", "Determination", "Control", "Progress", "Overcoming obstacles"],
    reversed_keywords_en: ["Loss of control", "Lack of direction", "Aggression", "Obstacles", "Arrogance"],
    upright_keywords_ja: ["勝利", "決意", "統制", "前進", "障害克服"],
    reversed_keywords_ja: ["制御不能", "方向性の欠如", "攻撃性", "妨害", "傲慢"],
  },
  {
    id: 8,
    name: "力量",
    name_en: "Strength",
    arcana: "major",
    suit: null,
    upright_keywords: ["勇气", "耐心", "内在力量", "柔和", "自律"],
    reversed_keywords: ["自我怀疑", "软弱", "失去信心", "粗暴", "控制不住"],
    upright_keywords_en: ["Courage", "Patience", "Inner strength", "Gentleness", "Self-discipline"],
    reversed_keywords_en: ["Self-doubt", "Weakness", "Loss of confidence", "Harshness", "Lack of control"],
    upright_keywords_ja: ["勇気", "忍耐", "内なる力", "優しさ", "自己規律"],
    reversed_keywords_ja: ["自己不信", "弱さ", "自信喪失", "粗暴", "自制の欠如"],
  },
  {
    id: 9,
    name: "隐者",
    name_en: "The Hermit",
    arcana: "major",
    suit: null,
    upright_keywords: ["内省", "独处", "指引", "智慧", "寻找真理"],
    reversed_keywords: ["孤立", "逃避", "偏执", "过度退缩", "拒绝帮助"],
    upright_keywords_en: ["Introspection", "Solitude", "Guidance", "Wisdom", "Seeking truth"],
    reversed_keywords_en: ["Isolation", "Avoidance", "Paranoia", "Withdrawal", "Refusing help"],
    upright_keywords_ja: ["内省", "孤独", "導き", "知恵", "真理探求"],
    reversed_keywords_ja: ["孤立", "逃避", "偏執", "過度の引きこもり", "助けを拒否"],
  },
  {
    id: 10,
    name: "命运之轮",
    name_en: "Wheel of Fortune",
    arcana: "major",
    suit: null,
    upright_keywords: ["转机", "好运", "命运", "周期", "变化"],
    reversed_keywords: ["厄运", "抗拒改变", "失控", "停滞", "坏运气"],
    upright_keywords_en: ["Turning point", "Good luck", "Destiny", "Cycles", "Change"],
    reversed_keywords_en: ["Bad luck", "Resisting change", "Loss of control", "Stagnation", "Misfortune"],
    upright_keywords_ja: ["転機", "幸運", "運命", "周期", "変化"],
    reversed_keywords_ja: ["不運", "変化への抵抗", "制御不能", "停滞", "不運"],
  },
  {
    id: 11,
    name: "正义",
    name_en: "Justice",
    arcana: "major",
    suit: null,
    upright_keywords: ["公平", "真相", "因果", "平衡", "责任"],
    reversed_keywords: ["不公正", "逃避责任", "偏见", "欺骗", "失衡"],
    upright_keywords_en: ["Fairness", "Truth", "Karma", "Balance", "Responsibility"],
    reversed_keywords_en: ["Injustice", "Avoiding responsibility", "Bias", "Deception", "Imbalance"],
    upright_keywords_ja: ["公正", "真実", "因果", "バランス", "責任"],
    reversed_keywords_ja: ["不公正", "責任回避", "偏見", "欺瞞", "不均衡"],
  },
  {
    id: 12,
    name: "倒吊人",
    name_en: "The Hanged Man",
    arcana: "major",
    suit: null,
    upright_keywords: ["牺牲", "等待", "换位思考", "放下", "新视角"],
    reversed_keywords: ["拖延", "抗拒", "无意义的牺牲", "自私", "僵持"],
    upright_keywords_en: ["Sacrifice", "Waiting", "New perspective", "Letting go", "Surrender"],
    reversed_keywords_en: ["Procrastination", "Resistance", "Pointless sacrifice", "Selfishness", "Stalemate"],
    upright_keywords_ja: ["犠牲", "待機", "視点転換", "手放し", "新たな視点"],
    reversed_keywords_ja: ["先延ばし", "抵抗", "無意味な犠牲", "利己的", "膠着"],
  },
  {
    id: 13,
    name: "死神",
    name_en: "Death",
    arcana: "major",
    suit: null,
    upright_keywords: ["结束", "转变", "放下过去", "重生", "新开始"],
    reversed_keywords: ["抗拒改变", "停滞", "无法放下", "恐惧", "拖延结束"],
    upright_keywords_en: ["Ending", "Transformation", "Letting go", "Rebirth", "New beginning"],
    reversed_keywords_en: ["Resisting change", "Stagnation", "Unable to let go", "Fear", "Delayed ending"],
    upright_keywords_ja: ["終わり", "変容", "過去を手放す", "再生", "新たな始まり"],
    reversed_keywords_ja: ["変化への抵抗", "停滞", "手放せない", "恐れ", "終わりの遅延"],
  },
  {
    id: 14,
    name: "节制",
    name_en: "Temperance",
    arcana: "major",
    suit: null,
    upright_keywords: ["平衡", "耐心", "调和", "适度", "目标"],
    reversed_keywords: ["失衡", "过度", "缺乏耐心", "极端", "冲突"],
    upright_keywords_en: ["Balance", "Patience", "Harmony", "Moderation", "Purpose"],
    reversed_keywords_en: ["Imbalance", "Excess", "Impatience", "Extremes", "Conflict"],
    upright_keywords_ja: ["バランス", "忍耐", "調和", "節度", "目的"],
    reversed_keywords_ja: ["不均衡", "過剰", "忍耐不足", "極端", "対立"],
  },
  {
    id: 15,
    name: "恶魔",
    name_en: "The Devil",
    arcana: "major",
    suit: null,
    upright_keywords: ["束缚", "诱惑", "物质", "阴影面", "执念"],
    reversed_keywords: ["解脱", "打破束缚", "觉醒", "恢复自由", "放下"],
    upright_keywords_en: ["Bondage", "Temptation", "Materialism", "Shadow self", "Obsession"],
    reversed_keywords_en: ["Liberation", "Breaking free", "Awakening", "Reclaiming freedom", "Letting go"],
    upright_keywords_ja: ["束縛", "誘惑", "物質主義", "影の側面", "執着"],
    reversed_keywords_ja: ["解放", "束縛を断つ", "覚醒", "自由の回復", "手放し"],
  },
  {
    id: 16,
    name: "塔",
    name_en: "The Tower",
    arcana: "major",
    suit: null,
    upright_keywords: ["突变", "崩塌", "觉醒", "真相揭露", "解放"],
    reversed_keywords: ["灾难延迟", "抗拒改变", "恐惧", "避免最坏", "内在转变"],
    upright_keywords_en: ["Sudden change", "Collapse", "Awakening", "Truth revealed", "Liberation"],
    reversed_keywords_en: ["Delayed disaster", "Resisting change", "Fear", "Avoiding worst", "Inner transformation"],
    upright_keywords_ja: ["激変", "崩壊", "覚醒", "真実の暴露", "解放"],
    reversed_keywords_ja: ["災害の遅延", "変化への抵抗", "恐れ", "最悪を避ける", "内面の変容"],
  },
  {
    id: 17,
    name: "星星",
    name_en: "The Star",
    arcana: "major",
    suit: null,
    upright_keywords: ["希望", "信念", "平静", "灵感", "疗愈"],
    reversed_keywords: ["失望", "缺乏信心", "悲观", "脱离现实", "空虚"],
    upright_keywords_en: ["Hope", "Faith", "Serenity", "Inspiration", "Healing"],
    reversed_keywords_en: ["Disappointment", "Lack of faith", "Pessimism", "Disconnection", "Emptiness"],
    upright_keywords_ja: ["希望", "信念", "平穏", "インスピレーション", "癒し"],
    reversed_keywords_ja: ["失望", "信念の欠如", "悲観", "現実離れ", "空虚"],
  },
  {
    id: 18,
    name: "月亮",
    name_en: "The Moon",
    arcana: "major",
    suit: null,
    upright_keywords: ["直觉", "幻象", "不确定", "潜意识", "恐惧"],
    reversed_keywords: ["混乱", "欺骗揭露", "焦虑释放", "清晰", "面对恐惧"],
    upright_keywords_en: ["Intuition", "Illusion", "Uncertainty", "Subconscious", "Fear"],
    reversed_keywords_en: ["Confusion", "Deception revealed", "Anxiety released", "Clarity", "Facing fears"],
    upright_keywords_ja: ["直感", "幻想", "不確実", "潜在意識", "恐れ"],
    reversed_keywords_ja: ["混乱", "欺瞞の暴露", "不安の解消", "明晰", "恐れに立ち向かう"],
  },
  {
    id: 19,
    name: "太阳",
    name_en: "The Sun",
    arcana: "major",
    suit: null,
    upright_keywords: ["成功", "快乐", "活力", "清晰", "积极"],
    reversed_keywords: ["短暂低迷", "缺乏热情", "延迟成功", "自负", "倦怠"],
    upright_keywords_en: ["Success", "Joy", "Vitality", "Clarity", "Positivity"],
    reversed_keywords_en: ["Temporary setback", "Lack of enthusiasm", "Delayed success", "Ego", "Burnout"],
    upright_keywords_ja: ["成功", "喜び", "活力", "明晰", "前向き"],
    reversed_keywords_ja: ["一時的な停滞", "情熱の欠如", "成功の遅延", "自負", "燃え尽き"],
  },
  {
    id: 20,
    name: "审判",
    name_en: "Judgement",
    arcana: "major",
    suit: null,
    upright_keywords: ["觉醒", "重生", "反思", "召唤", "决断"],
    reversed_keywords: ["自我怀疑", "拒绝改变", "无法原谅", "逃避", "错失机会"],
    upright_keywords_en: ["Awakening", "Rebirth", "Reflection", "Calling", "Decision"],
    reversed_keywords_en: ["Self-doubt", "Refusing change", "Unable to forgive", "Avoidance", "Missed opportunity"],
    upright_keywords_ja: ["覚醒", "再生", "内省", "召命", "決断"],
    reversed_keywords_ja: ["自己不信", "変化の拒否", "許せない", "逃避", "機会損失"],
  },
  {
    id: 21,
    name: "世界",
    name_en: "The World",
    arcana: "major",
    suit: null,
    upright_keywords: ["完成", "整合", "成就", "圆满", "新旅程"],
    reversed_keywords: ["未完成", "停滞", "缺乏闭环", "延迟", "不圆满"],
    upright_keywords_en: ["Completion", "Integration", "Achievement", "Fulfillment", "New journey"],
    reversed_keywords_en: ["Incompletion", "Stagnation", "Lack of closure", "Delay", "Unfulfillment"],
    upright_keywords_ja: ["完成", "統合", "達成", "充実", "新たな旅"],
    reversed_keywords_ja: ["未完成", "停滞", "完結の欠如", "遅延", "不完全"],
  },
];

// ===== 牌阵位置定义 =====
export const SPREAD_POSITIONS: {
  id: TarotPosition;
  label: string;
  meaning: string;
}[] = [
  {
    id: "past",
    label: "过去",
    meaning: "影响当前问题的背景和根源",
  },
  {
    id: "present",
    label: "现在",
    meaning: "当前状态和面临的核心议题",
  },
  {
    id: "future",
    label: "未来",
    meaning: "如果保持现状，可能的发展方向",
  },
];

// ===== 核心函数 =====

/**
 * 根据ID获取塔罗牌
 */
export function getCardById(id: number): TarotCard | null {
  return MAJOR_ARCANA.find((card) => card.id === id) || null;
}

/**
 * 获取牌的关键词（根据正逆位和语言）
 */
export function getCardKeywords(card: TarotCard, isUpright: boolean, lang: string = "zh"): string[] {
  if (lang === "en") {
    return isUpright 
      ? (card.upright_keywords_en || card.upright_keywords)
      : (card.reversed_keywords_en || card.reversed_keywords);
  }
  if (lang === "ja") {
    return isUpright 
      ? (card.upright_keywords_ja || card.upright_keywords)
      : (card.reversed_keywords_ja || card.reversed_keywords);
  }
  return isUpright ? card.upright_keywords : card.reversed_keywords;
}

/**
 * 获取牌的含义文本（支持多语言）
 */
export function getCardMeaning(card: TarotCard, isUpright: boolean, lang: string = "zh"): string {
  const keywords = getCardKeywords(card, isUpright, lang);
  const separator = lang === "en" ? ", " : "、";
  return keywords.join(separator);
}

/**
 * 获取牌的方向文本（支持多语言）
 */
export function getOrientationText(isUpright: boolean, lang: string = "zh"): string {
  const texts = {
    zh: { upright: "正位", reversed: "逆位" },
    ja: { upright: "正位置", reversed: "逆位置" },
    en: { upright: "Upright", reversed: "Reversed" },
  };
  const t = texts[lang as keyof typeof texts] || texts.zh;
  return isUpright ? t.upright : t.reversed;
}

/**
 * Fisher-Yates 洗牌算法
 */
export function shuffle<T>(array: T[], rng: () => number): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/**
 * 随机抽取塔罗牌（不使用seed）
 */
export function drawRandomCards(count: number): TarotDraw[] {
  const rng = () => Math.random();
  const shuffled = shuffle(
    MAJOR_ARCANA.map((c) => c.id),
    rng
  );

  return shuffled.slice(0, count).map((cardId, index) => {
    const card = getCardById(cardId)!;
    const position = SPREAD_POSITIONS[index];
    const isUpright = rng() > 0.5;

    return {
      card,
      position: position.id,
      position_label: position.label,
      is_upright: isUpright,
      meaning: getCardMeaning(card, isUpright),
    };
  });
}

/**
 * AI模式：使用seed抽取塔罗牌
 */
export function aiDrawTarot(seed: string): TarotDraw[] {
  const rng = seededRandom(seed);
  const shuffled = shuffle(
    MAJOR_ARCANA.map((c) => c.id),
    rng
  );

  return SPREAD_POSITIONS.map((position, index) => {
    const card = getCardById(shuffled[index])!;
    const isUpright = rng() > 0.5;

    return {
      card,
      position: position.id,
      position_label: position.label,
      is_upright: isUpright,
      meaning: getCardMeaning(card, isUpright),
    };
  });
}

/**
 * 生成完整的塔罗结果
 */
export function generateTarotResult(draws: TarotDraw[]): TarotResult {
  return {
    type: "tarot",
    spread_type: "three_card",
    spread_name: "过去-现在-未来",
    cards: draws,
    deck_version: "major_22",
    draw_sequence: draws.map((d) => d.card.id),
  };
}

/**
 * AI模式生成完整塔罗结果
 */
export function aiGenerateTarot(seed: string): TarotResult {
  const draws = aiDrawTarot(seed);
  return generateTarotResult(draws);
}

/**
 * 手动模式：创建单张抽牌结果
 */
export function createManualDraw(
  cardId: number,
  positionIndex: number,
  isUpright: boolean
): TarotDraw {
  const card = getCardById(cardId);
  if (!card) {
    throw new Error(`Invalid card id: ${cardId}`);
  }

  const position = SPREAD_POSITIONS[positionIndex];
  if (!position) {
    throw new Error(`Invalid position index: ${positionIndex}`);
  }

  return {
    card,
    position: position.id,
    position_label: position.label,
    is_upright: isUpright,
    meaning: getCardMeaning(card, isUpright),
  };
}

/**
 * 获取剩余可抽的牌ID
 */
export function getAvailableCards(drawnIds: number[]): number[] {
  const drawnSet = new Set(drawnIds);
  return MAJOR_ARCANA.filter((card) => !drawnSet.has(card.id)).map(
    (card) => card.id
  );
}

/**
 * 随机决定正逆位
 */
export function randomOrientation(): boolean {
  return Math.random() > 0.5;
}

// ===== 辅助函数 =====

/**
 * 格式化牌的完整描述
 */
export function formatCardDescription(draw: TarotDraw): string {
  const orientation = getOrientationText(draw.is_upright);
  return `${draw.card.name}（${orientation}）`;
}

/**
 * 格式化牌阵描述
 */
export function formatSpreadDescription(draws: TarotDraw[]): string {
  return draws
    .map((d) => `${d.position_label}：${formatCardDescription(d)}`)
    .join(" | ");
}

/**
 * 获取位置的引导文案
 */
export function getPositionPrompt(positionIndex: number): string {
  const prompts = [
    "请选择代表【过去】的牌，它将揭示影响当前问题的背景。",
    "请选择代表【现在】的牌，它将展示你当前面临的核心议题。",
    "请选择代表【未来】的牌，它将预示可能的发展方向。",
  ];
  return prompts[positionIndex] || "";
}

/**
 * 获取翻牌后的提示文案
 */
export function getRevealMessage(draw: TarotDraw): string {
  const orientation = getOrientationText(draw.is_upright);
  return `${draw.card.name}（${orientation}）- ${draw.meaning}`;
}

/**
 * 获取完成抽牌的提示文案
 */
export function getCompletionMessage(): string {
  return "三张牌已揭示，正在为你解读牌阵的含义...";
}
