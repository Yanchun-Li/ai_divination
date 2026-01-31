"use client";

import { useEffect, useState } from "react";
import { translations, type Language } from "./translations";
import { LiuyaoManual } from "../components/divination/liuyao/LiuyaoManual";
import { TarotManual } from "../components/divination/tarot/TarotManual";
import { DivinationView } from "../components/divination/DivinationView";
import type { LiuyaoResult, TarotResult, CoinToss, TarotDrawStep, DivinationInterpretation } from "../types/divination";

type Theme = "light" | "dark";
type View = "daily" | "divination";
type DivinationMode = "ai" | "self";
type DivinationMethod = "tarot" | "liuyao";
type HoroscopeSign =
  | "aries"
  | "taurus"
  | "gemini"
  | "cancer"
  | "leo"
  | "virgo"
  | "libra"
  | "scorpio"
  | "sagittarius"
  | "capricorn"
  | "aquarius"
  | "pisces";

type HoroscopeResponse = {
  current_date: string;
  compatibility: string;
  lucky_time: string;
  lucky_number: string;
  color: string;
  date_range: string;
  mood: string;
  description: string;
};

type DivinationResult = {
  type: DivinationMethod;
  card?: string;
  orientation?: string;
  keywords?: string;
  label?: string;
  meaning?: string;
};

type DivinationExplanation = {
  summary: string;
  explanation: string;
  advice: string;
  ritual_ending: string;
};

type DivinationResponse = {
  mode: DivinationMode;
  method: DivinationMethod;
  selection: { tool: string; reason: string };
  result: DivinationResult;
  explanation: DivinationExplanation;
};

type DivinationRecord = {
  id: number;
  question: string;
  method: DivinationMethod;
  created_at: string;
  interpretation?: DivinationExplanation | string | null;
};

type ChatMessage = {
  id: string;
  role: "ai" | "user";
  content: string;
  method?: DivinationMethod;
  result?: DivinationResult;
  explanation?: DivinationExplanation;
  selectionReason?: string;
};

const horoscopeSigns: HoroscopeSign[] = [
  "aries",
  "taurus",
  "gemini",
  "cancer",
  "leo",
  "virgo",
  "libra",
  "scorpio",
  "sagittarius",
  "capricorn",
  "aquarius",
  "pisces",
];

const normalizeHoroscopeValue = (value?: string) => (value ?? "").trim();

const getSignFromDateInput = (dateValue: string): HoroscopeSign | null => {
  if (!dateValue) return null;
  const parts = dateValue.split("-");
  if (parts.length !== 3) return null;
  const month = Number(parts[1]);
  const day = Number(parts[2]);
  if (!month || !day) return null;

  if ((month === 3 && day >= 21) || (month === 4 && day <= 19)) return "aries";
  if ((month === 4 && day >= 20) || (month === 5 && day <= 20)) return "taurus";
  if ((month === 5 && day >= 21) || (month === 6 && day <= 20)) return "gemini";
  if ((month === 6 && day >= 21) || (month === 7 && day <= 22)) return "cancer";
  if ((month === 7 && day >= 23) || (month === 8 && day <= 22)) return "leo";
  if ((month === 8 && day >= 23) || (month === 9 && day <= 22)) return "virgo";
  if ((month === 9 && day >= 23) || (month === 10 && day <= 22)) return "libra";
  if ((month === 10 && day >= 23) || (month === 11 && day <= 21)) return "scorpio";
  if ((month === 11 && day >= 22) || (month === 12 && day <= 21)) return "sagittarius";
  if ((month === 12 && day >= 22) || (month === 1 && day <= 19)) return "capricorn";
  if ((month === 1 && day >= 20) || (month === 2 && day <= 18)) return "aquarius";
  if ((month === 2 && day >= 19) || (month === 3 && day <= 20)) return "pisces";

  return null;
};

export default function Home() {
  const apiBase = process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:8000";
  const [theme, setTheme] = useState<Theme>("light");
  const [lang, setLang] = useState<Language>("zh");
  const [view, setView] = useState<View>("daily");
  const [isRitualStarted, setIsRitualStarted] = useState(false);
  const [ritualQuestion, setRitualQuestion] = useState("");
  const [chatInput, setChatInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [records, setRecords] = useState<DivinationRecord[]>([]);
  const [divinationMode, setDivinationMode] = useState<DivinationMode>("ai");
  const [divinationMethod, setDivinationMethod] = useState<DivinationMethod>("tarot");
  const [isDivinationLoading, setIsDivinationLoading] = useState(false);
  const [divinationError, setDivinationError] = useState<string | null>(null);
  // 移除旧的手动占卜状态，由 DivinationView 处理
  const [isManualDivination, setIsManualDivination] = useState(false);
  const [birthDate, setBirthDate] = useState("");
  const [sign, setSign] = useState<HoroscopeSign>("aries");
  const [horoscope, setHoroscope] = useState<HoroscopeResponse | null>(null);
  const [isHoroscopeLoading, setIsHoroscopeLoading] = useState(false);
  const [horoscopeError, setHoroscopeError] = useState<string | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authError, setAuthError] = useState<string | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(false);

  useEffect(() => {
    const savedTheme = window.localStorage.getItem("theme") as Theme | null;
    const savedLang = window.localStorage.getItem("lang") as Language | null;

    if (savedTheme) {
      setTheme(savedTheme);
    } else {
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      setTheme(prefersDark ? "dark" : "light");
    }

    if (savedLang) {
      setLang(savedLang);
    } else {
      const browserLang = navigator.language.split("-")[0];
      if (browserLang === "zh" || browserLang === "ja" || browserLang === "en") {
        setLang(browserLang as Language);
      }
    }
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    window.localStorage.setItem("theme", theme);
  }, [theme]);

  useEffect(() => {
    window.localStorage.setItem("lang", lang);
  }, [lang]);

  useEffect(() => {
    let isActive = true;

    const loadSession = async () => {
      try {
        const response = await fetch(`${apiBase}/api/auth/me`, { credentials: "include" });
        if (!response.ok) return;
        const data = (await response.json()) as {
          user: { email: string; birthDate?: string | null } | null;
        };
        if (!isActive) return;
        if (data.user) {
          setIsLoggedIn(true);
          setUserEmail(data.user.email);
          if (data.user.birthDate) setBirthDate(data.user.birthDate);
        } else {
          const sessionBirthDate = window.sessionStorage.getItem("guest.birthDate");
          if (sessionBirthDate) setBirthDate(sessionBirthDate);
        }
      } catch (error) {
        console.error("Auth session check failed", error);
      }
    };

    loadSession();

    return () => {
      isActive = false;
    };
  }, []);

  useEffect(() => {
    if (!birthDate) return;
    if (!isLoggedIn) {
      window.sessionStorage.setItem("guest.birthDate", birthDate);
      return;
    }

    const timer = window.setTimeout(() => {
      fetch(`${apiBase}/api/auth/profile`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ birthDate }),
        credentials: "include",
      }).catch((error) => console.error("Birth date update failed", error));
    }, 400);

    return () => window.clearTimeout(timer);
  }, [birthDate, isLoggedIn]);

  useEffect(() => {
    void loadRecords();
  }, [isLoggedIn, apiBase]);

  const t = translations[lang];
  const toggleTheme = () => setTheme(theme === "light" ? "dark" : "light");
  const derivedSign = getSignFromDateInput(birthDate);
  const effectiveSign = derivedSign ?? sign;
  const isBirthDateActive = Boolean(derivedSign);
  const effectiveSignLabel = t.signs?.[effectiveSign] ?? effectiveSign;
  const signOptions = horoscopeSigns.map((signOption) => ({
    value: signOption,
    label: t.signs?.[signOption] ?? signOption,
  }));
  const uiText = {
    modeLabel: lang === "en" ? "Divination Mode" : lang === "ja" ? "占いモード" : "占卜方式",
    modeAi: lang === "en" ? "AI Reading" : lang === "ja" ? "AIに占わせる" : "AI帮我占卜",
    modeSelf: lang === "en" ? "Self Reading" : lang === "ja" ? "自分で占う" : "自己占卜",
    methodLabel: lang === "en" ? "Method" : lang === "ja" ? "方式" : "占卜方式",
    methodTarot: lang === "en" ? "Tarot" : lang === "ja" ? "タロット" : "塔罗牌",
    methodLiuyao: lang === "en" ? "Liu Yao" : lang === "ja" ? "六爻" : "六爻",
    startError: lang === "en" ? "Failed to read. Please try again." : lang === "ja" ? "占いに失敗しました。" : "占卜失败，请稍后再试。",
    sending: lang === "en" ? "Reading..." : lang === "ja" ? "占い中..." : "占卜中...",
    resultTitle: lang === "en" ? "Result" : lang === "ja" ? "結果" : "占卜结果",
    selectionHint: lang === "en" ? "AI choice:" : lang === "ja" ? "AIの判断：" : "AI判断：",
  };
  const methodLabel = (method: DivinationMethod | undefined) => {
    if (method === "liuyao") return uiText.methodLiuyao;
    return uiText.methodTarot;
  };
  const formatValue = (value?: string) => {
    const cleaned = normalizeHoroscopeValue(value);
    return cleaned.length > 0 ? cleaned : t.horoscopeEmpty;
  };

  const loadRecords = async () => {
    if (!isLoggedIn) {
      setRecords([]);
      return;
    }
    try {
      const response = await fetch(`${apiBase}/api/divination/records`, {
        credentials: "include",
      });
      if (!response.ok) return;
      const data = (await response.json()) as { records?: DivinationRecord[] };
      setRecords(data.records ?? []);
    } catch (error) {
      console.error("Failed to load divination records", error);
    }
  };

  const formatRecordDate = (value: string) => value.replace("T", " ").slice(0, 16);

  const getRecordSummary = (record: DivinationRecord) => {
    const interpretation = record.interpretation;
    if (interpretation && typeof interpretation === "object" && "summary" in interpretation) {
      return (interpretation as DivinationExplanation).summary;
    }
    if (typeof interpretation === "string") {
      return interpretation;
    }
    return "";
  };

  const handleAuthSubmit = async () => {
    setIsAuthLoading(true);
    setAuthError(null);
    try {
      const endpoint = authMode === "login" ? "/api/auth/login" : "/api/auth/register";
      const payload =
        authMode === "login"
          ? { email: authEmail, password: authPassword }
          : { email: authEmail, password: authPassword, birthDate };
      const response = await fetch(`${apiBase}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        credentials: "include",
      });
      if (!response.ok) {
        const data = (await response.json()) as { error?: string };
        throw new Error(data.error ?? "Authentication failed");
      }
      const data = (await response.json()) as {
        user: { email: string; birthDate?: string | null };
      };
      setIsLoggedIn(true);
      setUserEmail(data.user.email);
      if (data.user.birthDate) setBirthDate(data.user.birthDate);
      window.sessionStorage.removeItem("guest.birthDate");
      setShowAuthModal(false);
      setAuthPassword("");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Authentication failed";
      setAuthError(message);
    } finally {
      setIsAuthLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch(`${apiBase}/api/auth/logout`, { method: "POST", credentials: "include" });
    } catch (error) {
      console.error("Logout failed", error);
    } finally {
      setIsLoggedIn(false);
      setUserEmail(null);
    }
  };

  useEffect(() => {
    let isActive = true;

    const fetchHoroscope = async () => {
      setIsHoroscopeLoading(true);
      setHoroscopeError(null);

      try {
        const response = await fetch(`${apiBase}/api/aztro`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sign: effectiveSign,
            day: "today",
            lang,
          }),
        });

        if (!response.ok) throw new Error("Horoscope request failed");
        const data = (await response.json()) as HoroscopeResponse;
        if (!isActive) return;
        setHoroscope(data);
      } catch {
        if (!isActive) return;
        setHoroscope(null);
        setHoroscopeError(t.horoscopeError);
      } finally {
        if (isActive) setIsHoroscopeLoading(false);
      }
    };

    fetchHoroscope();
    return () => {
      isActive = false;
    };
  }, [effectiveSign, lang, t.horoscopeError]);

  const [heroLine1, heroLine2] = t.dailyHeroTitle.split("\n");
  const createMessageId = () => `${Date.now()}-${Math.random().toString(16).slice(2)}`;

  const appendMessage = (message: ChatMessage) => {
    setMessages((prev) => [...prev, message]);
  };

  // 占卜完成后的回调
  const handleDivinationComplete = (result: any, interpretation: any) => {
    appendMessage({
      id: createMessageId(),
      role: "ai",
      content: interpretation?.summary || "占卜完成",
      method: divinationMethod,
      result: result,
      explanation: interpretation,
    });
    if (isLoggedIn) {
      void loadRecords();
    }
  };

  return (
    <main>
      <div className="layout-container">
        <header className="app-header">
          <div className="brand">
            <span className="logo-icon">*</span>
            <h1 className="logo-text">{t.appTitle}</h1>
          </div>
          <div className="header-actions">
            <div className="lang-switcher">
              <button className={lang === "zh" ? "active" : ""} onClick={() => setLang("zh")}>
                {"\u4e2d"}
              </button>
              <button className={lang === "ja" ? "active" : ""} onClick={() => setLang("ja")}>
                {"\u65e5"}
              </button>
              <button className={lang === "en" ? "active" : ""} onClick={() => setLang("en")}>
                EN
              </button>
            </div>
            <button className={`nav-tab ${view === "daily" ? "active" : ""}`} onClick={() => setView("daily")}>
              {t.dailyFortune}
            </button>
            <button
              className={`nav-tab ${view === "divination" ? "active" : ""}`}
              onClick={() => setView("divination")}
            >
              {t.deepDivination}
            </button>
            {isLoggedIn ? (
              <button className="nav-tab" onClick={handleLogout}>
                {t.logout}
              </button>
            ) : (
              <button
                className="nav-tab"
                onClick={() => {
                  setAuthMode("login");
                  setShowAuthModal(true);
                }}
              >
                {t.login}
              </button>
            )}
            <button className="theme-toggle" onClick={toggleTheme} aria-label={t.themeToggleLabel}>
              {theme === "light" ? (
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path
                    d="M12 3a7 7 0 1 0 9 9 8.5 8.5 0 1 1-9-9Z"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <circle cx="12" cy="12" r="4.2" fill="none" stroke="currentColor" strokeWidth="1.6" />
                  <path
                    d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M4.7 4.7l2.1 2.1M17.2 17.2l2.1 2.1M19.3 4.7l-2.1 2.1M6.8 17.2l-2.1 2.1"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                  />
                </svg>
              )}
            </button>
          </div>
        </header>

        {view === "daily" ? (
          <section className="view-daily animate-fade-in">
            <div className="daily-hero">
              <div className="date-badge">{t.sampleDate}</div>
              <h2 className="hero-title">
                {heroLine1}
                {heroLine2 ? (
                  <>
                    <br />
                    <span>{heroLine2}</span>
                  </>
                ) : null}
              </h2>
              <p className="hero-subtitle">{t.dailyHeroSubtitle}</p>
            </div>

            <div className="fortune-card">
              <div className="card-glass">
                <span className="ritual-status">{t.dailyEnergy}</span>
                <div className="card-body">
                  <p className="fortune-main-text">{t.dailyMessage}</p>
                  <div className="horoscope-panel">
                    <div className="horoscope-title">{t.dailyHoroscope}</div>
                    <div className="horoscope-controls">
                      <label className="horoscope-field">
                        <span>{t.horoscopeBirthDate}</span>
                        <input
                          type="date"
                          value={birthDate}
                          onChange={(event) => setBirthDate(event.target.value)}
                        />
                      </label>
                      <label className="horoscope-field">
                        <span>{t.horoscopeSign}</span>
                        <select
                          value={effectiveSign}
                          onChange={(event) => setSign(event.target.value as HoroscopeSign)}
                          disabled={isBirthDateActive}
                        >
                          {signOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </label>
                    </div>
                    {isBirthDateActive && (
                      <div className="horoscope-hint">
                        {t.horoscopeDerivedHint.replace("{sign}", effectiveSignLabel)}
                      </div>
                    )}
                    {isHoroscopeLoading && <div className="horoscope-status">{t.horoscopeLoading}</div>}
                    {horoscopeError && <div className="horoscope-status error">{horoscopeError}</div>}
                  </div>
                  <div className="fortune-aspects">
                    <div className="aspect">
                      <span className="aspect-label">{t.horoscopeMood}</span>
                      <span className="aspect-value">{formatValue(horoscope?.mood)}</span>
                    </div>
                    <div className="aspect">
                      <span className="aspect-label">{t.horoscopeLuckyTime}</span>
                      <span className="aspect-value">{formatValue(horoscope?.lucky_time)}</span>
                    </div>
                    <div className="aspect">
                      <span className="aspect-label">{t.horoscopeCompatibility}</span>
                      <span className="aspect-value">{formatValue(horoscope?.compatibility)}</span>
                    </div>
                  </div>
                  {horoscope && (
                    <div className="horoscope-details">
                      <div className="detail-row">
                        <span>{t.horoscopeLuckyNumber}</span>
                        <span>{formatValue(horoscope.lucky_number)}</span>
                      </div>
                      <div className="detail-row">
                        <span>{t.horoscopeColor}</span>
                        <span>{formatValue(horoscope.color)}</span>
                      </div>
                      <div className="detail-row">
                        <span>{t.horoscopeDateRange}</span>
                        <span>{formatValue(horoscope.date_range)}</span>
                      </div>
                      <div className="detail-row detail-description">
                        <span>{t.horoscopeDescription}</span>
                        <span>{formatValue(horoscope.description)}</span>
                      </div>
                    </div>
                  )}
                </div>
                <button className="btn-primary" onClick={() => setView("divination")}>
                  {t.moreDetails}
                </button>
              </div>
            </div>
          </section>
        ) : (
          <section className="view-divination animate-fade-in">
            <div className="chat-container">
              <DivinationView 
                onComplete={(result, interpretation) => {
                  handleDivinationComplete(result, interpretation);
                }}
              />
            </div>

            <aside className="auth-sidebar">
              <div className="auth-card">
                <p style={{ fontSize: "14px", marginBottom: "24px", opacity: 0.8, lineHeight: 1.6 }}>
                  {t.recordingDesc}
                </p>
                {isLoggedIn ? (
                  <div className="auth-status">
                    <div>{userEmail}</div>
                    <button className="ghost" type="button" onClick={handleLogout}>
                      {t.logout}
                    </button>
                    {records.length > 0 && (
                      <div style={{ marginTop: "20px", display: "grid", gap: "12px" }}>
                        {records.map((record) => {
                          const summary = getRecordSummary(record);
                          return (
                            <div
                              key={record.id}
                              style={{ display: "grid", gap: "6px", fontSize: "12px", color: "var(--ink-soft)" }}
                            >
                              <div style={{ color: "var(--ink)" }}>{record.question}</div>
                              <div>
                                {methodLabel(record.method)} - {formatRecordDate(record.created_at)}
                              </div>
                              {summary && (
                                <div style={{ color: "var(--accent-dark)", fontStyle: "italic" }}>{summary}</div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ) : (
                  <button
                    className="btn-primary"
                    style={{ background: "var(--mist)", color: "var(--ink)", fontSize: "14px", padding: "16px" }}
                    onClick={() => {
                      setAuthMode("login");
                      setShowAuthModal(true);
                    }}
                  >
                    {t.login}
                  </button>
                )}
              </div>
            </aside>
          </section>
        )}

        {showAuthModal && (
          <div className="auth-modal">
            <div
              className="auth-backdrop"
              onClick={() => {
                setShowAuthModal(false);
                setAuthError(null);
              }}
            />
            <div className="auth-panel">
              <div className="auth-header">
                <h3>{authMode === "login" ? t.authTitleLogin : t.authTitleRegister}</h3>
                <button
                  className="ghost"
                  type="button"
                  onClick={() => {
                    setShowAuthModal(false);
                    setAuthError(null);
                  }}
                >
                  ✕
                </button>
              </div>
              <p className="auth-hint">{t.authGuestHint}</p>
              <div className="auth-fields">
                <label className="auth-field">
                  <span>{t.email}</span>
                  <input
                    type="email"
                    value={authEmail}
                    onChange={(event) => setAuthEmail(event.target.value)}
                    placeholder={t.email}
                  />
                </label>
                <label className="auth-field">
                  <span>{t.password}</span>
                  <input
                    type="password"
                    value={authPassword}
                    onChange={(event) => setAuthPassword(event.target.value)}
                    placeholder={t.password}
                  />
                </label>
                {authMode === "register" && (
                  <label className="auth-field">
                    <span>{t.horoscopeBirthDate}</span>
                    <input
                      type="date"
                      value={birthDate}
                      onChange={(event) => setBirthDate(event.target.value)}
                    />
                  </label>
                )}
              </div>
              {authError && <div className="auth-error">{authError}</div>}
              <div className="auth-actions">
                <button className="btn-primary" type="button" onClick={handleAuthSubmit} disabled={isAuthLoading}>
                  {authMode === "login" ? t.authSubmitLogin : t.authSubmitRegister}
                </button>
                <button
                  className="ghost"
                  type="button"
                  onClick={() => {
                    setAuthMode(authMode === "login" ? "register" : "login");
                    setAuthError(null);
                  }}
                >
                  {authMode === "login" ? t.authSwitchToRegister : t.authSwitchToLogin}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
