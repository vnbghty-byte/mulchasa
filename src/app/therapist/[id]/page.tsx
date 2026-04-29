'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import ConsultFormModal from '@/components/ConsultFormModal'

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
}

interface Tag {
  category: string
  label: string
}

export default function TherapistDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [therapist, setTherapist] = useState<Therapist | null>(null)
  const [tags, setTags] = useState<Tag[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)

  useEffect(() => {
    async function fetchData() {
      setLoading(true)
      const id = params.id as string

      const { data: tData } = await supabase
        .from('therapists')
        .select('*')
        .eq('id', id)
        .eq('verification_status', 'verified')
        .single()

      if (!tData) {
        setLoading(false)
        return
      }

      setTherapist(tData)

      const { data: ttData } = await supabase
        .from('therapist_tags')
        .select('tag_id')
        .eq('therapist_id', id)

      if (ttData && ttData.length > 0) {
        const tagIds = ttData.map(t => t.tag_id)
        const { data: tagData } = await supabase
          .from('tags')
          .select('category, label')
          .in('id', tagIds)
        setTags(tagData || [])
      }

      setLoading(false)
    }
    fetchData()
  }, [params.id])

  const getTypeInfo = (type: string) => {
    if (type === 'hospital_pt') return { label: '병원 물리치료사', emoji: '🏥', color: 'bg-blue-50 text-blue-700' }
    if (type === 'exercise_specialist') return { label: '운동 전문가', emoji: '🏋️', color: 'bg-orange-50 text-orange-700' }
    if (type === 'both') return { label: '병원 + 운동 전문가', emoji: '🔄', color: 'bg-purple-50 text-purple-700' }
    return { label: type, emoji: '👤', color: 'bg-gray-50 text-gray-700' }
  }

  if (loading) {
    return (
      <main className="max-w-md mx-auto min-h-screen bg-white flex items-center justify-center">
        <p className="text-gray-400">프로필을 불러오는 중...</p>
      </main>
    )
  }

  if (!therapist) {
    return (
      <main className="max-w-md mx-auto min-h-screen bg-white flex items-center justify-center px-5">
        <div className="text-center">
          <div className="text-5xl mb-4">😔</div>
          <p className="text-base font-bold text-gray-700 mb-2">치료사를 찾을 수 없습니다</p>
          <p className="text-sm text-gray-400 mb-6">삭제되었거나 인증되지 않은 프로필입니다</p>
          <button onClick={() => router.push('/')} className="px-6 py-3 bg-[#0A8A7B] text-white rounded-xl font-semibold">홈으로</button>
        </div>
      </main>
    )
  }

  const typeInfo = getTypeInfo(therapist.practitioner_type)
  const bodyParts = tags.filter(t => t.category === 'body_part')
  const purposes = tags.filter(t => t.category === 'purpose')

  return (
    <main className="max-w-md mx-auto min-h-screen bg-gray-50 pb-28">
      <div className="sticky top-0 bg-white border-b border-gray-100 px-5 py-4 flex items-center gap-3 z-10">
        <button onClick={() => router.back()} className="text-gray-600 text-xl">←</button>
        <h1 className="text-base font-bold text-gray-900">치료사 프로필</h1>
      </div>

      <div className="bg-white px-5 py-6 mb-2">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-2xl font-extrabold text-gray-900">{therapist.name}</h2>
            <p className="text-sm text-gray-500 mt-1">경력 {therapist.years_experience}년</p>
          </div>
          <span className="px-3 py-1.5 bg-green-100 text-green-700 text-xs font-bold rounded-full">✓ 면허 인증</span>
        </div>

        <div className={'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ' + typeInfo.color}>
          <span>{typeInfo.emoji}</span>
          <span>{typeInfo.label}</span>
        </div>
      </div>

      <div className="bg-white px-5 py-5 mb-2">
        <h3 className="text-sm font-bold text-gray-900 mb-3">📍 소속</h3>
        {therapist.hospital_name && (
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm text-gray-400">🏥</span>
            <span className="text-sm text-gray-700">{therapist.hospital_name}</span>
          </div>
        )}
        {therapist.studio_name && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-400">🏋️</span>
            <span className="text-sm text-gray-700">{therapist.studio_name}</span>
          </div>
        )}
        {!therapist.hospital_name && !therapist.studio_name && (
          <p className="text-sm text-gray-400">소속 정보 없음</p>
        )}
      </div>

      {bodyParts.length > 0 && (
        <div className="bg-white px-5 py-5 mb-2">
          <h3 className="text-sm font-bold text-gray-900 mb-3">🦴 전문 부위</h3>
          <div className="flex flex-wrap gap-2">
            {bodyParts.map(tag => (
              <span key={tag.label} className="px-3 py-1.5 bg-[#E8F6F4] text-[#0A8A7B] text-sm font-semibold rounded-full">
                {tag.label}
              </span>
            ))}
          </div>
        </div>
      )}

      {purposes.length > 0 && (
        <div className="bg-white px-5 py-5 mb-2">
          <h3 className="text-sm font-bold text-gray-900 mb-3">🎯 전문 분야</h3>
          <div className="flex flex-wrap gap-2">
            {purposes.map(tag => (
              <span key={tag.label} className="px-3 py-1.5 bg-violet-50 text-violet-600 text-sm font-semibold rounded-full">
                {tag.label}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="bg-white px-5 py-5 mb-2">
        <h3 className="text-sm font-bold text-gray-900 mb-3">💬 자기소개</h3>
        <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{therapist.intro}</p>
      </div>

      <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto px-5 py-4 bg-white border-t border-gray-100 z-20">
        <button
          onClick={() => setShowModal(true)}
          className="w-full py-4 bg-[#FEE500] text-gray-900 text-center rounded-2xl font-bold text-base active:scale-[0.98] transition-all"
        >
          💬 카톡 상담하기
        </button>
      </div>

      <ConsultFormModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        therapistName={therapist.name}
        kakaoLink={therapist.kakao_link}
        bodyPart={bodyParts.length > 0 ? bodyParts[0].label : null}
        purpose={purposes.length > 0 ? purposes[0].label : null}
      />
    </main>
  )
}