import type {
  YaoType,
  CoinToss,
  LiuyaoLine,
  Hexagram,
  LiuyaoResult,
} from "../types/divination";

// ===== 铜钱法规则 =====
// 正面（有字）= 3，反面（无字）= 2
// 三枚相加：6=老阴, 7=少阳, 8=少阴, 9=老阳

const YAO_TYPE_MAP: Record<number, YaoType> = {
  6: "old_yin", // 动爻，阴变阳
  7: "young_yang", // 不动，阳
  8: "young_yin", // 不动，阴
  9: "old_yang", // 动爻，阳变阴
};

const YAO_NAMES: Record<string, Record<YaoType, string>> = {
  zh: {
    old_yin: "老阴",
    young_yin: "少阴",
    young_yang: "少阳",
    old_yang: "老阳",
  },
  ja: {
    old_yin: "老陰",
    young_yin: "少陰",
    young_yang: "少陽",
    old_yang: "老陽",
  },
  en: {
    old_yin: "Old Yin",
    young_yin: "Young Yin",
    young_yang: "Young Yang",
    old_yang: "Old Yang",
  },
};

const YAO_SYMBOLS: Record<YaoType, string> = {
  old_yin: "⚋×", // 阴爻动
  young_yin: "⚋",
  young_yang: "⚊",
  old_yang: "⚊○", // 阳爻动
};

// ===== 八卦数据 =====
const TRIGRAMS: Record<string, { name: string; symbol: string; nature: string }> = {
  "111": { name: "乾", symbol: "☰", nature: "天" },
  "000": { name: "坤", symbol: "☷", nature: "地" },
  "100": { name: "震", symbol: "☳", nature: "雷" },
  "010": { name: "坎", symbol: "☵", nature: "水" },
  "001": { name: "艮", symbol: "☶", nature: "山" },
  "011": { name: "巽", symbol: "☴", nature: "风" },
  "101": { name: "离", symbol: "☲", nature: "火" },
  "110": { name: "兑", symbol: "☱", nature: "泽" },
};

// ===== 64卦数据 =====
// 卦序按照先天八卦排列（上卦+下卦的二进制）
export const HEXAGRAMS: Hexagram[] = [
  // 乾宫八卦
  { id: 1, name: "乾", symbol: "☰☰", description: "元亨利贞，刚健进取", upper_trigram: "乾", lower_trigram: "乾" },
  { id: 2, name: "坤", symbol: "☷☷", description: "厚德载物，包容承载", upper_trigram: "坤", lower_trigram: "坤" },
  { id: 3, name: "屯", symbol: "☵☳", description: "万物始生，艰难初创", upper_trigram: "坎", lower_trigram: "震" },
  { id: 4, name: "蒙", symbol: "☶☵", description: "启蒙教育，循序渐进", upper_trigram: "艮", lower_trigram: "坎" },
  { id: 5, name: "需", symbol: "☵☰", description: "等待时机，蓄势待发", upper_trigram: "坎", lower_trigram: "乾" },
  { id: 6, name: "讼", symbol: "☰☵", description: "争讼纷争，宜和为贵", upper_trigram: "乾", lower_trigram: "坎" },
  { id: 7, name: "师", symbol: "☷☵", description: "行师出征，纪律严明", upper_trigram: "坤", lower_trigram: "坎" },
  { id: 8, name: "比", symbol: "☵☷", description: "亲比辅助，和睦相处", upper_trigram: "坎", lower_trigram: "坤" },
  { id: 9, name: "小畜", symbol: "☴☰", description: "小有积蓄，密云不雨", upper_trigram: "巽", lower_trigram: "乾" },
  { id: 10, name: "履", symbol: "☰☱", description: "小心行事，履虎尾", upper_trigram: "乾", lower_trigram: "兑" },
  { id: 11, name: "泰", symbol: "☷☰", description: "天地交泰，通达亨通", upper_trigram: "坤", lower_trigram: "乾" },
  { id: 12, name: "否", symbol: "☰☷", description: "天地不交，闭塞不通", upper_trigram: "乾", lower_trigram: "坤" },
  { id: 13, name: "同人", symbol: "☰☲", description: "志同道合，和睦共处", upper_trigram: "乾", lower_trigram: "离" },
  { id: 14, name: "大有", symbol: "☲☰", description: "大有所获，富有充盈", upper_trigram: "离", lower_trigram: "乾" },
  { id: 15, name: "谦", symbol: "☷☶", description: "谦虚恭让，获益多多", upper_trigram: "坤", lower_trigram: "艮" },
  { id: 16, name: "豫", symbol: "☳☷", description: "欢乐愉悦，顺势而为", upper_trigram: "震", lower_trigram: "坤" },
  { id: 17, name: "随", symbol: "☱☳", description: "随顺变通，灵活应对", upper_trigram: "兑", lower_trigram: "震" },
  { id: 18, name: "蛊", symbol: "☶☴", description: "整顿弊病，革故鼎新", upper_trigram: "艮", lower_trigram: "巽" },
  { id: 19, name: "临", symbol: "☷☱", description: "居高临下，亲近民众", upper_trigram: "坤", lower_trigram: "兑" },
  { id: 20, name: "观", symbol: "☴☷", description: "观察审视，以身作则", upper_trigram: "巽", lower_trigram: "坤" },
  { id: 21, name: "噬嗑", symbol: "☲☳", description: "明断狱讼，赏罚分明", upper_trigram: "离", lower_trigram: "震" },
  { id: 22, name: "贲", symbol: "☶☲", description: "文饰修养，内外兼修", upper_trigram: "艮", lower_trigram: "离" },
  { id: 23, name: "剥", symbol: "☶☷", description: "剥落衰败，顺势而退", upper_trigram: "艮", lower_trigram: "坤" },
  { id: 24, name: "复", symbol: "☷☳", description: "一阳来复，万象更新", upper_trigram: "坤", lower_trigram: "震" },
  { id: 25, name: "无妄", symbol: "☰☳", description: "无妄之福，顺应天道", upper_trigram: "乾", lower_trigram: "震" },
  { id: 26, name: "大畜", symbol: "☶☰", description: "大有积蓄，厚积薄发", upper_trigram: "艮", lower_trigram: "乾" },
  { id: 27, name: "颐", symbol: "☶☳", description: "颐养正道，自食其力", upper_trigram: "艮", lower_trigram: "震" },
  { id: 28, name: "大过", symbol: "☱☴", description: "过犹不及，把握分寸", upper_trigram: "兑", lower_trigram: "巽" },
  { id: 29, name: "坎", symbol: "☵☵", description: "重重险阻，坚持信念", upper_trigram: "坎", lower_trigram: "坎" },
  { id: 30, name: "离", symbol: "☲☲", description: "光明依附，柔顺中正", upper_trigram: "离", lower_trigram: "离" },
  { id: 31, name: "咸", symbol: "☱☶", description: "感应相通，真诚交流", upper_trigram: "兑", lower_trigram: "艮" },
  { id: 32, name: "恒", symbol: "☳☴", description: "恒久坚持，持之以恒", upper_trigram: "震", lower_trigram: "巽" },
  { id: 33, name: "遁", symbol: "☰☶", description: "退避隐遁，明哲保身", upper_trigram: "乾", lower_trigram: "艮" },
  { id: 34, name: "大壮", symbol: "☳☰", description: "刚健有力，适可而止", upper_trigram: "震", lower_trigram: "乾" },
  { id: 35, name: "晋", symbol: "☲☷", description: "日出地上，光明进取", upper_trigram: "离", lower_trigram: "坤" },
  { id: 36, name: "明夷", symbol: "☷☲", description: "光明受损，韬光养晦", upper_trigram: "坤", lower_trigram: "离" },
  { id: 37, name: "家人", symbol: "☴☲", description: "家道正和，齐家治国", upper_trigram: "巽", lower_trigram: "离" },
  { id: 38, name: "睽", symbol: "☲☱", description: "睽违背离，异中求同", upper_trigram: "离", lower_trigram: "兑" },
  { id: 39, name: "蹇", symbol: "☵☶", description: "艰难险阻，知难而退", upper_trigram: "坎", lower_trigram: "艮" },
  { id: 40, name: "解", symbol: "☳☵", description: "解除困难，雷雨交作", upper_trigram: "震", lower_trigram: "坎" },
  { id: 41, name: "损", symbol: "☶☱", description: "损下益上，有所舍得", upper_trigram: "艮", lower_trigram: "兑" },
  { id: 42, name: "益", symbol: "☴☳", description: "损上益下，利民兴业", upper_trigram: "巽", lower_trigram: "震" },
  { id: 43, name: "夬", symbol: "☱☰", description: "决断果敢，刚决柔", upper_trigram: "兑", lower_trigram: "乾" },
  { id: 44, name: "姤", symbol: "☰☴", description: "不期而遇，柔遇刚", upper_trigram: "乾", lower_trigram: "巽" },
  { id: 45, name: "萃", symbol: "☱☷", description: "聚集汇合，择善而从", upper_trigram: "兑", lower_trigram: "坤" },
  { id: 46, name: "升", symbol: "☷☴", description: "积小成大，升进发展", upper_trigram: "坤", lower_trigram: "巽" },
  { id: 47, name: "困", symbol: "☱☵", description: "困厄穷境，守正待时", upper_trigram: "兑", lower_trigram: "坎" },
  { id: 48, name: "井", symbol: "☵☴", description: "井养不穷，取之有道", upper_trigram: "坎", lower_trigram: "巽" },
  { id: 49, name: "革", symbol: "☱☲", description: "革故鼎新，顺时而变", upper_trigram: "兑", lower_trigram: "离" },
  { id: 50, name: "鼎", symbol: "☲☴", description: "鼎新革故，调和五味", upper_trigram: "离", lower_trigram: "巽" },
  { id: 51, name: "震", symbol: "☳☳", description: "雷声震动，慎言慎行", upper_trigram: "震", lower_trigram: "震" },
  { id: 52, name: "艮", symbol: "☶☶", description: "止而后动，静定生慧", upper_trigram: "艮", lower_trigram: "艮" },
  { id: 53, name: "渐", symbol: "☴☶", description: "循序渐进，稳步发展", upper_trigram: "巽", lower_trigram: "艮" },
  { id: 54, name: "归妹", symbol: "☳☱", description: "归妹出嫁，知行合一", upper_trigram: "震", lower_trigram: "兑" },
  { id: 55, name: "丰", symbol: "☳☲", description: "丰盛光明，宜日中", upper_trigram: "震", lower_trigram: "离" },
  { id: 56, name: "旅", symbol: "☲☶", description: "旅途漂泊，小心谨慎", upper_trigram: "离", lower_trigram: "艮" },
  { id: 57, name: "巽", symbol: "☴☴", description: "顺从柔和，谦逊入微", upper_trigram: "巽", lower_trigram: "巽" },
  { id: 58, name: "兑", symbol: "☱☱", description: "喜悦和乐，言语得当", upper_trigram: "兑", lower_trigram: "兑" },
  { id: 59, name: "涣", symbol: "☴☵", description: "涣散离析，济险脱困", upper_trigram: "巽", lower_trigram: "坎" },
  { id: 60, name: "节", symbol: "☵☱", description: "节制有度，适可而止", upper_trigram: "坎", lower_trigram: "兑" },
  { id: 61, name: "中孚", symbol: "☴☱", description: "诚信感动，真诚待人", upper_trigram: "巽", lower_trigram: "兑" },
  { id: 62, name: "小过", symbol: "☳☶", description: "小有过越，谨小慎微", upper_trigram: "震", lower_trigram: "艮" },
  { id: 63, name: "既济", symbol: "☵☲", description: "事已成就，守成保业", upper_trigram: "坎", lower_trigram: "离" },
  { id: 64, name: "未济", symbol: "☲☵", description: "事未完成，继续努力", upper_trigram: "离", lower_trigram: "坎" },
];

// 卦象查找映射：根据六爻阴阳(0/1)序列查找卦
// 键为6位二进制字符串，从初爻到上爻
const HEXAGRAM_LOOKUP: Record<string, number> = {};

// 构建查找表
function buildHexagramLookup(): void {
  // 根据上下卦的组合构建
  const trigramToBinary: Record<string, string> = {
    乾: "111",
    坤: "000",
    震: "100",
    坎: "010",
    艮: "001",
    巽: "011",
    离: "101",
    兑: "110",
  };

  const binaryToTrigram: Record<string, string> = {};
  for (const [name, binary] of Object.entries(trigramToBinary)) {
    binaryToTrigram[binary] = name;
  }

  HEXAGRAMS.forEach((hex) => {
    const upperBinary = trigramToBinary[hex.upper_trigram];
    const lowerBinary = trigramToBinary[hex.lower_trigram];
    if (upperBinary && lowerBinary) {
      // 六爻从下到上：下卦3爻 + 上卦3爻
      const fullBinary = lowerBinary + upperBinary;
      HEXAGRAM_LOOKUP[fullBinary] = hex.id;
    }
  });
}

buildHexagramLookup();

// ===== 核心函数 =====

/**
 * 模拟抛铜钱（随机生成）
 */
export function tossCoin(): number {
  return Math.random() > 0.5 ? 3 : 2; // 正面=3, 反面=2
}

/**
 * 抛三枚铜钱
 */
export function tossThreeCoins(): [number, number, number] {
  return [tossCoin(), tossCoin(), tossCoin()];
}

/**
 * 根据铜钱结果计算爻类型
 */
export function calculateToss(coins: [number, number, number]): CoinToss {
  const sum = coins[0] + coins[1] + coins[2];
  const yao_type = YAO_TYPE_MAP[sum];
  return {
    coins,
    sum,
    yao_type,
    is_changing: sum === 6 || sum === 9,
  };
}

/**
 * 获取爻的阴阳属性
 */
export function isYangYao(yaoType: YaoType): boolean {
  return yaoType === "young_yang" || yaoType === "old_yang";
}

/**
 * 将六爻转换为二进制字符串
 */
export function tossesToBinary(tosses: CoinToss[]): string {
  return tosses.map((t) => (isYangYao(t.yao_type) ? "1" : "0")).join("");
}

/**
 * 根据二进制字符串查找卦象
 */
export function lookupHexagram(binary: string): Hexagram | null {
  const id = HEXAGRAM_LOOKUP[binary];
  if (id) {
    return HEXAGRAMS.find((h) => h.id === id) || null;
  }
  return null;
}

/**
 * 生成变卦的二进制（动爻阴阳互换）
 */
export function generateRelatingBinary(
  tosses: CoinToss[],
  primaryBinary: string
): string {
  return tosses
    .map((t, i) => {
      if (!t.is_changing) return primaryBinary[i];
      return primaryBinary[i] === "1" ? "0" : "1";
    })
    .join("");
}

/**
 * 根据投掷序列生成本卦和变卦
 */
export function generateHexagrams(tosses: CoinToss[]): {
  primary: Hexagram;
  relating: Hexagram | null;
} {
  const primaryBinary = tossesToBinary(tosses);
  const primary = lookupHexagram(primaryBinary);

  if (!primary) {
    throw new Error(`Invalid hexagram binary: ${primaryBinary}`);
  }

  const hasChanging = tosses.some((t) => t.is_changing);
  let relating: Hexagram | null = null;

  if (hasChanging) {
    const relatingBinary = generateRelatingBinary(tosses, primaryBinary);
    relating = lookupHexagram(relatingBinary);
  }

  return { primary, relating };
}

/**
 * 构建六爻线条数据
 */
export function buildLines(tosses: CoinToss[]): LiuyaoLine[] {
  return tosses.map((toss, index) => {
    const is_yang = isYangYao(toss.yao_type);
    const line: LiuyaoLine = {
      position: index + 1,
      yao_type: toss.yao_type,
      is_yang,
      is_changing: toss.is_changing,
    };

    if (toss.is_changing) {
      line.changed_yang = !is_yang; // 动爻阴阳互换
    }

    return line;
  });
}

/**
 * 生成完整的六爻结果
 */
export function generateLiuyaoResult(tosses: CoinToss[]): LiuyaoResult {
  if (tosses.length !== 6) {
    throw new Error("Must have exactly 6 tosses");
  }

  const { primary, relating } = generateHexagrams(tosses);
  const lines = buildLines(tosses);
  const changing_lines = lines
    .filter((l) => l.is_changing)
    .map((l) => l.position);

  return {
    type: "liuyao",
    lines,
    changing_lines,
    primary_hexagram: primary,
    relating_hexagram: relating || undefined,
    raw_tosses: tosses,
  };
}

// ===== 可复现随机数生成器 =====

/**
 * 基于seed生成确定性随机数
 */
export function seededRandom(seed: string): () => number {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash = hash & hash;
  }

  return function () {
    hash = Math.imul(hash ^ (hash >>> 16), 2246822507);
    hash = Math.imul(hash ^ (hash >>> 13), 3266489909);
    hash ^= hash >>> 16;
    return (hash >>> 0) / 4294967296;
  };
}

/**
 * 使用seed生成铜钱结果
 */
export function seededTossCoin(rng: () => number): number {
  return rng() > 0.5 ? 3 : 2;
}

/**
 * 使用seed生成三枚铜钱
 */
export function seededTossThreeCoins(
  rng: () => number
): [number, number, number] {
  return [seededTossCoin(rng), seededTossCoin(rng), seededTossCoin(rng)];
}

/**
 * AI模式：使用seed生成完整六爻
 */
export function aiGenerateLiuyao(seed: string): LiuyaoResult {
  const rng = seededRandom(seed);
  const tosses: CoinToss[] = [];

  for (let i = 0; i < 6; i++) {
    const coins = seededTossThreeCoins(rng);
    tosses.push(calculateToss(coins));
  }

  return generateLiuyaoResult(tosses);
}

// ===== 辅助函数 =====

/**
 * 获取爻的名称
 */
export function getYaoName(yaoType: YaoType, lang: string = "zh"): string {
  const names = YAO_NAMES[lang] || YAO_NAMES.zh;
  return names[yaoType];
}

/**
 * 获取爻的符号
 */
export function getYaoSymbol(yaoType: YaoType): string {
  return YAO_SYMBOLS[yaoType];
}

/**
 * 获取铜钱结果描述
 */
export function getCoinResultText(coins: [number, number, number], lang: string = "zh"): string {
  const coinLabels: Record<string, { heads: string; tails: string }> = {
    zh: { heads: "正", tails: "反" },
    ja: { heads: "表", tails: "裏" },
    en: { heads: "H", tails: "T" },
  };
  const labels = coinLabels[lang] || coinLabels.zh;
  const faces = coins.map((c) => (c === 3 ? labels.heads : labels.tails));
  return faces.join("·");
}

/**
 * 获取爻位名称
 */
export function getPositionName(position: number, lang: string = "zh"): string {
  const positionNames: Record<string, string[]> = {
    zh: ["初", "二", "三", "四", "五", "上"],
    ja: ["初", "二", "三", "四", "五", "上"],
    en: ["1st", "2nd", "3rd", "4th", "5th", "6th"],
  };
  const names = positionNames[lang] || positionNames.zh;
  return names[position - 1] || "";
}

/**
 * 格式化爻的完整描述
 */
export function formatLineDescription(line: LiuyaoLine): string {
  const posName = getPositionName(line.position);
  const yinYang = line.is_yang ? "阳" : "阴";
  const yaoName = getYaoName(line.yao_type);
  const changingMark = line.is_changing ? "（动）" : "";
  return `${posName}爻：${yinYang}爻（${yaoName}）${changingMark}`;
}

/**
 * 获取动爻描述
 */
export function getChangingLinesDescription(changingLines: number[]): string {
  if (changingLines.length === 0) {
    return "无动爻";
  }
  const names = changingLines.map(
    (pos) => `${getPositionName(pos)}爻`
  );
  return names.join("、") + "动";
}
