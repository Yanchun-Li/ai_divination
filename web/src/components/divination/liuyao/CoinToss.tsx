"use client";

import { useState } from "react";
import type { CoinToss as CoinTossType } from "../../../types/divination";
import { getCoinResultText, getYaoName } from "../../../lib/liuyao";

interface CoinTossProps {
  onToss: () => Promise<CoinTossType | undefined>;
  disabled?: boolean;
  isAnimating?: boolean;
}

export function CoinToss({ onToss, disabled, isAnimating }: CoinTossProps) {
  const [lastResult, setLastResult] = useState<CoinTossType | null>(null);
  const [showResult, setShowResult] = useState(false);

  const handleToss = async () => {
    if (disabled || isAnimating) return;

    setShowResult(false);
    const result = await onToss();
    if (result) {
      setLastResult(result);
      setShowResult(true);
    }
  };

  return (
    <div className="coin-toss-container">
      {/* 三枚铜钱 */}
      <div className="coins-display">
        {[0, 1, 2].map((index) => (
          <button
            key={index}
            className={`coin ${isAnimating ? "animating" : ""}`}
            onClick={handleToss}
            disabled={disabled || isAnimating}
            aria-label={`铜钱 ${index + 1}`}
          >
            <div className="coin-inner">
              <div className="coin-front">正</div>
              <div className="coin-back">反</div>
            </div>
          </button>
        ))}
      </div>

      {/* 点击提示 */}
      {!isAnimating && !disabled && (
        <p className="toss-hint">点击铜钱进行投掷</p>
      )}

      {/* 动画中提示 */}
      {isAnimating && <p className="toss-hint animating">铜钱翻转中...</p>}

      {/* 结果展示 */}
      {showResult && lastResult && !isAnimating && (
        <div className="toss-result">
          <div className="result-coins">
            {lastResult.coins.map((coin, i) => (
              <span key={i} className={`result-coin ${coin === 3 ? "heads" : "tails"}`}>
                {coin === 3 ? "正" : "反"}
              </span>
            ))}
          </div>
          <div className="result-text">
            <span className="result-sum">= {lastResult.sum}</span>
            <span className="result-yao">
              {getYaoName(lastResult.yao_type)}
              {lastResult.is_changing && <span className="changing-mark">（动）</span>}
            </span>
          </div>
        </div>
      )}

      <style jsx>{`
        .coin-toss-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1.5rem;
          padding: 2rem;
        }

        .coins-display {
          display: flex;
          gap: 1rem;
          justify-content: center;
        }

        .coin {
          width: 80px;
          height: 80px;
          border-radius: 50%;
          border: none;
          cursor: pointer;
          perspective: 1000px;
          background: transparent;
          transition: transform 0.3s ease;
        }

        .coin:hover:not(:disabled) {
          transform: scale(1.1);
        }

        .coin:disabled {
          cursor: not-allowed;
          opacity: 0.6;
        }

        .coin-inner {
          width: 100%;
          height: 100%;
          position: relative;
          transform-style: preserve-3d;
          transition: transform 0.6s ease;
        }

        .coin.animating .coin-inner {
          animation: coinFlip 0.8s ease-in-out infinite;
        }

        @keyframes coinFlip {
          0% {
            transform: rotateY(0deg);
          }
          50% {
            transform: rotateY(180deg);
          }
          100% {
            transform: rotateY(360deg);
          }
        }

        .coin-front,
        .coin-back {
          position: absolute;
          width: 100%;
          height: 100%;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.5rem;
          font-weight: bold;
          backface-visibility: hidden;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
        }

        .coin-front {
          background: linear-gradient(145deg, #d4af37, #c49a6c);
          color: #2d2926;
        }

        .coin-back {
          background: linear-gradient(145deg, #8b6914, #6b4f0f);
          color: #f5e6d3;
          transform: rotateY(180deg);
        }

        .toss-hint {
          color: var(--ink-soft, #7a736d);
          font-size: 0.9rem;
          text-align: center;
        }

        .toss-hint.animating {
          animation: pulse 1s ease-in-out infinite;
        }

        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }

        .toss-result {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.5rem;
          padding: 1rem;
          background: var(--glass, rgba(255, 255, 255, 0.45));
          border-radius: 12px;
          animation: fadeIn 0.3s ease;
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .result-coins {
          display: flex;
          gap: 0.5rem;
          font-size: 1.2rem;
        }

        .result-coin {
          padding: 0.25rem 0.5rem;
          border-radius: 4px;
          font-weight: bold;
        }

        .result-coin.heads {
          background: #d4af37;
          color: #2d2926;
        }

        .result-coin.tails {
          background: #8b6914;
          color: #f5e6d3;
        }

        .result-text {
          display: flex;
          gap: 0.5rem;
          align-items: center;
          font-size: 1.1rem;
        }

        .result-sum {
          color: var(--ink-soft, #7a736d);
        }

        .result-yao {
          font-weight: bold;
          color: var(--ink, #2d2926);
        }

        .changing-mark {
          color: var(--accent, #c49a6c);
          font-size: 0.9rem;
        }
      `}</style>
    </div>
  );
}

export default CoinToss;
