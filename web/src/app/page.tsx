"use client";

import { useEffect, useState, useCallback } from "react";
import { translations, type Language } from "./translations";
import { DivinationView } from "../components/divination/DivinationView";
import type { LiuyaoResult, TarotResult, DivinationInterpretation, DivinationMode, DivinationMethod } from "../types/divination";

type Theme = "dark" | "light" | "forest";
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

type DivinationRecord = {
  id: number;
  question: string;
  method: DivinationMethod;
  created_at: string;
  interpretation?: { summary: string } | string | null;
};

const horoscopeSigns: HoroscopeSign[] = [
  "aries", "taurus", "gemini", "cancer", "leo", "virgo",
  "libra", "scorpio", "sagittarius", "capricorn", "aquarius", "pisces",
];

const signDateRanges: Record<HoroscopeSign, string> = {
  aries: "3.21-4.19",
  taurus: "4.20-5.20",
  gemini: "5.21-6.21",
  cancer: "6.22-7.22",
  leo: "7.23-8.22",
  virgo: "8.23-9.22",
  libra: "9.23-10.23",
  scorpio: "10.24-11.22",
  sagittarius: "11.23-12.21",
  capricorn: "12.22-1.19",
  aquarius: "1.20-2.18",
  pisces: "2.19-3.20",
};

export default function Home() {
  const apiBase = process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:8000";
  const [theme, setTheme] = useState<Theme>("dark");
  const [lang, setLang] = useState<Language>("zh");
  const [showLangMenu, setShowLangMenu] = useState(false);
  const [isDivinationActive, setIsDivinationActive] = useState(false);

  // Divination states
  const [question, setQuestion] = useState("");
  const [mode, setMode] = useState<DivinationMode>("ai");
  const [method, setMethod] = useState<DivinationMethod>("tarot");
  const [showDivinationView, setShowDivinationView] = useState(false);
  const [showMethodPicker, setShowMethodPicker] = useState(false);

  // Horoscope states
  const [sign, setSign] = useState<HoroscopeSign>("scorpio");
  const [horoscope, setHoroscope] = useState<HoroscopeResponse | null>(null);
  const [isHoroscopeLoading, setIsHoroscopeLoading] = useState(false);
  const [horoscopeError, setHoroscopeError] = useState<string | null>(null);

  // Auth states
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authError, setAuthError] = useState<string | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(false);
  const [records, setRecords] = useState<DivinationRecord[]>([]);

  const t = translations[lang];

  // Theme and language persistence
  useEffect(() => {
    const savedTheme = window.localStorage.getItem("theme") as Theme | null;
    const savedLang = window.localStorage.getItem("lang") as Language | null;

    if (savedTheme) setTheme(savedTheme);
    if (savedLang) setLang(savedLang);
    else {
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

  // Session check
  useEffect(() => {
    let isActive = true;
    const loadSession = async () => {
      try {
        const response = await fetch(`${apiBase}/api/auth/me`, { credentials: "include" });
        if (!response.ok) return;
        const data = (await response.json()) as { user: { email: string } | null };
        if (!isActive) return;
        if (data.user) {
          setIsLoggedIn(true);
          setUserEmail(data.user.email);
        }
      } catch (error) {
        console.error("Auth session check failed", error);
      }
    };
    loadSession();
    return () => { isActive = false; };
  }, [apiBase]);

  // Load records
  const loadRecords = useCallback(async () => {
    if (!isLoggedIn) {
      setRecords([]);
      return;
    }
    try {
      const response = await fetch(`${apiBase}/api/divination/records`, { credentials: "include" });
      if (!response.ok) return;
      const data = (await response.json()) as { records?: DivinationRecord[] };
      setRecords(data.records ?? []);
    } catch (error) {
      console.error("Failed to load divination records", error);
    }
  }, [apiBase, isLoggedIn]);

  useEffect(() => {
    void loadRecords();
  }, [loadRecords]);

  // Horoscope fetch
  useEffect(() => {
    let isActive = true;
    const fetchHoroscope = async () => {
      setIsHoroscopeLoading(true);
      setHoroscopeError(null);
      try {
        const response = await fetch(`${apiBase}/api/aztro`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sign, day: "today", lang }),
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
    return () => { isActive = false; };
  }, [sign, lang, t.horoscopeError, apiBase]);

  const toggleTheme = () => {
    const themes: Theme[] = ["dark", "light", "forest"];
    const currentIndex = themes.indexOf(theme);
    setTheme(themes[(currentIndex + 1) % themes.length]);
  };

  const handleAuthSubmit = async () => {
    setIsAuthLoading(true);
    setAuthError(null);
    try {
      const endpoint = authMode === "login" ? "/api/auth/login" : "/api/auth/register";
      const payload = { email: authEmail, password: authPassword };
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
      const data = (await response.json()) as { user: { email: string } };
      setIsLoggedIn(true);
      setUserEmail(data.user.email);
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

  const handleStartDivination = () => {
    if (!question.trim()) return;
    setShowDivinationView(true);
    setIsDivinationActive(true);
  };

  const handleDivinationComplete = (result: LiuyaoResult | TarotResult, interpretation: DivinationInterpretation | null) => {
    if (isLoggedIn) {
      void loadRecords();
    }
  };

  const handleReset = () => {
    setShowDivinationView(false);
    setIsDivinationActive(false);
    setQuestion("");
  };

  const formatDate = () => {
    const now = new Date();
    return `${now.getFullYear()}.${String(now.getMonth() + 1).padStart(2, "0")}.${String(now.getDate()).padStart(2, "0")}`;
  };

  const formatRecordDate = (value: string) => value.replace("T", " ").slice(0, 16);

  const getRecordSummary = (record: DivinationRecord) => {
    const interpretation = record.interpretation;
    if (interpretation && typeof interpretation === "object" && "summary" in interpretation) {
      return interpretation.summary;
    }
    if (typeof interpretation === "string") return interpretation;
    return "";
  };

  const methodLabel = (m: DivinationMethod) => (m === "liuyao" ? t.methodLiuyao : t.methodTarot);

  return (
    <main>
      <div className="layout-container">
        {/* Header */}
        <header>
          <h1 className="serif">{t.appTitle}</h1>
          <div className="header-actions">
            <div className="lang-dropdown-container">
              <button 
                className="icon-btn" 
                onClick={() => setShowLangMenu(!showLangMenu)}
                aria-label="Select Language"
              >
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/>
                  <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
                </svg>
              </button>
              {showLangMenu && (
                <div className="lang-menu animate-fade-in">
                  <button className={lang === "zh" ? "active" : ""} onClick={() => { setLang("zh"); setShowLangMenu(false); }}>
                    中文
                  </button>
                  <button className={lang === "ja" ? "active" : ""} onClick={() => { setLang("ja"); setShowLangMenu(false); }}>
                    日本語
                  </button>
                  <button className={lang === "en" ? "active" : ""} onClick={() => { setLang("en"); setShowLangMenu(false); }}>
                    English
                  </button>
                </div>
              )}
            </div>
            <button onClick={toggleTheme} className="icon-btn" title="切换视觉风格">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="5"/>
                <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
              </svg>
            </button>
            {isLoggedIn ? (
              <button className="icon-btn" onClick={handleLogout} title={t.logout}>
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                  <circle cx="12" cy="7" r="4"/>
                </svg>
              </button>
            ) : (
              <button className="icon-btn" onClick={() => { setAuthMode("login"); setShowAuthModal(true); }} title={t.login}>
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                  <circle cx="12" cy="7" r="4"/>
                </svg>
              </button>
            )}
          </div>
        </header>

        {/* Main Content */}
        <div className={isDivinationActive ? "divination-active" : ""}>
          {/* Divination Section */}
          {!showDivinationView ? (
            <>
              {/* Daily Fortune Mini Card */}
              <section className="daily-mini glass">
                <div className="daily-mini-header">
                  <div className="sign-select-wrapper">
                    <select
                      className="sign-select-mini serif"
                      value={sign}
                      onChange={(e) => setSign(e.target.value as HoroscopeSign)}
                    >
                      {horoscopeSigns.map((s) => (
                        <option key={s} value={s}>
                          {t.signs?.[s] ?? s} ({signDateRanges[s]})
                        </option>
                      ))}
                    </select>
                  </div>
                  <span className="date-mini">{formatDate()}</span>
                </div>
                {isHoroscopeLoading ? (
                  <p className="daily-mini-text">{t.horoscopeLoading}</p>
                ) : horoscopeError ? (
                  <p className="daily-mini-text error">{horoscopeError}</p>
                ) : (
                  <>
                    <p className="daily-mini-text">{horoscope?.description || "-"}</p>
                    <div className="daily-mini-footer">
                      <div className="lucky-item">
                        <span className="color-dot" style={{ background: horoscope?.color || "#a5b4fc" }}></span>
                        <span>{t.luckyColor}：{horoscope?.color || "-"}</span>
                      </div>
                      <div className="lucky-item">
                        <span>{t.luckyTime}：{horoscope?.lucky_time || "-"}</span>
                      </div>
                    </div>
                  </>
                )}
              </section>

              {/* Today's Energy - Center Position */}
              <section className="energy-section">
                <span className="energy-dot"></span>
                <p className="energy-quote-center serif">"{t.dailyMessage}"</p>
              </section>

              {/* ChatGPT-style Input Bar */}
              <section className="input-bar-section">
                <div className="input-bar glass">
                  <textarea
                    className="input-textarea"
                    placeholder={t.ritualPlaceholder}
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey && question.trim()) {
                        e.preventDefault();
                        handleStartDivination();
                      }
                    }}
                    rows={1}
                  />
                  <div className="input-actions">
                    {/* Mode Toggle */}
                    <button 
                      className="input-action-btn"
                      onClick={() => setMode(mode === "ai" ? "manual" : "ai")}
                      title={mode === "ai" ? t.modeAi : t.modeManual}
                    >
                      {mode === "ai" ? (
                        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M12 2a2 2 0 0 1 2 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 0 1 7 7h1a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-1v1a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-1H2a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1h1a7 7 0 0 1 7-7h1V5.73c-.6-.34-1-.99-1-1.73a2 2 0 0 1 2-2z"/>
                          <circle cx="8" cy="14" r="1"/>
                          <circle cx="16" cy="14" r="1"/>
                        </svg>
                      ) : (
                        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M18 11V6a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v5"/>
                          <path d="M12 12v6"/>
                          <circle cx="12" cy="19" r="2"/>
                          <path d="M6 11a6 6 0 0 0 12 0"/>
                        </svg>
                      )}
                    </button>

                    {/* Method Selector */}
                    <button 
                      className="input-action-btn"
                      onClick={() => setShowMethodPicker(true)}
                      title={method === "tarot" ? t.methodTarot : t.methodLiuyao}
                    >
                      {method === "tarot" ? (
                        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="6" y="3" width="12" height="18" rx="2"/>
                          <circle cx="12" cy="12" r="2"/>
                        </svg>
                      ) : (
                        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M4 6h16M4 10h6m4 0h6M4 14h16M4 18h6m4 0h6"/>
                        </svg>
                      )}
                    </button>

                    {/* Send Button */}
                    <button
                      className="send-btn"
                      onClick={handleStartDivination}
                      disabled={!question.trim()}
                    >
                      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M5 12h14M12 5l7 7-7 7"/>
                      </svg>
                    </button>
                  </div>
                </div>
                <p className="input-hint">{t.ritualSubtitle}</p>
              </section>

              {/* Method Picker Modal */}
              {showMethodPicker && (
                <div className="method-picker-overlay" onClick={() => setShowMethodPicker(false)}>
                  <div className="method-picker animate-fade-in" onClick={(e) => e.stopPropagation()}>
                    <div className="method-picker-header">
                      <span>{t.methodLabel}</span>
                      <button className="close-btn" onClick={() => setShowMethodPicker(false)}>
                        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <line x1="18" y1="6" x2="6" y2="18"/>
                          <line x1="6" y1="6" x2="18" y2="18"/>
                        </svg>
                      </button>
                    </div>
                    <div className="method-picker-options">
                      <div 
                        className={`method-option ${method === "tarot" ? "active" : ""}`}
                        onClick={() => { setMethod("tarot"); setShowMethodPicker(false); }}
                      >
                        <div className="method-option-icon">
                          <svg viewBox="0 0 24 24" width="32" height="32">
                            <rect x="5" y="3" width="14" height="18" rx="2" className="icon-path" />
                            <circle cx="12" cy="12" r="3" className="icon-path" strokeDasharray="2 2" />
                            <path d="M12 7v2M12 15v2M8 12h2M14 12h2" className="icon-path" />
                          </svg>
                        </div>
                        <div className="method-option-content">
                          <div className="method-option-title">{t.methodTarot}</div>
                          <div className="method-option-desc">{t.tarotDesc}</div>
                        </div>
                      </div>
                      <div 
                        className={`method-option ${method === "liuyao" ? "active" : ""}`}
                        onClick={() => { setMethod("liuyao"); setShowMethodPicker(false); }}
                      >
                        <div className="method-option-icon">
                          <svg viewBox="0 0 24 24" width="32" height="32">
                            <path d="M4 6h16M4 10h7m2 0h7M4 14h16M4 18h7m2 0h7" className="icon-path" strokeWidth="2" />
                          </svg>
                        </div>
                        <div className="method-option-content">
                          <div className="method-option-title">{t.methodLiuyao}</div>
                          <div className="method-option-desc">{t.liuyaoDesc}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : (
            /* Divination View */
            <div className="divination-view-container">
              <DivinationView
                initialQuestion={question}
                initialMode={mode}
                initialMethod={method}
                onActiveChange={setIsDivinationActive}
                onComplete={handleDivinationComplete}
                onReset={handleReset}
              />
            </div>
          )}

          {/* Auth Sidebar - temporarily hidden until login is configured */}
          {/* 
          <aside className="auth-sidebar">
            <div className="auth-card">
              <p className="auth-desc">{t.recordingDesc}</p>
              {isLoggedIn ? (
                <div>
                  <div style={{ fontSize: "14px", opacity: 0.8, marginBottom: "8px" }}>{userEmail}</div>
                  <button
                    style={{ background: "none", border: "none", color: "var(--text-main)", opacity: 0.4, cursor: "pointer", fontSize: "12px" }}
                    onClick={handleLogout}
                  >
                    {t.logout}
                  </button>
                  {records.length > 0 && (
                    <div className="records-list">
                      {records.slice(0, 3).map((record) => {
                        const summary = getRecordSummary(record);
                        return (
                          <div key={record.id} className="record-item">
                            <div className="record-question">{record.question}</div>
                            <div className="record-meta">
                              {methodLabel(record.method)} · {formatRecordDate(record.created_at)}
                            </div>
                            {summary && <div className="record-summary">{summary}</div>}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              ) : (
                <button
                  className="auth-login-btn"
                  onClick={() => { setAuthMode("login"); setShowAuthModal(true); }}
                >
                  {t.login}
                </button>
              )}
            </div>
          </aside>
          */}
        </div>

        {/* Auth Modal */}
        {showAuthModal && (
          <div className="auth-modal">
            <div className="auth-backdrop" onClick={() => { setShowAuthModal(false); setAuthError(null); }} />
            <div className="auth-panel glass">
              <div className="auth-header">
                <h3 className="serif">{authMode === "login" ? t.authTitleLogin : t.authTitleRegister}</h3>
                <button className="auth-close-btn" onClick={() => { setShowAuthModal(false); setAuthError(null); }}>✕</button>
              </div>
              <p className="auth-hint">{t.authGuestHint}</p>
              <div className="auth-fields">
                <label className="auth-field">
                  <span>{t.email}</span>
                  <input
                    type="email"
                    value={authEmail}
                    onChange={(e) => setAuthEmail(e.target.value)}
                    placeholder={t.email}
                  />
                </label>
                <label className="auth-field">
                  <span>{t.password}</span>
                  <input
                    type="password"
                    value={authPassword}
                    onChange={(e) => setAuthPassword(e.target.value)}
                    placeholder={t.password}
                  />
                </label>
              </div>
              {authError && <div className="auth-error">{authError}</div>}
              <div className="auth-actions">
                <button className="btn-primary" onClick={handleAuthSubmit} disabled={isAuthLoading}>
                  {authMode === "login" ? t.authSubmitLogin : t.authSubmitRegister}
                </button>
                <button
                  className="auth-switch-btn"
                  onClick={() => { setAuthMode(authMode === "login" ? "register" : "login"); setAuthError(null); }}
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
