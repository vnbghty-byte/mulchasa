"use client";

import { useState, useEffect, useRef } from "react";
import { toPng } from "html-to-image";
import {
  PERSONAS,
  PersonaCharacter,
  type PersonaId,
  type PersonaInfo,
} from "./characters";

// ─── 타입 정의 ────────────────────────────────────────────────
type QuestionOption = {
  id: string;
  emoji: string;
  label: string;
  desc: string;
};

type Question = {
  id: number;
  step: string;
  stage: string;
  stageNum: number;
  area: string;
  question: string;
  subtext: string;
  type: "single" | "multi" | "text_only";
  branch?: "all" | "B2C" | "B2B";
  options?: QuestionOption[];
  placeholder?: string;
};

// ─── 16문항 설문 데이터 ──────────────────────────────────────
const QUESTIONS: Question[] = [
  // ════════ 1단계: 타겟 (공통 4문항) ════════
  {
    id: 1, step: "01", stage: "🎯 1단계 · 나의 타겟", stageNum: 1,
    area: "타겟 결정",
    question: "내 콘텐츠가 가장 필요한 사람은 누구인가요?",
    subtext: "이 선택에 따라 이후 질문이 달라져요 ✨",
    type: "single", branch: "all",
    options: [
      { id: "B2C_patient", emoji: "🏥", label: "환자·일반 대중", desc: "통증·재활로 고민하는 사람들" },
      { id: "B2C_special", emoji: "🎯", label: "특수 목적 고객", desc: "다이어트·퍼포먼스·예방 등" },
      { id: "B2B", emoji: "🎓", label: "동료·후배 PT", desc: "성장하고 싶은 전문가들" },
    ],
  },
  {
    id: 2, step: "02", stage: "🎯 1단계 · 나의 타겟", stageNum: 1,
    area: "타겟 고민",
    question: "그들이 가장 힘들어하는 건 뭘까요?",
    subtext: "내가 해결해줄 수 있는 고민을 떠올려보세요",
    type: "single", branch: "B2C",
    options: [
      { id: "info_lack", emoji: "😰", label: "정보 부재", desc: "믿을 만한 정보를 어디서 얻어야 할지 몰라요" },
      { id: "find_pt", emoji: "😟", label: "전문가 찾기", desc: "어떤 PT를 찾아야 할지 모르겠어요" },
      { id: "no_time", emoji: "🏃", label: "시간·방법 부족", desc: "바빠서 건강 관리할 방법을 모르겠어요" },
    ],
  },
  {
    id: 2, step: "02", stage: "🎯 1단계 · 나의 타겟", stageNum: 1,
    area: "타겟 고민",
    question: "동료 PT들이 가장 힘들어하는 건 뭘까요?",
    subtext: "내가 해결해줄 수 있는 고민을 떠올려보세요",
    type: "single", branch: "B2B",
    options: [
      { id: "edu_lack", emoji: "📚", label: "교육 부족", desc: "임상에서 막히는 부분을 해결할 교육이 없어요" },
      { id: "career", emoji: "💸", label: "커리어·수익 정체", desc: "열심히 일하는데 성장이 느껴지지 않아요" },
      { id: "branding", emoji: "🌐", label: "브랜딩 시작 막막", desc: "SNS를 하고 싶은데 어디서 시작할지 몰라요" },
    ],
  },
  {
    id: 3, step: "03", stage: "🎯 1단계 · 나의 타겟", stageNum: 1,
    area: "콘텐츠 언어",
    question: "콘텐츠의 언어 스타일은 어떻게 하고 싶나요?",
    subtext: "내가 가장 자연스럽게 말할 수 있는 방식으로",
    type: "single", branch: "all",
    options: [
      { id: "casual", emoji: "💬", label: "쉽고 친근하게", desc: "전문 용어 없이 누구나 이해하는 일상어" },
      { id: "mixed", emoji: "🔀", label: "전문성 + 친근함", desc: "근거는 탄탄하게, 설명은 쉽게" },
      { id: "expert", emoji: "🔬", label: "하이레벨 전문가", desc: "논문·근거 기반 전문 용어 중심" },
    ],
  },
  {
    id: 4, step: "04", stage: "🎯 1단계 · 나의 타겟", stageNum: 1,
    area: "관계 목표",
    question: "팔로워와 궁극적으로 어떤 관계를 만들고 싶나요?",
    subtext: "브랜딩의 최종 형태를 상상해보세요",
    type: "single", branch: "all",
    options: [
      { id: "offline", emoji: "📍", label: "오프라인으로 직접 오게", desc: "지역 기반 · 내 공간으로 방문 유도" },
      { id: "online", emoji: "💻", label: "온라인으로 영향력 넓히기", desc: "시공간 관계없이 콘텐츠로 소통" },
      { id: "community", emoji: "🔥", label: "소수의 진짜 팬 커뮤니티", desc: "깊은 신뢰 기반 찐팬 중심" },
    ],
  },

  // ════════ 2단계: 강점 (B2C 분기) ════════
  {
    id: 5, step: "05", stage: "💡 2단계 · 나의 강점", stageNum: 2,
    area: "전문 분야",
    question: "임상에서 가장 자신 있고 깊게 파고든 분야는?",
    subtext: "지금까지 가장 많이 다뤄온 분야를 골라주세요",
    type: "single", branch: "B2C",
    options: [
      { id: "post_op", emoji: "🦴", label: "수술 후 재활", desc: "관절·척추 수술 회복" },
      { id: "chronic", emoji: "⚡", label: "만성 통증·체형 교정", desc: "허리·목·자세 불균형" },
      { id: "sports", emoji: "⚽", label: "스포츠·퍼포먼스", desc: "선수·운동 마니아" },
      { id: "neuro", emoji: "🧠", label: "신경계·특수 재활", desc: "뇌졸중·발달·특수 케어" },
    ],
  },
  {
    id: 6, step: "06", stage: "💡 2단계 · 나의 강점", stageNum: 2,
    area: "주요 고객군",
    question: "치료 시너지가 가장 잘 나는 고객군은?",
    subtext: "가장 보람을 느꼈던 환자들을 떠올려보세요",
    type: "single", branch: "B2C",
    options: [
      { id: "senior", emoji: "👴", label: "5060 액티브 시니어", desc: "건강하게 오래 살고 싶은 분들" },
      { id: "worker", emoji: "💼", label: "2030 직장인·학생", desc: "앉아서 생기는 통증·체형 고민" },
      { id: "athlete", emoji: "🏋️", label: "운동 마니아·아마추어 선수", desc: "부상 없이 더 잘하고 싶은 분들" },
    ],
  },

  // ════════ 2단계: 강점 (B2B 분기) ════════
  {
    id: 5, step: "05", stage: "💡 2단계 · 나의 강점", stageNum: 2,
    area: "인플루언서 유형",
    question: "동료 PT들에게 어떤 인플루언서로 알려지고 싶나요?",
    subtext: "5년 후 나를 상상해보세요",
    type: "single", branch: "B2B",
    options: [
      { id: "mentor", emoji: "🩺", label: "임상 멘토", desc: "실전 케이스·치료법을 나눠주는 선배" },
      { id: "educator", emoji: "📚", label: "교육 강사", desc: "체계적인 강의·교재로 지식을 전달하는 교육자" },
      { id: "curator", emoji: "🔬", label: "트렌드 큐레이터", desc: "최신 논문·해외 트렌드를 정리해주는 사람" },
      { id: "founder", emoji: "💼", label: "창업 멘토", desc: "스튜디오·클리닉 창업 노하우를 공유하는 선구자" },
    ],
  },
  {
    id: 6, step: "06", stage: "💡 2단계 · 나의 강점", stageNum: 2,
    area: "해결 강점",
    question: "동료 PT들이 힘들어하는 것 중 내가 잘 해결해줄 수 있는 건?",
    subtext: "솔직하게 나의 강점을 골라주세요",
    type: "single", branch: "B2B",
    options: [
      { id: "clinical", emoji: "🏆", label: "임상 실력·케이스 해결", desc: "어려운 환자 케이스를 풀어나가는 방법" },
      { id: "comm", emoji: "💬", label: "소통·설명 방법", desc: "환자에게 쉽게 설명하고 신뢰 얻는 방법" },
      { id: "money", emoji: "💰", label: "수익·커리어 성장", desc: "연봉·이직·창업·N잡 전략" },
      { id: "sns", emoji: "📱", label: "SNS·브랜딩 시작", desc: "어떻게 시작하고 운영하는지" },
    ],
  },

  // ════════ 3단계: 제작 스타일 (공통 4문항) ════════
  {
    id: 7, step: "07", stage: "📱 3단계 · 제작 스타일", stageNum: 3,
    area: "지도 스타일",
    question: "나만의 치료·지도 방식을 한 가지 고른다면?",
    subtext: "임상에서 가장 자연스럽게 나오는 스타일",
    type: "single", branch: "all",
    options: [
      { id: "one_on_one", emoji: "🤝", label: "1:1 밀착 케어형", desc: "한 사람에게 깊게 집중하는 스타일" },
      { id: "group", emoji: "👥", label: "그룹 리더형", desc: "여러 명을 함께 이끌고 에너지를 나누는 스타일" },
      { id: "system", emoji: "📋", label: "시스템·매뉴얼형", desc: "체계적인 프로그램과 문서로 관리하는 스타일" },
    ],
  },
  {
    id: 8, step: "08", stage: "📱 3단계 · 제작 스타일", stageNum: 3,
    area: "표현 방식",
    question: "생각을 표현할 때 가장 편한 방식은?",
    subtext: "억지로 하지 않아도 자연스럽게 나오는 방식",
    type: "single", branch: "all",
    options: [
      { id: "text", emoji: "✍️", label: "글", desc: "논리적으로 쓸 때 가장 잘 정리돼요" },
      { id: "image", emoji: "🖼️", label: "이미지·카드", desc: "시각적으로 보여주는 게 편해요" },
      { id: "video", emoji: "🎬", label: "영상·말", desc: "직접 보여주고 말할 때 자연스러워요" },
    ],
  },
  {
    id: 9, step: "09", stage: "📱 3단계 · 제작 스타일", stageNum: 3,
    area: "노출 범위",
    question: "얼굴·목소리 노출에 대해 어떻게 생각하세요?",
    subtext: "솔직하게 답할수록 더 맞는 전략이 나와요",
    type: "single", branch: "all",
    options: [
      { id: "full", emoji: "😊", label: "적극 노출", desc: "내 얼굴이 브랜드예요, 보여줄수록 좋아요" },
      { id: "partial", emoji: "🎙️", label: "부분 노출", desc: "목소리나 일부만 보여줘도 괜찮아요" },
      { id: "none", emoji: "📄", label: "비노출", desc: "정보·텍스트 중심으로 얼굴 없이 할래요" },
    ],
  },
  {
    id: 10, step: "10", stage: "📱 3단계 · 제작 스타일", stageNum: 3,
    area: "제작 패턴",
    question: "일주일에 콘텐츠에 투자할 수 있는 패턴은?",
    subtext: "현실적인 답변이 더 정확한 전략을 만들어요",
    type: "single", branch: "all",
    options: [
      { id: "daily", emoji: "⏰", label: "매일 틈틈이", desc: "출퇴근·쉬는 시간에 조금씩" },
      { id: "weekend", emoji: "🗓️", label: "주말 몰아치기", desc: "한 번에 여러 개 만들어 예약 발행" },
      { id: "routine", emoji: "📅", label: "정해진 요일 루틴", desc: "특정 요일에 집중해서 제작" },
    ],
  },

  // ════════ 4단계: 목표 (B2C 분기) ════════
  {
    id: 11, step: "11", stage: "🚀 4단계 · 나의 목표", stageNum: 4,
    area: "수익 모델",
    question: "브랜딩으로 가장 먼저 실현하고 싶은 수익 모델은?",
    subtext: "현실적으로 가장 끌리는 것을 골라주세요",
    type: "single", branch: "B2C",
    options: [
      { id: "offline_biz", emoji: "🏢", label: "내 공간 고객 유입", desc: "클리닉·스튜디오로 환자가 찾아오게" },
      { id: "digital", emoji: "📖", label: "지식 콘텐츠 판매", desc: "전자책·VOD·온라인 강의" },
      { id: "ad", emoji: "📸", label: "광고·협찬 크리에이터", desc: "건강 브랜드·기업 협업" },
      { id: "product", emoji: "🛒", label: "제품·공동구매", desc: "내 이름을 건 기구·용품 판매" },
    ],
  },
  {
    id: 12, step: "12", stage: "🚀 4단계 · 나의 목표", stageNum: 4,
    area: "직업 정체성",
    question: "브랜딩 여정의 끝에서 불리고 싶은 타이틀은?",
    subtext: "5년 후 나를 소개하는 한 줄",
    type: "single", branch: "B2C",
    options: [
      { id: "brand_owner", emoji: "👑", label: "내 이름을 건 브랜드 대표", desc: "○○ PT 하면 바로 떠오르는 사람" },
      { id: "educator", emoji: "🌱", label: "선한 영향력의 교육자", desc: "정보로 삶을 바꿔주는 사람" },
      { id: "community", emoji: "🌐", label: "커뮤니티 리더", desc: "같은 고민을 가진 사람들의 중심" },
    ],
  },

  // ════════ 4단계: 목표 (B2B 분기) ════════
  {
    id: 11, step: "11", stage: "🚀 4단계 · 나의 목표", stageNum: 4,
    area: "수익 모델",
    question: "브랜딩으로 가장 먼저 실현하고 싶은 수익 모델은?",
    subtext: "현실적으로 가장 끌리는 것을 골라주세요",
    type: "single", branch: "B2B",
    options: [
      { id: "lecture", emoji: "🎤", label: "강의·세미나", desc: "오프라인·온라인 유료 강의" },
      { id: "book", emoji: "📕", label: "교재·전자책", desc: "PT들을 위한 실전 가이드 판매" },
      { id: "consulting", emoji: "💬", label: "1:1 멘토링·컨설팅", desc: "커리어·임상 개인 코칭" },
      { id: "b2b", emoji: "🤝", label: "기업 협업·B2B 계약", desc: "병원·기업 전속 파트너십" },
    ],
  },
  {
    id: 12, step: "12", stage: "🚀 4단계 · 나의 목표", stageNum: 4,
    area: "직업 정체성",
    question: "브랜딩 여정의 끝에서 불리고 싶은 타이틀은?",
    subtext: "5년 후 나를 소개하는 한 줄",
    type: "single", branch: "B2B",
    options: [
      { id: "brand_owner", emoji: "👑", label: "PT 업계의 브랜드 오너", desc: "내 이름이 곧 기준이 되는 사람" },
      { id: "educator", emoji: "🌱", label: "후배에게 선한 영향력의 교육자", desc: "다음 세대 PT를 키우는 사람" },
      { id: "community", emoji: "🌐", label: "PT 커뮤니티 리더", desc: "함께 성장하는 문화를 만드는 사람" },
    ],
  },

  // ════════ 공통 마지막 4문항 ════════
  {
    id: 13, step: "13", stage: "🚀 4단계 · 나의 목표", stageNum: 4,
    area: "활동 비중",
    question: "이 활동의 비중을 어떻게 설정하고 싶나요?",
    subtext: "지금 현실적인 상황을 솔직하게 선택해주세요",
    type: "single", branch: "all",
    options: [
      { id: "nJob", emoji: "💰", label: "안전한 N잡 추가 수입", desc: "지금 직장 유지하며 부수입 만들기" },
      { id: "transition", emoji: "🎯", label: "목표 달성 후 전업 전환", desc: "궤도에 오르면 올인할 계획" },
      { id: "allin", emoji: "🔥", label: "지금 당장 올인", desc: "이미 마음의 결정이 섰어요" },
    ],
  },
  {
    id: 14, step: "14", stage: "🚀 4단계 · 나의 목표", stageNum: 4,
    area: "도구 수준",
    question: "현재 콘텐츠 제작 도구 활용 수준은?",
    subtext: "솔직하게 체크할수록 더 현실적인 전략이 나와요",
    type: "single", branch: "all",
    options: [
      { id: "basic", emoji: "📱", label: "스마트폰 기본 앱", desc: "사진 찍고 올리는 정도" },
      { id: "mid", emoji: "✂️", label: "편집 앱·자동 자막 활용", desc: "캡컷·브루 등 기본 편집 가능" },
      { id: "ai", emoji: "🤖", label: "AI 툴·영상 편집 적극 활용", desc: "챗GPT·미드저니 등 익숙하게 사용" },
    ],
  },
  {
    id: 15, step: "15", stage: "🚀 4단계 · 나의 목표", stageNum: 4,
    area: "필요 지원",
    question: "지금 당장 가장 필요한 도움은?",
    subtext: "이 부분을 결과 리포트에 집중 반영할게요",
    type: "single", branch: "all",
    options: [
      { id: "copy", emoji: "📢", label: "콘텐츠 기획·카피라이팅", desc: "뭘 어떻게 써야 할지 감이 없어요" },
      { id: "efficiency", emoji: "⚡", label: "AI·도구 활용 효율화", desc: "시간을 줄이고 싶어요" },
      { id: "business", emoji: "📊", label: "수익화·비즈니스 실무", desc: "세금·계약·플랫폼 운영이 막막해요" },
    ],
  },
  {
    id: 16, step: "16", stage: "🚀 4단계 · 나의 목표", stageNum: 4,
    area: "브랜딩 선언",
    question: "브랜딩 목표를 한 줄로 완성해주세요!",
    subtext: '"나는 _______ 전문 물리치료사로 기억되고 싶다"',
    type: "text_only", branch: "all",
    placeholder: "예: 수술 후 일상 복귀를 돕는 / 직장인 허리 통증 해결사 / 후배 PT가 가장 신뢰하는...",
  },
];

const STAGE_TRANSITIONS = [
  { stageNum: 2, message: "잘 하고 있어요! 이제 강점을 찾아볼게요 💡" },
  { stageNum: 3, message: "거의 절반 왔어요! 제작 스타일을 알아볼게요 📱" },
  { stageNum: 4, message: "마지막 단계예요! 목표를 설정해봐요 🚀" },
];

const LOADING_STEPS = [
  "타겟 분석 중...",
  "강점 매칭 중...",
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
  const idMatch = text.match(/PERSONA_ID:\s*([a-z_]+)/i);
  if (idMatch) result.personaId = idMatch[1] as PersonaId;

  const sections = [
    { key: "personaTitle", emoji: "🎯", kw: ["페르소나", "분석"] },
    { key: "strengths",    emoji: "💡", kw: ["강점", "차별화"] },
    { key: "benchmark",    emoji: "🌟", kw: ["벤치마킹", "롤모델"] },
    { key: "channel",      emoji: "📱", kw: ["채널", "콘텐츠"] },
    { key: "monetization", emoji: "💰", kw: ["수익화", "비즈니스"] },
    { key: "pitfall",      emoji: "⚠️", kw: ["함정", "주의"] },
    { key: "bio",          emoji: "✍️", kw: ["소개글", "바이오"] },
    { key: "action",       emoji: "🚀", kw: ["액션", "실행"] },
    { key: "tagline",      emoji: "✨", kw: ["메시지", "캐치프레이즈"] },
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
      if (s.kw.some((k) => first.includes(k)) || first.length < 30)
        body = lines.slice(1).join("\n").trim();
    }
    (result as any)[s.key] = body || "";
  });
  return result;
}

function RichText({ text, style }: { text: string; style?: React.CSSProperties }) {
  if (!text) return null;
  return (
    <div style={style}>
      {text.split(/\r?\n/).map((line, li, arr) => (
        <span key={li}>
          {line.split(/\*\*(.+?)\*\*/g).map((part, pi) =>
            pi % 2 === 1
              ? <strong key={pi} style={{ fontWeight: 700, color: "inherit" }}>{part}</strong>
              : part
          )}
          {li < arr.length - 1 && <br />}
        </span>
      ))}
    </div>
  );
}

// ─── 메인 컴포넌트 ─────────────────────────────────────────────
export default function BrandingTestPage() {
  const [screen, setScreen] = useState<"intro" | "stage_intro" | "quiz" | "loading" | "result">("intro");
  const [currentQ, setCurrentQ] = useState(0);
  const [selections, setSelections] = useState<Record<number, string[]>>({});
  const [freeTexts, setFreeTexts] = useState<Record<number, string>>({});
  const [loadingStep, setLoadingStep] = useState(0);
  const [report, setReport] = useState<Report | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [pendingStageNum, setPendingStageNum] = useState<number | null>(null);
  const [visible, setVisible] = useState(true);
  const [animDir, setAnimDir] = useState<"forward" | "back">("forward");
  const reportRef = useRef<HTMLDivElement>(null);

  // 분기 적용
  const target = selections[1]?.[0];
  const branch = target === "B2B" ? "B2B" : "B2C";

  const filteredQuestions = QUESTIONS.filter((q) => {
    if (!q.branch || q.branch === "all") return true;
    return q.branch === branch;
  }).reduce((acc: Question[], q) => {
    // id 중복 제거 (분기별 Q2, Q5, Q6, Q11, Q12 중 해당하는 것만)
    const exists = acc.find((x) => x.id === q.id && x.step === q.step);
    if (!exists) acc.push(q);
    return acc;
  }, []);

  const q = filteredQuestions[currentQ];
  const sel = selections[q?.id * 100 + currentQ] || [];
  const txt = freeTexts[q?.id * 100 + currentQ] || "";
  const totalSteps = filteredQuestions.length;
  const canNext = q?.type === "text_only" ? txt.trim().length > 0 : sel.length > 0;

  // 스테이지별 선택지 키 생성 (중복 id 대비 currentQ 포함)
  const selKey = q ? q.id * 100 + currentQ : 0;

  useEffect(() => {
    if (screen !== "loading") return;
    const id = setInterval(() => setLoadingStep((p) => (p + 1) % LOADING_STEPS.length), 1100);
    return () => clearInterval(id);
  }, [screen]);

  function toggleOption(optId: string) {
    setSelections((prev) => {
      const cur = prev[selKey] || [];
      if (q.type === "single") return { ...prev, [selKey]: [optId] };
      return cur.includes(optId)
        ? { ...prev, [selKey]: cur.filter((x) => x !== optId) }
        : { ...prev, [selKey]: [...cur, optId] };
    });
  }

  function animateTo(fn: () => void) {
    setVisible(false);
    setTimeout(() => { fn(); setVisible(true); }, 220);
  }

  function goNext() {
    if (currentQ < totalSteps - 1) {
      const nextQ = filteredQuestions[currentQ + 1];
      const transition = STAGE_TRANSITIONS.find((t) => t.stageNum === nextQ?.stageNum && q?.stageNum !== nextQ?.stageNum);
      if (transition) {
        setPendingStageNum(transition.stageNum);
        setScreen("stage_intro");
        return;
      }
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
      const lines = filteredQuestions.map((fq, idx) => {
        const key = fq.id * 100 + idx;
        const s = selections[key] || [];
        const opts = fq.options
          ? s.map((id) => fq.options?.find((o) => o.id === id)?.label).filter(Boolean).join(", ")
          : "";
        const free = freeTexts[key] || "";
        const parts = [opts, free].filter(Boolean).join(" / 추가: ");
        return `[${fq.stage} - ${fq.area}] ${parts || "(미입력)"}`;
      });

      const res = await fetch("/api/branding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userMessage: lines.join("\n") }),
      });
      const data = await res.json();
      setReport(parseReport(data.text || ""));
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
        cacheBust: true, pixelRatio: 2, backgroundColor: "#F4F7F9",
      });
      const link = document.createElement("a");
      link.download = `mulchasa-branding-${report?.personaId || "result"}.png`;
      link.href = dataUrl;
      link.click();
    } catch {
      alert("이미지 저장 중 오류가 발생했습니다.");
    } finally {
      setDownloading(false);
    }
  }

  const TEAL = "#0ABFA3";
  const TEAL_L = "#E6FAF7";
  const SLATE = "#1A2332";
  const persona: PersonaInfo | null = report?.personaId ? PERSONAS[report.personaId] : null;

  // 스테이지 색상
  const STAGE_COLORS: Record<number, { bg: string; accent: string; light: string }> = {
    1: { bg: "#FFF5F5", accent: "#EF4444", light: "#FFE5E5" },
    2: { bg: "#FFFBEB", accent: "#F59E0B", light: "#FEF3C7" },
    3: { bg: "#F0FDF9", accent: "#0ABFA3", light: "#CCFBF1" },
    4: { bg: "#EFF6FF", accent: "#3B82F6", light: "#DBEAFE" },
  };

  const currentStageColor = STAGE_COLORS[q?.stageNum || 1];

  return (
    <div style={{ minHeight: "100vh", background: "#F4F7F9", fontFamily: "'Apple SD Gothic Neo', 'Noto Sans KR', sans-serif", display: "flex", flexDirection: "column", alignItems: "center", paddingBottom: "60px" }}>
      <style>{`
        @keyframes fadeUp { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
        @keyframes fadeSlide { from { opacity:0; transform:translateX(${animDir === "forward" ? "28px" : "-28px"}); } to { opacity:1; transform:translateX(0); } }
        @keyframes spin { to { transform:rotate(360deg); } }
        @keyframes pulse { 0%,100%{opacity:1;} 50%{opacity:0.4;} }
        @keyframes scaleIn { from{transform:scale(0.92);opacity:0;} to{transform:scale(1);opacity:1;} }
        @keyframes bounceIn { 0%{transform:scale(0.8);opacity:0;} 70%{transform:scale(1.05);} 100%{transform:scale(1);opacity:1;} }
        .opt-card:hover { transform: translateY(-2px); box-shadow: 0 4px 16px rgba(0,0,0,0.08); }
        .btn-primary:hover { filter: brightness(0.92); transform: translateY(-1px); }
        .btn-ghost:hover { background: #E8EDF2 !important; }
        * { -webkit-font-smoothing: antialiased; box-sizing: border-box; }
        textarea::placeholder { color: #A8B5C4; }
      `}</style>

      {/* ── INTRO ── */}
      {screen === "intro" && (
        <div style={{ width: "100%", maxWidth: "540px", padding: "60px 24px 0", animation: "fadeUp .5s ease" }}>
          <div style={{ background: TEAL, color: "#fff", display: "inline-block", borderRadius: "100px", padding: "4px 14px", fontSize: "11px", letterSpacing: "2px", textTransform: "uppercase", marginBottom: "28px", fontWeight: 700 }}>
            물찾사 · AI 브랜딩 DNA 검사
          </div>
          <h1 style={{ fontSize: "clamp(28px,6vw,42px)", fontWeight: 900, color: SLATE, lineHeight: 1.2, margin: "0 0 16px", letterSpacing: "-1px" }}>
            나만의 PT 브랜딩<br />DNA를 찾아드려요 🧬
          </h1>
          <p style={{ fontSize: "15px", color: "#5A6A7E", lineHeight: 1.8, margin: "0 0 40px" }}>
            4단계 16문항으로 분석하는<br />
            <strong style={{ color: SLATE }}>나만의 브랜딩 전략 리포트</strong>
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "32px" }}>
            {[
              { num: "01", label: "🎯 타겟 설정", desc: "누구에게 말할 건가요?" },
              { num: "02", label: "💡 강점 발견", desc: "나만의 무기는 뭔가요?" },
              { num: "03", label: "📱 제작 스타일", desc: "어떻게 표현할 건가요?" },
              { num: "04", label: "🚀 목표 설정", desc: "어떤 결과를 만들 건가요?" },
            ].map((s) => (
              <div key={s.num} style={{ display: "flex", alignItems: "center", gap: "14px", background: "#fff", borderRadius: "14px", padding: "14px 18px", border: "1px solid #E8EDF2" }}>
                <div style={{ width: "32px", height: "32px", borderRadius: "10px", background: TEAL_L, color: TEAL, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", fontWeight: 800, flexShrink: 0 }}>{s.num}</div>
                <div>
                  <div style={{ fontSize: "13px", fontWeight: 700, color: SLATE }}>{s.label}</div>
                  <div style={{ fontSize: "11px", color: "#8A98A8" }}>{s.desc}</div>
                </div>
              </div>
            ))}
          </div>

          <button className="btn-primary" onClick={() => setScreen("quiz")} style={{ width: "100%", background: TEAL, color: "#fff", border: "none", borderRadius: "16px", padding: "18px", fontSize: "16px", fontWeight: 800, cursor: "pointer", letterSpacing: "-0.3px", transition: "all .2s" }}>
            브랜딩 DNA 검사 시작하기 →
          </button>
          <p style={{ textAlign: "center", marginTop: "12px", fontSize: "12px", color: "#A8B5C4" }}>소요 시간 약 5~7분</p>
        </div>
      )}

      {/* ── 단계 전환 카드 ── */}
      {screen === "stage_intro" && (
        <div style={{ width: "100%", maxWidth: "540px", padding: "80px 24px 0", textAlign: "center", animation: "bounceIn .4s ease" }}>
          {(() => {
            const sc = STAGE_COLORS[pendingStageNum || 2];
            const msg = STAGE_TRANSITIONS.find((t) => t.stageNum === pendingStageNum);
            return (
              <div style={{ background: sc.bg, borderRadius: "28px", padding: "48px 32px", border: `2px solid ${sc.light}` }}>
                <div style={{ fontSize: "52px", marginBottom: "20px" }}>
                  {pendingStageNum === 2 ? "💡" : pendingStageNum === 3 ? "📱" : "🚀"}
                </div>
                <div style={{ fontSize: "13px", color: sc.accent, fontWeight: 700, letterSpacing: "1.5px", textTransform: "uppercase", marginBottom: "12px" }}>
                  STEP {pendingStageNum} / 4
                </div>
                <p style={{ fontSize: "20px", fontWeight: 800, color: SLATE, margin: "0 0 32px", lineHeight: 1.4 }}>
                  {msg?.message}
                </p>
                <button
                  onClick={() => {
                    setCurrentQ((p) => p + 1);
                    setScreen("quiz");
                    setVisible(true);
                  }}
                  style={{ background: sc.accent, color: "#fff", border: "none", borderRadius: "14px", padding: "14px 40px", fontSize: "15px", fontWeight: 800, cursor: "pointer" }}
                >
                  계속하기 →
                </button>
              </div>
            );
          })()}
        </div>
      )}

      {/* ── QUIZ ── */}
      {screen === "quiz" && q && (
        <div style={{ width: "100%", maxWidth: "560px", padding: "40px 24px 0" }}>
          {/* 상단 네비 */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "24px" }}>
            <button className="btn-ghost" onClick={currentQ === 0 ? () => setScreen("intro") : goPrev} style={{ background: "transparent", border: "1px solid #E0E7EF", borderRadius: "10px", padding: "8px 14px", fontSize: "13px", color: "#5A6A7E", cursor: "pointer", transition: "all .15s" }}>
              ← 이전
            </button>
            <div style={{ display: "flex", gap: "4px" }}>
              {filteredQuestions.map((_, i) => (
                <div key={i} style={{ width: i === currentQ ? "20px" : "5px", height: "5px", borderRadius: "100px", background: i < currentQ ? TEAL : i === currentQ ? TEAL : "#D8E2EC", transition: "all .3s ease", opacity: i < currentQ ? 0.4 : 1 }} />
              ))}
            </div>
            <div style={{ fontSize: "12px", color: "#A8B5C4", fontWeight: 600 }}>{currentQ + 1} / {totalSteps}</div>
          </div>

          {/* 스테이지 배지 */}
          <div style={{ marginBottom: "12px" }}>
            <span style={{ background: currentStageColor?.light, color: currentStageColor?.accent, borderRadius: "100px", padding: "4px 12px", fontSize: "11px", fontWeight: 700 }}>
              {q.stage}
            </span>
          </div>

          {/* 질문 카드 */}
          <div style={{ animation: visible ? `fadeSlide .25s ease` : "none", opacity: visible ? 1 : 0 }}>
            <div style={{ background: "#fff", borderRadius: "24px", padding: "28px", border: "1px solid #E8EDF2", boxShadow: "0 4px 24px rgba(0,0,0,0.05)", marginBottom: "20px" }}>
              <h2 style={{ fontSize: "20px", fontWeight: 800, color: SLATE, margin: "0 0 6px", lineHeight: 1.3, letterSpacing: "-0.5px" }}>
                {q.question}
              </h2>
              <p style={{ fontSize: "13px", color: "#8A98A8", margin: "0 0 24px" }}>{q.subtext}</p>

              {q.options && (
                <div style={{ display: "grid", gridTemplateColumns: q.options.length <= 3 ? "1fr" : "1fr 1fr", gap: "10px", marginBottom: q.placeholder ? "16px" : "0" }}>
                  {q.options.map((opt) => {
                    const active = sel.includes(opt.id);
                    return (
                      <button key={opt.id} className="opt-card" onClick={() => toggleOption(opt.id)} style={{ background: active ? TEAL_L : "#F8FAFB", border: `2px solid ${active ? TEAL : "#E8EDF2"}`, borderRadius: "14px", padding: "14px", cursor: "pointer", textAlign: "left", transition: "all .18s ease" }}>
                        <div style={{ fontSize: "20px", marginBottom: "6px" }}>{opt.emoji}</div>
                        <div style={{ fontSize: "14px", fontWeight: 700, color: active ? TEAL : SLATE, marginBottom: "2px" }}>{opt.label}</div>
                        <div style={{ fontSize: "11px", color: active ? "#47B8A3" : "#9AAAB8", lineHeight: 1.4 }}>{opt.desc}</div>
                      </button>
                    );
                  })}
                </div>
              )}

              {q.placeholder && (
                <textarea
                  rows={4}
                  value={txt}
                  onChange={(e) => setFreeTexts((prev) => ({ ...prev, [selKey]: e.target.value }))}
                  placeholder={q.placeholder}
                  style={{ width: "100%", background: "#F8FAFB", border: "1.5px solid #E8EDF2", borderRadius: "12px", padding: "14px", fontSize: "13px", color: SLATE, lineHeight: 1.7, resize: "none", outline: "none", transition: "border-color .2s", fontFamily: "inherit", marginTop: q.options ? "12px" : "0" }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = TEAL)}
                  onBlur={(e) => (e.currentTarget.style.borderColor = "#E8EDF2")}
                />
              )}
            </div>

            <button className="btn-primary" onClick={goNext} disabled={!canNext} style={{ width: "100%", background: canNext ? TEAL : "#D8E2EC", color: canNext ? "#fff" : "#A8B5C4", border: "none", borderRadius: "16px", padding: "17px", fontSize: "16px", fontWeight: 800, cursor: canNext ? "pointer" : "not-allowed", transition: "all .2s" }}>
              {currentQ === totalSteps - 1 ? "✦ 나의 브랜딩 DNA 분석하기" : "다음 →"}
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
            <p style={{ fontSize: "18px", fontWeight: 800, color: SLATE, margin: "0 0 8px", animation: "pulse 1.1s ease infinite" }}>{LOADING_STEPS[loadingStep]}</p>
            <p style={{ fontSize: "13px", color: "#A8B5C4", margin: 0 }}>AI가 당신의 브랜딩 DNA를 분석하고 있어요</p>
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
          <div ref={reportRef} style={{ background: "#F4F7F9", padding: "24px", borderRadius: "8px" }}>
            {/* 캐릭터 헤더 */}
            {persona && (
              <div style={{ background: persona.cardBgColor, borderRadius: "24px", padding: "32px 24px", marginBottom: "20px", textAlign: "center", border: `2px solid ${persona.cardAccentColor}33` }}>
                <div style={{ fontSize: "11px", letterSpacing: "2px", color: persona.cardAccentColor, fontWeight: 800, marginBottom: "12px" }}>당신의 PT 브랜딩 DNA는</div>
                <div style={{ display: "flex", justifyContent: "center", marginBottom: "16px" }}>
                  <div style={{ background: persona.bgColor, borderRadius: "16px", overflow: "hidden", border: "2px solid #1A2332" }}>
                    <PersonaCharacter id={persona.id} size={240} />
                  </div>
                </div>
                <div style={{ fontSize: "13px", color: "#5A6A7E", marginBottom: "4px" }}>{persona.animal}</div>
                <h2 style={{ fontSize: "28px", fontWeight: 900, color: SLATE, margin: "0 0 8px", letterSpacing: "-0.5px" }}>{persona.name}</h2>
                <p style={{ fontSize: "14px", color: "#5A6A7E", margin: 0, fontWeight: 500 }}>{persona.description}</p>
              </div>
            )}

            {/* 결과 섹션들 */}
            {[
              { key: "personaTitle", emoji: "🎯", title: "맞춤 페르소나 분석",  color: "#0ABFA3", bg: "#F0FDF9" },
              { key: "strengths",    emoji: "💡", title: "핵심 강점 & 차별화",  color: "#F59E0B", bg: "#FFFBEB" },
              { key: "benchmark",    emoji: "🌟", title: "벤치마킹 추천",        color: "#3B82F6", bg: "#EFF6FF" },
              { key: "channel",      emoji: "📱", title: "채널 & 콘텐츠 전략",  color: "#8B5CF6", bg: "#F5F3FF" },
              { key: "monetization", emoji: "💰", title: "수익화 로드맵",        color: "#10B981", bg: "#ECFDF5" },
              { key: "pitfall",      emoji: "⚠️", title: "피해야 할 함정",       color: "#EF4444", bg: "#FFF5F5" },
              { key: "bio",          emoji: "✍️", title: "SNS 바이오 초안",      color: "#EC4899", bg: "#FDF2F8" },
              { key: "action",       emoji: "🚀", title: "오늘의 액션 플랜",     color: "#F97316", bg: "#FFF7ED" },
              { key: "tagline",      emoji: "✨", title: "나의 브랜딩 메시지",   color: "#A855F7", bg: "#FAF5FF" },
            ].map((s) =>
              (report as any)[s.key] && (
                <div key={s.key} style={{ background: s.bg, border: `1.5px solid ${s.color}22`, borderLeft: `4px solid ${s.color}`, borderRadius: "18px", padding: "24px", marginBottom: "16px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
                    <span style={{ fontSize: "18px" }}>{s.emoji}</span>
                    <span style={{ fontSize: "11px", fontWeight: 800, letterSpacing: "1px", color: s.color, textTransform: "uppercase" }}>{s.title}</span>
                  </div>
                  <RichText text={(report as any)[s.key]} style={{ fontSize: "14px", lineHeight: 1.85, color: "#2D3748" }} />
                </div>
              )
            )}
            <div style={{ textAlign: "center", padding: "20px 0 8px", color: "#A8B5C4", fontSize: "11px", letterSpacing: "1px" }}>
              물찾사 · AI 브랜딩 DNA 검사 결과
            </div>
          </div>

          {/* 액션 버튼 */}
          <div style={{ display: "flex", gap: "10px", paddingTop: "24px" }}>
            <button onClick={handleDownload} disabled={downloading} style={{ flex: 1, background: TEAL, color: "#fff", border: "none", borderRadius: "14px", padding: "16px", fontSize: "14px", fontWeight: 800, cursor: downloading ? "wait" : "pointer", transition: "all .2s" }}>
              {downloading ? "저장 중..." : "📥 결과 이미지 저장"}
            </button>
            <button onClick={() => { setSelections({}); setFreeTexts({}); setCurrentQ(0); setReport(null); setScreen("intro"); }} style={{ background: "transparent", border: "1.5px solid #D8E2EC", color: "#8A98A8", borderRadius: "14px", padding: "16px 24px", fontSize: "14px", cursor: "pointer", transition: "all .2s" }}>
              다시 검사
            </button>
          </div>
        </div>
      )}
    </div>
  );
}