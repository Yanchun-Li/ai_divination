"use client";

import { useState } from "react";
import { useTarot } from "../../../hooks/useTarot";
import { CardDeck } from "./CardDeck";
import { CardReveal } from "./CardReveal";
import { SpreadDisplay } from "./SpreadDisplay";
import { SPREAD_POSITIONS, randomOrientation } from "../../../lib/tarot";
import { translations, type Language } from "../../../app/translations";
import type { TarotResult, TarotDrawStep } from "../../../types/divination";

interface TarotManualProps {
  onComplete: (result: TarotResult) => void;
  onStepComplete?: (stepNumber: number, draw: TarotDrawStep) => void;
  lang?: Language;
}

export function TarotManual({ onComplete, onStepComplete, lang = "zh" }: TarotManualProps) {
  const td = translations[lang].divination;
  const {
    state,
    selectCard,
    reset,
    isComplete,
    result,
    availableCardIds,
  } = useTarot();
  
  // 使用翻译后的进度文本
  const progressText = td.tarotProgress.replace("{n}", String(Math.min(state.currentStep + 1, 3)));
  const currentPrompt = isComplete ? td.threeCardsRevealed : td.focusAndDraw;

  const [lastDraw, setLastDraw] = useState<import("../../../types/divination").TarotDraw | null>(null);
  const [showLastReveal, setShowLastReveal] = useState(false);

  const handleSelectCard = async (cardId: number) => {
    if (state.isRevealing || isComplete) return;
    
    try {
      const draw = await selectCard(cardId);
      setLastDraw(draw);
      
      // 上报步骤
      onStepComplete?.(state.drawnCards.length + 1, {
        card_id: draw.card.id,
        position: draw.position,
        is_upright: draw.is_upright,
      });
    } catch (error) {
      console.error("Select card failed:", error);
    }
  };

  const currentPosition = SPREAD_POSITIONS[state.currentStep];
  
  // 获取翻译后的位置标签
  const getPositionLabel = (label: string) => {
    if (label === "过去") return td.positionPast;
    if (label === "现在") return td.positionPresent;
    if (label === "未来") return td.positionFuture;
    return label;
  };

  return (
    <div className="tarot-manual">
      {/* 进度指示 */}
      <div className="progress-header">
        <span className="progress-text">{progressText}</span>
        <p className="step-hint">{currentPrompt}</p>
        {currentPosition && !isComplete && (
          <p className="position-hint">
            {td.selectPosition}{getPositionLabel(currentPosition.label)}
          </p>
        )}
      </div>

      {/* 牌阵展示（包含已抽的和未抽的） */}
      <div className="spread-preview">
        <SpreadDisplay 
          draws={state.drawnCards} 
          showAll={true}
          compact={isComplete ? false : true}
          lang={lang}
        />
      </div>

      {/* 牌堆 */}
      {!isComplete && (
        <div className="deck-section">
          <CardDeck
            availableCardIds={availableCardIds}
            onSelectCard={handleSelectCard}
            disabled={state.isRevealing}
            selectedCardId={state.selectedCardIndex}
          />
        </div>
      )}

      {/* 完成后操作 */}
      {isComplete && result && (
        <div className="action-buttons">
          <button className="btn-secondary" onClick={reset}>
            {td.redrawManual}
          </button>
          <button className="btn-primary" onClick={() => {
            if (result) onComplete(result);
          }}>
            {td.getInterpretation}
          </button>
        </div>
      )}

      <style jsx>{`
        .tarot-manual {
          display: flex;
          flex-direction: column;
          gap: 2rem;
          padding: 1rem;
        }

        .progress-header {
          text-align: center;
        }

        .progress-text {
          display: inline-block;
          padding: 4px 12px;
          background: var(--accent-soft);
          color: var(--accent-dark);
          border-radius: 12px;
          font-size: 12px;
          font-weight: 600;
          margin-bottom: 8px;
        }

        .step-hint {
          font-size: 18px;
          color: var(--ink);
          font-family: var(--font-serif);
        }

        .position-hint {
          font-size: 14px;
          color: var(--accent-dark);
          margin-top: 4px;
        }

        .spread-preview {
          margin: 20px 0;
        }

        .deck-section {
          background: var(--glass);
          border-radius: 24px;
          padding: 20px;
        }

        .action-buttons {
          display: flex;
          gap: 16px;
          justify-content: center;
        }

        .btn-primary, .btn-secondary {
          padding: 12px 32px;
          border-radius: 12px;
          font-size: 16px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-primary {
          background: var(--accent);
          color: white;
          border: none;
        }

        .btn-secondary {
          background: white;
          color: var(--ink);
          border: 1px solid var(--accent);
        }
      `}</style>
    </div>
  );
}

export default TarotManual;
