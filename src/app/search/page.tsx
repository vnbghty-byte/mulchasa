'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import ConsultFormModal from '@/components/ConsultFormModal'

interface Therapist {
  id: string
  name: string
  hospital_name: string | null
  studio_name: string | null
  years_experience: number
  intro: string
  phone: string
  kakao_link: string
  latitude: number | null
  longitude: number | null
  distance?: number | null
}

function getDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

function formatDistance(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)}m`
  if (km < 10) return `${km.toFixed(1)}km`
  return `${Math.round(km)}km`
}

function SearchContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [therapists, setTherapists] = useState<Therapist[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedTherapist, setSelectedTherapist] = useState<Therapist | null>(null)

  const bodyPart = searchParams.get('part')
  const purpose = searchParams.get('purpose')
  const userLat = searchParams.get('lat') ? Number(searchParams.get('lat')) : null
  const userLng = searchParams.get('lng') ? Number(searchParams.get('lng')) : null
  const hasLocation = userLat !== null && userLng !== null

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

      const { data: tData } = await supabase
        .from('therapists')
        .select('*')
        .in('id', therapistIds)
        .eq('verification_status', 'verified')

      if (tData) {
        const withDistance = tData.map(t => ({
          ...t,
          distance: (hasLocation && t.latitude && t.longitude)
            ? getDistanceKm(userLat!, userLng!, t.latitude, t.longitude)
            : null
        }))

        if (hasLocation) {
          withDistance.sort((a, b) => {
            if (a.distance === null && b.distance === null) return b.years_experience - a.years_experience
            if (a.distance === null) return 1
            if (b.distance === null) return -1
            return a.distance - b.distance
          })
        } else {
          withDistance.sort((a, b) => b.years_experience - a.years_experience)
        }

        setTherapists(withDistance)
      } else {
        setTherapists([])
      }
      setLoading(false)
    }
    fetchTherapists()
  }, [bodyPart, purpose, userLat, userLng, hasLocation])

  if (loading) {
    return <div className="max-w-md mx-auto min-h-screen bg-white flex items-center justify-center"><p className="text-gray-400">치료사를 찾고 있습니다...</p></div>
  }

  return (
    <main className="max-w-md mx-auto min-h-screen bg-white">
      <div className="sticky top-0 bg-white border-b border-gray-100 px-5 py-4 flex items-center gap-3 z-10">
        <button onClick={() => router.back()} className="text-gray-600 text-xl">←</button>
        <div className="flex-1">
          <h1 className="text-lg font-bold text-gray-900">{bodyPart} 전문가 {therapists.length}명</h1>
          {purpose && <p className="text-sm text-gray-400">{purpose}</p>}
        </div>
        <span className="text-xs text-gray-400">
          {hasLocation ? '📍 거리순' : '⭐ 경력순'}
        </span>
      </div>
<div className="px-5 py-2 text-xs text-red-500">
        DEBUG: lat={userLat}, lng={userLng}, hasLocation={String(hasLocation)}, 
        첫번째 치료사 좌표: {therapists[0]?.latitude ?? 'null'} / {therapists[0]?.longitude ?? 'null'},
        거리: {therapists[0]?.distance ?? 'null'}
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
              <div className="cursor-pointer" onClick={() => router.push('/therapist/' + t.id)}>
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">{t.name}</h3>
                    <p className="text-sm text-gray-500">경력 {t.years_experience}년</p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full">면허 인증</span>
                    {t.distance !== null && t.distance !== undefined && (
                      <span className="text-xs text-[#0A8A7B] font-bold">📍 {formatDistance(t.distance)}</span>
                    )}
                  </div>
                </div>
                <p className="text-sm text-gray-600 mb-3">{t.hospital_name || t.studio_name}</p>
                <p className="text-sm text-gray-700 mb-3">{t.intro}</p>
                <p className="text-xs text-[#0A8A7B] font-semibold mb-3 text-right">프로필 상세보기 →</p>
              </div>
              <button
                onClick={() => setSelectedTherapist(t)}
                className="w-full py-3 bg-[#FEE500] text-gray-900 text-center rounded-xl font-bold active:scale-[0.98] transition-all"
              >
                💬 카톡 상담하기
              </button>
            </div>
          ))}
        </div>
      )}

      <ConsultFormModal
        isOpen={selectedTherapist !== null}
        onClose={() => setSelectedTherapist(null)}
        therapistName={selectedTherapist?.name || ''}
        kakaoLink={selectedTherapist?.kakao_link || ''}
        bodyPart={bodyPart}
        purpose={purpose}
      />
    </main>
  )
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="max-w-md mx-auto min-h-screen bg-white flex items-center justify-center">
        <p className="text-gray-400">로딩 중...</p>
      </div>
    }>
      <SearchContent />
    </Suspense>
  )
}