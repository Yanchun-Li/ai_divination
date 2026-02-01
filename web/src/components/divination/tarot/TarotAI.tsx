"use client";

import { useState, useEffect } from "react";
import { CardReveal } from "./CardReveal";
import { SpreadDisplay } from "./SpreadDisplay";
import { aiGenerateTarot, SPREAD_POSITIONS } from "../../../lib/tarot";
import { translations, type Language } from "../../../app/translations";
import type { TarotResult, TarotDraw } from "../../../types/divination";

interface TarotAIProps {
  seed: string;
  onComplete: (result: TarotResult) => void;
  autoStart?: boolean;
  lang?: Language;
}

export function TarotAI({ seed, onComplete, autoStart = true, lang = "zh" }: TarotAIProps) {
  const t = translations[lang];
  const td = t.divination;
  const [result, setResult] = useState<TarotResult | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [revealedCards, setRevealedCards] = useState<number[]>([]);
  const [showAnimation, setShowAnimation] = useState(true);
  const [isCompleting, setIsCompleting] = useState(false); // 防止闪烁

  useEffect(() => {
    if (autoStart && !result && !isGenerating) {
      generateResult();
    }
  }, [autoStart]);

  const generateResult = async () => {
    setIsGenerating(true);
    setShowAnimation(true);
    setRevealedCards([]);

    // 洗牌动画
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // 生成结果
    const generatedResult = aiGenerateTarot(seed);
    setResult(generatedResult);
    setIsGenerating(false);

    // 依次翻牌动画
    for (let i = 0; i < 3; i++) {
      await new Promise((resolve) => setTimeout(resolve, 800));
      setRevealedCards((prev) => [...prev, i]);
    }

    setShowAnimation(false);

    // 直接调用回调，开始解读（不再显示中间的 result-container）
    setIsCompleting(true);
    onComplete(generatedResult);
  };

  const handleRegenerate = () => {
    setResult(null);
    generateResult();
  };

  return (
    <div className="tarot-ai">
      {/* 生成动画 */}
      {isGenerating && (
        <div className="generation-animation">
          <div className="animation-container">
            {/* 洗牌动画 */}
            <div className="shuffle-animation">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="shuffle-card"
                  style={{ animationDelay: `${i * 0.2}s` }}
                >
                  <div className="card-back">
                    <span className="pattern-symbol">✧</span>
                  </div>
                </div>
              ))}
            </div>
            <p className="generating-text">{td.shuffling}</p>
          </div>
        </div>
      )}

      {/* 翻牌动画 */}
      {!isGenerating && showAnimation && result && (
        <div className="reveal-animation">
          <div className="cards-reveal-row">
            {result.cards.map((draw, index) => {
              const positionLabels = [td.positionPast, td.positionPresent, td.positionFuture];
              const isRevealed = revealedCards.includes(index);
              return (
                <div key={draw.card.id} className="reveal-position">
                  <span className="position-label">
                    {positionLabels[index]}
                  </span>
                  <CardReveal
                    card={draw.card}
                    isUpright={draw.is_upright}
                    isRevealed={isRevealed}
                    size="medium"
                    lang={lang}
                  />
                </div>
              );
            })}
          </div>
          <p className="reveal-progress">
            {td.revealing} {revealedCards.length}/3
          </p>
        </div>
      )}

      {/* 完成后显示牌阵（仅当不是自动完成时） */}
      {!showAnimation && result && !isCompleting && (
        <div className="result-container">
          <div className="result-header">
            <h3>{td.spreadComplete}</h3>
          </div>

          <SpreadDisplay draws={result.cards} showAll={true} lang={lang} />

          <div className="action-buttons">
            <button className="btn-secondary" onClick={handleRegenerate}>
              {td.redrawCards}
            </button>
            <button className="btn-primary" onClick={() => onComplete(result)}>
              {td.viewInterpretation}
            </button>
          </div>
        </div>
      )}

      <style jsx>{`
        .tarot-ai {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1.5rem;
        }

        .generation-animation {
          display: flex;
          justify-content: center;
          padding: 3rem;
        }

        .animation-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 2rem;
        }

        .shuffle-animation {
          position: relative;
          width: 200px;
          height: 150px;
          display: flex;
          justify-content: center;
          align-items: center;
        }

        .shuffle-card {
          position: absolute;
          width: 80px;
          height: 120px;
          animation: shuffle 1s ease-in-out infinite;
        }

        @keyframes shuffle {
          0%, 100% {
            transform: translateX(0) rotate(0deg);
          }
          25% {
            transform: translateX(-30px) rotate(-10deg);
          }
          50% {
            transform: translateX(0) rotate(0deg);
          }
          75% {
            transform: translateX(30px) rotate(10deg);
          }
        }

        .shuffle-card .card-back {
          width: 100%;
          height: 100%;
          background: linear-gradient(135deg, #2d2926 0%, #4a3f35 100%);
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
          border: 1px solid rgba(196, 154, 108, 0.3);
        }

        .pattern-symbol {
          font-size: 1.5rem;
          color: var(--accent, #c49a6c);
          opacity: 0.6;
        }

        .generating-text {
          color: var(--ink-soft, #7a736d);
          font-size: 1rem;
          animation: pulse 1.5s ease-in-out infinite;
        }

        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }

        .reveal-animation {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1.5rem;
        }

        .cards-reveal-row {
          display: flex;
          gap: 1.5rem;
          justify-content: center;
        }

        .reveal-position {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.5rem;
        }

        .position-label {
          font-size: 1rem;
          font-weight: 600;
          color: var(--accent, #c49a6c);
        }

        .reveal-progress {
          color: var(--ink-soft, #7a736d);
          font-size: 0.9rem;
        }

        .result-container {
          width: 100%;
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
          animation: fadeIn 0.5s ease;
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .result-header {
          text-align: center;
        }

        .result-header h3 {
          font-size: 1.25rem;
          color: var(--ink, #2d2926);
          margin: 0;
          font-family: var(--font-serif, "Shippori Mincho", serif);
        }

        .action-buttons {
          display: flex;
          gap: 1rem;
          justify-content: center;
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

export default TarotAI;
