"use client";

import { useState } from "react";
import type { TarotCard } from "../../../types/divination";
import { MAJOR_ARCANA } from "../../../lib/tarot";

interface CardDeckProps {
  availableCardIds: number[];
  onSelectCard: (cardId: number) => void;
  disabled?: boolean;
  selectedCardId?: number | null;
}

export function CardDeck({
  availableCardIds,
  onSelectCard,
  disabled = false,
  selectedCardId,
}: CardDeckProps) {
  const [hoveredId, setHoveredId] = useState<number | null>(null);

  const handleCardClick = (cardId: number) => {
    if (disabled || !availableCardIds.includes(cardId)) return;
    onSelectCard(cardId);
  };

  return (
    <div className="card-deck">
      <div className="deck-container">
        {MAJOR_ARCANA.map((card, index) => {
          const isAvailable = availableCardIds.includes(card.id);
          const isSelected = selectedCardId === card.id;
          const isHovered = hoveredId === card.id;

          return (
            <div
              key={card.id}
              className={`deck-card ${isAvailable ? "available" : "drawn"} ${
                isSelected ? "selected" : ""
              } ${isHovered ? "hovered" : ""}`}
              style={{
                transform: `rotate(${(index - 10.5) * 3}deg) translateY(${
                  isHovered && isAvailable ? -20 : 0
                }px)`,
                zIndex: isHovered ? 100 : index,
              }}
              onClick={() => handleCardClick(card.id)}
              onMouseEnter={() => setHoveredId(card.id)}
              onMouseLeave={() => setHoveredId(null)}
              role="button"
              tabIndex={isAvailable ? 0 : -1}
              aria-label={`选择牌 ${card.name}`}
              aria-disabled={!isAvailable || disabled}
            >
              <div className="card-back">
                <div className="card-pattern">
                  <span className="pattern-symbol">✧</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <p className="deck-hint">
        {disabled ? "请等待..." : "点击选择一张牌"}
      </p>

      <style jsx>{`
        .card-deck {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 2rem 0;
        }

        .deck-container {
          position: relative;
          width: 100%;
          height: 200px;
          display: flex;
          justify-content: center;
          align-items: flex-end;
        }

        .deck-card {
          position: absolute;
          width: 60px;
          height: 90px;
          cursor: pointer;
          transition: all 0.3s ease;
          transform-origin: bottom center;
        }

        .deck-card.available:hover {
          transform: translateY(-20px) scale(1.1) !important;
        }

        .deck-card.drawn {
          opacity: 0.3;
          cursor: not-allowed;
        }

        .deck-card.selected {
          transform: translateY(-30px) scale(1.2) !important;
          z-index: 200 !important;
        }

        .card-back {
          width: 100%;
          height: 100%;
          background: linear-gradient(135deg, #2d2926 0%, #4a3f35 100%);
          border-radius: 6px;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1px solid rgba(196, 154, 108, 0.3);
        }

        .deck-card.available:hover .card-back {
          box-shadow: 0 8px 25px rgba(0, 0, 0, 0.3);
          border-color: var(--accent, #c49a6c);
        }

        .card-pattern {
          width: 80%;
          height: 85%;
          border: 1px solid rgba(196, 154, 108, 0.3);
          border-radius: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .pattern-symbol {
          font-size: 1rem;
          color: var(--accent, #c49a6c);
          opacity: 0.6;
        }

        .deck-hint {
          margin-top: 2rem;
          color: var(--ink-soft, #7a736d);
          font-size: 0.9rem;
        }
      `}</style>
    </div>
  );
}

export default CardDeck;
