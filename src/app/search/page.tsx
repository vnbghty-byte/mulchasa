'use client'

import Script from 'next/script'
import { useEffect, useState, Suspense, useRef } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import ConsultFormModal from '@/components/ConsultFormModal'

interface Therapist {
  id: string
  name: string
  hospital_name: string | null
  studio_name: string | null
  years_experience: number
  practitioner_type: string
  intro: string
  phone: string
  kakao_link: string
  latitude: number | null
  longitude: number | null
  distance?: number | null
  profile_image_url: string | null
}

declare global {
  interface Window {
    kakao: any
  }
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

const EXPERIENCE_FILTERS = [
  { label: '전체', min: 0 },
  { label: '3년+', min: 3 },
  { label: '5년+', min: 5 },
  { label: '10년+', min: 10 },
]

const TYPE_FILTERS = [
  { label: '전체', value: 'all' },
  { label: '🏥 병원 물리치료사', value: 'hospital_pt' },
  { label: '🏋️ 움직임 전문가', value: 'exercise_specialist' },
]

// 카카오맵 컴포넌트
function KakaoMap({ therapists, userLat, userLng, onSelectTherapist }: {
  therapists: Therapist[]
  userLat: number | null
  userLng: number | null
  onSelectTherapist: (t: Therapist) => void
}) {
  const mapRef = useRef<HTMLDivElement>(null)
  const [sdkReady, setSdkReady] = useState(false)

  useEffect(() => {
    if (!sdkReady || !mapRef.current || !window.kakao?.maps) return

    window.kakao.maps.load(() => {
      if (!mapRef.current) return

      const centerLat = userLat ?? (therapists[0]?.latitude ?? 37.5665)
      const centerLng = userLng ?? (therapists[0]?.longitude ?? 126.9780)

      const map = new window.kakao.maps.Map(mapRef.current, {
        center: new window.kakao.maps.LatLng(centerLat, centerLng),
        level: 5,
      })

      if (userLat && userLng) {
        const myMarkerImage = new window.kakao.maps.MarkerImage(
          'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10" fill="#3B82F6" stroke="white" stroke-width="3"/>
              <circle cx="12" cy="12" r="4" fill="white"/>
            </svg>
          `),
          new window.kakao.maps.Size(24, 24),
          { offset: new window.kakao.maps.Point(12, 12) }
        )
        new window.kakao.maps.Marker({
          map,
          position: new window.kakao.maps.LatLng(userLat, userLng),
          image: myMarkerImage,
          title: '내 위치',
        })
      }

      therapists.forEach(t => {
        if (!t.latitude || !t.longitude) return
        const markerImage = new window.kakao.maps.MarkerImage(
          'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
            <svg xmlns="http://www.w3.org/2000/svg" width="36" height="44" viewBox="0 0 36 44">
              <ellipse cx="18" cy="42" rx="6" ry="2" fill="rgba(0,0,0,0.15)"/>
              <path d="M18 0C10.3 0 4 6.3 4 14c0 9.9 14 28 14 28S32 23.9 32 14C32 6.3 25.7 0 18 0z" fill="#0A8A7B"/>
              <circle cx="18" cy="14" r="7" fill="white"/>
              <text x="18" y="18" text-anchor="middle" font-size="10" fill="#0A8A7B" font-weight="bold">PT</text>
            </svg>
          `),
          new window.kakao.maps.Size(36, 44),
          { offset: new window.kakao.maps.Point(18, 44) }
        )
        const marker = new window.kakao.maps.Marker({
          map,
          position: new window.kakao.maps.LatLng(t.latitude, t.longitude),
          image: markerImage,
          title: t.name,
        })
        window.kakao.maps.event.addListener(marker, 'click', () => onSelectTherapist(t))
      })
    })
  }, [sdkReady, therapists, userLat, userLng])

  return (
    <>
      <Script
        src={`https://dapi.kakao.com/v2/maps/sdk.js?appkey=${process.env.NEXT_PUBLIC_KAKAO_MAP_KEY}&autoload=false`}
        strategy="afterInteractive"
        onReady={() => setSdkReady(true)}
        onLoad={() => setSdkReady(true)}
      />
      <div ref={mapRef} style={{ width: '100%', height: '100%' }} />
    </>
  )
}

// 지도 팝업 카드
function MapPopupCard({ therapist, onClose, onConsult, onProfile }: {
  therapist: Therapist
  onClose: () => void
  onConsult: () => void
  onProfile: () => void
}) {
  return (
    <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl shadow-2xl p-5 z-20 animate-slide-up">
      <div className="flex items-start gap-3 mb-4">
        <div className="shrink-0">
          {therapist.profile_image_url ? (
            <img src={therapist.profile_image_url} alt={therapist.name}
              style={{ width: 52, height: 52, borderRadius: '50%', objectFit: 'cover' }} />
          ) : (
            <div style={{ width: 52, height: 52, borderRadius: '50%' }}
              className="bg-gray-200 flex items-center justify-center">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="8" r="4" fill="#9CA3AF" />
                <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </div>
          )}
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-gray-900">{therapist.name}</h3>
            <button onClick={onClose} className="text-gray-400 text-xl leading-none">×</button>
          </div>
          <p className="text-xs text-gray-500">경력 {therapist.years_experience}년</p>
          <p className="text-xs text-gray-400">
            {therapist.practitioner_type === 'hospital_pt' ? '🏥 병원 물리치료사' : '🏋️ 움직임 전문가'}
          </p>
          {therapist.distance != null && (
            <p className="text-xs text-[#0A8A7B] font-bold mt-0.5">📍 {formatDistance(therapist.distance)}</p>
          )}
        </div>
      </div>
      <p className="text-sm text-gray-600 mb-4 line-clamp-2">{therapist.intro}</p>
      <div className="flex gap-2">
        <button onClick={onProfile}
          className="flex-1 py-2.5 border border-[#0A8A7B] text-[#0A8A7B] rounded-xl text-sm font-semibold">
          프로필 보기
        </button>
        <button onClick={onConsult}
          className="flex-1 py-2.5 bg-[#FEE500] text-gray-900 rounded-xl text-sm font-bold">
          💬 카톡 상담
        </button>
      </div>
    </div>
  )
}

function SearchContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [therapists, setTherapists] = useState<Therapist[]>([])
  const [filtered, setFiltered] = useState<Therapist[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedTherapist, setSelectedTherapist] = useState<Therapist | null>(null)
  const [mapSelectedTherapist, setMapSelectedTherapist] = useState<Therapist | null>(null)
  const [expFilter, setExpFilter] = useState(0)
  const [typeFilter, setTypeFilter] = useState('all')
  const [showFilters, setShowFilters] = useState(false)
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list')

  const bodyPart = searchParams.get('part')
  const purpose = searchParams.get('purpose')
  const userLat = searchParams.get('lat') ? Number(searchParams.get('lat')) : null
  const userLng = searchParams.get('lng') ? Number(searchParams.get('lng')) : null
  const hasLocation = userLat !== null && userLng !== null

  useEffect(() => {
    async function fetchTherapists() {
      setLoading(true)
      const tagLabels = [bodyPart, purpose].filter(Boolean) as string[]
      if (tagLabels.length === 0) { setTherapists([]); setLoading(false); return }

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
        .from('therapists').select('*').in('id', therapistIds).eq('verification_status', 'verified')

      if (tData) {
        const withDistance = tData.map(t => ({
          ...t,
          distance: (hasLocation && t.latitude && t.longitude)
            ? getDistanceKm(userLat!, userLng!, t.latitude, t.longitude) : null
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

  useEffect(() => {
    let result = [...therapists]
    if (expFilter > 0) result = result.filter(t => t.years_experience >= expFilter)
    if (typeFilter !== 'all') result = result.filter(t => t.practitioner_type === typeFilter)
    setFiltered(result)
  }, [therapists, expFilter, typeFilter])

  const isFilterActive = expFilter > 0 || typeFilter !== 'all'
  const resetFilters = () => { setExpFilter(0); setTypeFilter('all') }

  if (loading) {
    return (
      <div className="max-w-md mx-auto min-h-screen bg-white flex items-center justify-center">
        <p className="text-gray-400">치료사를 찾고 있습니다...</p>
      </div>
    )
  }

  return (
    <main className="max-w-md mx-auto min-h-screen bg-white">
      {/* 헤더 */}
      <div className="sticky top-0 bg-white border-b border-gray-100 px-5 py-4 flex items-center gap-3 z-10">
        <button onClick={() => router.back()} className="text-gray-600 text-xl">←</button>
        <div className="flex-1">
          <h1 className="text-lg font-bold text-gray-900">{bodyPart} 전문가 {filtered.length}명</h1>
          {purpose && <p className="text-sm text-gray-400">{purpose}</p>}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400">{hasLocation ? '📍 거리순' : '⭐ 경력순'}</span>
          {viewMode === 'list' && (
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={'px-3 py-1.5 rounded-full text-xs font-bold transition-all ' +
                (isFilterActive ? 'bg-[#0A8A7B] text-white' : 'bg-gray-100 text-gray-600')}
            >
              필터 {isFilterActive ? '●' : ''}
            </button>
          )}
        </div>
      </div>

      {/* 탭 전환 */}
      <div className="flex border-b border-gray-100 bg-white sticky top-[73px] z-10 max-w-md mx-auto w-full">
        <button
          onClick={() => setViewMode('list')}
          className={'flex-1 py-3 text-sm font-bold transition-all ' +
            (viewMode === 'list' ? 'text-[#0A8A7B] border-b-2 border-[#0A8A7B]' : 'text-gray-400')}
        >
          📋 리스트 보기
        </button>
        <button
          onClick={() => setViewMode('map')}
          className={'flex-1 py-3 text-sm font-bold transition-all ' +
            (viewMode === 'map' ? 'text-[#0A8A7B] border-b-2 border-[#0A8A7B]' : 'text-gray-400')}
        >
          🗺️ 지도 보기
        </button>
      </div>

      {/* 필터 (리스트 모드만) */}
      {viewMode === 'list' && showFilters && (
        <div className="bg-gray-50 px-5 py-4 border-b border-gray-100">
          <div className="mb-3">
            <p className="text-xs font-bold text-gray-500 mb-2">경력</p>
            <div className="flex gap-2 flex-wrap">
              {EXPERIENCE_FILTERS.map(f => (
                <button key={f.min} onClick={() => setExpFilter(f.min)}
                  className={'px-3 py-1.5 rounded-full text-xs font-semibold transition-all ' +
                    (expFilter === f.min ? 'bg-[#0A8A7B] text-white' : 'bg-white text-gray-600 border border-gray-200')}>
                  {f.label}
                </button>
              ))}
            </div>
          </div>
          <div className="mb-3">
            <p className="text-xs font-bold text-gray-500 mb-2">활동 유형</p>
            <div className="flex gap-2 flex-wrap">
              {TYPE_FILTERS.map(f => (
                <button key={f.value} onClick={() => setTypeFilter(f.value)}
                  className={'px-3 py-1.5 rounded-full text-xs font-semibold transition-all ' +
                    (typeFilter === f.value ? 'bg-[#0A8A7B] text-white' : 'bg-white text-gray-600 border border-gray-200')}>
                  {f.label}
                </button>
              ))}
            </div>
          </div>
          {isFilterActive && (
            <button onClick={resetFilters} className="text-xs text-red-400 font-semibold">✕ 필터 초기화</button>
          )}
        </div>
      )}

      {/* 지도 뷰 */}
      {viewMode === 'map' && (
  <div className="relative" style={{ height: 'calc(100vh - 130px)', minHeight: '500px' }}>
          {filtered.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-gray-400 text-sm">표시할 치료사가 없습니다</p>
            </div>
          ) : (
            <>
              <KakaoMap
                therapists={filtered}
                userLat={userLat}
                userLng={userLng}
                onSelectTherapist={setMapSelectedTherapist}
              />
              {mapSelectedTherapist && (
                <MapPopupCard
                  therapist={mapSelectedTherapist}
                  onClose={() => setMapSelectedTherapist(null)}
                  onConsult={() => {
                    setSelectedTherapist(mapSelectedTherapist)
                    setMapSelectedTherapist(null)
                  }}
                  onProfile={() => router.push('/therapist/' + mapSelectedTherapist.id)}
                />
              )}
            </>
          )}
        </div>
      )}

      {/* 리스트 뷰 */}
      {viewMode === 'list' && (
        <>
          {filtered.length === 0 ? (
            <div className="px-5 py-20 text-center">
              <div className="text-5xl mb-4">🔍</div>
              <p className="text-base font-bold text-gray-700 mb-2">
                {isFilterActive ? '필터 조건에 맞는 전문가가 없습니다' : '조건에 맞는 전문가가 없습니다'}
              </p>
              <p className="text-sm text-gray-400 mb-6">
                {isFilterActive ? '필터를 조정해보세요' : '부위나 목적을 다시 선택해보세요'}
              </p>
              {isFilterActive ? (
                <button onClick={resetFilters} className="px-6 py-3 bg-[#0A8A7B] text-white rounded-xl font-semibold">필터 초기화</button>
              ) : (
                <button onClick={() => router.push('/')} className="px-6 py-3 bg-[#0A8A7B] text-white rounded-xl font-semibold">다시 검색하기</button>
              )}
            </div>
          ) : (
            <div className="px-5 py-4 space-y-4">
              {filtered.map((t) => (
                <div key={t.id} className="border border-gray-100 rounded-2xl p-5">
                  <div className="cursor-pointer" onClick={() => router.push('/therapist/' + t.id)}>
                    <div className="flex items-start gap-3 mb-3">
                      <div className="shrink-0" style={{ width: 56, height: 56 }}>
                        {t.profile_image_url ? (
                          <img src={t.profile_image_url} alt={t.name}
                            style={{ width: 56, height: 56, borderRadius: '50%', objectFit: 'cover' }} />
                        ) : (
                          <div style={{ width: 56, height: 56, borderRadius: '50%' }}
                            className="bg-gray-200 flex items-center justify-center">
                            <svg width="36" height="36" viewBox="0 0 24 24" fill="none">
                              <circle cx="12" cy="8" r="4" fill="#9CA3AF" />
                              <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" />
                            </svg>
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="text-base font-bold text-gray-900">{t.name}</h3>
                            <p className="text-xs text-gray-500">경력 {t.years_experience}년</p>
                            <p className="text-xs text-gray-400 mt-0.5">
                              {t.practitioner_type === 'hospital_pt' && '🏥 병원 물리치료사'}
                              {t.practitioner_type === 'exercise_specialist' && '🏋️ 움직임 전문가'}
                            </p>
                          </div>
                          <div className="flex flex-col items-end gap-1">
                            <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full">면허 인증</span>
                            {t.distance !== null && t.distance !== undefined && (
                              <span className="text-xs text-[#0A8A7B] font-bold">📍 {formatDistance(t.distance)}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{t.hospital_name || t.studio_name}</p>
                    <p className="text-sm text-gray-700 mb-3">{t.intro}</p>
                    <p className="text-xs text-[#0A8A7B] font-semibold mb-3 text-right">프로필 상세보기 →</p>
                  </div>
                  <button onClick={() => setSelectedTherapist(t)}
                    className="w-full py-3 bg-[#FEE500] text-gray-900 text-center rounded-xl font-bold active:scale-[0.98] transition-all">
                    💬 카톡 상담하기
                  </button>
                </div>
              ))}
            </div>
          )}
        </>
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