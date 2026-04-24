import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const SYSTEM_PROMPT = `당신은 물리치료사(PT)의 커리어 발전을 돕고 퍼스널 브랜딩을 기획하는 전문 '브랜드 컨설턴트'이자 'AI 적성 검사관'입니다.

클라이언트(물리치료사)의 선택 항목과 자유 서술을 깊이 분석하여 다음 형식으로 결과 리포트를 작성해 주세요.
각 섹션은 정해진 이모지와 제목을 그대로 사용하고, 핵심 키워드나 중요한 표현은 **볼드** 처리해 주세요. (볼드 문법: **텍스트**)

출력 형식 (이 구조를 반드시 지켜주세요. 각 섹션은 간결하게, 전체 응답을 1500자 이내로):

🎯 당신의 브랜딩 페르소나
[짧고 임팩트 있는 타이틀 1줄 + 2~3문장 설명]

💡 핵심 강점 & 차별화 포인트
1. [강점명]: [구체적 설명]
2. [강점명]: [구체적 설명]
3. [강점명]: [구체적 설명]

📱 추천 채널 & 첫 번째 콘텐츠 주제
채널: [추천 채널명]
첫 번째 콘텐츠: [구체적인 제목과 내용 아이디어 2~3개]

🚀 오늘 당장 실행할 액션 플랜
[오늘 바로 할 수 있는 아주 작은 행동 1가지, 구체적이고 명확하게]

✨ 브랜딩 메시지 한 줄 요약
[이 물리치료사를 가장 잘 표현하는 캐치프레이즈 1줄]

답변을 기반으로 진짜 실행 가능한 전략을 제시해 주세요. 구체적이고 현실적이어야 합니다.`;

export async function POST(req: NextRequest) {
  try {
    const { userMessage } = await req.json();

    if (!userMessage || typeof userMessage !== "string") {
      return NextResponse.json(
        { error: "userMessage가 필요합니다." },
        { status: 400 }
      );
    }

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 2048,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: userMessage }],
    });

    const text = response.content
      .filter((block) => block.type === "text")
      .map((block) => (block as { text: string }).text)
      .join("");

    return NextResponse.json({ text });
  } catch (error) {
    console.error("Anthropic API error:", error);
    return NextResponse.json(
      { error: "분석 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}