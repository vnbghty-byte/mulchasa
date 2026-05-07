"use client";

// ─── 페르소나 타입 정의 ─────────────────────────────────────
export type PersonaId =
  | "clinical_mentor"      // 🐶 비숑 - 임상 멘토
  | "active_coach"         // 🐯 호랑이 - 액티브 코치
  | "recovery_guide"       // 🦴 거북이 - 회복 가이드
  | "senior_companion"     // 👴 코끼리 - 시니어 동반자
  | "posture_master"       // 💼 기린 - 자세 마스터
  | "women_health"         // 🌸 백조 - 여성 건강
  | "education_master"     // 🦉 부엉이 - 교육 강사
  | "pain_healer"          // 🐻 곰 - 공감 치유사
  | "trend_curator"        // 🐧 펭귄 - 트렌드 큐레이터
  | "founder_pt"           // 🦁 사자 - 창업가형 PT
  | "content_creator"      // 📱 플라밍고 - SNS 크리에이터
  | "wellness_coach";      // 🐰 토끼 - 웰니스 코치

export interface PersonaInfo {
  id: PersonaId;
  name: string;
  animal: string;
  description: string;
  target: "B2C" | "B2B";
  glassesColor: string;     // 안경 테두리 색
  bgColor: string;           // 캐릭터 배경색
  cardBgColor: string;       // 카드 배경색
  cardAccentColor: string;   // 강조 색
}

// ─── 12개 페르소나 데이터 ───────────────────────────────────
export const PERSONAS: Record<PersonaId, PersonaInfo> = {
  clinical_mentor: {
    id: "clinical_mentor", name: "임상 멘토", animal: "🐶 비숑",
    description: "임상 교육·후배 멘토링 · 든든한 선배",
    target: "B2B", glassesColor: "#0ABFA3",
    bgColor: "#D6D8E1", cardBgColor: "#F0FDF9", cardAccentColor: "#0ABFA3",
  },
  active_coach: {
    id: "active_coach", name: "액티브 코치", animal: "🐯 호랑이",
    description: "스포츠 손상·기능 회복 · 에너지 넘침",
    target: "B2C", glassesColor: "#FF6B7A",
    bgColor: "#E2D8D8", cardBgColor: "#FFF5F5", cardAccentColor: "#EF4444",
  },
  recovery_guide: {
    id: "recovery_guide", name: "회복 가이드", animal: "🦴 거북이",
    description: "수술/부상 후 재활 · 차분한 신뢰감",
    target: "B2C", glassesColor: "#3B82F6",
    bgColor: "#D6D8E1", cardBgColor: "#EFF6FF", cardAccentColor: "#3B82F6",
  },
  senior_companion: {
    id: "senior_companion", name: "시니어 동반자", animal: "👴 코끼리",
    description: "노인성 질환·낙상 예방 · 따뜻한 케어",
    target: "B2C", glassesColor: "#C9A876",
    bgColor: "#E2D8D8", cardBgColor: "#FEFAEC", cardAccentColor: "#B59647",
  },
  posture_master: {
    id: "posture_master", name: "자세 마스터", animal: "💼 기린",
    description: "직장인 체형 교정 · 분석적 접근",
    target: "B2C", glassesColor: "#A78BFA",
    bgColor: "#D6D8E1", cardBgColor: "#F5F3FF", cardAccentColor: "#7C3AED",
  },
  women_health: {
    id: "women_health", name: "여성 건강 케어러", animal: "🌸 백조",
    description: "산전·산후·골반저 · 우아한 케어",
    target: "B2C", glassesColor: "#FFB5C9",
    bgColor: "#E2D8D8", cardBgColor: "#FFF1F5", cardAccentColor: "#DB2777",
  },
  education_master: {
    id: "education_master", name: "교육 강사", animal: "🦉 부엉이",
    description: "강의·교재·콘텐츠 · 똑똑한 지식 전달",
    target: "B2B", glassesColor: "#F0C957",
    bgColor: "#D6D8E1", cardBgColor: "#FFFBEB", cardAccentColor: "#F59E0B",
  },
  pain_healer: {
    id: "pain_healer", name: "통증 공감 치유사", animal: "🐻 곰",
    description: "급·만성 통증 · 마음까지 어루만짐",
    target: "B2C", glassesColor: "#FFA5BC",
    bgColor: "#E2D8D8", cardBgColor: "#FEF2F0", cardAccentColor: "#E11D48",
  },
  trend_curator: {
    id: "trend_curator", name: "트렌드 큐레이터", animal: "🐧 펭귄",
    description: "논문·해외사례 · 최신 정보 큐레이팅",
    target: "B2B", glassesColor: "#4F46E5",
    bgColor: "#D6D8E1", cardBgColor: "#EEF0FF", cardAccentColor: "#4F46E5",
  },
  founder_pt: {
    id: "founder_pt", name: "창업가형 PT", animal: "🦁 사자",
    description: "스튜디오·클리닉 · 자신감 있는 운영자",
    target: "B2B", glassesColor: "#10B981",
    bgColor: "#E2D8D8", cardBgColor: "#ECFDF5", cardAccentColor: "#10B981",
  },
  content_creator: {
    id: "content_creator", name: "SNS 크리에이터", animal: "📱 플라밍고",
    description: "릴스·영상 · 트렌디한 콘텐츠 메이커",
    target: "B2B", glassesColor: "#E879F9",
    bgColor: "#D6D8E1", cardBgColor: "#FDF4FF", cardAccentColor: "#A21CAF",
  },
  wellness_coach: {
    id: "wellness_coach", name: "웰니스 코치", animal: "🐰 토끼",
    description: "예방·운동·라이프스타일 · 활기찬",
    target: "B2B", glassesColor: "#A3E635",
    bgColor: "#E2D8D8", cardBgColor: "#F7FEE7", cardAccentColor: "#65A30D",
  },
};

export function getPersona(id: string): PersonaInfo | null {
  return PERSONAS[id as PersonaId] || null;
}

// ─── Nouns 통일 안경 컴포넌트 ───────────────────────────────
function NounsGlasses({ color }: { color: string }) {
  return (
    <g shapeRendering="crispEdges">
      {/* 위 테두리 */}
      <rect x="68" y="72" width="144" height="8" fill={color} />
      {/* 왼쪽 렌즈 */}
      <rect x="68" y="80" width="8" height="48" fill={color} />
      <rect x="68" y="120" width="64" height="8" fill={color} />
      <rect x="124" y="80" width="8" height="48" fill={color} />
      <rect x="76" y="80" width="48" height="40" fill="#FFFFFF" />
      <rect x="92" y="92" width="16" height="16" fill="#1A2332" />
      {/* 다리 */}
      <rect x="132" y="88" width="16" height="8" fill={color} />
      {/* 오른쪽 렌즈 */}
      <rect x="148" y="80" width="8" height="48" fill={color} />
      <rect x="148" y="120" width="64" height="8" fill={color} />
      <rect x="204" y="80" width="8" height="48" fill={color} />
      <rect x="156" y="80" width="48" height="40" fill="#FFFFFF" />
      <rect x="172" y="92" width="16" height="16" fill="#1A2332" />
    </g>
  );
}

// ─── 12개 캐릭터 SVG 컴포넌트 ────────────────────────────────
interface CharacterProps {
  size?: number;
}

export function PersonaCharacter({ id, size = 280 }: { id: PersonaId; size?: number }) {
  const persona = PERSONAS[id];

  return (
    <svg
      viewBox="0 0 280 200"
      width={size}
      height={size * (200 / 280)}
      xmlns="http://www.w3.org/2000/svg"
      style={{ background: persona.bgColor }}
    >
      <CharacterArt id={id} />
    </svg>
  );
}

function CharacterArt({ id }: { id: PersonaId }) {
  const persona = PERSONAS[id];
  const c = persona.glassesColor;

  switch (id) {
    case "clinical_mentor": // 비숑
      return (
        <g shapeRendering="crispEdges">
          <rect x="100" y="32" width="80" height="8" fill="#FFFFFF" />
          <rect x="92" y="40" width="96" height="8" fill="#FFFFFF" />
          <rect x="68" y="48" width="24" height="32" fill="#FFFFFF" />
          <rect x="60" y="56" width="8" height="24" fill="#FFFFFF" />
          <rect x="188" y="48" width="24" height="32" fill="#FFFFFF" />
          <rect x="212" y="56" width="8" height="24" fill="#FFFFFF" />
          <rect x="84" y="48" width="112" height="80" fill="#FFFFFF" />
          <NounsGlasses color={c} />
          <rect x="132" y="136" width="16" height="8" fill="#1A2332" />
          <rect x="76" y="148" width="128" height="36" fill="#2A4275" />
          <rect x="124" y="148" width="32" height="8" fill="#FFFFFF" />
          <rect x="132" y="156" width="16" height="8" fill="#FFFFFF" />
          <rect x="76" y="172" width="128" height="4" fill="#7FCEB8" />
        </g>
      );

    case "active_coach": // 호랑이
      return (
        <g shapeRendering="crispEdges">
          <rect x="68" y="32" width="24" height="24" fill="#E89E5C" />
          <rect x="76" y="24" width="8" height="8" fill="#E89E5C" />
          <rect x="76" y="40" width="8" height="8" fill="#FFCCD5" />
          <rect x="188" y="32" width="24" height="24" fill="#E89E5C" />
          <rect x="196" y="24" width="8" height="8" fill="#E89E5C" />
          <rect x="196" y="40" width="8" height="8" fill="#FFCCD5" />
          <rect x="76" y="48" width="128" height="80" fill="#E89E5C" />
          <rect x="92" y="48" width="8" height="16" fill="#5C3819" />
          <rect x="116" y="48" width="8" height="16" fill="#5C3819" />
          <rect x="156" y="48" width="8" height="16" fill="#5C3819" />
          <rect x="180" y="48" width="8" height="16" fill="#5C3819" />
          <rect x="76" y="116" width="16" height="8" fill="#5C3819" />
          <rect x="188" y="116" width="16" height="8" fill="#5C3819" />
          <NounsGlasses color={c} />
          <rect x="132" y="136" width="16" height="8" fill="#FF8FA0" />
          <rect x="76" y="148" width="128" height="36" fill="#A8C8E8" />
          <rect x="76" y="172" width="128" height="6" fill="#FFFFFF" />
          <rect x="136" y="148" width="4" height="36" fill="#7FA5CF" />
        </g>
      );

    case "recovery_guide": // 거북이
      return (
        <g shapeRendering="crispEdges">
          <rect x="92" y="32" width="96" height="8" fill="#7CB99F" />
          <rect x="76" y="40" width="128" height="88" fill="#9BCFB2" />
          <rect x="100" y="112" width="80" height="16" fill="#7CB99F" />
          <NounsGlasses color={c} />
          <rect x="132" y="120" width="16" height="4" fill="#1A2332" />
          <rect x="60" y="148" width="160" height="36" fill="#5C8870" />
          <rect x="76" y="152" width="20" height="20" fill="#7CB99F" />
          <rect x="100" y="152" width="20" height="20" fill="#7CB99F" />
          <rect x="124" y="152" width="20" height="20" fill="#7CB99F" />
          <rect x="148" y="152" width="20" height="20" fill="#7CB99F" />
          <rect x="172" y="152" width="20" height="20" fill="#7CB99F" />
          <rect x="60" y="160" width="160" height="4" fill="#5C8870" />
        </g>
      );

    case "senior_companion": // 코끼리
      return (
        <g shapeRendering="crispEdges">
          <rect x="44" y="48" width="32" height="48" fill="#A8A0A0" />
          <rect x="36" y="56" width="8" height="32" fill="#A8A0A0" />
          <rect x="52" y="60" width="16" height="24" fill="#C8C0C0" />
          <rect x="204" y="48" width="32" height="48" fill="#A8A0A0" />
          <rect x="236" y="56" width="8" height="32" fill="#A8A0A0" />
          <rect x="212" y="60" width="16" height="24" fill="#C8C0C0" />
          <rect x="76" y="40" width="128" height="80" fill="#B5ADAD" />
          <NounsGlasses color={c} />
          <rect x="124" y="120" width="32" height="8" fill="#B5ADAD" />
          <rect x="124" y="128" width="32" height="8" fill="#A8A0A0" />
          <rect x="124" y="136" width="32" height="8" fill="#B5ADAD" />
          <rect x="124" y="144" width="32" height="8" fill="#A8A0A0" />
          <rect x="132" y="152" width="16" height="8" fill="#A8A0A0" />
          <rect x="76" y="148" width="128" height="36" fill="#D2B89A" />
          <rect x="136" y="156" width="6" height="6" fill="#8B6F47" />
          <rect x="136" y="172" width="6" height="6" fill="#8B6F47" />
        </g>
      );

    case "posture_master": // 기린
      return (
        <g shapeRendering="crispEdges">
          <rect x="100" y="20" width="6" height="12" fill="#8B6F47" />
          <rect x="98" y="16" width="10" height="6" fill="#5C3819" />
          <rect x="174" y="20" width="6" height="12" fill="#8B6F47" />
          <rect x="172" y="16" width="10" height="6" fill="#5C3819" />
          <rect x="92" y="32" width="96" height="8" fill="#E8C887" />
          <rect x="60" y="40" width="20" height="16" fill="#E8C887" />
          <rect x="200" y="40" width="20" height="16" fill="#E8C887" />
          <rect x="76" y="40" width="128" height="80" fill="#F0D49C" />
          <rect x="84" y="48" width="8" height="8" fill="#8B6F47" />
          <rect x="184" y="48" width="8" height="8" fill="#8B6F47" />
          <rect x="84" y="112" width="12" height="8" fill="#8B6F47" />
          <rect x="184" y="112" width="12" height="8" fill="#8B6F47" />
          <rect x="92" y="120" width="8" height="8" fill="#8B6F47" />
          <rect x="180" y="120" width="8" height="8" fill="#8B6F47" />
          <NounsGlasses color={c} />
          <rect x="132" y="128" width="16" height="6" fill="#1A2332" />
          <rect x="124" y="148" width="32" height="20" fill="#F0D49C" />
          <rect x="132" y="152" width="6" height="6" fill="#8B6F47" />
          <rect x="142" y="158" width="6" height="6" fill="#8B6F47" />
          <rect x="100" y="168" width="80" height="16" fill="#FFFFFF" />
          <rect x="100" y="168" width="80" height="4" fill="#A78BFA" />
          <rect x="136" y="172" width="8" height="12" fill="#A78BFA" />
        </g>
      );

    case "women_health": // 백조
      return (
        <g shapeRendering="crispEdges">
          <rect x="100" y="32" width="80" height="8" fill="#FFFFFF" />
          <rect x="92" y="40" width="96" height="8" fill="#FFFFFF" />
          <rect x="76" y="40" width="128" height="80" fill="#FFFFFF" />
          <NounsGlasses color={c} />
          <rect x="124" y="120" width="32" height="12" fill="#FFA85C" />
          <rect x="128" y="132" width="24" height="4" fill="#FFA85C" />
          <rect x="148" y="120" width="8" height="6" fill="#1A2332" />
          <rect x="116" y="140" width="48" height="12" fill="#FFFFFF" />
          <rect x="124" y="148" width="32" height="8" fill="#FFFFFF" />
          <rect x="76" y="156" width="128" height="28" fill="#FFD3DF" />
          <rect x="124" y="160" width="32" height="6" fill="#FF6B9D" />
          <rect x="132" y="166" width="16" height="6" fill="#FF6B9D" />
          <rect x="100" y="170" width="6" height="6" fill="#FFFFFF" />
          <rect x="174" y="170" width="6" height="6" fill="#FFFFFF" />
        </g>
      );

    case "education_master": // 부엉이
      return (
        <g shapeRendering="crispEdges">
          <rect x="76" y="24" width="8" height="16" fill="#9C7B52" />
          <rect x="196" y="24" width="8" height="16" fill="#9C7B52" />
          <rect x="76" y="40" width="128" height="88" fill="#B89B6E" />
          <rect x="92" y="96" width="96" height="32" fill="#E0C28A" />
          <rect x="76" y="56" width="128" height="8" fill={c} />
          <rect x="76" y="96" width="56" height="8" fill={c} />
          <rect x="148" y="96" width="56" height="8" fill={c} />
          <rect x="76" y="56" width="56" height="40" fill="#FFFFFF" />
          <rect x="76" y="56" width="8" height="40" fill={c} />
          <rect x="124" y="56" width="8" height="40" fill={c} />
          <rect x="96" y="68" width="16" height="16" fill="#1A2332" />
          <rect x="148" y="56" width="56" height="40" fill="#FFFFFF" />
          <rect x="148" y="56" width="8" height="40" fill={c} />
          <rect x="196" y="56" width="8" height="40" fill={c} />
          <rect x="168" y="68" width="16" height="16" fill="#1A2332" />
          <rect x="132" y="68" width="16" height="8" fill={c} />
          <rect x="128" y="112" width="24" height="8" fill="#FFA85C" />
          <rect x="136" y="120" width="8" height="8" fill="#FFA85C" />
          <rect x="76" y="128" width="128" height="56" fill="#B5DCC8" />
          <rect x="108" y="128" width="64" height="16" fill="#FFFFFF" />
          <rect x="124" y="144" width="32" height="8" fill="#1F3A68" />
        </g>
      );

    case "pain_healer": // 곰
      return (
        <g shapeRendering="crispEdges">
          <rect x="68" y="40" width="24" height="24" fill="#A07A5A" />
          <rect x="76" y="48" width="8" height="8" fill="#FFCCD5" />
          <rect x="188" y="40" width="24" height="24" fill="#A07A5A" />
          <rect x="196" y="48" width="8" height="8" fill="#FFCCD5" />
          <rect x="76" y="48" width="128" height="80" fill="#C49575" />
          <rect x="100" y="104" width="80" height="24" fill="#E8C8AC" />
          <NounsGlasses color={c} />
          <rect x="132" y="112" width="16" height="8" fill="#1A2332" />
          <rect x="76" y="148" width="128" height="36" fill="#B0E0CE" />
          <rect x="124" y="156" width="8" height="8" fill="#FF6B6B" />
          <rect x="148" y="156" width="8" height="8" fill="#FF6B6B" />
          <rect x="120" y="164" width="40" height="8" fill="#FF6B6B" />
          <rect x="128" y="172" width="24" height="6" fill="#FF6B6B" />
        </g>
      );

    case "trend_curator": // 펭귄
      return (
        <g shapeRendering="crispEdges">
          <rect x="76" y="32" width="128" height="16" fill="#1F1F2F" />
          <rect x="68" y="40" width="144" height="8" fill="#1F1F2F" />
          <rect x="76" y="48" width="128" height="56" fill="#1F1F2F" />
          <rect x="92" y="72" width="96" height="56" fill="#FFFFFF" />
          <rect x="84" y="80" width="112" height="48" fill="#FFFFFF" />
          <NounsGlasses color={c} />
          <rect x="128" y="128" width="24" height="8" fill="#FFA85C" />
          <rect x="132" y="136" width="16" height="6" fill="#FFA85C" />
          <rect x="76" y="148" width="128" height="36" fill="#1F1F2F" />
          <rect x="100" y="148" width="80" height="36" fill="#FFFFFF" />
          <rect x="124" y="148" width="32" height="8" fill={c} />
        </g>
      );

    case "founder_pt": // 사자
      return (
        <g shapeRendering="crispEdges">
          <rect x="60" y="32" width="160" height="8" fill="#8B5A2B" />
          <rect x="52" y="40" width="176" height="16" fill="#8B5A2B" />
          <rect x="44" y="56" width="192" height="48" fill="#8B5A2B" />
          <rect x="52" y="104" width="176" height="16" fill="#8B5A2B" />
          <rect x="60" y="120" width="160" height="8" fill="#8B5A2B" />
          <rect x="52" y="48" width="8" height="8" fill="#C68A4A" />
          <rect x="68" y="32" width="8" height="8" fill="#C68A4A" />
          <rect x="100" y="24" width="8" height="8" fill="#C68A4A" />
          <rect x="172" y="24" width="8" height="8" fill="#C68A4A" />
          <rect x="204" y="32" width="8" height="8" fill="#C68A4A" />
          <rect x="220" y="48" width="8" height="8" fill="#C68A4A" />
          <rect x="44" y="80" width="8" height="8" fill="#C68A4A" />
          <rect x="228" y="80" width="8" height="8" fill="#C68A4A" />
          <rect x="76" y="48" width="128" height="80" fill="#F4C063" />
          <NounsGlasses color={c} />
          <rect x="128" y="120" width="24" height="8" fill="#1A2332" />
          <rect x="138" y="128" width="4" height="6" fill="#1A2332" />
          <rect x="76" y="148" width="128" height="36" fill="#1F3A68" />
          <rect x="124" y="148" width="32" height="36" fill="#FFFFFF" />
          <rect x="136" y="148" width="8" height="20" fill={c} />
          <rect x="132" y="168" width="16" height="12" fill={c} />
        </g>
      );

    case "content_creator": // 플라밍고
      return (
        <g shapeRendering="crispEdges">
          <rect x="92" y="32" width="96" height="8" fill="#FFB5C5" />
          <rect x="76" y="40" width="128" height="80" fill="#FFB5C5" />
          <NounsGlasses color={c} />
          <rect x="120" y="120" width="40" height="12" fill="#FF6B9D" />
          <rect x="148" y="120" width="12" height="12" fill="#1A2332" />
          <rect x="124" y="140" width="32" height="16" fill="#FFB5C5" />
          <rect x="116" y="156" width="16" height="8" fill="#FFB5C5" />
          <rect x="76" y="156" width="128" height="28" fill={c} />
          <rect x="92" y="164" width="6" height="6" fill="#FFD93D" />
          <rect x="180" y="164" width="6" height="6" fill="#FFD93D" />
          <rect x="116" y="166" width="48" height="10" fill="#FF4E5C" />
          <rect x="120" y="170" width="3" height="3" fill="#FFFFFF" />
          <rect x="128" y="170" width="3" height="3" fill="#FFFFFF" />
          <rect x="136" y="170" width="3" height="3" fill="#FFFFFF" />
          <rect x="144" y="170" width="3" height="3" fill="#FFFFFF" />
        </g>
      );

    case "wellness_coach": // 토끼
      return (
        <g shapeRendering="crispEdges">
          <rect x="84" y="8" width="20" height="40" fill="#FFFFFF" />
          <rect x="88" y="16" width="12" height="24" fill="#FFCCD5" />
          <rect x="176" y="8" width="20" height="40" fill="#FFFFFF" />
          <rect x="180" y="16" width="12" height="24" fill="#FFCCD5" />
          <rect x="76" y="40" width="128" height="80" fill="#FFFFFF" />
          <NounsGlasses color={c} />
          <rect x="132" y="120" width="16" height="8" fill="#FF8FA0" />
          <rect x="138" y="128" width="4" height="6" fill="#1A2332" />
          <rect x="132" y="132" width="6" height="4" fill="#1A2332" />
          <rect x="142" y="132" width="6" height="4" fill="#1A2332" />
          <rect x="134" y="136" width="4" height="6" fill="#FFFFFF" />
          <rect x="142" y="136" width="4" height="6" fill="#FFFFFF" />
          <rect x="76" y="148" width="128" height="36" fill={c} />
          <rect x="76" y="160" width="128" height="4" fill="#FFFFFF" />
          <rect x="124" y="168" width="8" height="10" fill="#65A30D" />
          <rect x="132" y="172" width="6" height="6" fill="#84CC16" />
          <rect x="138" y="168" width="8" height="10" fill="#65A30D" />
        </g>
      );

    default:
      return null;
  }
}