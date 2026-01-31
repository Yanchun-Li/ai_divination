// ===== 基础类型 =====
export type DivinationMode = "ai" | "manual";
export type DivinationMethod = "liuyao" | "tarot";

// ===== 问题 =====
export interface Question {
  text: string;
  created_at: string; // ISO timestamp
}

// ===== 六爻相关 =====
export type YaoType = "old_yin" | "young_yin" | "young_yang" | "old_yang";
// 老阴(6)=动爻阴变阳, 少阴(8)=不动阴, 少阳(7)=不动阳, 老阳(9)=动爻阳变阴

export interface CoinToss {
  coins: [number, number, number]; // 每枚铜钱结果：2或3
  sum: number; // 6/7/8/9
  yao_type: YaoType;
  is_changing: boolean; // 是否动爻
}

export interface LiuyaoLine {
  position: number; // 1-6，从下往上
  yao_type: YaoType;
  is_yang: boolean; // 本卦是否为阳爻
  is_changing: boolean;
  changed_yang?: boolean; // 变卦后是否为阳爻（仅动爻有）
}

export interface Hexagram {
  id: number; // 卦序号 1-64
  name: string; // 如 "乾"
  symbol: string; // 如 "☰☰"
  description: string;
  upper_trigram: string; // 上卦名
  lower_trigram: string; // 下卦名
}

export interface LiuyaoResult {
  type: "liuyao";
  lines: LiuyaoLine[]; // 6条爻，index 0=初爻
  changing_lines: number[]; // 动爻位置列表 [1,3,5]
  primary_hexagram: Hexagram;
  relating_hexagram?: Hexagram; // 变卦（无动爻时为null）
  raw_tosses: CoinToss[]; // 原始投掷记录（可复现）
}

// ===== 塔罗相关 =====
export type TarotArcana = "major" | "minor";
export type TarotSuit = "wands" | "cups" | "swords" | "pentacles" | null;
export type TarotPosition = "past" | "present" | "future";

export interface TarotCard {
  id: number; // 0-21 for major arcana
  name: string; // 如 "愚者"
  name_en: string; // "The Fool"
  arcana: TarotArcana;
  suit: TarotSuit; // 大阿尔克那为null
  upright_keywords: string[]; // 正位关键词
  reversed_keywords: string[]; // 逆位关键词
}

export interface TarotDraw {
  card: TarotCard;
  position: TarotPosition; // 牌阵位置
  position_label: string; // "过去" | "现在" | "未来"
  is_upright: boolean; // 是否正位
  meaning: string; // 根据正逆位的解释
}

export interface TarotResult {
  type: "tarot";
  spread_type: "three_card"; // MVP只做三张牌阵
  spread_name: string; // "过去-现在-未来"
  cards: TarotDraw[]; // 3张牌
  deck_version: string; // "major_22" 或 "full_78"
  draw_sequence: number[]; // 抽牌顺序（card id列表，用于复现）
}

// ===== 手动步骤 =====
export interface ManualStep {
  step_number: number;
  action: "coin_toss" | "card_draw";
  data: CoinToss | TarotDrawStep;
  timestamp: string;
}

export interface TarotDrawStep {
  card_id: number;
  position: TarotPosition;
  is_upright: boolean;
}

// ===== LLM解读结果 =====
export interface DivinationInterpretation {
  summary: string; // 一句话结论
  advice: string; // 行动建议
  timing: string; // 时机提示
  confidence: "low" | "medium" | "high"; // 置信度
  reasoning_bullets: string[]; // 解释要点（3-5条）
  follow_up_questions: string[]; // 追问建议（2-3个）
  ritual_ending: string; // 结束语
}

// ===== 会话 =====
export type DivinationStatus = "pending" | "in_progress" | "completed" | "failed";

export interface DivinationSession {
  id: string; // UUID
  user_id?: string; // 登录用户ID
  question: Question;
  mode: DivinationMode;
  method: DivinationMethod;
  seed: string; // 用于AI模式的随机种子
  status: DivinationStatus;
  result: LiuyaoResult | TarotResult | null;
  interpretation: DivinationInterpretation | null;
  manual_steps?: ManualStep[]; // 手动模式的步骤记录
  created_at: string;
  completed_at?: string;
}

// ===== API请求/响应类型 =====
export interface CreateSessionRequest {
  question: string;
  mode: DivinationMode;
  method: DivinationMethod;
  user_seed?: string;
  lang?: string; // "zh" | "ja" | "en"
}

export interface CreateSessionResponse {
  session_id: string;
  seed: string;
  status: DivinationStatus;
  created_at: string;
}

export interface GenerateRequest {
  session_id: string;
}

export interface GenerateResponse {
  session_id: string;
  status: DivinationStatus;
  result: LiuyaoResult | TarotResult;
  interpretation: DivinationInterpretation;
}

export interface ManualStepRequest {
  session_id: string;
  step_number: number;
  action: "coin_toss" | "card_draw";
  data: CoinToss | TarotDrawStep;
}

export interface ManualStepResponse {
  session_id: string;
  current_step: number;
  total_steps: number;
  is_complete: boolean;
  partial_result?: Partial<LiuyaoResult | TarotResult>;
}

export interface InterpretRequest {
  session_id: string;
}

export interface InterpretResponse {
  session_id: string;
  interpretation: DivinationInterpretation;
}

export interface SessionDetailResponse {
  session: DivinationSession;
}

// ===== 前端状态类型 =====
export interface LiuyaoState {
  currentStep: number; // 0-5
  tosses: CoinToss[];
  isAnimating: boolean;
  hexagrams: { primary: Hexagram; relating: Hexagram | null } | null;
}

export interface TarotState {
  currentStep: number; // 0-2
  drawnCards: TarotDraw[];
  availableCards: number[]; // 剩余可抽的牌ID
  isRevealing: boolean; // 翻牌动画中
  selectedCardIndex: number | null;
}

export interface DivinationFlowState {
  stage:
    | "idle"
    | "question_entered"
    | "mode_selected"
    | "method_selected"
    | "in_progress"
    | "generating"
    | "interpreting"
    | "completed"
    | "error";
  question: string;
  mode: DivinationMode | null;
  method: DivinationMethod | null;
  sessionId: string | null;
  seed: string | null;
  liuyaoState: LiuyaoState | null;
  tarotState: TarotState | null;
  result: LiuyaoResult | TarotResult | null;
  interpretation: DivinationInterpretation | null;
  error: string | null;
  isLoading: boolean;
}
