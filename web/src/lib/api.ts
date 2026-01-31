import type {
  CreateSessionRequest,
  CreateSessionResponse,
  GenerateRequest,
  GenerateResponse,
  ManualStepRequest,
  ManualStepResponse,
  InterpretRequest,
  InterpretResponse,
  SessionDetailResponse,
  DivinationSession,
} from "../types/divination";

// API基础配置
const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:8000";

// ===== 通用请求函数 =====

interface ApiError {
  message: string;
  status: number;
  detail?: string;
}

class ApiException extends Error {
  status: number;
  detail?: string;

  constructor(error: ApiError) {
    super(error.message);
    this.status = error.status;
    this.detail = error.detail;
    this.name = "ApiException";
  }
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE}${endpoint}`;

  const defaultHeaders: HeadersInit = {
    "Content-Type": "application/json",
  };

  const config: RequestInit = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
    credentials: "include", // 携带Cookie
  };

  console.log(`[API Request] ${options.method || "GET"} ${url}`);

  try {
    const response = await fetch(url, config);
    console.log(`[API Response] ${response.status} ${response.statusText}`);

    if (!response.ok) {
      let detail: string | undefined;
      try {
        const errorData = await response.json();
        detail = errorData.detail || errorData.message;
        console.error(`[API Error Detail]`, errorData);
      } catch {
        detail = await response.text();
        console.error(`[API Error Text]`, detail);
      }

      throw new ApiException({
        message: `API Error: ${response.status}`,
        status: response.status,
        detail,
      });
    }

    return response.json();
  } catch (error) {
    if (error instanceof ApiException) {
      throw error;
    }
    console.error(`[API Network Error]`, error);
    throw new ApiException({
      message: "Network error",
      status: 0,
      detail: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

// ===== 占卜 API v2 =====

const DIVINATION_V2_BASE = "/api/v2/divination";

/**
 * 创建占卜会话
 */
export async function createSession(
  data: CreateSessionRequest
): Promise<CreateSessionResponse> {
  return request<CreateSessionResponse>(`${DIVINATION_V2_BASE}/session`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

/**
 * AI生成占卜结果
 */
export async function generateDivination(
  data: GenerateRequest
): Promise<GenerateResponse> {
  return request<GenerateResponse>(`${DIVINATION_V2_BASE}/generate`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

/**
 * 手动模式上报步骤
 */
export async function submitManualStep(
  data: ManualStepRequest
): Promise<ManualStepResponse> {
  return request<ManualStepResponse>(`${DIVINATION_V2_BASE}/manual/step`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

/**
 * 获取LLM解读
 */
export async function getInterpretation(
  data: InterpretRequest
): Promise<InterpretResponse> {
  console.log("[API] getInterpretation called with:", data);
  const url = `${DIVINATION_V2_BASE}/interpret`;
  console.log("[API] Full URL:", `${API_BASE}${url}`);
  try {
    const result = await request<InterpretResponse>(url, {
      method: "POST",
      body: JSON.stringify(data),
    });
    console.log("[API] getInterpretation success:", result);
    return result;
  } catch (error) {
    console.error("[API] getInterpretation error:", error);
    throw error;
  }
}

/**
 * 获取会话详情（回放）
 */
export async function getSessionDetail(
  sessionId: string
): Promise<SessionDetailResponse> {
  return request<SessionDetailResponse>(
    `${DIVINATION_V2_BASE}/${sessionId}`
  );
}

/**
 * 获取用户的占卜历史记录
 */
export async function getDivinationRecords(): Promise<{
  records: DivinationSession[];
}> {
  return request<{ records: DivinationSession[] }>(
    `${DIVINATION_V2_BASE}/records`
  );
}

// ===== 旧版占卜 API（兼容） =====

interface OldDivinationRequest {
  question: string;
  mode: "ai" | "self";
  method?: "tarot" | "roulette";
  user_seed?: string;
}

interface OldDivinationResponse {
  mode: "ai" | "self";
  method: "tarot" | "roulette";
  selection: { tool: string; reason: string };
  result: {
    type: string;
    card?: string;
    orientation?: string;
    keywords?: string;
    label?: string;
    meaning?: string;
  };
  explanation: {
    summary: string;
    explanation: string;
    advice: string;
    ritual_ending: string;
  };
}

/**
 * 旧版占卜接口（保持兼容）
 */
export async function legacyDivination(
  data: OldDivinationRequest
): Promise<OldDivinationResponse> {
  return request<OldDivinationResponse>("/api/divination", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

// ===== 工具函数 =====

/**
 * 重试包装器
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> {
  let lastError: Error | null = null;

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      if (i < maxRetries - 1) {
        await new Promise((resolve) => setTimeout(resolve, delay * (i + 1)));
      }
    }
  }

  throw lastError;
}

/**
 * 本地存储草稿
 */
export function saveDraft(sessionId: string, data: unknown): void {
  try {
    localStorage.setItem(
      `divination_draft_${sessionId}`,
      JSON.stringify(data)
    );
  } catch {
    // localStorage不可用时忽略
  }
}

/**
 * 读取本地草稿
 */
export function loadDraft<T>(sessionId: string): T | null {
  try {
    const data = localStorage.getItem(`divination_draft_${sessionId}`);
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
}

/**
 * 清除本地草稿
 */
export function clearDraft(sessionId: string): void {
  try {
    localStorage.removeItem(`divination_draft_${sessionId}`);
  } catch {
    // 忽略
  }
}

/**
 * 检查是否有未完成的草稿
 */
export function hasPendingDraft(): string | null {
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith("divination_draft_")) {
        return key.replace("divination_draft_", "");
      }
    }
  } catch {
    // 忽略
  }
  return null;
}

export { ApiException };
