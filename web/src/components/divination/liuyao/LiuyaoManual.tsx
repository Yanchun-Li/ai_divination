"use client";

import { useEffect } from "react";
import { useLiuyao, formatTossResult } from "../../../hooks/useLiuyao";
import { CoinToss } from "./CoinToss";
import { LineDisplay } from "./LineDisplay";
import { HexagramDisplay } from "./HexagramDisplay";
import type { LiuyaoResult } from "../../../types/divination";

interface LiuyaoManualProps {
  onComplete: (result: LiuyaoResult) => void;
  onStepComplete?: (stepNumber: number, toss: import("../../../types/divination").CoinToss) => void;
}

export function LiuyaoManual({ onComplete, onStepComplete }: LiuyaoManualProps) {
  const {
    state,
    tossCoin,
    reset,
    isComplete,
    result,
    currentStepText,
    progressText,
  } = useLiuyao();

  const handleToss = async () => {
    if (state.isAnimating || isComplete) return;
    
    // 直接调用 tossCoin，它会处理动画和状态更新
    const toss = await tossCoin();
    
    // 这里的 state.tosses 还是旧的，所以用 tossCoin 返回的结果
    if (toss) {
      onStepComplete?.(state.tosses.length + 1, toss);
    }
    return toss;
  };

  // 使用 useEffect 监听完成状态
  useEffect(() => {
    if (isComplete && result && !state.isAnimating) {
      // 自动触发完成回调（可选）
      // onComplete(result);
    }
  }, [isComplete, result, state.isAnimating]);

  return (
    <div className="liuyao-manual">
      {/* 进度指示 */}
      <div className="progress-header">
        <span className="progress-text">{progressText}</span>
        <p className="step-hint">{currentStepText}</p>
      </div>

      {/* 已完成的爻（从下往上显示） */}
      {state.tosses.length > 0 && (
        <div className="completed-lines">
          <h4 className="section-title">已成之爻</h4>
          <div className="lines-stack">
            {[...state.tosses].reverse().map((toss, reversedIndex) => {
              const position = state.tosses.length - reversedIndex;
              return (
                <div key={position} className="line-row">
                  <LineDisplay
                    toss={toss}
                    position={position}
                    showDetails={true}
                    isHighlighted={toss.is_changing}
                  />
                  <span className="toss-result-text">
                    {formatTossResult(toss)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 抛铜钱区域 */}
      {!isComplete && (
        <CoinToss
          onToss={handleToss}
          disabled={isComplete}
          isAnimating={state.isAnimating}
        />
      )}

      {/* 完成后显示卦象 */}
      {isComplete && result && state.hexagrams && (
        <div className="result-section">
          <h4 className="section-title">卦象已成</h4>
          <HexagramDisplay
            hexagram={state.hexagrams.primary}
            tosses={state.tosses}
            relatingHexagram={state.hexagrams.relating || undefined}
            showLines={true}
          />

          <div className="action-buttons">
            <button className="btn-secondary" onClick={reset}>
              重新起卦
            </button>
            <button className="btn-primary" onClick={() => {
              if (result) onComplete(result);
            }}>
              获取解读
            </button>
          </div>
        </div>
      )}

      <style jsx>{`
        .liuyao-manual {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .progress-header {
          text-align: center;
        }

        .progress-text {
          display: inline-block;
          padding: 0.5rem 1rem;
          background: var(--accent, #c49a6c);
          color: white;
          border-radius: 20px;
          font-size: 0.9rem;
          font-weight: 500;
        }

        .step-hint {
          margin: 0.75rem 0 0;
          color: var(--ink-soft, #7a736d);
          font-size: 0.95rem;
        }

        .section-title {
          font-size: 1rem;
          color: var(--ink, #2d2926);
          margin: 0 0 0.75rem;
          font-weight: 500;
        }

        .completed-lines {
          padding: 1rem;
          background: var(--glass, rgba(255, 255, 255, 0.45));
          border-radius: 12px;
        }

        .lines-stack {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .line-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1rem;
        }

        .toss-result-text {
          font-size: 0.8rem;
          color: var(--ink-soft, #7a736d);
          white-space: nowrap;
        }

        .result-section {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .action-buttons {
          display: flex;
          gap: 1rem;
          justify-content: center;
          margin-top: 1rem;
        }

        .btn-primary,
        .btn-secondary {
          padding: 0.75rem 1.5rem;
          border-radius: 12px;
          font-size: 1rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .btn-primary {
          background: var(--accent, #c49a6c);
          color: white;
          border: none;
        }

        .btn-primary:hover {
          background: var(--accent-dark, #8b6d4b);
        }

        .btn-secondary {
          background: transparent;
          color: var(--ink, #2d2926);
          border: 1px solid var(--ink-soft, #7a736d);
        }

        .btn-secondary:hover {
          background: rgba(0, 0, 0, 0.05);
        }
      `}</style>
    </div>
  );
}

export default LiuyaoManual;
