"use client";

import { useState, useEffect, useRef } from "react";
import { useDivination, getStartButtonText } from "../../hooks/useDivination";
import { LiuyaoManual, LiuyaoAI, HexagramDisplay } from "./liuyao";
import { TarotManual, TarotAI, SpreadDisplay } from "./tarot";
import { translations, type Language } from "../../app/translations";
import type {
  DivinationMode,
  DivinationMethod,
  LiuyaoResult,
  TarotResult,
  DivinationInterpretation,
  CoinToss,
  TarotDrawStep,
} from "../../types/divination";

interface DivinationViewProps {
  initialQuestion?: string;
  initialMode?: DivinationMode;
  initialMethod?: DivinationMethod;
  lang?: Language;
  onComplete?: (result: LiuyaoResult | TarotResult, interpretation: DivinationInterpretation | null) => void;
  onActiveChange?: (isActive: boolean) => void;
  onReset?: () => void;
}

export function DivinationView({ 
  initialQuestion,
  initialMode,
  initialMethod,
  lang = "zh",
  onComplete, 
  onActiveChange,
  onReset 
}: DivinationViewProps) {
  // 获取翻译
  const t = translations[lang];
  const td = t.divination;

  const {
    state,
    setQuestion,
    setMode,
    setMethod,
    startDivination,
    submitStep,
    requestInterpretation,
    reset,
    canStart,
  } = useDivination();

  // 初始化时设置问题、模式和方法
  const hasInitialized = useRef(false);
  useEffect(() => {
    if (!hasInitialized.current && initialQuestion) {
      // 先设置所有值
      setQuestion(initialQuestion);
      if (initialMode) setMode(initialMode);
      if (initialMethod) setMethod(initialMethod);
      hasInitialized.current = true;
    }
  }, [initialQuestion, initialMode, initialMethod, setQuestion, setMode, setMethod]);

  // 当所有条件满足后自动开始占卜
  useEffect(() => {
    if (hasInitialized.current && initialQuestion && canStart && state.stage !== "in_progress" && state.stage !== "generating" && state.stage !== "interpreting" && state.stage !== "completed" && !state.sessionId) {
      startDivination(lang);
    }
  }, [canStart, initialQuestion, state.stage, state.sessionId, startDivination, lang]);

  // 通知父组件交互状态变化
  useEffect(() => {
    const isActive = state.stage !== "idle" && state.stage !== "question_entered" && state.stage !== "mode_selected" && state.stage !== "method_selected";
    // 或者是更宽泛的定义：只要开始了占卜会话就算 active
    const isActuallyActive = state.sessionId !== null || state.stage === "in_progress" || state.stage === "generating" || state.stage === "interpreting" || state.stage === "completed";
    onActiveChange?.(isActuallyActive);
  }, [state.stage, state.sessionId, onActiveChange]);

  const [localResult, setLocalResult] = useState<LiuyaoResult | TarotResult | null>(null);
  
  // 使用 ref 来跟踪最新的 sessionId，避免闭包问题
  const sessionIdRef = useRef<string | null>(null);
  
  // 当 state.sessionId 变化时更新 ref
  useEffect(() => {
    sessionIdRef.current = state.sessionId;
    console.log("[DivinationView] sessionIdRef updated to:", state.sessionId);
  }, [state.sessionId]);

  // 处理结果完成
  const handleResultComplete = async (result: LiuyaoResult | TarotResult) => {
    console.log("[DivinationView] handleResultComplete called with result:", result);
    console.log("[DivinationView] Current state.sessionId:", state.sessionId);
    console.log("[DivinationView] sessionIdRef.current:", sessionIdRef.current);
    
    setLocalResult(result);
    
    // 使用 ref 获取最新的 sessionId（更可靠）
    const currentSessionId = sessionIdRef.current || state.sessionId;
    console.log("[DivinationView] Using sessionId:", currentSessionId);
    
    if (!currentSessionId) {
      console.error("[DivinationView] No sessionId available! Cannot request interpretation.");
      return;
    }
    
    // 请求解读，显式传递 sessionId
    try {
      console.log("[DivinationView] Calling requestInterpretation with sessionId:", currentSessionId);
      await requestInterpretation(currentSessionId);
      console.log("[DivinationView] requestInterpretation completed successfully");
    } catch (error) {
      console.error("[DivinationView] Interpretation failed:", error);
    }
  };

  // 当解读完成时通知父组件
  useEffect(() => {
    if (state.stage === "completed" && state.interpretation && localResult) {
      onComplete?.(localResult, state.interpretation);
    }
  }, [state.stage, state.interpretation, localResult, onComplete]);

  // 处理手动步骤
  const handleManualStep = async (stepData: CoinToss | TarotDrawStep) => {
    await submitStep(stepData);
  };

  // 判断是否由父组件控制（传入了初始问题）
  const isControlled = !!initialQuestion;

  return (
    <div className="divination-view">
      {/* 阶段1：输入问题（仅在非控制模式下显示） */}
      {!isControlled && (state.stage === "idle" || state.stage === "question_entered" || state.stage === "mode_selected" || state.stage === "method_selected") && (
        <div className="setup-section">
          <div className="intro-header">
            <h3 className="intro-title">{t.ritualIntroTitle}</h3>
            <p className="intro-desc">{t.ritualIntroDesc}</p>
          </div>
          {/* 问题输入 */}
          <div className="question-input-container">
            <label htmlFor="question" className="input-label">
              {t.greetingTitle}
            </label>
            <textarea
              id="question"
              className="question-input"
              placeholder={t.ritualPlaceholder}
              value={state.question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  if (canStart && !state.isLoading) {
                    startDivination(lang);
                  }
                }
              }}
              rows={3}
            />
          </div>

          {/* 模式选择 */}
          <div className="selector-group">
            <label className="group-label">{t.modeLabel}</label>
            <div className="button-group">
              <button
                className={`mode-button ${state.mode === "ai" ? "active" : ""}`}
                onClick={() => setMode("ai")}
              >
                <span className="button-icon">✨</span>
                <span className="button-text">{t.modeAi}</span>
                <span className="button-desc">{t.modeAiDesc}</span>
              </button>
              <button
                className={`mode-button ${state.mode === "manual" ? "active" : ""}`}
                onClick={() => setMode("manual")}
              >
                <span className="button-icon">🤲</span>
                <span className="button-text">{t.modeManual}</span>
                <span className="button-desc">{t.modeManualDesc}</span>
              </button>
            </div>
          </div>

          {/* 方式选择 */}
          <div className="selector-group">
            <label className="group-label">{t.methodLabel}</label>
            <div className="button-group">
              <button
                className={`method-button ${state.method === "liuyao" ? "active" : ""}`}
                onClick={() => setMethod("liuyao")}
              >
                <span className="button-icon">☰</span>
                <span className="button-text">{t.methodLiuyao}</span>
                <span className="button-desc">{t.liuyaoDesc}</span>
              </button>
              <button
                className={`method-button ${state.method === "tarot" ? "active" : ""}`}
                onClick={() => setMethod("tarot")}
              >
                <span className="button-icon">🎴</span>
                <span className="button-text">{t.methodTarot}</span>
                <span className="button-desc">{t.tarotDesc}</span>
              </button>
            </div>
          </div>

          {/* 开始按钮 */}
          <button
            className="start-button"
            onClick={() => startDivination(lang)}
            disabled={!canStart || state.isLoading}
          >
            {state.isLoading ? td.preparing : getStartButtonText(state.mode, state.method, lang)}
          </button>

          {state.error && (
            <div className="error-message">{state.error}</div>
          )}
        </div>
      )}

      {/* 阶段2：占卜进行中 */}
      {(state.stage === "in_progress" || state.stage === "generating") && (
        <div className="divination-section">
          {/* 问题回显 */}
          <div className="question-display">
            <span className="question-label">{td.yourQuestion}</span>
            <p className="question-text">「{state.question}」</p>
          </div>

          {/* AI模式：六爻 */}
          {state.mode === "ai" && state.method === "liuyao" && state.seed && (
            <LiuyaoAI
              seed={state.seed}
              onComplete={handleResultComplete}
              autoStart={true}
              lang={lang}
            />
          )}

          {/* AI模式：塔罗 */}
          {state.mode === "ai" && state.method === "tarot" && state.seed && (
            <TarotAI
              seed={state.seed}
              onComplete={handleResultComplete}
              autoStart={true}
              lang={lang}
            />
          )}

          {/* 手动模式：六爻 */}
          {state.mode === "manual" && state.method === "liuyao" && (
            <LiuyaoManual
              onComplete={handleResultComplete}
              onStepComplete={(step, toss) => handleManualStep(toss)}
              lang={lang}
            />
          )}

          {/* 手动模式：塔罗 */}
          {state.mode === "manual" && state.method === "tarot" && (
            <TarotManual
              onComplete={handleResultComplete}
              onStepComplete={(step, draw) => handleManualStep(draw)}
              lang={lang}
            />
          )}
        </div>
      )}

      {/* 阶段3：解读中 */}
      {state.stage === "interpreting" && (
        <div className="interpreting-section">
          <div className="loading-indicator">
            <div className="spinner" />
            <p className="loading-text">{td.interpreting}</p>
            <p className="loading-hint">{td.connectingAI}</p>
          </div>
        </div>
      )}

      {/* 错误状态 */}
      {state.stage === "error" && (
        <div className="error-section">
          <div className="error-card">
            <h3 className="error-title">{td.errorOccurred}</h3>
            <p className="error-text">{state.error || td.unknownError}</p>
            <div className="error-actions">
              {localResult && state.sessionId && (
                <button className="btn-primary" onClick={async () => {
                  try {
                    await requestInterpretation(state.sessionId!);
                  } catch (error) {
                    console.error("Retry failed:", error);
                  }
                }}>
                  {td.retryInterpretation}
                </button>
              )}
              <button className="btn-secondary" onClick={() => { reset(); onReset?.(); }}>
                {td.restartDivination}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 阶段4：结果展示 */}
      {state.stage === "completed" && state.interpretation && (
        <div className="result-section">
          {/* 问题回显 */}
          <div className="question-display">
            <span className="question-label">{td.yourQuestion}</span>
            <p className="question-text">「{state.question}」</p>
          </div>

          {/* 占卜结果展示 */}
          <div className="divination-result-card">
            <h3 className="result-card-title">{td.divinationResult}</h3>
            
            {/* 六爻结果 */}
            {localResult && localResult.type === "liuyao" && (
              <HexagramDisplay
                hexagram={(localResult as LiuyaoResult).primary_hexagram}
                lines={(localResult as LiuyaoResult).lines}
                relatingHexagram={(localResult as LiuyaoResult).relating_hexagram ?? undefined}
                showLines={true}
                compact={true}
              />
            )}

            {/* 塔罗结果 */}
            {localResult && localResult.type === "tarot" && (
              <SpreadDisplay
                draws={(localResult as TarotResult).cards}
                showAll={true}
                compact={true}
                lang={lang}
              />
            )}
          </div>

          {/* 解读内容 */}
          <div className="interpretation-card">
            <h3 className="interpretation-title">{td.divinationInterpretation}</h3>

            {/* 一句话总结 */}
            <div className="summary-box">
              <p className="summary-text">{state.interpretation.summary}</p>
            </div>

            {/* 解释要点 */}
            <div className="reasoning-section">
              <h4 className="section-title">{td.interpretationPoints}</h4>
              <ul className="reasoning-list">
                {state.interpretation.reasoning_bullets.map((bullet, i) => (
                  <li key={i} className="reasoning-item">{bullet}</li>
                ))}
              </ul>
            </div>

            {/* 建议 */}
            <div className="advice-section">
              <h4 className="section-title">{td.actionAdvice}</h4>
              <p className="advice-text">{state.interpretation.advice}</p>
            </div>

            {/* 时机 */}
            <div className="timing-section">
              <span className="timing-label">{td.timingHint}</span>
              <span className="timing-text">{state.interpretation.timing}</span>
            </div>

            {/* 追问 */}
            <div className="followup-section">
              <h4 className="section-title">{td.youMayWantToKnow}</h4>
              <div className="followup-questions">
                {state.interpretation.follow_up_questions.map((q, i) => (
                  <span key={i} className="followup-tag">{q}</span>
                ))}
              </div>
            </div>

            {/* 结束语 */}
            <div className="ending-section">
              <p className="ending-text">{state.interpretation.ritual_ending}</p>
            </div>
          </div>

          {/* 操作按钮 */}
          <div className="action-buttons">
            <button className="btn-secondary" onClick={() => { reset(); onReset?.(); }}>
              {td.divinateAgain}
            </button>
          </div>
        </div>
      )}

      <style jsx>{`
        .divination-view {
          display: flex;
          flex-direction: column;
          gap: 2rem;
          max-width: 600px;
          margin: 0 auto;
          padding: 1rem;
        }

        .setup-section {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .intro-header {
          text-align: center;
          margin-bottom: 1rem;
        }

        .intro-title {
          font-size: 2rem;
          margin-bottom: 0.5rem;
          font-family: var(--font-serif);
        }

        .intro-desc {
          color: var(--ink-soft);
          font-size: 1.1rem;
          line-height: 1.6;
        }

        .question-input-container {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .input-label,
        .group-label {
          font-size: 0.9rem;
          font-weight: 500;
          color: var(--ink, #2d2926);
        }

        .question-input {
          padding: 1rem;
          border: 1px solid rgba(0, 0, 0, 0.1);
          border-radius: 12px;
          font-size: 1rem;
          resize: none;
          background: var(--glass, rgba(255, 255, 255, 0.45));
          transition: border-color 0.2s;
        }

        .question-input:focus {
          outline: none;
          border-color: var(--accent, #c49a6c);
        }

        .selector-group {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .button-group {
          display: flex;
          gap: 1rem;
        }

        .mode-button,
        .method-button {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.25rem;
          padding: 1rem;
          border: 2px solid rgba(0, 0, 0, 0.1);
          border-radius: 12px;
          background: var(--glass, rgba(255, 255, 255, 0.45));
          cursor: pointer;
          transition: all 0.2s;
        }

        .mode-button:hover,
        .method-button:hover {
          border-color: var(--accent, #c49a6c);
        }

        .mode-button.active,
        .method-button.active {
          border-color: var(--accent, #c49a6c);
          background: var(--accent-soft, #fdf5e6);
        }

        .button-icon {
          font-size: 1.5rem;
        }

        .button-text {
          font-weight: 600;
          color: var(--ink, #2d2926);
        }

        .button-desc {
          font-size: 0.75rem;
          color: var(--ink-soft, #7a736d);
        }

        .start-button {
          padding: 1rem 2rem;
          font-size: 1.1rem;
          font-weight: 600;
          color: white;
          background: var(--accent, #c49a6c);
          border: none;
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .start-button:hover:not(:disabled) {
          background: var(--accent-dark, #8b6d4b);
        }

        .start-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .error-message {
          padding: 0.75rem 1rem;
          background: #fce4ec;
          color: #c2185b;
          border-radius: 8px;
          font-size: 0.9rem;
        }

        .divination-section {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .question-display {
          text-align: center;
          padding: 1rem;
          background: var(--glass, rgba(255, 255, 255, 0.45));
          border-radius: 12px;
        }

        .question-label {
          font-size: 0.8rem;
          color: var(--ink-soft, #7a736d);
        }

        .question-text {
          font-size: 1.1rem;
          font-weight: 500;
          color: var(--ink, #2d2926);
          margin: 0.5rem 0 0;
          font-family: var(--font-serif, "Shippori Mincho", serif);
        }

        .interpreting-section {
          display: flex;
          justify-content: center;
          padding: 3rem;
        }

        .loading-indicator {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1rem;
        }

        .spinner {
          width: 40px;
          height: 40px;
          border: 3px solid rgba(0, 0, 0, 0.1);
          border-top-color: var(--accent, #c49a6c);
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }

        .loading-text {
          color: var(--ink-soft, #7a736d);
          font-size: 0.95rem;
        }

        .loading-hint {
          color: var(--ink-soft, #7a736d);
          font-size: 0.8rem;
          opacity: 0.7;
          margin-top: 0.5rem;
        }

        .error-section {
          display: flex;
          justify-content: center;
          padding: 2rem;
        }

        .error-card {
          padding: 1.5rem;
          background: #fff5f5;
          border: 1px solid #ffcdd2;
          border-radius: 12px;
          text-align: center;
          max-width: 400px;
        }

        .error-title {
          color: #c2185b;
          font-size: 1.1rem;
          margin: 0 0 0.75rem;
        }

        .error-text {
          color: #7a736d;
          font-size: 0.9rem;
          margin: 0 0 1rem;
          line-height: 1.5;
        }

        .error-actions {
          display: flex;
          gap: 0.75rem;
          justify-content: center;
        }

        .result-section {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .interpretation-card {
          padding: 1.5rem;
          background: var(--glass, rgba(255, 255, 255, 0.45));
          border-radius: 16px;
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }

        .interpretation-title {
          font-size: 1.25rem;
          font-weight: bold;
          color: var(--ink, #2d2926);
          margin: 0;
          text-align: center;
          font-family: var(--font-serif, "Shippori Mincho", serif);
        }

        .summary-box {
          padding: 1rem;
          background: var(--accent-soft, #fdf5e6);
          border-radius: 12px;
          text-align: center;
        }

        .summary-text {
          font-size: 1.1rem;
          font-weight: 500;
          color: var(--ink, #2d2926);
          margin: 0;
          line-height: 1.5;
        }

        .section-title {
          font-size: 0.9rem;
          font-weight: 600;
          color: var(--ink, #2d2926);
          margin: 0 0 0.5rem;
        }

        .reasoning-list {
          list-style: none;
          padding: 0;
          margin: 0;
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .reasoning-item {
          padding: 0.5rem 0.75rem;
          background: rgba(0, 0, 0, 0.03);
          border-radius: 8px;
          font-size: 0.9rem;
          color: var(--ink, #2d2926);
        }

        .reasoning-item::before {
          content: "•";
          color: var(--accent, #c49a6c);
          margin-right: 0.5rem;
        }

        .advice-text {
          margin: 0;
          font-size: 0.95rem;
          color: var(--ink, #2d2926);
          line-height: 1.5;
        }

        .timing-section {
          padding: 0.75rem 1rem;
          background: rgba(196, 154, 108, 0.1);
          border-radius: 8px;
          font-size: 0.9rem;
        }

        .timing-label {
          color: var(--ink-soft, #7a736d);
        }

        .timing-text {
          color: var(--ink, #2d2926);
          font-weight: 500;
        }

        .followup-questions {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
        }

        .followup-tag {
          padding: 0.4rem 0.8rem;
          background: rgba(0, 0, 0, 0.05);
          border-radius: 20px;
          font-size: 0.8rem;
          color: var(--ink-soft, #7a736d);
        }

        .ending-section {
          padding-top: 1rem;
          border-top: 1px solid rgba(0, 0, 0, 0.1);
          text-align: center;
        }

        .ending-text {
          font-size: 0.95rem;
          color: var(--ink-soft, #7a736d);
          font-style: italic;
          margin: 0;
        }

        .action-buttons {
          display: flex;
          justify-content: center;
        }

        .btn-secondary {
          padding: 0.75rem 1.5rem;
          border-radius: 12px;
          font-size: 1rem;
          font-weight: 500;
          cursor: pointer;
          background: transparent;
          color: var(--ink, #2d2926);
          border: 1px solid var(--ink-soft, #7a736d);
          transition: all 0.2s;
        }

        .btn-secondary:hover {
          background: rgba(0, 0, 0, 0.05);
        }

        .divination-result-card {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          padding: 1.5rem;
          background: var(--glass, rgba(255, 255, 255, 0.45));
          border-radius: 16px;
          backdrop-filter: blur(10px);
        }

        .result-card-title {
          font-size: 1.25rem;
          font-weight: bold;
          color: var(--ink, #2d2926);
          margin: 0;
          text-align: center;
          font-family: var(--font-serif, "Shippori Mincho", serif);
        }
      `}</style>
    </div>
  );
}

export default DivinationView;
