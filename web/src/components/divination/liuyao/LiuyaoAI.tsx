"use client";

import { useState, useEffect } from "react";
import { HexagramDisplay } from "./HexagramDisplay";
import { aiGenerateLiuyao } from "../../../lib/liuyao";
import { translations, type Language } from "../../../app/translations";
import type { LiuyaoResult } from "../../../types/divination";

interface LiuyaoAIProps {
  seed: string;
  onComplete: (result: LiuyaoResult) => void;
  autoStart?: boolean;
  lang?: Language;
}

export function LiuyaoAI({ seed, onComplete, autoStart = true, lang = "zh" }: LiuyaoAIProps) {
  const t = translations[lang];
  const td = t.divination;
  const [result, setResult] = useState<LiuyaoResult | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showAnimation, setShowAnimation] = useState(true);
  const [animationStep, setAnimationStep] = useState(0);
  const [isCompleting, setIsCompleting] = useState(false); // 防止闪烁

  useEffect(() => {
    if (autoStart && !result && !isGenerating) {
      generateResult();
    }
  }, [autoStart]);

  const generateResult = async () => {
    setIsGenerating(true);
    setShowAnimation(true);
    setAnimationStep(0);

    // 模拟六次投掷的动画
    for (let i = 0; i < 6; i++) {
      setAnimationStep(i + 1);
      await new Promise((resolve) => setTimeout(resolve, 500));
    }

    // 生成结果
    const generatedResult = aiGenerateLiuyao(seed);
    setResult(generatedResult);
    setIsGenerating(false);
    setShowAnimation(false);

    // 直接调用回调，开始解读
    setIsCompleting(true);
    onComplete(generatedResult);
  };

  const handleRegenerate = () => {
    setResult(null);
    generateResult();
  };

  return (
    <div className="liuyao-ai">
      {/* 生成动画 */}
      {showAnimation && (
        <div className="generation-animation">
          <div className="animation-container">
            {/* 旋转八卦图 */}
            <div className="bagua-spinner">
              <svg viewBox="0 0 100 100" className="bagua-svg">
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeDasharray="10 5"
                />
                <text x="50" y="55" textAnchor="middle" fontSize="24">
                  ☯
                </text>
              </svg>
            </div>

            {/* 进度指示 */}
            <div className="progress-indicator">
              <span className="progress-text">{td.lineProgress.replace("{current}", String(animationStep))}</span>
              <div className="progress-bar">
                <div
                  className="progress-fill"
                  style={{ width: `${(animationStep / 6) * 100}%` }}
                />
              </div>
            </div>

            <p className="generating-text">{td.calculatingFate}</p>
          </div>
        </div>
      )}

      {/* 结果展示（仅当不是自动完成时） */}
      {!showAnimation && result && !isCompleting && (
        <div className="result-container">
          <div className="result-header">
            <h3>{td.hexagramComplete}</h3>
          </div>

          <HexagramDisplay
            hexagram={result.primary_hexagram}
            lines={result.lines}
            relatingHexagram={result.relating_hexagram}
            showLines={true}
          />

          <div className="action-buttons">
            <button className="btn-secondary" onClick={handleRegenerate}>
              {td.regenerateHexagram}
            </button>
            <button className="btn-primary" onClick={() => onComplete(result)}>
              {td.viewInterpretation}
            </button>
          </div>
        </div>
      )}

      <style jsx>{`
        .liuyao-ai {
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
          gap: 1.5rem;
        }

        .bagua-spinner {
          width: 120px;
          height: 120px;
          animation: spin 3s linear infinite;
        }

        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }

        .bagua-svg {
          width: 100%;
          height: 100%;
          color: var(--accent, #c49a6c);
        }

        .progress-indicator {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.5rem;
          width: 200px;
        }

        .progress-text {
          font-size: 0.9rem;
          color: var(--ink, #2d2926);
          font-weight: 500;
        }

        .progress-bar {
          width: 100%;
          height: 6px;
          background: rgba(0, 0, 0, 0.1);
          border-radius: 3px;
          overflow: hidden;
        }

        .progress-fill {
          height: 100%;
          background: var(--accent, #c49a6c);
          border-radius: 3px;
          transition: width 0.3s ease;
        }

        .generating-text {
          color: var(--ink-soft, #7a736d);
          font-size: 0.95rem;
          animation: pulse 1.5s ease-in-out infinite;
        }

        @keyframes pulse {
          0%,
          100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
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

export default LiuyaoAI;
