'use client'

import { useEffect, useState, Suspense, useRef } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Script from 'next/script'
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
  tags?: string[]
  rating?: number | null
  reviewCount?: number
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

function typeLabel(type: string): string {
  if (type === 'hospital_pt') return '🏥 병원 물리치료사'
  if (type === 'exercise_specialist') return '🏋️ 움직임 전문가'
  if (type === 'both') return '🔄 병원+운동 전문가'
  return '👤 전문가'
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

// 프로필 이미지 또는 플레이스홀더 (와이드 배너용)
function WideImage({ url, name }: { url: string | null; name: string }) {
  if (url) {
    return <img src={url} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
  }
  return (
    <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, #d4e8e3, #a8d4c8)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <svg width="64" height="64" viewBox="0 0 24 24" fill="none" style={{ opacity: 0.45 }}>
        <circle cx="12" cy="8" r="4" fill="#fff" />
        <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
      </svg>
    </div>
  )
}

// 와이드 배너형 결과 카드
function ResultCard({ t, onProfile, onConsult }: {
  t: Therapist
  onProfile: () => void
  onConsult: () => void
}) {
  return (
    <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
      {/* 와이드 사진 배너 */}
      <div className="relative cursor-pointer" style={{ height: 170 }} onClick={onProfile}>
        <WideImage url={t.profile_image_url} name={t.name} />
        <span className="absolute top-3 left-3 bg-white/95 text-[11px] font-semibold px-2.5 py-1 rounded-md flex items-center gap-1" style={{ color: '#0F6E56' }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" fill="#0A8A7B" /><path d="m8 12 3 3 5-6" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
          면허 인증
        </span>
        {t.distance != null && (
          <span className="absolute bottom-3 right-3 bg-black/50 text-white text-xs font-semibold px-2.5 py-1 rounded-md">
            📍 {formatDistance(t.distance)}
          </span>
        )}
      </div>

      {/* 정보 */}
      <div className="px-4 pt-3.5 pb-4">
        <div className="cursor-pointer" onClick={onProfile}>
          <div className="flex items-center gap-1.5 mb-1">
            <span className="text-[18px] font-bold text-gray-900">{t.name}</span>
            {t.rating != null && (
              <>
                <span className="text-[13px] font-semibold" style={{ color: '#BA7517' }}>★ {t.rating.toFixed(1)}</span>
                <span className="text-xs text-gray-400">({t.reviewCount})</span>
              </>
            )}
          </div>
          <div className="text-[13px] text-gray-500 mb-2.5">
            경력 {t.years_experience}년 · {typeLabel(t.practitioner_type)} · {t.hospital_name || t.studio_name}
          </div>

          {/* 태그 */}
          {t.tags && t.tags.length > 0 && (
            <div className="flex gap-1.5 flex-wrap mb-3">
              {t.tags.slice(0, 3).map((tag, i) => (
                <span key={i} className="text-xs px-2.5 py-1 rounded-md" style={{ background: '#E1F5EE', color: '#0F6E56' }}>
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* 카톡 버튼 */}
        <button
          onClick={onConsult}
          className="w-full py-3 bg-[#FEE500] text-gray-900 rounded-xl font-bold active:scale-[0.98] transition-all flex items-center justify-center gap-1.5"
        >
          💬 카톡 상담하기
        </button>
      </div>
    </div>
  )
}

// 카카오맵
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
        level: 6,
      })

      const bounds = new window.kakao.maps.LatLngBounds()
      let boundsCount = 0

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
        bounds.extend(new window.kakao.maps.LatLng(userLat, userLng))
        boundsCount++
      }

      // 치료사 "말풍선 1명" 클러스터 스타일 마커 (운동닥터 스타일)
      therapists.forEach(t => {
        if (!t.latitude || !t.longitude) return

        const labelName = (t.hospital_name || t.studio_name || t.name)
        const shortName = labelName.length > 7 ? labelName.slice(0, 7) + '…' : labelName

        const content = document.createElement('div')
        content.style.cssText = 'transform: translate(-50%, -100%); cursor: pointer;'
        content.innerHTML = `
          <div style="background:#0A8A7B; color:#fff; border-radius:18px; padding:6px 12px; font-size:13px; font-weight:700; font-family:sans-serif; white-space:nowrap; box-shadow:0 2px 8px rgba(0,0,0,0.25); display:flex; flex-direction:column; align-items:center; line-height:1.3; position:relative;">
            <span>1명</span>
            <span style="font-size:11px; font-weight:500;">${shortName}</span>
            <div style="position:absolute; bottom:-6px; left:50%; transform:translateX(-50%); width:0; height:0; border-left:6px solid transparent; border-right:6px solid transparent; border-top:7px solid #0A8A7B;"></div>
          </div>
        `
        content.addEventListener('click', () => onSelectTherapist(t))

        const overlay = new window.kakao.maps.CustomOverlay({
          map,
          position: new window.kakao.maps.LatLng(t.latitude, t.longitude),
          content,
          yAnchor: 1,
          xAnchor: 0.5,
        })
        void overlay

        bounds.extend(new window.kakao.maps.LatLng(t.latitude, t.longitude))
        boundsCount++
      })

      // 모든 마커가 보이도록 범위 자동 조정
      if (boundsCount >= 2) {
        map.setBounds(bounds, 60, 60, 60, 60)
      } else if (boundsCount === 1) {
        map.setCenter(bounds.getCenter())
        map.setLevel(4)
      }
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

// 지도 하단 시트 (운동닥터 스타일 - 큰 시트)
function MapBottomSheet({ therapist, onClose, onConsult, onProfile }: {
  therapist: Therapist
  onClose: () => void
  onConsult: () => void
  onProfile: () => void
}) {
  return (
    <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl shadow-2xl z-20" style={{ animation: 'slideUp 0.25s ease-out' }}>
      <style>{`@keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }`}</style>

      {/* 핸들 */}
      <div className="flex justify-center pt-3 pb-1">
        <div className="w-10 h-1 bg-gray-300 rounded-full" />
      </div>

      {/* 닫기 */}
      <button onClick={onClose} className="absolute top-3 right-4 text-gray-400 text-2xl leading-none z-10">×</button>

      {/* 소속 헤더 */}
      <div className="px-5 pt-2 pb-3">
        <div className="text-[17px] font-bold text-gray-900">{therapist.hospital_name || therapist.studio_name}</div>
        <div className="text-xs text-gray-400 mt-0.5">{typeLabel(therapist.practitioner_type)}</div>
      </div>

      {/* 와이드 사진 */}
      <div className="px-5 mb-4 cursor-pointer" onClick={onProfile}>
        <div className="rounded-2xl overflow-hidden" style={{ height: 150 }}>
          <WideImage url={therapist.profile_image_url} name={therapist.name} />
        </div>
      </div>

      {/* 정보 */}
      <div className="px-5 pb-2 cursor-pointer" onClick={onProfile}>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[18px] font-bold text-gray-900">{therapist.name}</span>
          {therapist.rating != null && (
            <span className="text-[13px] font-semibold" style={{ color: '#BA7517' }}>★ {therapist.rating.toFixed(1)} <span className="text-gray-400 font-normal">({therapist.reviewCount})</span></span>
          )}
          <span className="ml-auto px-2.5 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full">✓ 면허 인증</span>
        </div>
        <div className="text-[13px] text-gray-500 mb-2">
          경력 {therapist.years_experience}년
          {therapist.distance != null && <span style={{ color: '#0A8A7B' }} className="font-bold"> · 📍 {formatDistance(therapist.distance)}</span>}
        </div>
        {therapist.tags && therapist.tags.length > 0 && (
          <div className="flex gap-1.5 flex-wrap mb-3">
            {therapist.tags.slice(0, 3).map((tag, i) => (
              <span key={i} className="text-xs px-2.5 py-1 rounded-md" style={{ background: '#E1F5EE', color: '#0F6E56' }}>{tag}</span>
            ))}
          </div>
        )}
        <p className="text-sm text-gray-600 mb-4 line-clamp-2">{therapist.intro}</p>
      </div>

      {/* 버튼 */}
      <div className="px-5 pb-6 flex gap-2">
        <button onClick={onProfile} className="flex-1 py-3 border border-[#0A8A7B] text-[#0A8A7B] rounded-xl text-sm font-semibold">
          프로필 보기
        </button>
        <button onClick={onConsult} className="flex-1 py-3 bg-[#FEE500] text-gray-900 rounded-xl text-sm font-bold">
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

      if (!tData) { setTherapists([]); setLoading(false); return }

      // 각 치료사의 태그 전체 로드
      const { data: allTtData } = await supabase
        .from('therapist_tags')
        .select('therapist_id, tag_id')
        .in('therapist_id', therapistIds)

      const { data: allTagData } = await supabase
        .from('tags')
        .select('id, label, category')

      const tagMap: Record<string, string> = {}
      ;(allTagData || []).forEach(tg => { tagMap[tg.id] = tg.label })

      const therapistTagsMap: Record<string, string[]> = {}
      ;(allTtData || []).forEach(tt => {
        if (!therapistTagsMap[tt.therapist_id]) therapistTagsMap[tt.therapist_id] = []
        const label = tagMap[tt.tag_id]
        if (label) therapistTagsMap[tt.therapist_id].push(label)
      })

      // 각 치료사의 리뷰 평점 로드
      const { data: reviewData } = await supabase
        .from('reviews')
        .select('therapist_id, rating')
        .in('therapist_id', therapistIds)

      const reviewMap: Record<string, { sum: number; count: number }> = {}
      ;(reviewData || []).forEach(rv => {
        if (!reviewMap[rv.therapist_id]) reviewMap[rv.therapist_id] = { sum: 0, count: 0 }
        reviewMap[rv.therapist_id].sum += rv.rating
        reviewMap[rv.therapist_id].count += 1
      })

      const enriched = tData.map(t => {
        const rv = reviewMap[t.id]
        return {
          ...t,
          distance: (hasLocation && t.latitude && t.longitude)
            ? getDistanceKm(userLat!, userLng!, t.latitude, t.longitude) : null,
          tags: therapistTagsMap[t.id] || [],
          rating: rv ? rv.sum / rv.count : null,
          reviewCount: rv ? rv.count : 0,
        }
      })

      if (hasLocation) {
        enriched.sort((a, b) => {
          if (a.distance === null && b.distance === null) return b.years_experience - a.years_experience
          if (a.distance === null) return 1
          if (b.distance === null) return -1
          return a.distance - b.distance
        })
      } else {
        enriched.sort((a, b) => b.years_experience - a.years_experience)
      }
      setTherapists(enriched)
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
    <main className="max-w-md mx-auto min-h-screen bg-gray-50">
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

      {/* 필터 */}
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
            <div className="flex items-center justify-center h-full bg-gray-50">
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
                <MapBottomSheet
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
                <ResultCard
                  key={t.id}
                  t={t}
                  onProfile={() => router.push('/therapist/' + t.id)}
                  onConsult={() => setSelectedTherapist(t)}
                />
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
