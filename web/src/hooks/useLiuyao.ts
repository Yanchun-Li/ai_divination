import { useState, useCallback } from "react";
import type {
  CoinToss,
  LiuyaoResult,
  LiuyaoState,
  Hexagram,
} from "../types/divination";
import {
  tossThreeCoins,
  calculateToss,
  generateLiuyaoResult,
  generateHexagrams,
  getYaoName,
  getCoinResultText,
  getPositionName,
} from "../lib/liuyao";

interface UseLiuyaoReturn {
  state: LiuyaoState;
  tossCoin: () => Promise<CoinToss>;
  reset: () => void;
  isComplete: boolean;
  result: LiuyaoResult | null;
  currentStepText: string;
  progressText: string;
}

const INITIAL_STATE: LiuyaoState = {
  currentStep: 0,
  tosses: [],
  isAnimating: false,
  hexagrams: null,
};

export function useLiuyao(): UseLiuyaoReturn {
  const [state, setState] = useState<LiuyaoState>(INITIAL_STATE);
  const [result, setResult] = useState<LiuyaoResult | null>(null);

  const isComplete = state.tosses.length >= 6;

  const tossCoin = useCallback(async (): Promise<CoinToss> => {
    if (isComplete) {
      throw new Error("Already completed 6 tosses");
    }

    // 开始动画
    setState((prev) => ({ ...prev, isAnimating: true }));

    // 模拟动画延迟
    await new Promise((resolve) => setTimeout(resolve, 800));

    // 抛铜钱
    const coins = tossThreeCoins();
    const toss = calculateToss(coins);

    // 更新状态
    setState((prev) => {
      const newTosses = [...prev.tosses, toss];
      const newStep = prev.currentStep + 1;

      let hexagrams: { primary: Hexagram; relating: Hexagram | null } | null =
        null;

      // 如果完成6次，计算卦象
      if (newTosses.length === 6) {
        hexagrams = generateHexagrams(newTosses);
      }

      return {
        currentStep: newStep,
        tosses: newTosses,
        isAnimating: false,
        hexagrams,
      };
    });

    return toss;
  }, [isComplete]);

  // 当完成时生成结果
  if (isComplete && !result && state.tosses.length === 6) {
    const newResult = generateLiuyaoResult(state.tosses);
    setResult(newResult);
  }

  const reset = useCallback(() => {
    setState(INITIAL_STATE);
    setResult(null);
  }, []);

  // 当前步骤提示文本
  const currentStepText = isComplete
    ? "六爻已成"
    : `心中默念问题，点击铜钱进行第${state.currentStep + 1}次投掷`;

  // 进度文本
  const progressText = `第 ${Math.min(state.currentStep + 1, 6)}/6 爻`;

  return {
    state,
    tossCoin,
    reset,
    isComplete,
    result,
    currentStepText,
    progressText,
  };
}

// ===== 工具函数 =====

/**
 * 格式化投掷结果文本
 */
export function formatTossResult(toss: CoinToss, lang: string = "zh"): string {
  const coinsText = getCoinResultText(toss.coins, lang);
  const yaoName = getYaoName(toss.yao_type, lang);
  const changingMarks: Record<string, { changing: string; static: string }> = {
    zh: { changing: "（动爻）", static: "（不动爻）" },
    ja: { changing: "（動爻）", static: "（不動爻）" },
    en: { changing: " (changing)", static: " (static)" },
  };
  const marks = changingMarks[lang] || changingMarks.zh;
  const changingMark = toss.is_changing ? marks.changing : marks.static;
  return `${coinsText} → ${toss.sum} → ${yaoName}${changingMark}`;
}

/**
 * 获取爻的展示数据
 */
export function getLineDisplayData(toss: CoinToss, position: number) {
  const posName = getPositionName(position);
  const isYang =
    toss.yao_type === "young_yang" || toss.yao_type === "old_yang";
  const yaoName = getYaoName(toss.yao_type);

  return {
    position,
    positionName: posName,
    isYang,
    isChanging: toss.is_changing,
    yaoName,
    symbol: isYang ? "⚊" : "⚋",
    changingMark: toss.is_changing ? (isYang ? "○" : "×") : "",
  };
}

export default useLiuyao;
