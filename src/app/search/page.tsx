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
      const { data } = await supabase.from('therapists').select('*')
      setTherapists(data || [])
      setLoading(false)
    }
    fetchTherapists()
  }, [bodyPart, purpose])

  if (loading) {
    return (
      <div className="max-w-md mx-auto min-h-screen bg-white flex items-center justify-center">
        <p className="text-gray-400">치료사를 찾고 있습니다...</p>
      </div>
    )
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
    </main>
  )
}