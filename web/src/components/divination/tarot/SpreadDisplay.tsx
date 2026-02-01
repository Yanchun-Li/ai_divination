"use client";

import type { TarotDraw, TarotResult } from "../../../types/divination";
import { CardReveal } from "./CardReveal";
import { SPREAD_POSITIONS, getCardMeaning } from "../../../lib/tarot";
import { translations, type Language } from "../../../app/translations";

interface SpreadDisplayProps {
  draws: TarotDraw[];
  showAll?: boolean;
  compact?: boolean;
  lang?: Language;
}

export function SpreadDisplay({
  draws,
  showAll = true,
  compact = false,
  lang = "zh",
}: SpreadDisplayProps) {
  const t = translations[lang];
  const td = t.divination;

  // 获取正位/逆位文本
  const getOrientationText = (isUpright: boolean) => {
    return isUpright ? "" : `(${td.reversed})`;
  };

  // 根据语言获取牌名（日语和英语用英文牌名，中文用中文牌名）
  const getCardName = (card: { name: string; name_en: string }) => {
    return lang === "zh" ? card.name : card.name_en;
  };

  return (
    <div className={`spread-display ${compact ? "compact" : ""}`}>
      {/* 牌阵标题 */}
      <div className="spread-header">
        <h3 className="spread-title">
          {compact ? td.spread : td.threeCardSpread}
          {compact && draws.map((d, i) => (
            <span key={d.position} className="inline-card-name">
              {getCardName(d.card)}{getOrientationText(d.is_upright)}
              {i < draws.length - 1 ? " → " : ""}
            </span>
          ))}
        </h3>
        {!compact && <p className="spread-subtitle">{td.pastPresentFuture}</p>}
      </div>

      {/* 牌位展示 - 非紧凑模式 */}
      {!compact && (
        <div className="spread-cards">
          {SPREAD_POSITIONS.map((position, index) => {
            const draw = draws.find((d) => d.position === position.id);
            const hasCard = !!draw;
            const positionLabels = [td.positionPast, td.positionPresent, td.positionFuture];
            const positionMeanings = [td.positionMeaningPast, td.positionMeaningPresent, td.positionMeaningFuture];

            return (
              <div key={position.id} className="spread-position">
                {/* 位置标签 */}
                <div className="position-label">
                  <span className="label-text">{positionLabels[index]}</span>
                </div>

                {/* 牌展示 */}
                <div className="card-slot">
                  {hasCard ? (
                    <CardReveal
                      card={draw.card}
                      isUpright={draw.is_upright}
                      isRevealed={showAll}
                      size="medium"
                      lang={lang}
                    />
                  ) : (
                    <div className="empty-slot">
                      <span className="slot-number">{index + 1}</span>
                    </div>
                  )}
                </div>

                {/* 位置含义 */}
                <p className="position-meaning">{positionMeanings[index]}</p>

                {/* 牌的解读 */}
                {hasCard && (
                  <div className="card-meaning">
                    <p className="meaning-text">{getCardMeaning(draw.card, draw.is_upright, lang)}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* 紧凑模式 - 横向卡片列表 */}
      {compact && (
        <div className="compact-cards-row">
          {draws.map((draw, index) => {
            const positionLabels = [td.positionPast, td.positionPresent, td.positionFuture];
            return (
              <div key={draw.position} className="compact-card-item">
                <CardReveal
                  card={draw.card}
                  isUpright={draw.is_upright}
                  isRevealed={showAll}
                  size="small"
                  lang={lang}
                />
                <span className="compact-card-label">{positionLabels[index]}</span>
              </div>
            );
          })}
        </div>
      )}

      <style jsx>{`
        .spread-display {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .spread-display.compact {
          gap: 0.75rem;
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
          display: flex;
          flex-wrap: wrap;
          justify-content: center;
          align-items: center;
          gap: 0.25rem;
        }

        .inline-card-name {
          color: var(--accent, #c49a6c);
          font-weight: 500;
        }

        .spread-subtitle {
          font-size: 0.9rem;
          color: var(--ink-soft, #7a736d);
          margin: 0.25rem 0 0;
        }

        .spread-cards {
          display: flex;
          justify-content: center;
          gap: 2rem;
          flex-wrap: wrap;
        }

        .spread-position {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.75rem;
          max-width: 150px;
        }

        .position-label {
          text-align: center;
        }

        .label-text {
          font-size: 1rem;
          font-weight: 600;
          color: var(--accent, #c49a6c);
        }

        .card-slot {
          min-height: 195px;
          display: flex;
          align-items: center;
          justify-content: center;
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

        .slot-number {
          font-size: 2rem;
          color: var(--ink-soft, #7a736d);
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

        /* 紧凑模式横向布局 */
        .compact-cards-row {
          display: flex;
          justify-content: center;
          align-items: flex-start;
          gap: 1rem;
          flex-wrap: nowrap;
        }

        .compact-card-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.25rem;
        }

        .compact-card-label {
          font-size: 0.7rem;
          color: var(--ink-soft, #7a736d);
          text-align: center;
        }
      `}</style>
    </div>
  );
}

export default SpreadDisplay;
