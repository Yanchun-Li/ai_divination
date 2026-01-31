import { useState, useCallback } from "react";
import type {
  TarotDraw,
  TarotResult,
  TarotState,
  TarotPosition,
} from "../types/divination";
import {
  MAJOR_ARCANA,
  SPREAD_POSITIONS,
  getCardById,
  getCardMeaning,
  generateTarotResult,
  getAvailableCards,
  randomOrientation,
  getPositionPrompt,
  getRevealMessage,
} from "../lib/tarot";

interface UseTarotReturn {
  state: TarotState;
  selectCard: (cardId: number) => Promise<TarotDraw>;
  reset: () => void;
  isComplete: boolean;
  result: TarotResult | null;
  currentPrompt: string;
  progressText: string;
  availableCardIds: number[];
}

const INITIAL_STATE: TarotState = {
  currentStep: 0,
  drawnCards: [],
  availableCards: MAJOR_ARCANA.map((c) => c.id),
  isRevealing: false,
  selectedCardIndex: null,
};

export function useTarot(): UseTarotReturn {
  const [state, setState] = useState<TarotState>(INITIAL_STATE);
  const [result, setResult] = useState<TarotResult | null>(null);

  const isComplete = state.drawnCards.length >= 3;

  const selectCard = useCallback(
    async (cardId: number): Promise<TarotDraw> => {
      if (isComplete) {
        throw new Error("Already completed 3 draws");
      }

      if (!state.availableCards.includes(cardId)) {
        throw new Error("Card not available");
      }

      // 开始翻牌动画
      setState((prev) => ({
        ...prev,
        isRevealing: true,
        selectedCardIndex: cardId,
      }));

      // 模拟翻牌动画延迟
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // 随机决定正逆位
      const isUpright = randomOrientation();
      const card = getCardById(cardId)!;
      const position = SPREAD_POSITIONS[state.currentStep];

      const draw: TarotDraw = {
        card,
        position: position.id,
        position_label: position.label,
        is_upright: isUpright,
        meaning: getCardMeaning(card, isUpright),
      };

      // 更新状态
      setState((prev) => {
        const newDrawnCards = [...prev.drawnCards, draw];
        const newAvailableCards = getAvailableCards(
          newDrawnCards.map((d) => d.card.id)
        );

        return {
          currentStep: prev.currentStep + 1,
          drawnCards: newDrawnCards,
          availableCards: newAvailableCards,
          isRevealing: false,
          selectedCardIndex: null,
        };
      });

      return draw;
    },
    [isComplete, state.availableCards, state.currentStep]
  );

  // 当完成时生成结果
  if (isComplete && !result && state.drawnCards.length === 3) {
    const newResult = generateTarotResult(state.drawnCards);
    setResult(newResult);
  }

  const reset = useCallback(() => {
    setState(INITIAL_STATE);
    setResult(null);
  }, []);

  // 当前提示文本
  const currentPrompt = isComplete
    ? "三张牌已揭示"
    : getPositionPrompt(state.currentStep);

  // 进度文本
  const progressText = `第 ${Math.min(state.currentStep + 1, 3)}/3 张`;

  return {
    state,
    selectCard,
    reset,
    isComplete,
    result,
    currentPrompt,
    progressText,
    availableCardIds: state.availableCards,
  };
}

// ===== 工具函数 =====

/**
 * 获取牌的展示数据
 */
export function getCardDisplayData(draw: TarotDraw) {
  return {
    id: draw.card.id,
    name: draw.card.name,
    nameEn: draw.card.name_en,
    isUpright: draw.is_upright,
    orientation: draw.is_upright ? "正位" : "逆位",
    position: draw.position,
    positionLabel: draw.position_label,
    meaning: draw.meaning,
    keywords: draw.is_upright
      ? draw.card.upright_keywords
      : draw.card.reversed_keywords,
    revealMessage: getRevealMessage(draw),
  };
}

/**
 * 获取牌堆的展示数据
 */
export function getDeckDisplayData(availableCards: number[]) {
  return availableCards.map((id) => {
    const card = getCardById(id)!;
    return {
      id,
      name: card.name,
      nameEn: card.name_en,
    };
  });
}

export default useTarot;
