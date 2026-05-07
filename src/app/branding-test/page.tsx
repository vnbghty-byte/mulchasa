"use client";

import { useState, useEffect, useRef } from "react";
import { toPng } from "html-to-image";
import { PERSONAS, PersonaCharacter, type PersonaId, type PersonaInfo } from "./characters";

// ─── 질문 데이터 ───────────────────────────────────────────────
type QuestionOption = {
  id: string;
  emoji: string;
  label: string;
  desc: string;
};

type Question = {
  id: number;
  step: string;
  area: string;
  question: string;
  subtext: string;
  type: "single" | "multi" | "text_only";
  branch?: "all" | "B2C" | "B2B";
  options?: QuestionOption[];
  placeholder?: string;
};

const QUESTIONS: Question[] = [
  // ─── Q1: 타겟 결정 (분기점) ───
  {
    id: 1, step: "01", area: "타겟 결정",
    question: "누구에게 브랜딩하고 싶으신가요?",
    subtext: "이 선택에 따라 이후 질문이 달라집니다",
    type: "single", branch: "all",
    options: [
      { id: "B2C", emoji: "🏥", label: "환자 대상", desc: "병원에 오는 잠재 고객 · 일반인" },
      { id: "B2B", emoji: "📚", label: "동료 PT 대상", desc: "물리치료사 인플루언서 · 교육자" },
    ],
  },
  // ─── Q2~Q4: 공통 질문 ───
  {
    id: 2, step: "02", area: "전문 분야",
    question: "가장 자신 있는 영역은?",
    subtext: "임상에서 가장 많이 다루거나 즐거운 분야",
    type: "single", branch: "all",
    options: [
      { id: "manual", emoji: "🤲", label: "수기 치료", desc: "도수치료 · 연부조직 기법" },
      { id: "rehab", emoji: "🏋️", label: "운동 재활", desc: "메디컬 트레이닝 · 기능 회복" },
      { id: "edu", emoji: "📖", label: "교육·강의", desc: "지식 전달 · 후배 멘토링" },
      { id: "fusion", emoji: "✨", label: "융합형", desc: "여러 영역을 통합" },
    ],
  },
  {
    id: 3, step: "03", area: "세부 특화",
    question: "구체적인 특화 분야를 골라주세요",
    subtext: "복수 선택 가능 · 자유 추가 가능",
    type: "multi", branch: "all",
    options: [
      { id: "post_op", emoji: "🦴", label: "수술 후 재활", desc: "관절·척추 회복" },
      { id: "sports", emoji: "⚽", label: "스포츠 손상", desc: "선수·동호인" },
      { id: "senior", emoji: "👴", label: "시니어·노인성", desc: "낙상 예방·만성 질환" },
      { id: "office", emoji: "💼", label: "직장인 체형", desc: "거북목·허리·자세" },
      { id: "pedi", emoji: "🧒", label: "소아·발달", desc: "발달 재활" },
      { id: "womens", emoji: "🌸", label: "여성 건강", desc: "산전·산후·골반저" },
      { id: "pain", emoji: "⚡", label: "통증 케어", desc: "급·만성 통증" },
      { id: "well", emoji: "🌿", label: "예방·웰니스", desc: "건강 유지" },
    ],
    placeholder: "위에 없는 다른 특화 분야가 있다면 적어주세요 (선택)",
  },
  {
    id: 4, step: "04", area: "소통 스타일",
    question: "환자/동료와 소통할 때 나는?",
    subtext: "가장 가까운 유형 하나",
    type: "single", branch: "all",
    options: [
      { id: "analyst", emoji: "📊", label: "분석가형", desc: "데이터·논리적 설명" },
      { id: "empath", emoji: "🤝", label: "공감형", desc: "감정·신뢰 형성" },
      { id: "coach", emoji: "🔥", label: "코치형", desc: "강한 에너지·동기부여" },
      { id: "teacher", emoji: "📖", label: "교육자형", desc: "원리·메커니즘 가르침" },
    ],
  },
  // ─── Q5a: B2C 분기 ───
  {
    id: 5, step: "05", area: "보람 케이스",
    question: "가장 보람을 느꼈던 환자 케이스는?",
    subtext: "여러 개 선택 가능",
    type: "multi", branch: "B2C",
    options: [
      { id: "dramatic", emoji: "🌟", label: "극적 회복", desc: "걷지 못하던 분이 다시 걸을 때" },
      { id: "long_term", emoji: "🤝", label: "장기 관계", desc: "오래 함께한 환자 신뢰" },
      { id: "skeptic", emoji: "🎯", label: "의심 환자 설득", desc: "물리치료 효과 의심하던 분" },
      { id: "complex", emoji: "🧩", label: "복잡한 케이스", desc: "어려운 진단 해결" },
      { id: "young", emoji: "🌱", label: "젊은 환자", desc: "직장인·운동선수" },
      { id: "family", emoji: "💝", label: "가족까지 케어", desc: "환자 + 보호자 함께" },
    ],
  },
  // ─── Q5b: B2B 분기 ───
  {
    id: 5, step: "05", area: "인플루언서 유형",
    question: "어떤 인플루언서로 알려지고 싶나요?",
    subtext: "롤모델에 가까운 유형 하나",
    type: "single", branch: "B2B",
    options: [
      { id: "mentor", emoji: "🩺", label: "임상 멘토", desc: "후배에게 진짜 임상을 가르치는 선배" },
      { id: "lecturer", emoji: "📚", label: "교육 강사", desc: "오프라인·온라인 강의 전문" },
      { id: "curator", emoji: "🔬", label: "트렌드 큐레이터", desc: "논문·해외사례 정리·전파" },
      { id: "founder", emoji: "💼", label: "창업가형", desc: "스튜디오·클리닉 사례 공유" },
      { id: "creator", emoji: "📱", label: "SNS 크리에이터", desc: "릴스·유튜브 콘텐츠 메이커" },
      { id: "wellness", emoji: "🌿", label: "웰니스 코치", desc: "라이프스타일·예방 중심" },
    ],
  },
  // ─── Q6a: B2C 분기 ───
  {
    id: 6, step: "06", area: "환자 고민",
    question: "환자들이 가장 많이 묻는 고민은?",
    subtext: "구체적으로 적을수록 좋은 콘텐츠 아이디어가 나와요",
    type: "text_only", branch: "B2C",
    placeholder: "예: 수술 후 언제부터 운동해도 되나요? / 도수치료 받으면 다시 안 아파지나요? / 자세 교정은 얼마나 걸리나요?",
  },
  // ─── Q6b: B2B 분기 ───
  {
    id: 6, step: "06", area: "수익화 의향",
    question: "관심 있는 수익화 모델은?",
    subtext: "복수 선택 가능",
    type: "multi", branch: "B2B",
    options: [
      { id: "lecture", emoji: "🎤", label: "강의·세미나", desc: "오프라인·온라인" },
      { id: "book", emoji: "📕", label: "교재·전자책", desc: "지식 콘텐츠 판매" },
      { id: "consult", emoji: "💬", label: "1:1 컨설팅", desc: "후배·창업 멘토링" },
      { id: "product", emoji: "🛒", label: "제품·도구", desc: "공동구매·자체 브랜드" },
      { id: "collab", emoji: "🤝", label: "협업·광고", desc: "브랜드 컬래버" },
      { id: "membership", emoji: "🎫", label: "유료 멤버십", desc: "정기 구독 콘텐츠" },
    ],
  },
  // ─── Q7~Q9: 공통 ───
  {
    id: 7, step: "07", area: "콘텐츠 포맷",
    question: "끌리는 콘텐츠 포맷은?",
    subtext: "복수 선택 가능 · 트렌디한 포맷 위주",
    type: "multi", branch: "all",
    options: [
      { id: "card", emoji: "📇", label: "카드뉴스", desc: "정보 정리·인스타 슬라이드" },
      { id: "toon", emoji: "🎨", label: "인스타툰", desc: "그림+스토리텔링" },
      { id: "before_after", emoji: "📸", label: "전후비교", desc: "Before/After 사진·영상" },
      { id: "reels", emoji: "🎬", label: "릴스·숏폼", desc: "15~60초 영상" },
      { id: "tutorial", emoji: "▶️", label: "정보 영상", desc: "유튜브·심층 설명" },
      { id: "essay", emoji: "✍️", label: "공감 글", desc: "에세이·일기 형식" },
    ],
  },
  {
    id: 8, step: "08", area: "메인 채널",
    question: "주력하고 싶은 채널은?",
    subtext: "현재 가장 가능성 있는 한 곳",
    type: "single", branch: "all",
    options: [
      { id: "ig_reels", emoji: "🎬", label: "인스타 릴스", desc: "짧은 영상 중심" },
      { id: "ig_feed", emoji: "📷", label: "인스타 피드", desc: "이미지·카드뉴스" },
      { id: "youtube", emoji: "▶️", label: "유튜브", desc: "긴 호흡 영상" },
      { id: "blog", emoji: "✍️", label: "네이버 블로그", desc: "검색 유입·SEO" },
      { id: "kakao", emoji: "💬", label: "카카오 채널", desc: "기존 환자·구독자" },
    ],
  },
  {
    id: 9, step: "09", area: "브랜딩 목표",
    question: "한 줄로 표현한 브랜딩 목표는?",
    subtext: '"_____ 전문 물리치료사"의 빈칸을 채워보세요',
    type: "text_only", branch: "all",
    placeholder: "예: 무릎 수술 후 일상 복귀를 책임지는 / 직장인 허리 통증 해결사 / 후배 PT가 가장 신뢰하는...",
  },
];

const LOADING_STEPS = [
  "타겟 분석 중...",
  "전문성 매칭 중...",
  "어울리는 동물 찾는 중...",
  "페르소나 캐릭터 디자인 중...",
  "벤치마킹 사례 수집 중...",
  "수익화 전략 도출 중...",
  "함정 패턴 점검 중...",
  "최종 리포트 정리 중...",
];

// ─── 결과 파싱 ─────────────────────────────────────────────────
type Report = {
  personaId?: PersonaId;
  personaTitle?: string;
  strengths?: string;
  benchmark?: string;
  channel?: string;
  monetization?: string;
  pitfall?: string;
  bio?: string;
  action?: string;
  tagline?: string;
};

function parseReport(text: string): Report {
  const result: Report = {};

  // 페르소나 ID 추출
  const idMatch = text.match(/PERSONA_ID:\s*([a-z_]+)/i);
  if (idMatch) result.personaId = idMatch[1] as PersonaId;

  const sections = [
    { key: "personaTitle", emoji: "🎯", kw: ["페르소나", "타이틀"] },
    { key: "strengths", emoji: "💡", kw: ["강점", "차별화"] },
    { key: "benchmark", emoji: "🌟", kw: ["벤치마킹", "롤모델"] },
    { key: "channel", emoji: "📱", kw: ["채널", "콘텐츠"] },
    { key: "monetization", emoji: "💰", kw: ["수익화", "비즈니스"] },
    { key: "pitfall", emoji: "⚠️", kw: ["함정", "주의"] },
    { key: "bio", emoji: "✍️", kw: ["소개글", "바이오"] },
    { key: "action", emoji: "🚀", kw: ["액션", "실행"] },
    { key: "tagline", emoji: "✨", kw: ["메시지", "캐치프레이즈"] },
  ] as const;

  sections.forEach((s, i) => {
    const start = text.indexOf(s.emoji);
    if (start === -1) return;
    const next = sections[i + 1]?.emoji;
    const end = next && text.indexOf(next) > start ? text.indexOf(next) : text.length;
    let body = text.slice(start + s.emoji.length, end).trim();
    const lines = body.split(/\r?\n/);
    if (lines.length > 1) {
      const first = lines[0].trim();
      const isTitle = s.kw.some((k) => first.includes(k)) || first.length < 30;
      if (isTitle) body = lines.slice(1).join("\n").trim();
    }
    (result as any)[s.key] = body || "";
  });
  return result;
}

// ─── 볼드 마크다운 렌더링 ────────────────────────────────────
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
              pi % 2 === 1 ? (
                <strong key={pi} style={{ fontWeight: 700, color: "inherit" }}>{part}</strong>
              ) : (
                part
              )
            )}
            {li < lines.length - 1 && <br />}
          </span>
        );
      })}
    </div>
  );
}

// ─── MAIN ──────────────────────────────────────────────────────
export default function BrandingTestPage() {
  const [screen, setScreen] = useState<"intro" | "quiz" | "loading" | "result">("intro");
  const [currentQ, setCurrentQ] = useState(0);
  const [selections, setSelections] = useState<Record<number, string[]>>({});
  const [freeTexts, setFreeTexts] = useState<Record<number, string>>({});
  const [loadingStep, setLoadingStep] = useState(0);
  const [report, setReport] = useState<Report | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [animDir, setAnimDir] = useState<"forward" | "back">("forward");
  const [visible, setVisible] = useState(true);

  const reportRef = useRef<HTMLDivElement>(null);

  // 분기 적용된 질문 목록
  const target = selections[1]?.[0]; // B2C or B2B
  const filteredQuestions = QUESTIONS.filter(
    (q) => !q.branch || q.branch === "all" || q.branch === target
  );
  const q = filteredQuestions[currentQ];
  const sel = selections[q?.id] || [];
  const txt = freeTexts[q?.id] || "";
  const totalSteps = filteredQuestions.length;

  const canNext =
    q?.type === "text_only" ? txt.trim().length > 0 : sel.length > 0;

  useEffect(() => {
    if (screen !== "loading") return;
    const id = setInterval(() => setLoadingStep((p) => (p + 1) % LOADING_STEPS.length), 1100);
    return () => clearInterval(id);
  }, [screen]);

  function toggleOption(optId: string) {
    setSelections((prev) => {
      const cur = prev[q.id] || [];
      if (q.type === "single") return { ...prev, [q.id]: [optId] };
      return cur.includes(optId)
        ? { ...prev, [q.id]: cur.filter((x) => x !== optId) }
        : { ...prev, [q.id]: [...cur, optId] };
    });
  }

  function animateTo(fn: () => void) {
    setVisible(false);
    setTimeout(() => {
      fn();
      setVisible(true);
    }, 220);
  }

  function goNext() {
    if (currentQ < totalSteps - 1) {
      setAnimDir("forward");
      animateTo(() => setCurrentQ((p) => p + 1));
    } else {
      startAnalysis();
    }
  }

  function goPrev() {
    if (currentQ > 0) {
      setAnimDir("back");
      animateTo(() => setCurrentQ((p) => p - 1));
    }
  }

  async function startAnalysis() {
    setScreen("loading");
    setLoadingStep(0);
    try {
      const lines = filteredQuestions.map((q) => {
        const s = selections[q.id] || [];
        const opts = q.options
          ? s.map((id) => q.options?.find((o) => o.id === id)?.label).filter(Boolean).join(", ")
          : "";
        const free = freeTexts[q.id] || "";
        const parts = [opts, free].filter(Boolean).join(" / 추가: ");
        return `[${q.area}] ${parts || "(미입력)"}`;
      });

      const res = await fetch("/api/branding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userMessage: lines.join("\n") }),
      });
      const data = await res.json();
      const text = data.text || "";
      const parsed = parseReport(text);
      setReport(parsed);
      setTimeout(() => setScreen("result"), 600);
    } catch {
      setReport({ personaTitle: "분석 중 오류가 발생했습니다. 다시 시도해 주세요." });
      setTimeout(() => setScreen("result"), 600);
    }
  }

  async function handleDownload() {
    if (!reportRef.current) return;
    setDownloading(true);
    try {
      const dataUrl = await toPng(reportRef.current, {
        cacheBust: true,
        pixelRatio: 2,
        backgroundColor: "#F4F7F9",
      });
      const link = document.createElement("a");
      link.download = `mulchasa-branding-${report?.personaId || "result"}.png`;
      link.href = dataUrl;
      link.click();
    } catch (e) {
      alert("이미지 저장 중 오류가 발생했습니다.");
    } finally {
      setDownloading(false);
    }
  }

  const TEAL = "#0ABFA3";
  const TEAL_L = "#E6FAF7";
  const SLATE = "#1A2332";

  // 페르소나 정보 (결과 화면에서 사용)
  const persona: PersonaInfo | null = report?.personaId ? PERSONAS[report.personaId] : null;

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#F4F7F9",
        fontFamily: "'Apple SD Gothic Neo', 'Noto Sans KR', sans-serif",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        paddingBottom: "60px",
      }}
    >
      <style>{`
        @keyframes fadeUp { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
        @keyframes fadeSlide { from { opacity:0; transform:translateX(${animDir === "forward" ? "28px" : "-28px"}); } to { opacity:1; transform:translateX(0); } }
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

      {/* ── INTRO ── */}
      {screen === "intro" && (
        <div style={{ width: "100%", maxWidth: "540px", padding: "60px 24px 0", animation: "fadeUp .5s ease" }}>
          <div
            style={{
              background: TEAL, color: "#fff", display: "inline-block",
              borderRadius: "100px", padding: "4px 14px", fontSize: "11px",
              letterSpacing: "2px", textTransform: "uppercase",
              marginBottom: "28px", fontWeight: 700,
            }}
          >
            물찾사 · AI 브랜딩 검사
          </div>
          <h1 style={{ fontSize: "clamp(28px,6vw,42px)", fontWeight: 900, color: SLATE, lineHeight: 1.2, margin: "0 0 16px", letterSpacing: "-1px" }}>
            나만의 PT 페르소나를<br />찾아드려요
          </h1>
          <p style={{ fontSize: "15px", color: "#5A6A7E", lineHeight: 1.8, margin: "0 0 40px" }}>
            9가지 질문에 답하면 AI가 12가지 페르소나 중<br />
            <strong style={{ color: SLATE }}>당신과 가장 잘 맞는 캐릭터</strong>를 찾아드립니다.
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "44px" }}>
            {[
              { e: "🎯", t: "맞춤 페르소나 캐릭터" },
              { e: "💡", t: "강점·차별화 분석" },
              { e: "🌟", t: "벤치마킹 롤모델 추천" },
              { e: "💰", t: "수익화 전략 (B2B 타겟)" },
              { e: "⚠️", t: "피해야 할 함정" },
              { e: "✍️", t: "SNS 바이오 초안" },
            ].map((item, i) => (
              <div
                key={i}
                style={{
                  display: "flex", alignItems: "center", gap: "14px",
                  background: "#fff", borderRadius: "14px", padding: "12px 18px",
                  border: "1px solid #E8EDF2",
                }}
              >
                <span style={{ fontSize: "20px" }}>{item.e}</span>
                <span style={{ fontSize: "14px", color: "#3D4F63", fontWeight: 500 }}>{item.t}</span>
              </div>
            ))}
          </div>

          <button
            className="btn-primary"
            onClick={() => setScreen("quiz")}
            style={{
              width: "100%", background: TEAL, color: "#fff",
              border: "none", borderRadius: "16px", padding: "18px",
              fontSize: "16px", fontWeight: 800, cursor: "pointer",
              letterSpacing: "-0.3px", transition: "all .2s",
            }}
          >
            검사 시작하기 →
          </button>
          <p style={{ textAlign: "center", marginTop: "12px", fontSize: "12px", color: "#A8B5C4" }}>
            소요 시간 약 5~7분
          </p>
        </div>
      )}

      {/* ── QUIZ ── */}
      {screen === "quiz" && q && (
        <div style={{ width: "100%", maxWidth: "560px", padding: "40px 24px 0" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "32px" }}>
            <button
              className="btn-ghost"
              onClick={currentQ === 0 ? () => setScreen("intro") : goPrev}
              style={{
                background: "transparent", border: "1px solid #E0E7EF",
                borderRadius: "10px", padding: "8px 14px",
                fontSize: "13px", color: "#5A6A7E", cursor: "pointer", transition: "all .15s",
              }}
            >
              ← 이전
            </button>
            <div style={{ display: "flex", gap: "5px" }}>
              {filteredQuestions.map((_, i) => (
                <div
                  key={i}
                  style={{
                    width: i === currentQ ? "20px" : "6px",
                    height: "6px", borderRadius: "100px",
                    background: i < currentQ ? TEAL : i === currentQ ? TEAL : "#D8E2EC",
                    transition: "all .3s ease",
                    opacity: i < currentQ ? 0.4 : 1,
                  }}
                />
              ))}
            </div>
            <div style={{ fontSize: "13px", color: "#A8B5C4", fontWeight: 600 }}>
              {currentQ + 1} / {totalSteps}
            </div>
          </div>

          <div style={{ animation: visible ? `fadeSlide .25s ease` : "none", opacity: visible ? 1 : 0 }}>
            <div
              style={{
                background: "#fff", borderRadius: "24px", padding: "32px",
                border: "1px solid #E8EDF2",
                boxShadow: "0 4px 24px rgba(0,0,0,0.05)",
                marginBottom: "20px",
              }}
            >
              <div
                style={{
                  display: "inline-block", background: TEAL_L, color: TEAL,
                  borderRadius: "8px", padding: "4px 10px",
                  fontSize: "11px", fontWeight: 800, letterSpacing: "0.8px",
                  marginBottom: "16px",
                }}
              >
                {q.step} · {q.area}
              </div>
              <h2 style={{ fontSize: "20px", fontWeight: 800, color: SLATE, margin: "0 0 6px", lineHeight: 1.3, letterSpacing: "-0.5px" }}>
                {q.question}
              </h2>
              <p style={{ fontSize: "13px", color: "#8A98A8", margin: "0 0 24px" }}>{q.subtext}</p>

              {q.options && (
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: q.options.length > 4 ? "1fr 1fr" : "1fr 1fr",
                    gap: "10px",
                    marginBottom: q.placeholder ? "20px" : "0",
                  }}
                >
                  {q.options.map((opt) => {
                    const active = sel.includes(opt.id);
                    return (
                      <button
                        key={opt.id}
                        className="opt-card"
                        onClick={() => toggleOption(opt.id)}
                        style={{
                          background: active ? TEAL_L : "#F8FAFB",
                          border: `2px solid ${active ? TEAL : "#E8EDF2"}`,
                          borderRadius: "14px", padding: "14px",
                          cursor: "pointer", textAlign: "left",
                          transition: "all .18s ease",
                        }}
                      >
                        <div style={{ fontSize: "22px", marginBottom: "6px" }}>{opt.emoji}</div>
                        <div style={{ fontSize: "14px", fontWeight: 700, color: active ? TEAL : SLATE, marginBottom: "2px" }}>
                          {opt.label}
                        </div>
                        <div style={{ fontSize: "11px", color: active ? "#47B8A3" : "#9AAAB8", lineHeight: 1.4 }}>
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
                  onChange={(e) => setFreeTexts((prev) => ({ ...prev, [q.id]: e.target.value }))}
                  placeholder={q.placeholder}
                  style={{
                    width: "100%", background: "#F8FAFB",
                    border: "1.5px solid #E8EDF2", borderRadius: "12px",
                    padding: "14px", fontSize: "13px", color: SLATE,
                    lineHeight: 1.7, resize: "none", outline: "none",
                    transition: "border-color .2s",
                    marginTop: q.options ? "12px" : "0",
                  }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = TEAL)}
                  onBlur={(e) => (e.currentTarget.style.borderColor = "#E8EDF2")}
                />
              )}
            </div>

            <button
              className="btn-primary"
              onClick={goNext}
              disabled={!canNext}
              style={{
                width: "100%", background: canNext ? TEAL : "#D8E2EC",
                color: canNext ? "#fff" : "#A8B5C4",
                border: "none", borderRadius: "16px", padding: "17px",
                fontSize: "16px", fontWeight: 800,
                cursor: canNext ? "pointer" : "not-allowed",
                transition: "all .2s", letterSpacing: "-0.3px",
              }}
            >
              {currentQ === totalSteps - 1 ? "✦ 페르소나 분석하기" : "다음 →"}
            </button>
          </div>
        </div>
      )}

      {/* ── LOADING ── */}
      {screen === "loading" && (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100vh", gap: "32px", animation: "fadeUp .4s ease" }}>
          <div style={{ position: "relative", width: "80px", height: "80px" }}>
            <div style={{ position: "absolute", inset: 0, border: `3px solid ${TEAL_L}`, borderTop: `3px solid ${TEAL}`, borderRadius: "50%", animation: "spin 0.9s linear infinite" }} />
            <div style={{ position: "absolute", inset: "12px", border: `2px solid #E8EDF2`, borderBottom: `2px solid ${TEAL}`, borderRadius: "50%", animation: "spin 1.4s linear infinite reverse" }} />
          </div>
          <div style={{ textAlign: "center" }}>
            <p style={{ fontSize: "18px", fontWeight: 800, color: SLATE, margin: "0 0 8px", animation: "pulse 1.1s ease infinite" }}>
              {LOADING_STEPS[loadingStep]}
            </p>
            <p style={{ fontSize: "13px", color: "#A8B5C4", margin: 0 }}>
              AI가 당신의 페르소나를 찾고 있어요
            </p>
          </div>
          <div style={{ display: "flex", gap: "8px" }}>
            {LOADING_STEPS.map((_, i) => (
              <div key={i} style={{ width: "6px", height: "6px", borderRadius: "50%", background: i <= loadingStep ? TEAL : "#D8E2EC", transition: "background .3s" }} />
            ))}
          </div>
        </div>
      )}

      {/* ── RESULT ── */}
      {screen === "result" && report && (
        <div style={{ width: "100%", maxWidth: "600px", padding: "48px 24px 0", animation: "scaleIn .4s ease" }}>
          {/* 다운로드 캡처 영역 시작 */}
          <div ref={reportRef} style={{ background: "#F4F7F9", padding: "24px", borderRadius: "8px" }}>
            {/* 캐릭터 + 페르소나 헤더 */}
            {persona && (
              <div
                style={{
                  background: persona.cardBgColor,
                  borderRadius: "24px",
                  padding: "32px 24px",
                  marginBottom: "20px",
                  textAlign: "center",
                  border: `2px solid ${persona.cardAccentColor}33`,
                }}
              >
                <div style={{ fontSize: "11px", letterSpacing: "2px", color: persona.cardAccentColor, fontWeight: 800, marginBottom: "12px" }}>
                  당신의 PT 페르소나는
                </div>
                <div style={{ display: "flex", justifyContent: "center", marginBottom: "16px" }}>
                  <div style={{ background: persona.bgColor, borderRadius: "16px", padding: "0", overflow: "hidden", border: "2px solid #1A2332" }}>
                    <PersonaCharacter id={persona.id} size={240} />
                  </div>
                </div>
                <div style={{ fontSize: "13px", color: "#5A6A7E", marginBottom: "4px" }}>{persona.animal}</div>
                <h2 style={{ fontSize: "28px", fontWeight: 900, color: SLATE, margin: "0 0 8px", letterSpacing: "-0.5px" }}>
                  {persona.name}
                </h2>
                <p style={{ fontSize: "14px", color: "#5A6A7E", margin: 0, fontWeight: 500 }}>
                  {persona.description}
                </p>
              </div>
            )}

            {/* 결과 섹션들 */}
            {[
              { key: "personaTitle", emoji: "🎯", title: "맞춤 페르소나 분석", color: "#0ABFA3", bg: "#F0FDF9" },
              { key: "strengths", emoji: "💡", title: "핵심 강점 & 차별화", color: "#F59E0B", bg: "#FFFBEB" },
              { key: "benchmark", emoji: "🌟", title: "벤치마킹 추천", color: "#3B82F6", bg: "#EFF6FF" },
              { key: "channel", emoji: "📱", title: "채널 & 콘텐츠 전략", color: "#8B5CF6", bg: "#F5F3FF" },
              { key: "monetization", emoji: "💰", title: "수익화 로드맵", color: "#10B981", bg: "#ECFDF5" },
              { key: "pitfall", emoji: "⚠️", title: "피해야 할 함정", color: "#EF4444", bg: "#FFF5F5" },
              { key: "bio", emoji: "✍️", title: "SNS 바이오 초안", color: "#EC4899", bg: "#FDF2F8" },
              { key: "action", emoji: "🚀", title: "오늘의 액션 플랜", color: "#F97316", bg: "#FFF7ED" },
              { key: "tagline", emoji: "✨", title: "브랜딩 메시지", color: "#A855F7", bg: "#FAF5FF" },
            ].map(
              (s) =>
                (report as any)[s.key] && (
                  <div
                    key={s.key}
                    style={{
                      background: s.bg,
                      border: `1.5px solid ${s.color}22`,
                      borderLeft: `4px solid ${s.color}`,
                      borderRadius: "18px",
                      padding: "24px",
                      marginBottom: "16px",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
                      <span style={{ fontSize: "18px" }}>{s.emoji}</span>
                      <span style={{ fontSize: "11px", fontWeight: 800, letterSpacing: "1px", color: s.color, textTransform: "uppercase" }}>
                        {s.title}
                      </span>
                    </div>
                    <RichText
                      text={(report as any)[s.key]}
                      style={{ fontSize: "14px", lineHeight: 1.85, color: "#2D3748" }}
                    />
                  </div>
                )
            )}

            {/* 푸터 (이미지에 포함) */}
            <div style={{ textAlign: "center", padding: "20px 0 8px", color: "#A8B5C4", fontSize: "11px", letterSpacing: "1px" }}>
              물찾사 · AI 브랜딩 검사 결과
            </div>
          </div>
          {/* 다운로드 캡처 영역 끝 */}

          {/* 액션 버튼들 */}
          <div style={{ display: "flex", gap: "10px", paddingTop: "24px" }}>
            <button
              onClick={handleDownload}
              disabled={downloading}
              style={{
                flex: 1, background: TEAL, color: "#fff",
                border: "none", borderRadius: "14px", padding: "16px",
                fontSize: "14px", fontWeight: 800,
                cursor: downloading ? "wait" : "pointer",
                transition: "all .2s",
              }}
            >
              {downloading ? "이미지 저장 중..." : "📥 결과 이미지 저장"}
            </button>
            <button
              onClick={() => {
                setSelections({});
                setFreeTexts({});
                setCurrentQ(0);
                setReport(null);
                setScreen("intro");
              }}
              style={{
                background: "transparent", border: "1.5px solid #D8E2EC",
                color: "#8A98A8", borderRadius: "14px", padding: "16px 24px",
                fontSize: "14px", cursor: "pointer", transition: "all .2s",
              }}
            >
              다시 검사
            </button>
          </div>
        </div>
      )}
    </div>
  );
}