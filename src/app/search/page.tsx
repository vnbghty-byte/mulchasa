'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

interface Therapist {
  id: string
  name: string
  hospital_name: string | null
  studio_name: string | null
  years_experience: number
  intro: string
  phone: string
  kakao_link: string
}

export default function SearchPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [therapists, setTherapists] = useState<Therapist[]>([])
  const [loading, setLoading] = useState(true)

  const bodyPart = searchParams.get('part')
  const purpose = searchParams.get('purpose')

  useEffect(() => {
    async function fetchTherapists() {
      setLoading(true)
      const tagLabels = [bodyPart, purpose].filter(Boolean) as string[]

      if (tagLabels.length === 0) {
        setTherapists([])
        setLoading(false)
        return
      }

      const { data: tagData } = await supabase.from('tags').select('id, label').in('label', tagLabels)
      if (!tagData || tagData.length === 0) { setTherapists([]); setLoading(false); return }

      const tagIds = tagData.map(t => t.id)
      const { data: ttData } = await supabase.from('therapist_tags').select('therapist_id, tag_id').in('tag_id', tagIds)
      if (!ttData || ttData.length === 0) { setTherapists([]); setLoading(false); return }

      let therapistIds: string[] = []
      if (tagLabels.length === 2) {
        const counts: Record<string, number> = {}
        ttData.forEach(r => { counts[r.therapist_id] = (counts[r.therapist_id] || 0) + 1 })
        therapistIds = Object.keys(counts).filter(id => counts[id] === 2)
      } else {
        therapistIds = Array.from(new Set(ttData.map(r => r.therapist_id)))
      }

      if (therapistIds.length === 0) { setTherapists([]); setLoading(false); return }

      const { data: tData } = await supabase.from('therapists').select('*').in('id', therapistIds).order('years_experience', { ascending: false })
      setTherapists(tData || [])
      setLoading(false)
    }
    fetchTherapists()
  }, [bodyPart, purpose])

  if (loading) {
    return <div className="max-w-md mx-auto min-h-screen bg-white flex items-center justify-center"><p className="text-gray-400">치료사를 찾고 있습니다...</p></div>
  }

  return (
    <main className="max-w-md mx-auto min-h-screen bg-white">
      <div className="sticky top-0 bg-white border-b border-gray-100 px-5 py-4 flex items-center gap-3">
        <button onClick={() => router.back()} className="text-gray-600 text-xl">←</button>
        <div>
          <h1 className="text-lg font-bold text-gray-900">{bodyPart} 전문가 {therapists.length}명</h1>
          {purpose && <p className="text-sm text-gray-400">{purpose}</p>}
        </div>
      </div>

      {therapists.length === 0 ? (
        <div className="px-5 py-20 text-center">
          <div className="text-5xl mb-4">🔍</div>
          <p className="text-base font-bold text-gray-700 mb-2">조건에 맞는 전문가가 없습니다</p>
          <p className="text-sm text-gray-400 mb-6">부위나 목적을 다시 선택해보세요</p>
          <button onClick={() => router.push('/')} className="px-6 py-3 bg-[#0A8A7B] text-white rounded-xl font-semibold">다시 검색하기</button>
        </div>
      ) : (
        <div className="px-5 py-4 space-y-4">
          {therapists.map((t) => (
            <div key={t.id} className="border border-gray-100 rounded-2xl p-5">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">{t.name}</h3>
                  <p className="text-sm text-gray-500">경력 {t.years_experience}년</p>
                </div>
                <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full">면허 인증</span>
              </div>
              <p className="text-sm text-gray-600 mb-3">{t.hospital_name || t.studio_name}</p>
              <p className="text-sm text-gray-700 mb-4">{t.intro}</p>
              <div className="flex gap-2">
                <a href={t.kakao_link} target="_blank" rel="noopener noreferrer" className="flex-1 py-3 bg-yellow-300 text-gray-900 text-center rounded-xl font-semibold">카톡 상담</a>
                <a href={`tel:${t.phone}`} className="flex-1 py-3 bg-gray-100 text-gray-700 text-center rounded-xl font-semibold">전화</a>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  )
}