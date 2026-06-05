'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

interface Therapist {
  id: string
  name: string
  license_number: string
  years_experience: number
  practitioner_type: string
  hospital_name: string | null
  studio_name: string | null
  phone: string
  kakao_link: string
  intro: string
  verification_status: string
  created_at: string
}

export default function AdminPage() {
  const [authenticated, setAuthenticated] = useState(false)
  const [password, setPassword] = useState('')
  const [therapists, setTherapists] = useState<Therapist[]>([])
  const [loading, setLoading] = useState(false)
  const [approvingId, setApprovingId] = useState<string | null>(null)
  const [tab, setTab] = useState<'pending' | 'verified' | 'rejected'>('pending')

  const handleLogin = () => {
    if (password === process.env.NEXT_PUBLIC_ADMIN_PASSWORD) {
      setAuthenticated(true)
      sessionStorage.setItem('mulchasa_admin', 'true')
    } else {
      alert('비밀번호가 올바르지 않습니다.')
    }
  }

  useEffect(() => {
    if (sessionStorage.getItem('mulchasa_admin') === 'true') {
      setAuthenticated(true)
    }
  }, [])

  useEffect(() => {
    if (!authenticated) return
    async function fetchTherapists() {
      setLoading(true)
      const { data } = await supabase.from('therapists').select('*').eq('verification_status', tab).order('created_at', { ascending: false })
      setTherapists(data || [])
      setLoading(false)
    }
    fetchTherapists()
  }, [authenticated, tab])

  const refresh = async () => {
    const { data } = await supabase.from('therapists').select('*').eq('verification_status', tab).order('created_at', { ascending: false })
    setTherapists(data || [])
  }

  const handleApprove = async (id: string, name: string) => {
    if (!confirm(name + ' 치료사의 면허 인증을 승인하시겠습니까?\n승인 시 해당 치료사에게 안내 문자가 발송됩니다.')) return
    setApprovingId(id)
    try {
      const res = await fetch('/api/approve-therapist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, password: process.env.NEXT_PUBLIC_ADMIN_PASSWORD }),
      })
      const result = await res.json()

      if (!res.ok) {
        alert('승인 처리 실패: ' + (result.error || '알 수 없는 오류'))
        return
      }

      if (result.smsSent) {
        alert('승인 완료 · 안내 문자 발송됨: ' + name)
      } else if (result.alreadyVerified) {
        alert('이미 승인된 치료사입니다: ' + name)
      } else {
        alert('승인은 완료됐지만 문자 발송에 실패했습니다: ' + name + '\n사유: ' + (result.smsError || '알 수 없음'))
      }
      refresh()
    } catch {
      alert('요청 중 오류가 발생했습니다. 네트워크 상태를 확인해주세요.')
    } finally {
      setApprovingId(null)
    }
  }

  const handleReject = async (id: string, name: string) => {
    if (!confirm(name + ' 치료사의 신청을 거부하시겠습니까?')) return
    await supabase.from('therapists').update({ verification_status: 'rejected' }).eq('id', id)
    alert('거부 완료: ' + name)
    refresh()
  }

  const handleRevert = async (id: string, name: string) => {
    if (!confirm(name + ' 치료사를 대기 중으로 되돌리시겠습니까?')) return
    await supabase.from('therapists').update({ verification_status: 'pending' }).eq('id', id)
    alert('변경 완료: ' + name)
    refresh()
  }

  const handleLogout = () => {
    sessionStorage.removeItem('mulchasa_admin')
    setAuthenticated(false)
    setPassword('')
  }

  const getTypeLabel = (type: string) => {
    if (type === 'hospital_pt') return '🏥 병원 물리치료사'
    if (type === 'exercise_specialist') return '🏋️ 움직임 전문가'
    return type
  }

  if (!authenticated) {
    return (
      <main className="max-w-md mx-auto min-h-screen bg-white flex items-center justify-center px-5">
        <div className="w-full">
          <div className="text-center mb-8">
            <div className="text-5xl mb-3">🔐</div>
            <h1 className="text-2xl font-extrabold text-gray-900">관리자 페이지</h1>
            <p className="text-sm text-gray-400 mt-2">물찾사 운영자 전용</p>
          </div>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleLogin()} placeholder="비밀번호 입력" className="w-full p-4 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#0A8A7B] mb-3" />
          <button onClick={handleLogin} className="w-full py-4 bg-[#0A8A7B] text-white rounded-xl font-bold">로그인</button>
        </div>
      </main>
    )
  }

  return (
    <main className="max-w-3xl mx-auto min-h-screen bg-white">
      <div className="sticky top-0 bg-white border-b border-gray-100 px-5 py-4 flex items-center justify-between z-10">
        <div>
          <h1 className="text-lg font-extrabold text-gray-900">물찾사 관리자</h1>
          <p className="text-xs text-gray-400">치료사 면허 인증 관리</p>
        </div>
        <button onClick={handleLogout} className="text-xs text-gray-400">로그아웃</button>
      </div>

      <div className="px-5 pt-4 flex gap-2 border-b border-gray-100 sticky bg-white z-10" style={{ top: 73 }}>
        <button onClick={() => setTab('pending')} className={'px-4 py-2 text-sm font-bold ' + (tab === 'pending' ? 'border-b-2 border-[#0A8A7B] text-[#0A8A7B]' : 'text-gray-400')}>🟡 대기 중</button>
        <button onClick={() => setTab('verified')} className={'px-4 py-2 text-sm font-bold ' + (tab === 'verified' ? 'border-b-2 border-[#0A8A7B] text-[#0A8A7B]' : 'text-gray-400')}>✅ 승인됨</button>
        <button onClick={() => setTab('rejected')} className={'px-4 py-2 text-sm font-bold ' + (tab === 'rejected' ? 'border-b-2 border-[#0A8A7B] text-[#0A8A7B]' : 'text-gray-400')}>❌ 거부됨</button>
      </div>

      <div className="px-5 py-4">
        {loading ? (
          <p className="text-center text-gray-400 py-12">불러오는 중...</p>
        ) : therapists.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-5xl mb-3">📭</div>
            <p className="text-gray-400">데이터가 없습니다</p>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-gray-400">총 {therapists.length}명</p>
            {therapists.map((t) => (
              <div key={t.id} className="border border-gray-200 rounded-2xl p-5">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">{t.name}</h3>
                    <p className="text-xs text-gray-400 mt-1">신청일: {new Date(t.created_at).toLocaleDateString('ko-KR')}</p>
                  </div>
                  <span className="px-3 py-1 bg-gray-100 text-gray-600 text-xs font-semibold rounded-full">{getTypeLabel(t.practitioner_type)}</span>
                </div>

                <div className="bg-gray-50 rounded-xl p-4 mb-4 space-y-2 text-sm">
                  <div className="flex items-center">
                    <span className="text-gray-400 w-24 shrink-0">면허번호</span>
                    <span className="font-bold text-gray-900 flex-1">{t.license_number}</span>
                    <a href="https://lic.mohw.go.kr/" target="_blank" rel="noopener noreferrer" className="text-xs text-[#0A8A7B] underline">🔍 조회</a>
                  </div>
                  <div className="flex">
                    <span className="text-gray-400 w-24 shrink-0">경력</span>
                    <span className="text-gray-700">{t.years_experience}년</span>
                  </div>
                  <div className="flex">
                    <span className="text-gray-400 w-24 shrink-0">소속</span>
                    <span className="text-gray-700">{t.hospital_name || t.studio_name || '-'}</span>
                  </div>
                  <div className="flex">
                    <span className="text-gray-400 w-24 shrink-0">연락처</span>
                    <span className="text-gray-700">{t.phone}</span>
                  </div>
                  <div className="flex">
                    <span className="text-gray-400 w-24 shrink-0">카톡</span>
                    <a href={t.kakao_link} target="_blank" rel="noopener noreferrer" className="text-[#0A8A7B] underline text-xs truncate flex-1">{t.kakao_link}</a>
                  </div>
                </div>

                <div className="mb-4">
                  <p className="text-xs text-gray-400 mb-1">자기소개</p>
                  <p className="text-sm text-gray-700 leading-relaxed">{t.intro}</p>
                </div>

                {tab === 'pending' ? (
                  <div className="flex gap-2">
                    <button onClick={() => handleApprove(t.id, t.name)} disabled={approvingId === t.id} className={'flex-1 py-3 rounded-xl font-bold text-sm ' + (approvingId === t.id ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-[#0A8A7B] text-white')}>{approvingId === t.id ? '처리 중...' : '✅ 승인'}</button>
                    <button onClick={() => handleReject(t.id, t.name)} disabled={approvingId === t.id} className="flex-1 py-3 bg-red-50 text-red-600 rounded-xl font-bold text-sm border border-red-100 disabled:opacity-50">❌ 거부</button>
                  </div>
                ) : (
                  <button onClick={() => handleRevert(t.id, t.name)} className="w-full py-3 bg-gray-100 text-gray-600 rounded-xl font-bold text-sm">🔄 대기 중으로 되돌리기</button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
