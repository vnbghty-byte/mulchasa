"use client";

import { useState, useEffect } from "react";

// ─── 질문 데이터 ───────────────────────────────────────────────
const QUESTIONS = [
  {
    id: 1,
    step: "01",
    area: "임상 & 스킬 선호도",
    question: "가장 자신 있거나 재미를 느끼는 분야를 골라주세요",
    subtext: "복수 선택 가능",
    type: "multi" as const,
    options: [
      { id: "manual", emoji: "🤲", label: "수기 치료", desc: "도수치료 · 연부조직 기법" },
      { id: "rehab",  emoji: "🏋️", label: "운동 재활", desc: "메디컬 트레이닝 · 기능 회복" },
      { id: "pain",   emoji: "⚡", label: "통증 케어", desc: "급·만성 통증 관리" },
      { id: "well",   emoji: "🌿", label: "예방 & 웰니스", desc: "체형 교정 · 건강 유지" },
    ],
    placeholder: "더 추가하고 싶은 분야나 특기가 있다면 적어주세요 (선택)",
  },
  {
    id: 2,
    step: "02",
    area: "타겟 환자군",
    question: "앞으로 전문적으로 파고들고 싶은 환자는?",
    subtext: "가장 보람을 느꼈던 케이스를 중심으로",
    type: "single" as const,
    options: [
      { id: "post_op",  emoji: "🦴", label: "수술 후 재활",    desc: "관절·척추 수술 회복" },
      { id: "sports",   emoji: "⚽", label: "스포츠 손상",      desc: "선수·동호인 부상 관리" },
      { id: "senior",   emoji: "👴", label: "시니어 & 노인성",  desc: "낙상 예방 · 만성 질환" },
      { id: "office",   emoji: "💼", label: "직장인 체형 교정", desc: "거북목·허리 · 자세 불균형" },
      { id: "pedi",     emoji: "🧒", label: "소아 & 발달",      desc: "발달 재활 · 성장기 케어" },
      { id: "womens",   emoji: "🌸", label: "여성 건강",        desc: "산전·산후 · 골반저 재활" },
    ],
    placeholder: "위 항목에 없는 환자군이 있다면 적어주세요 (선택)",
  },
  {
    id: 3,
    step: "03",
    area: "성향 & 소통 스타일",
    question: "환자와 소통할 때 나는 어떤 스타일인가요?",
    subtext: "가장 가까운 유형 하나를 선택",
    type: "single" as const,
    options: [
      { id: "analyst", emoji: "📊", label: "분석가형", desc: "데이터·검사 결과로 논리적으로 설명" },
      { id: "empath",  emoji: "🤝", label: "공감형",   desc: "감정·통증에 깊이 공감, 신뢰 형성" },
      { id: "coach",   emoji: "🔥", label: "코치형",   desc: "강한 에너지로 운동·목표 달성 견인" },
      { id: "teacher", emoji: "📖", label: "교육자형", desc: "원인·메커니즘을 쉽게 가르쳐 주는 스타일" },
    ],
    placeholder: "이 유형들이 아니라면 본인의 스타일을 직접 표현해 주세요 (선택)",
  },
  {
    id: 4,
    step: "04",
    area: "콘텐츠 채널",
    question: "꾸준히 해볼 수 있을 것 같은 채널은?",
    subtext: "완벽하지 않아도 됩니다. 가장 부담 적은 걸로",
    type: "single" as const,
    options: [
      { id: "blog",   emoji: "✍️", label: "블로그",          desc: "네이버·브런치 · 긴 호흡의 글쓰기" },
      { id: "reels",  emoji: "🎬", label: "인스타그램 릴스", desc: "15~60초 짧은 영상 · 비주얼 중심" },
      { id: "youtube",emoji: "▶️", label: "유튜브",          desc: "5~15분 심층 영상 · 채널 브랜딩" },
      { id: "thread", emoji: "💬", label: "카드뉴스 & 피드", desc: "인스타 · 카카오채널 · 정보 카드" },
    ],
    placeholder: "이미 운영 중인 채널이 있다면 알려주세요 (선택)",
  },
  {
    id: 5,
    step: "05",
    area: "나의 브랜딩 목표",
    question: "\"_____ 전문 물리치료사\"로 기억되고 싶어요",
    subtext: "빈칸에 들어갈 말을 직접 써주세요. 완벽하지 않아도 괜찮습니다",
    type: "text_only" as const,
    placeholder: "예: 무릎 수술 후 일상 복귀를 책임지는 / 직장인 허리 통증 해결사 / 시니어가 믿고 찾는...",
  },
];

const LOADING_STEPS = [
  "임상 강점 분석 중...",
  "타겟 환자군 매칭 중...",
  "소통 스타일 유형화 중...",
  "최적 채널 전략 도출 중...",
  "브랜딩 페르소나 완성 중...",
];

// ─── Helpers ───────────────────────────────────────────────────
function RichText({ text, style }: { text: string; style?: React.CSSProperties }) {
  if (!text) return null;
  const lines = text.split(/\r?\n/);
  return (
    <div style={style}>
      {lines.map((line, li) => {
        const parts = line.split(/\*\*(.+?)\*\*/g);
        return (
          <span key={li}>
            {parts.map((part, pi) =>
              pi % 2 === 1
                ? <strong key={pi} style={{ fontWeight: 700, color: "inherit" }}>{part}</strong>
                : part
            )}
            {li < lines.length - 1 && <br />}
          </span>
        );
      })}
    </div>
  );
}

function parseReport(text: string): Record<string, string> {
  const sections = [
    { key: "persona",   emoji: "🎯", titleKeywords: ["페르소나", "브랜딩 페르소나"] },
    { key: "strengths", emoji: "💡", titleKeywords: ["핵심 강점", "차별화"] },
    { key: "channel",   emoji: "📱", titleKeywords: ["채널", "콘텐츠"] },
    { key: "action",    emoji: "🚀", titleKeywords: ["액션 플랜", "실행"] },
    { key: "tagline",   emoji: "✨", titleKeywords: ["메시지", "한 줄 요약", "캐치프레이즈"] },
  ];
  const result: Record<string, string> = {};
  sections.forEach((s, i) => {
    const start = text.indexOf(s.emoji);
    if (start === -1) return;
    const nextEmoji = sections[i + 1]?.emoji;
    const end = nextEmoji && text.indexOf(nextEmoji) > start
      ? text.indexOf(nextEmoji)
      : text.length;

    let body = text.slice(start + s.emoji.length, end).trim();
    const lines = body.split(/\r?\n/);
    if (lines.length > 1) {
      const firstLine = lines[0].trim();
      const looksLikeTitle = s.titleKeywords.some(kw => firstLine.includes(kw)) || firstLine.length < 30;
      if (looksLikeTitle) body = lines.slice(1).join("\n").trim();
    } else {
      const looksLikeTitle = s.titleKeywords.some(kw => body.includes(kw));
      if (looksLikeTitle) body = "";
    }
    result[s.key] = body || "_(분석 결과를 불러오지 못했습니다. '다시 검사하기'를 시도해 주세요)_";
  });
  return result;
}

// ─── MAIN ──────────────────────────────────────────────────────
export default function BrandingTestPage() {
  const [screen, setScreen] = useState<"intro" | "quiz" | "loading" | "result">("intro");
  const [currentQ, setCurrentQ] = useState(0);
  const [selections, setSelections] = useState<Record<number, string[]>>({});
  const [freeTexts, setFreeTexts] = useState<Record<number, string>>({});
  const [loadingStep, setLoadingStep] = useState(0);
  const [report, setReport] = useState<Record<string, string> | null>(null);
  const [animDir, setAnimDir] = useState<"forward" | "back">("forward");
  const [visible, setVisible] = useState(true);

  const q = QUESTIONS[currentQ];
  const sel = selections[q?.id] || [];
  const txt = freeTexts[q?.id] || "";

  const canNext = q?.type === "text_only" ? txt.trim().length > 0 : sel.length > 0;

  useEffect(() => {
    if (screen !== "loading") return;
    const id = setInterval(() => setLoadingStep(p => (p + 1) % LOADING_STEPS.length), 1100);
    return () => clearInterval(id);
  }, [screen]);

  function toggleOption(optId: string) {
    setSelections(prev => {
      const cur = prev[q.id] || [];
      if (q.type === "single") return { ...prev, [q.id]: [optId] };
      return cur.includes(optId)
        ? { ...prev, [q.id]: cur.filter(x => x !== optId) }
        : { ...prev, [q.id]: [...cur, optId] };
    });
  }

  function animateTo(fn: () => void) {
    setVisible(false);
    setTimeout(() => { fn(); setVisible(true); }, 220);
  }

  function goNext() {
    if (currentQ < QUESTIONS.length - 1) {
      setAnimDir("forward");
      animateTo(() => setCurrentQ(p => p + 1));
    } else {
      startAnalysis();
    }
  }

  function goPrev() {
    if (currentQ > 0) {
      setAnimDir("back");
      animateTo(() => setCurrentQ(p => p - 1));
    }
  }

  async function startAnalysis() {
    setScreen("loading");
    setLoadingStep(0);
    try {
      const lines = QUESTIONS.map(q => {
        const s = selections[q.id] || [];
        const opts = q.options ? s.map(id => q.options?.find(o => o.id === id)?.label).filter(Boolean).join(", ") : "";
        const free = freeTexts[q.id] || "";
        const parts = [opts, free].filter(Boolean).join(" / 추가의견: ");
        return `[${q.area}] ${parts || "(미입력)"}`;
      });

      const res = await fetch("/api/branding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userMessage: lines.join("\n") }),
      });
      const data = await res.json();
      const text = data.text || "";
      setReport(parseReport(text));
      setTimeout(() => setScreen("result"), 600);
    } catch {
      setReport({ persona: "분석 중 오류가 발생했습니다. 다시 시도해 주세요." });
      setTimeout(() => setScreen("result"), 600);
    }
  }

  const TEAL = "#0ABFA3";
  const TEAL_L = "#E6FAF7";
  const SLATE = "#1A2332";

  return (
    <div style={{
      minHeight: "100vh",
      background: "#F4F7F9",
      fontFamily: "'Apple SD Gothic Neo', 'Noto Sans KR', sans-serif",
      display: "flex", flexDirection: "column", alignItems: "center",
      paddingBottom: "60px",
    }}>
      <style>{`
        @keyframes fadeUp { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
        @keyframes fadeSlide { from { opacity:0; transform:translateX(${animDir==="forward"?"28px":"-28px"}); } to { opacity:1; transform:translateX(0); } }
        @keyframes spin { to { transform:rotate(360deg); } }
        @keyframes pulse { 0%,100%{opacity:1;} 50%{opacity:0.4;} }
        @keyframes scaleIn { from{transform:scale(0.92);opacity:0;} to{transform:scale(1);opacity:1;} }
        .opt-card:hover { transform: translateY(-2px); }
        .btn-primary:hover { background: #09A98F !important; transform: translateY(-1px); }
        .btn-ghost:hover { background: #E8EDF2 !important; }
        * { -webkit-font-smoothing: antialiased; box-sizing: border-box; }
        textarea { font-family: inherit; }
        textarea::placeholder { color: #A8B5C4; }
      `}</style>

      {screen === "intro" && (
        <div style={{ width:"100%", maxWidth:"540px", padding:"60px 24px 0", animation:"fadeUp .5s ease" }}>
          <div style={{
            background: TEAL, color:"#fff",
            display:"inline-block", borderRadius:"100px",
            padding:"4px 14px", fontSize:"11px", letterSpacing:"2px",
            textTransform:"uppercase", marginBottom:"28px", fontWeight:700,
          }}>물찾사 · AI 브랜딩 검사</div>

          <h1 style={{ fontSize:"clamp(28px,6vw,42px)", fontWeight:900, color:SLATE, lineHeight:1.2, margin:"0 0 16px", letterSpacing:"-1px" }}>
            나만의 퍼스널<br/>브랜드를 찾아드려요
          </h1>
          <p style={{ fontSize:"15px", color:"#5A6A7E", lineHeight:1.8, margin:"0 0 40px" }}>
            5가지 질문에 답하면 AI가 당신의 강점을 분석해<br/>
            <strong style={{color:SLATE}}>최적의 브랜딩 컨셉과 채널 전략</strong>을 제안해 드립니다.
          </p>

          <div style={{ display:"flex", flexDirection:"column", gap:"10px", marginBottom:"44px" }}>
            {QUESTIONS.map((q, i) => (
              <div key={i} style={{
                display:"flex", alignItems:"center", gap:"14px",
                background:"#fff", borderRadius:"14px", padding:"14px 18px",
                border:"1px solid #E8EDF2",
              }}>
                <div style={{
                  width:"28px", height:"28px", borderRadius:"8px",
                  background:TEAL_L, color:TEAL,
                  display:"flex", alignItems:"center", justifyContent:"center",
                  fontSize:"12px", fontWeight:800, flexShrink:0,
                }}>{q.step}</div>
                <div>
                  <div style={{ fontSize:"11px", color:TEAL, fontWeight:700, letterSpacing:"0.5px" }}>{q.area}</div>
                  <div style={{ fontSize:"13px", color:"#3D4F63", fontWeight:500 }}>{q.question}</div>
                </div>
              </div>
            ))}
          </div>

          <button className="btn-primary" onClick={() => setScreen("quiz")} style={{
            width:"100%", background:TEAL, color:"#fff", border:"none",
            borderRadius:"16px", padding:"18px", fontSize:"16px", fontWeight:800,
            cursor:"pointer", letterSpacing:"-0.3px", transition:"all .2s",
          }}>
            검사 시작하기 →
          </button>
          <p style={{ textAlign:"center", marginTop:"12px", fontSize:"12px", color:"#A8B5C4" }}>
            소요 시간 약 3~5분
          </p>
        </div>
      )}

      {screen === "quiz" && (
        <div style={{ width:"100%", maxWidth:"560px", padding:"40px 24px 0" }}>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:"32px" }}>
            <button className="btn-ghost" onClick={currentQ === 0 ? () => setScreen("intro") : goPrev} style={{
              background:"transparent", border:"1px solid #E0E7EF",
              borderRadius:"10px", padding:"8px 14px",
              fontSize:"13px", color:"#5A6A7E", cursor:"pointer", transition:"all .15s",
            }}>← 이전</button>

            <div style={{ display:"flex", gap:"6px" }}>
              {QUESTIONS.map((_, i) => (
                <div key={i} style={{
                  width: i === currentQ ? "24px" : "8px",
                  height:"8px", borderRadius:"100px",
                  background: i < currentQ ? TEAL : i === currentQ ? TEAL : "#D8E2EC",
                  transition:"all .3s ease",
                  opacity: i < currentQ ? 0.4 : 1,
                }}/>
              ))}
            </div>

            <div style={{ fontSize:"13px", color:"#A8B5C4", fontWeight:600 }}>
              {currentQ + 1} / {QUESTIONS.length}
            </div>
          </div>

          <div style={{
            animation: visible ? `fadeSlide .25s ease` : "none",
            opacity: visible ? 1 : 0,
          }}>
            <div style={{
              background:"#fff", borderRadius:"24px", padding:"32px",
              border:"1px solid #E8EDF2",
              boxShadow:"0 4px 24px rgba(0,0,0,0.05)",
              marginBottom:"20px",
            }}>
              <div style={{
                display:"inline-block",
                background:TEAL_L, color:TEAL,
                borderRadius:"8px", padding:"4px 10px",
                fontSize:"11px", fontWeight:800, letterSpacing:"0.8px",
                marginBottom:"16px",
              }}>{q.step} · {q.area}</div>

              <h2 style={{ fontSize:"20px", fontWeight:800, color:SLATE, margin:"0 0 6px", lineHeight:1.3, letterSpacing:"-0.5px" }}>
                {q.question}
              </h2>
              <p style={{ fontSize:"13px", color:"#8A98A8", margin:"0 0 24px" }}>{q.subtext}</p>

              {q.options && (
                <div style={{
                  display:"grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap:"10px", marginBottom: q.placeholder ? "20px" : "0",
                }}>
                  {q.options.map(opt => {
                    const active = sel.includes(opt.id);
                    return (
                      <button key={opt.id} className="opt-card" onClick={() => toggleOption(opt.id)} style={{
                        background: active ? TEAL_L : "#F8FAFB",
                        border: `2px solid ${active ? TEAL : "#E8EDF2"}`,
                        borderRadius:"14px", padding:"14px",
                        cursor:"pointer", textAlign:"left",
                        transition:"all .18s ease",
                      }}>
                        <div style={{ fontSize:"22px", marginBottom:"6px" }}>{opt.emoji}</div>
                        <div style={{ fontSize:"14px", fontWeight:700, color: active ? TEAL : SLATE, marginBottom:"2px" }}>
                          {opt.label}
                        </div>
                        <div style={{ fontSize:"11px", color: active ? "#47B8A3" : "#9AAAB8", lineHeight:1.4 }}>
                          {opt.desc}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

              {q.placeholder && (
                <textarea
                  rows={q.type === "text_only" ? 4 : 2}
                  value={txt}
                  onChange={e => setFreeTexts(prev => ({ ...prev, [q.id]: e.target.value }))}
                  placeholder={q.placeholder}
                  style={{
                    width:"100%", background:"#F8FAFB",
                    border:"1.5px solid #E8EDF2", borderRadius:"12px",
                    padding:"14px", fontSize:"13px", color:SLATE,
                    lineHeight:1.7, resize:"none", outline:"none",
                    transition:"border-color .2s",
                    marginTop: q.options ? "12px" : "0",
                  }}
                  onFocus={e => e.currentTarget.style.borderColor = TEAL}
                  onBlur={e => e.currentTarget.style.borderColor = "#E8EDF2"}
                />
              )}
            </div>

            <button
              className="btn-primary"
              onClick={goNext}
              disabled={!canNext}
              style={{
                width:"100%", background: canNext ? TEAL : "#D8E2EC",
                color: canNext ? "#fff" : "#A8B5C4",
                border:"none", borderRadius:"16px", padding:"17px",
                fontSize:"16px", fontWeight:800, cursor: canNext ? "pointer" : "not-allowed",
                transition:"all .2s", letterSpacing:"-0.3px",
              }}
            >
              {currentQ === QUESTIONS.length - 1 ? "✦ 브랜딩 전략 분석하기" : "다음 →"}
            </button>
            {!canNext && q.type !== "text_only" && (
              <p style={{ textAlign:"center", marginTop:"10px", fontSize:"12px", color:"#C0CEDD" }}>
                하나 이상 선택해 주세요
              </p>
            )}
          </div>
        </div>
      )}

      {screen === "loading" && (
        <div style={{
          display:"flex", flexDirection:"column", alignItems:"center",
          justifyContent:"center", minHeight:"100vh", gap:"32px",
          animation:"fadeUp .4s ease",
        }}>
          <div style={{ position:"relative", width:"80px", height:"80px" }}>
            <div style={{
              position:"absolute", inset:0,
              border:`3px solid ${TEAL_L}`,
              borderTop:`3px solid ${TEAL}`,
              borderRadius:"50%",
              animation:"spin 0.9s linear infinite",
            }}/>
            <div style={{
              position:"absolute", inset:"12px",
              border:`2px solid #E8EDF2`,
              borderBottom:`2px solid ${TEAL}`,
              borderRadius:"50%",
              animation:"spin 1.4s linear infinite reverse",
            }}/>
          </div>

          <div style={{ textAlign:"center" }}>
            <p style={{
              fontSize:"18px", fontWeight:800, color:SLATE, margin:"0 0 8px",
              animation:"pulse 1.1s ease infinite",
            }}>
              {LOADING_STEPS[loadingStep]}
            </p>
            <p style={{ fontSize:"13px", color:"#A8B5C4", margin:0 }}>
              AI가 당신의 브랜딩 전략을 설계하고 있어요
            </p>
          </div>

          <div style={{ display:"flex", gap:"8px" }}>
            {LOADING_STEPS.map((_, i) => (
              <div key={i} style={{
                width:"6px", height:"6px", borderRadius:"50%",
                background: i <= loadingStep ? TEAL : "#D8E2EC",
                transition:"background .3s",
              }}/>
            ))}
          </div>
        </div>
      )}

      {screen === "result" && report && (
        <div style={{ width:"100%", maxWidth:"600px", padding:"48px 24px 0", animation:"scaleIn .4s ease" }}>
          <div style={{
            background:`linear-gradient(135deg, ${TEAL} 0%, #0CD4B3 100%)`,
            borderRadius:"24px", padding:"32px",
            marginBottom:"24px", textAlign:"center", color:"#fff",
          }}>
            <div style={{ fontSize:"32px", marginBottom:"12px" }}>🎉</div>
            <h2 style={{ fontSize:"22px", fontWeight:900, margin:"0 0 8px", letterSpacing:"-0.5px" }}>
              브랜딩 리포트 완성!
            </h2>
            <p style={{ fontSize:"13px", margin:0, opacity:0.85 }}>
              아래 전략을 바탕으로 오늘 바로 시작해 보세요
            </p>
          </div>

          {[
            { key:"persona",   emoji:"🎯", title:"브랜딩 페르소나",    border:"#0ABFA3", bg:"#F0FDF9" },
            { key:"strengths", emoji:"💡", title:"핵심 강점 & 차별화", border:"#F59E0B", bg:"#FFFBEB" },
            { key:"channel",   emoji:"📱", title:"채널 & 콘텐츠 전략", border:"#3B82F6", bg:"#EFF6FF" },
            { key:"action",    emoji:"🚀", title:"오늘의 액션 플랜",    border:"#EF4444", bg:"#FFF5F5" },
            { key:"tagline",   emoji:"✨", title:"나의 브랜딩 메시지",  border:"#8B5CF6", bg:"#F5F3FF" },
          ].map(s => report[s.key] && (
            <div key={s.key} style={{
              background:s.bg, border:`1.5px solid ${s.border}22`,
              borderLeft:`4px solid ${s.border}`,
              borderRadius:"18px", padding:"24px", marginBottom:"16px",
            }}>
              <div style={{ display:"flex", alignItems:"center", gap:"8px", marginBottom:"12px" }}>
                <span style={{ fontSize:"18px" }}>{s.emoji}</span>
                <span style={{ fontSize:"11px", fontWeight:800, letterSpacing:"1px", color:s.border, textTransform:"uppercase" }}>
                  {s.title}
                </span>
              </div>
              <RichText text={report[s.key]} style={{ fontSize:"14px", lineHeight:1.85, color:"#2D3748" }} />
            </div>
          ))}

          <div style={{ textAlign:"center", paddingTop:"12px" }}>
            <button className="btn-ghost" onClick={() => {
              setSelections({}); setFreeTexts({});
              setCurrentQ(0); setReport(null); setScreen("intro");
            }} style={{
              background:"transparent", border:"1.5px solid #D8E2EC",
              color:"#8A98A8", borderRadius:"12px", padding:"12px 28px",
              fontSize:"13px", cursor:"pointer", transition:"all .2s",
            }}>
              다시 검사하기
            </button>
          </div>
        </div>
      )}
    </div>
  );
}