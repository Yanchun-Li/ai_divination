"use client";

import type { TarotDraw, TarotResult } from "../../../types/divination";
import { CardReveal } from "./CardReveal";
import { SPREAD_POSITIONS } from "../../../lib/tarot";

interface SpreadDisplayProps {
  draws: TarotDraw[];
  showAll?: boolean;
  compact?: boolean;
}

export function SpreadDisplay({
  draws,
  showAll = true,
  compact = false,
}: SpreadDisplayProps) {
  return (
    <div className={`spread-display ${compact ? "compact" : ""}`}>
      {/* 牌阵标题 */}
      <div className="spread-header">
        <h3 className="spread-title">三张牌阵</h3>
        <p className="spread-subtitle">过去 - 现在 - 未来</p>
      </div>

      {/* 牌位展示 */}
      <div className="spread-cards">
        {SPREAD_POSITIONS.map((position, index) => {
          const draw = draws.find((d) => d.position === position.id);
          const hasCard = !!draw;

          return (
            <div key={position.id} className="spread-position">
              {/* 位置标签 */}
              <div className="position-label">
                <span className="label-text">{position.label}</span>
              </div>

              {/* 牌展示 */}
              <div className="card-slot">
                {hasCard ? (
                  <CardReveal
                    card={draw.card}
                    isUpright={draw.is_upright}
                    isRevealed={showAll}
                    size={compact ? "small" : "medium"}
                  />
                ) : (
                  <div className="empty-slot">
                    <span className="slot-number">{index + 1}</span>
                  </div>
                )}
              </div>

              {/* 位置含义 */}
              {!compact && (
                <p className="position-meaning">{position.meaning}</p>
              )}

              {/* 牌的解读 */}
              {hasCard && !compact && (
                <div className="card-meaning">
                  <p className="meaning-text">{draw.meaning}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <style jsx>{`
        .spread-display {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .spread-display.compact {
          gap: 1rem;
        }

        .spread-header {
          text-align: center;
        }

        .spread-title {
          font-size: 1.25rem;
          font-weight: bold;
          color: var(--ink, #2d2926);
          margin: 0;
          font-family: var(--font-serif, "Shippori Mincho", serif);
        }

        .compact .spread-title {
          font-size: 1rem;
        }

        .spread-subtitle {
          font-size: 0.9rem;
          color: var(--ink-soft, #7a736d);
          margin: 0.25rem 0 0;
        }

        .compact .spread-subtitle {
          font-size: 0.8rem;
        }

        .spread-cards {
          display: flex;
          justify-content: center;
          gap: 2rem;
          flex-wrap: wrap;
        }

        .compact .spread-cards {
          gap: 1rem;
        }

        .spread-position {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.75rem;
          max-width: 150px;
        }

        .compact .spread-position {
          gap: 0.5rem;
          max-width: 100px;
        }

        .position-label {
          text-align: center;
        }

        .label-text {
          font-size: 1rem;
          font-weight: 600;
          color: var(--accent, #c49a6c);
        }

        .compact .label-text {
          font-size: 0.85rem;
        }

        .card-slot {
          min-height: 195px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .compact .card-slot {
          min-height: 130px;
        }

        .empty-slot {
          width: 120px;
          height: 195px;
          border: 2px dashed var(--ink-soft, #7a736d);
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          opacity: 0.3;
        }

        .compact .empty-slot {
          width: 80px;
          height: 130px;
        }

        .slot-number {
          font-size: 2rem;
          color: var(--ink-soft, #7a736d);
        }

        .compact .slot-number {
          font-size: 1.5rem;
        }

        .position-meaning {
          font-size: 0.75rem;
          color: var(--ink-soft, #7a736d);
          text-align: center;
          margin: 0;
          line-height: 1.4;
        }

        .card-meaning {
          padding: 0.5rem;
          background: var(--glass, rgba(255, 255, 255, 0.45));
          border-radius: 8px;
          max-width: 100%;
        }

        .meaning-text {
          font-size: 0.8rem;
          color: var(--ink, #2d2926);
          margin: 0;
          text-align: center;
          line-height: 1.4;
        }
      `}</style>
    </div>
  );
}

export default SpreadDisplay;
