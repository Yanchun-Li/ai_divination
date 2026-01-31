"use client";

import type { LiuyaoLine, CoinToss } from "../../../types/divination";
import { getYaoName, getPositionName } from "../../../lib/liuyao";

interface LineDisplayProps {
  line?: LiuyaoLine;
  toss?: CoinToss;
  position: number;
  showDetails?: boolean;
  isHighlighted?: boolean;
}

export function LineDisplay({
  line,
  toss,
  position,
  showDetails = true,
  isHighlighted = false,
}: LineDisplayProps) {
  // 从line或toss中获取数据
  const isYang = line
    ? line.is_yang
    : toss
    ? toss.yao_type === "young_yang" || toss.yao_type === "old_yang"
    : false;

  const isChanging = line ? line.is_changing : toss?.is_changing || false;
  const yaoType = line?.yao_type || toss?.yao_type;
  const posName = getPositionName(position);

  return (
    <div className={`line-display ${isHighlighted ? "highlighted" : ""}`}>
      {/* 爻符号 */}
      <div className={`yao-symbol ${isYang ? "yang" : "yin"}`}>
        {isYang ? (
          // 阳爻：一条实线
          <div className="yang-line" />
        ) : (
          // 阴爻：中间断开的线
          <div className="yin-line">
            <div className="yin-segment" />
            <div className="yin-gap" />
            <div className="yin-segment" />
          </div>
        )}
        {/* 动爻标记 */}
        {isChanging && (
          <span className="changing-indicator">{isYang ? "○" : "×"}</span>
        )}
      </div>

      {/* 详细信息 */}
      {showDetails && yaoType && (
        <div className="line-details">
          <span className="position-name">{posName}爻</span>
          <span className="yao-name">{getYaoName(yaoType)}</span>
          {isChanging && <span className="changing-label">动</span>}
        </div>
      )}

      <style jsx>{`
        .line-display {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 0.5rem;
          border-radius: 8px;
          transition: background-color 0.2s ease;
        }

        .line-display.highlighted {
          background: var(--accent-soft, #fdf5e6);
        }

        .yao-symbol {
          position: relative;
          width: 100px;
          height: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .yang-line {
          width: 100%;
          height: 8px;
          background: var(--ink, #2d2926);
          border-radius: 2px;
        }

        .yin-line {
          width: 100%;
          display: flex;
          justify-content: space-between;
        }

        .yin-segment {
          width: 42%;
          height: 8px;
          background: var(--ink, #2d2926);
          border-radius: 2px;
        }

        .yin-gap {
          width: 16%;
        }

        .changing-indicator {
          position: absolute;
          right: -25px;
          font-size: 1rem;
          color: var(--accent, #c49a6c);
          font-weight: bold;
        }

        .line-details {
          display: flex;
          gap: 0.5rem;
          align-items: center;
          font-size: 0.85rem;
        }

        .position-name {
          color: var(--ink-soft, #7a736d);
        }

        .yao-name {
          color: var(--ink, #2d2926);
          font-weight: 500;
        }

        .changing-label {
          padding: 0.1rem 0.4rem;
          background: var(--accent, #c49a6c);
          color: white;
          border-radius: 4px;
          font-size: 0.75rem;
        }
      `}</style>
    </div>
  );
}

export default LineDisplay;
