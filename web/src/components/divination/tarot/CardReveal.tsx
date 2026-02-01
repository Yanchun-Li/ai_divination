"use client";

import { useState, useEffect } from "react";
import type { TarotCard } from "../../../types/divination";
import { getOrientationText } from "../../../lib/tarot";
import { translations, type Language } from "../../../app/translations";

interface CardRevealProps {
  card: TarotCard;
  isUpright: boolean;
  isRevealed: boolean;
  onReveal?: () => void;
  showBack?: boolean;
  size?: "small" | "medium" | "large";
  lang?: Language;
}

export function CardReveal({
  card,
  isUpright,
  isRevealed,
  onReveal,
  showBack = true,
  size = "medium",
  lang = "zh",
}: CardRevealProps) {
  const td = translations[lang].divination;
  const [isFlipping, setIsFlipping] = useState(false);
  const [showFront, setShowFront] = useState(isRevealed);

  useEffect(() => {
    if (isRevealed && !showFront) {
      setIsFlipping(true);
      const timer = setTimeout(() => {
        setShowFront(true);
        setIsFlipping(false);
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [isRevealed, showFront]);

  const handleClick = () => {
    if (!isRevealed && !isFlipping && onReveal) {
      onReveal();
    }
  };

  const keywords = isUpright
    ? card.upright_keywords
    : card.reversed_keywords;
  const orientation = getOrientationText(isUpright, lang);
  const tarotCardLabel = lang === "zh" ? "塔罗牌" : lang === "ja" ? "タロットカード" : "Tarot Card";

  return (
    <div
      className={`card-reveal ${size} ${isFlipping ? "flipping" : ""} ${
        showFront ? "revealed" : ""
      } ${!isUpright && showFront ? "reversed" : ""}`}
      onClick={handleClick}
      role="button"
      tabIndex={0}
      aria-label={showFront ? `${card.name} ${orientation}` : tarotCardLabel}
    >
      <div className="card-inner">
        {/* 牌背 */}
        <div className="card-back">
          <div className="card-pattern">
            <div className="pattern-inner">
              <span className="pattern-symbol">✧</span>
            </div>
          </div>
        </div>

        {/* 牌面 */}
        <div className="card-front">
          <div className="card-header">
            <span className="card-number">{card.id}</span>
          </div>
          <div className="card-image">
            <span className="card-symbol">☆</span>
          </div>
          <div className="card-info">
            <h3 className="card-name">{card.name}</h3>
            <span className="card-name-en">{card.name_en}</span>
            <span className={`orientation ${isUpright ? "upright" : "reversed"}`}>
              {orientation}
            </span>
          </div>
          <div className="card-keywords">
            {keywords.slice(0, 3).map((keyword, i) => (
              <span key={i} className="keyword">
                {keyword}
              </span>
            ))}
          </div>
        </div>
      </div>

      <style jsx>{`
        .card-reveal {
          perspective: 1000px;
          cursor: pointer;
          transition: transform 0.3s ease;
        }

        .card-reveal:hover:not(.revealed) {
          transform: translateY(-10px);
        }

        .card-reveal.small {
          width: 80px;
          height: 130px;
        }

        .card-reveal.medium {
          width: 120px;
          height: 195px;
        }

        .card-reveal.large {
          width: 160px;
          height: 260px;
        }

        .card-inner {
          width: 100%;
          height: 100%;
          position: relative;
          transform-style: preserve-3d;
          transition: transform 0.6s ease;
        }

        .card-reveal.flipping .card-inner {
          transform: rotateY(180deg);
        }

        .card-reveal.revealed .card-inner {
          transform: rotateY(180deg);
        }

        .card-back,
        .card-front {
          position: absolute;
          width: 100%;
          height: 100%;
          backface-visibility: hidden;
          border-radius: 12px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
          overflow: hidden;
        }

        .card-back {
          background: linear-gradient(135deg, #2d2926 0%, #4a3f35 100%);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .card-pattern {
          width: 80%;
          height: 90%;
          border: 2px solid rgba(196, 154, 108, 0.5);
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .pattern-inner {
          width: 60%;
          height: 70%;
          background: linear-gradient(
            45deg,
            rgba(196, 154, 108, 0.2) 0%,
            rgba(196, 154, 108, 0.1) 100%
          );
          border-radius: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .pattern-symbol {
          font-size: 2rem;
          color: var(--accent, #c49a6c);
          opacity: 0.8;
        }

        .card-front {
          background: linear-gradient(180deg, #fdf8f0 0%, #f5e6d3 100%);
          transform: rotateY(180deg);
          display: flex;
          flex-direction: column;
          padding: 0.5rem;
        }

        .card-reveal.reversed .card-front {
          transform: rotateY(180deg) rotate(180deg);
        }

        .card-header {
          display: flex;
          justify-content: center;
        }

        .card-number {
          font-size: 0.7rem;
          color: var(--ink-soft, #7a736d);
          font-weight: 500;
        }

        .card-image {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(255, 255, 255, 0.5);
          border-radius: 8px;
          margin: 0.25rem 0;
        }

        .card-symbol {
          font-size: 2.5rem;
          color: var(--accent, #c49a6c);
        }

        .small .card-symbol {
          font-size: 1.5rem;
        }

        .large .card-symbol {
          font-size: 3.5rem;
        }

        .card-info {
          text-align: center;
          padding: 0.25rem 0;
        }

        .card-name {
          font-size: 1rem;
          font-weight: bold;
          color: var(--ink, #2d2926);
          margin: 0;
          font-family: var(--font-serif, "Shippori Mincho", serif);
        }

        .small .card-name {
          font-size: 0.7rem;
        }

        .large .card-name {
          font-size: 1.25rem;
        }

        .card-name-en {
          display: block;
          font-size: 0.6rem;
          color: var(--ink-soft, #7a736d);
          margin-top: 0.1rem;
        }

        .small .card-name-en {
          display: none;
        }

        .orientation {
          display: inline-block;
          margin-top: 0.25rem;
          padding: 0.1rem 0.4rem;
          border-radius: 10px;
          font-size: 0.65rem;
          font-weight: 500;
        }

        .orientation.upright {
          background: #e8f5e9;
          color: #2e7d32;
        }

        .orientation.reversed {
          background: #fce4ec;
          color: #c2185b;
        }

        .card-keywords {
          display: flex;
          flex-wrap: wrap;
          gap: 0.2rem;
          justify-content: center;
          padding-top: 0.25rem;
        }

        .keyword {
          font-size: 0.55rem;
          color: var(--ink-soft, #7a736d);
          background: rgba(0, 0, 0, 0.05);
          padding: 0.1rem 0.3rem;
          border-radius: 4px;
        }

        .small .card-keywords {
          display: none;
        }
      `}</style>
    </div>
  );
}

export default CardReveal;
