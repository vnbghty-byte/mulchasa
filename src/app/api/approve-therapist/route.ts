import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { SolapiMessageService } from 'solapi'
 
// 솔라피 SDK는 Node 런타임이 필요합니다 (Edge 런타임에서는 동작하지 않음)
export const runtime = 'nodejs'
 
export async function POST(req: Request) {
  try {
    const { id, password } = await req.json()
 
    // 간단한 관리자 가드 — 문자는 건당 비용이 발생하므로 아무나 호출하지 못하게 막습니다.
    if (!password || password !== process.env.NEXT_PUBLIC_ADMIN_PASSWORD) {
      return NextResponse.json({ error: '인증 실패' }, { status: 401 })
    }
    if (!id) {
      return NextResponse.json({ error: 'id가 없습니다' }, { status: 400 })
    }
 
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
 
    // 치료사 조회 (이름·연락처·현재 상태)
    const { data: therapist, error: fetchError } = await supabase
      .from('therapists')
      .select('id, name, phone, verification_status')
      .eq('id', id)
      .single()
 
    if (fetchError || !therapist) {
      return NextResponse.json({ error: '치료사를 찾을 수 없습니다' }, { status: 404 })
    }
 
    const wasAlreadyVerified = therapist.verification_status === 'verified'
 
    // 상태를 verified로 변경
    const { error: updateError } = await supabase
      .from('therapists')
      .update({ verification_status: 'verified' })
      .eq('id', id)
 
    if (updateError) {
      return NextResponse.json({ error: '상태 변경 실패' }, { status: 500 })
    }
 
    // 문자 발송 — 이미 승인된 건이면 중복 발송하지 않음
    let smsSent = false
    let smsError: string | null = null
 
    if (!wasAlreadyVerified) {
      try {
        const messageService = new SolapiMessageService(
          process.env.SOLAPI_API_KEY!,
          process.env.SOLAPI_API_SECRET!
        )
        const text =
          `[물찾사] ${therapist.name} 선생님, 면허 인증이 승인되었습니다.\n` +
          `이제 검색 결과에 프로필이 노출됩니다. 프로필 사진·자격증 등은 마이페이지에서 추가/수정하실 수 있습니다.`
 
        await messageService.send({
          // 솔라피는 하이픈 없는 01012345678 형식을 요구합니다.
          to: String(therapist.phone).replace(/[^0-9]/g, ''),
          from: process.env.SOLAPI_SENDER!,
          text,
        })
        smsSent = true
      } catch (e) {
        smsError = e instanceof Error ? e.message : '문자 발송 실패'
        console.error('SMS 발송 실패:', e)
      }
    }
 
    return NextResponse.json({ ok: true, smsSent, smsError, alreadyVerified: wasAlreadyVerified })
  } catch (e) {
    console.error('approve-therapist error:', e)
    return NextResponse.json({ error: '서버 오류' }, { status: 500 })
  }
}
 