import { useState, useCallback, useEffect, useRef } from "react";
import type {
  DivinationMode,
  DivinationMethod,
  DivinationFlowState,
  LiuyaoResult,
  TarotResult,
  DivinationInterpretation,
  CoinToss,
  TarotDrawStep,
} from "../types/divination";
import {
  createSession,
  generateDivination,
  submitManualStep,
  getInterpretation,
  saveDraft,
  loadDraft,
  clearDraft,
  hasPendingDraft,
} from "../lib/api";
import { aiGenerateLiuyao } from "../lib/liuyao";
import { aiGenerateTarot } from "../lib/tarot";

interface UseDivinationReturn {
  state: DivinationFlowState;
  setQuestion: (question: string) => void;
  setMode: (mode: DivinationMode) => void;
  setMethod: (method: DivinationMethod) => void;
  startDivination: (lang?: string) => Promise<void>;
  submitStep: (stepData: CoinToss | TarotDrawStep) => Promise<void>;
  requestInterpretation: (explicitSessionId?: string) => Promise<void>;
  reset: () => void;
  canStart: boolean;
  resumeDraft: () => Promise<boolean>;
}

const INITIAL_STATE: DivinationFlowState = {
  stage: "idle",
  question: "",
  mode: null,
  method: null,
  sessionId: null,
  seed: null,
  liuyaoState: null,
  tarotState: null,
  result: null,
  interpretation: null,
  error: null,
  isLoading: false,
};

export function useDivination(): UseDivinationReturn {
  const [state, setState] = useState<DivinationFlowState>(INITIAL_STATE);
  const [manualStepCount, setManualStepCount] = useState(0);
  
  // 使用 ref 来跟踪步骤计数，避免闭包问题
  const stepCountRef = useRef(0);

  // 检查是否可以开始占卜
  const canStart =
    state.question.trim().length > 0 &&
    state.mode !== null &&
    state.method !== null;

  // 设置问题
  const setQuestion = useCallback((question: string) => {
    setState((prev) => ({
      ...prev,
      question,
      stage: question.trim() ? "question_entered" : "idle",
    }));
  }, []);

  // 设置模式
  const setMode = useCallback((mode: DivinationMode) => {
    setState((prev) => ({
      ...prev,
      mode,
      stage: prev.question.trim() ? "mode_selected" : prev.stage,
    }));
  }, []);

  // 设置方式
  const setMethod = useCallback((method: DivinationMethod) => {
    setState((prev) => ({
      ...prev,
      method,
      stage:
        prev.question.trim() && prev.mode ? "method_selected" : prev.stage,
    }));
  }, []);

  // 开始占卜
  const startDivination = useCallback(async (lang?: string) => {
    if (!canStart) {
      throw new Error("Cannot start: missing question, mode, or method");
    }

    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      // 创建会话
      const response = await createSession({
        question: state.question,
        mode: state.mode!,
        method: state.method!,
        lang: lang || "zh",
      });

      setState((prev) => ({
        ...prev,
        sessionId: response.session_id,
        seed: response.seed,
        stage: "in_progress",
      }));

      // AI模式：直接生成结果
      if (state.mode === "ai") {
        setState((prev) => ({ ...prev, stage: "generating" }));

        // 调用后端生成
        const genResponse = await generateDivination({
          session_id: response.session_id,
        });

        setState((prev) => ({
          ...prev,
          result: genResponse.result,
          interpretation: genResponse.interpretation,
          stage: "completed",
          isLoading: false,
        }));
      } else {
        // 手动模式：等待用户操作
        setState((prev) => ({ ...prev, isLoading: false }));
        setManualStepCount(0);
        stepCountRef.current = 0;
      }
    } catch (error) {
      setState((prev) => ({
        ...prev,
        error: error instanceof Error ? error.message : "Unknown error",
        stage: "error",
        isLoading: false,
      }));
    }
  }, [canStart, state.question, state.mode, state.method]);

  // 提交手动步骤
  const submitStep = useCallback(
    async (stepData: CoinToss | TarotDrawStep) => {
      console.log("[submitStep] Called with:", stepData);
      console.log("[submitStep] Current sessionId:", state.sessionId);
      console.log("[submitStep] stepCountRef.current:", stepCountRef.current);
      
      if (!state.sessionId) {
        console.error("[submitStep] No session ID!");
        throw new Error("No active session");
      }

      // 使用 ref 来获取最新的步骤计数，避免闭包问题
      const currentCount = stepCountRef.current;
      const newStepCount = currentCount + 1;
      const action =
        state.method === "liuyao" ? "coin_toss" : "card_draw";
      const totalSteps = state.method === "liuyao" ? 6 : 3;

      console.log(`[submitStep] Submitting step ${newStepCount}/${totalSteps}, action: ${action}`);

      // 立即更新 ref，防止并发调用
      stepCountRef.current = newStepCount;

      setState((prev) => ({ ...prev, isLoading: true }));

      try {
        const response = await submitManualStep({
          session_id: state.sessionId,
          step_number: newStepCount,
          action,
          data: stepData,
        });

        console.log("[submitStep] Response:", response);
        setManualStepCount(newStepCount);

        // 保存草稿
        saveDraft(state.sessionId, {
          ...state,
          manualStepCount: newStepCount,
        });

        if (response.is_complete) {
          console.log("[submitStep] All steps complete!");
          // 完成所有步骤，不自动切换到 interpreting，让用户点击按钮
          setState((prev) => ({
            ...prev,
            isLoading: false,
          }));
        } else {
          setState((prev) => ({ ...prev, isLoading: false }));
        }
      } catch (error) {
        console.error("[submitStep] Error:", error);
        // 回滚 ref
        stepCountRef.current = currentCount;
        setState((prev) => ({
          ...prev,
          error: error instanceof Error ? error.message : "Unknown error",
          isLoading: false,
        }));
      }
    },
    [state.sessionId, state.method]
  );

  // 请求LLM解读
  const requestInterpretation = useCallback(async (explicitSessionId?: string) => {
    // 使用显式传入的 sessionId 或从 state 中获取
    const sessionId = explicitSessionId || state.sessionId;
    
    console.log("[requestInterpretation] Called with explicitSessionId:", explicitSessionId);
    console.log("[requestInterpretation] state.sessionId:", state.sessionId);
    console.log("[requestInterpretation] Using sessionId:", sessionId);

    if (!sessionId) {
      console.error("[requestInterpretation] No session ID available");
      setState((prev) => ({
        ...prev,
        error: "会话ID不存在，请重新开始占卜",
        stage: "error",
        isLoading: false,
      }));
      return;
    }

    console.log("[requestInterpretation] Starting interpretation for session:", sessionId);
    setState((prev) => ({ ...prev, isLoading: true, stage: "interpreting" }));

    try {
      const response = await getInterpretation({
        session_id: sessionId,
      });

      console.log("[requestInterpretation] Interpretation received:", response);

      // 清除草稿
      clearDraft(sessionId);

      setState((prev) => ({
        ...prev,
        interpretation: response.interpretation,
        stage: "completed",
        isLoading: false,
      }));
    } catch (error) {
      console.error("[requestInterpretation] Error:", error);
      setState((prev) => ({
        ...prev,
        error: error instanceof Error ? error.message : "获取解读失败，请重试",
        stage: "error",
        isLoading: false,
      }));
    }
  }, [state.sessionId]);

  // 重置
  const reset = useCallback(() => {
    if (state.sessionId) {
      clearDraft(state.sessionId);
    }
    setState(INITIAL_STATE);
    setManualStepCount(0);
    stepCountRef.current = 0;
  }, [state.sessionId]);

  // 恢复草稿
  const resumeDraft = useCallback(async (): Promise<boolean> => {
    const pendingSessionId = hasPendingDraft();
    if (!pendingSessionId) {
      return false;
    }

    const draft = loadDraft<DivinationFlowState & { manualStepCount: number }>(
      pendingSessionId
    );
    if (!draft) {
      return false;
    }

    setState(draft);
    setManualStepCount(draft.manualStepCount || 0);
    return true;
  }, []);

  return {
    state,
    setQuestion,
    setMode,
    setMethod,
    startDivination,
    submitStep,
    requestInterpretation,
    reset,
    canStart,
    resumeDraft,
  };
}

// ===== 工具函数 =====

/**
 * 获取阶段的中文描述
 */
export function getStageText(stage: DivinationFlowState["stage"]): string {
  const stageTexts: Record<DivinationFlowState["stage"], string> = {
    idle: "等待输入",
    question_entered: "已输入问题",
    mode_selected: "已选择模式",
    method_selected: "已选择方式",
    in_progress: "占卜进行中",
    generating: "正在生成结果",
    interpreting: "正在解读",
    completed: "占卜完成",
    error: "发生错误",
  };
  return stageTexts[stage];
}

/**
 * 获取开始按钮的文案
 */
export function getStartButtonText(
  mode: DivinationMode | null,
  method: DivinationMethod | null
): string {
  if (!mode || !method) {
    return "开始占卜";
  }

  if (mode === "ai") {
    return "开始占卜";
  }

  if (method === "liuyao") {
    return "开始起卦";
  }

  return "开始抽牌";
}

export default useDivination;
