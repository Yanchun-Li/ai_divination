"use client";

import type { Hexagram, LiuyaoLine, CoinToss } from "../../../types/divination";
import { LineDisplay } from "./LineDisplay";
import { translations, type Language } from "../../../app/translations";

interface HexagramDisplayProps {
  hexagram: Hexagram;
  lines?: LiuyaoLine[];
  tosses?: CoinToss[];
  relatingHexagram?: Hexagram;
  showLines?: boolean;
  compact?: boolean;
  lang?: Language;
}

export function HexagramDisplay({
  hexagram,
  lines,
  tosses,
  relatingHexagram,
  showLines = true,
  compact = false,
  lang = "zh",
}: HexagramDisplayProps) {
  const td = translations[lang].divination;
  // 获取显示用的爻数据（优先使用lines，否则使用tosses）
  const lineData = lines || tosses;

  // 紧凑模式：横向显示卦名
  if (compact) {
    return (
      <div className="hexagram-display compact">
        <div className="compact-hexagram-row">
          <div className="compact-hexagram-item">
            <span className="compact-symbol">{hexagram.symbol}</span>
            <span className="compact-name">{hexagram.name}{lang !== "en" ? td.hexagram : ""}</span>
          </div>
          {relatingHexagram && (
            <>
              <span className="compact-arrow">→</span>
              <div className="compact-hexagram-item">
                <span className="compact-symbol">{relatingHexagram.symbol}</span>
                <span className="compact-name">{relatingHexagram.name}{lang !== "en" ? td.hexagram : ""}</span>
              </div>
            </>
          )}
        </div>
        <p className="compact-description">{hexagram.description}</p>
        
        <style jsx>{`
          .hexagram-display.compact {
            padding: 1rem;
            background: var(--glass, rgba(255, 255, 255, 0.45));
            border-radius: 12px;
          }
          .compact-hexagram-row {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 1rem;
            margin-bottom: 0.5rem;
          }
          .compact-hexagram-item {
            display: flex;
            align-items: center;
            gap: 0.5rem;
          }
          .compact-symbol {
            font-size: 1.5rem;
          }
          .compact-name {
            font-size: 1.1rem;
            font-weight: bold;
            color: var(--ink, #2d2926);
            font-family: var(--font-serif, "Shippori Mincho", serif);
          }
          .compact-arrow {
            font-size: 1.25rem;
            color: var(--accent, #c49a6c);
          }
          .compact-description {
            font-size: 0.85rem;
            color: var(--ink-soft, #7a736d);
            text-align: center;
            margin: 0;
            line-height: 1.4;
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="hexagram-display">
      <div className="hexagram-main">
        {/* 卦名和符号 */}
        <div className="hexagram-header">
          <span className="hexagram-symbol">{hexagram.symbol}</span>
          <h3 className="hexagram-name">{hexagram.name}</h3>
        </div>

        {/* 卦辞 */}
        <p className="hexagram-description">{hexagram.description}</p>

        {/* 上下卦 */}
        <div className="trigram-info">
          <span>{td.upperTrigram}：{hexagram.upper_trigram}</span>
          <span>{td.lowerTrigram}：{hexagram.lower_trigram}</span>
        </div>
      </div>

      {/* 六爻展示 */}
      {showLines && lineData && lineData.length === 6 && (
        <div className="lines-container">
          {/* 从上到下展示（第6爻到第1爻） */}
          {[...lineData].reverse().map((item, reversedIndex) => {
            const position = 6 - reversedIndex;
            const line = lines ? (item as LiuyaoLine) : undefined;
            const toss = tosses ? (item as CoinToss) : undefined;
            const isChanging = line?.is_changing || toss?.is_changing;

            return (
              <LineDisplay
                key={position}
                line={line}
                toss={toss}
                position={position}
                showDetails={true}
                isHighlighted={isChanging}
                lang={lang}
              />
            );
          })}
        </div>
      )}

      {/* 变卦 */}
      {relatingHexagram && (
        <div className="relating-hexagram">
          <div className="arrow">→</div>
          <div className="hexagram-mini">
            <span className="hexagram-symbol">{relatingHexagram.symbol}</span>
            <div className="hexagram-info">
              <h4 className="hexagram-name">{relatingHexagram.name}</h4>
              <p className="hexagram-description">
                {relatingHexagram.description}
              </p>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .hexagram-display {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
          padding: 1.5rem;
          background: var(--glass, rgba(255, 255, 255, 0.45));
          border-radius: 16px;
          backdrop-filter: blur(10px);
        }

        .hexagram-display.compact {
          padding: 1rem;
          gap: 1rem;
        }

        .hexagram-main {
          text-align: center;
        }

        .hexagram-header {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.75rem;
          margin-bottom: 0.75rem;
        }

        .hexagram-symbol {
          font-size: 2rem;
          line-height: 1;
        }

        .compact .hexagram-symbol {
          font-size: 1.5rem;
        }

        .hexagram-name {
          font-size: 1.75rem;
          font-weight: bold;
          color: var(--ink, #2d2926);
          margin: 0;
          font-family: var(--font-serif, "Shippori Mincho", serif);
        }

        .compact .hexagram-name {
          font-size: 1.25rem;
        }

        .hexagram-description {
          color: var(--ink-soft, #7a736d);
          font-size: 0.95rem;
          margin: 0 0 0.75rem;
          line-height: 1.5;
        }

        .compact .hexagram-description {
          font-size: 0.85rem;
          margin: 0;
        }

        .trigram-info {
          display: flex;
          justify-content: center;
          gap: 1.5rem;
          font-size: 0.85rem;
          color: var(--ink-soft, #7a736d);
        }

        .lines-container {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
          padding: 1rem;
          background: rgba(255, 255, 255, 0.3);
          border-radius: 12px;
        }

        .relating-hexagram {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding-top: 1rem;
          border-top: 1px solid rgba(0, 0, 0, 0.1);
        }

        .arrow {
          font-size: 1.5rem;
          color: var(--accent, #c49a6c);
        }

        .hexagram-mini {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          flex: 1;
        }

        .hexagram-mini .hexagram-symbol {
          font-size: 1.5rem;
        }

        .hexagram-mini .hexagram-info {
          text-align: left;
        }

        .hexagram-mini .hexagram-name {
          font-size: 1.25rem;
          margin: 0 0 0.25rem;
        }

        .hexagram-mini .hexagram-description {
          font-size: 0.85rem;
          margin: 0;
        }
      `}</style>
    </div>
  );
}

export default HexagramDisplay;
