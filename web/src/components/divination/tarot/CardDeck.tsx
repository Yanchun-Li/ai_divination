"use client";

import { useState, useRef, useEffect } from "react";
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
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  // 初始化时滚动到中间
  useEffect(() => {
    if (scrollRef.current) {
      const container = scrollRef.current;
      const scrollWidth = container.scrollWidth;
      const clientWidth = container.clientWidth;
      container.scrollLeft = (scrollWidth - clientWidth) / 2;
    }
  }, []);

  const handleCardClick = (cardId: number) => {
    if (disabled || !availableCardIds.includes(cardId) || isDragging) return;
    onSelectCard(cardId);
  };

  // 拖拽滚动
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!scrollRef.current) return;
    setIsDragging(true);
    setStartX(e.pageX - scrollRef.current.offsetLeft);
    setScrollLeft(scrollRef.current.scrollLeft);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !scrollRef.current) return;
    e.preventDefault();
    const x = e.pageX - scrollRef.current.offsetLeft;
    const walk = (x - startX) * 1.5;
    scrollRef.current.scrollLeft = scrollLeft - walk;
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
  };

  return (
    <div className="card-deck">
      <p className="deck-hint-top">
        {disabled ? "请等待..." : "在下方选择一张牌（可左右滑动）"}
      </p>
      
      <div 
        className={`deck-scroll-container ${isDragging ? "dragging" : ""}`}
        ref={scrollRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
      >
        <div className="deck-cards">
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
                onClick={() => handleCardClick(card.id)}
                onMouseEnter={() => !isDragging && setHoveredId(card.id)}
                onMouseLeave={() => setHoveredId(null)}
                role="button"
                tabIndex={isAvailable ? 0 : -1}
                aria-label={`选择牌 ${card.name}`}
                aria-disabled={!isAvailable || disabled}
              >
                <div className="card-back">
                  <div className="card-pattern">
                    <div className="card-number">{card.id}</div>
                    <span className="pattern-symbol">✧</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="scroll-indicators">
        <span className="scroll-arrow left">←</span>
        <span className="scroll-text">滑动浏览</span>
        <span className="scroll-arrow right">→</span>
      </div>

      <style jsx>{`
        .card-deck {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1rem;
        }

        .deck-hint-top {
          color: var(--ink-soft, #7a736d);
          font-size: 0.9rem;
          margin: 0;
        }

        .deck-scroll-container {
          width: 100%;
          overflow-x: auto;
          overflow-y: hidden;
          cursor: grab;
          padding: 1rem 0 1.5rem;
          scrollbar-width: none;
          -ms-overflow-style: none;
        }

        .deck-scroll-container::-webkit-scrollbar {
          display: none;
        }

        .deck-scroll-container.dragging {
          cursor: grabbing;
        }

        .deck-cards {
          display: flex;
          gap: 0.75rem;
          padding: 0 2rem;
          min-width: max-content;
        }

        .deck-card {
          flex-shrink: 0;
          width: 70px;
          height: 105px;
          cursor: pointer;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
          user-select: none;
        }

        .deck-card.available:hover {
          transform: translateY(-12px) scale(1.05);
        }

        .deck-card.available:active {
          transform: translateY(-8px) scale(1.02);
        }

        .deck-card.drawn {
          opacity: 0.25;
          cursor: not-allowed;
          transform: scale(0.95);
        }

        .deck-card.selected {
          transform: translateY(-16px) scale(1.1);
        }

        .card-back {
          width: 100%;
          height: 100%;
          background: linear-gradient(145deg, #3d3530 0%, #2d2926 50%, #252220 100%);
          border-radius: 8px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25);
          display: flex;
          align-items: center;
          justify-content: center;
          border: 2px solid rgba(196, 154, 108, 0.3);
          transition: all 0.2s ease;
        }

        .deck-card.available:hover .card-back {
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.35);
          border-color: var(--accent, #c49a6c);
        }

        .deck-card.selected .card-back {
          border-color: var(--accent, #c49a6c);
          box-shadow: 0 8px 24px rgba(196, 154, 108, 0.4);
        }

        .card-pattern {
          width: 85%;
          height: 90%;
          border: 1px solid rgba(196, 154, 108, 0.25);
          border-radius: 6px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 0.25rem;
          background: linear-gradient(180deg, 
            rgba(196, 154, 108, 0.05) 0%, 
            transparent 50%,
            rgba(196, 154, 108, 0.05) 100%
          );
        }

        .card-number {
          font-size: 0.7rem;
          color: rgba(196, 154, 108, 0.5);
          font-weight: 600;
        }

        .pattern-symbol {
          font-size: 1.25rem;
          color: var(--accent, #c49a6c);
          opacity: 0.5;
        }

        .scroll-indicators {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          color: var(--ink-soft, #7a736d);
          font-size: 0.8rem;
          opacity: 0.6;
        }

        .scroll-arrow {
          font-size: 1rem;
          animation: bounce 1.5s ease-in-out infinite;
        }

        .scroll-arrow.left {
          animation-delay: 0s;
        }

        .scroll-arrow.right {
          animation-delay: 0.75s;
        }

        @keyframes bounce {
          0%, 100% {
            transform: translateX(0);
            opacity: 0.6;
          }
          50% {
            transform: translateX(-3px);
            opacity: 1;
          }
        }

        .scroll-arrow.right {
          animation-name: bounceRight;
        }

        @keyframes bounceRight {
          0%, 100% {
            transform: translateX(0);
            opacity: 0.6;
          }
          50% {
            transform: translateX(3px);
            opacity: 1;
          }
        }

        .scroll-text {
          font-size: 0.75rem;
        }

        /* 移动端触摸优化 */
        @media (max-width: 768px) {
          .deck-card {
            width: 65px;
            height: 97px;
          }

          .deck-cards {
            gap: 0.5rem;
            padding: 0 1rem;
          }
        }
      `}</style>
    </div>
  );
}

export default CardDeck;
