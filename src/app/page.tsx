'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

const BODY_PARTS = [
  { label: '목', emoji: '😣' },
  { label: '어깨', emoji: '💪' },
  { label: '허리', emoji: '🧘' },
  { label: '무릎', emoji: '🦵' },
  { label: '손목', emoji: '✋' },
  { label: '발목', emoji: '🦶' },
  { label: '골반', emoji: '🚶' },
  { label: '기타', emoji: '➕' },
]

const PURPOSES = [
  // 🏥 치료·재활
  { label: '도수치료', type: 'medical' },
  { label: '운동치료', type: 'medical' },
  { label: '통증치료', type: 'medical' },
  // 🏋️ 운동·교정
  { label: '필라테스', type: 'exercise' },
  { label: '1:1 PT', type: 'exercise' },
  { label: '자세교정', type: 'exercise' },
  // 🤰 특수 상황
  { label: '산후 재활', type: 'special' },
  { label: '스포츠 재활', type: 'special' },
  { label: '수술 후 재활', type: 'special' },
]

export default function Home() {
  const router = useRouter()
const [selectedPart, setSelectedPart] = useState<string | null>(null)
  const [selectedPurpose, setSelectedPurpose] = useState<string | null>(null)
  const [userLat, setUserLat] = useState<number | null>(null)
  const [userLng, setUserLng] = useState<number | null>(null)
  const [locationStatus, setLocationStatus] = useState<string>('위치를 불러오는 중...')

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLat(position.coords.latitude)
          setUserLng(position.coords.longitude)
          setLocationStatus('내 주변 검색 가능')
        },
        () => {
          setLocationStatus('위치 정보를 사용할 수 없습니다')
        },
        { timeout: 5000 }
      )
    }
  }, [])
  const purposeObj = PURPOSES.find(p => p.label === selectedPurpose)
  const searchLabel = !selectedPart
    ? '부위를 선택해주세요'
    : purposeObj?.type === 'exercise'
      ? `${selectedPart} 전문 운동전문가 찾기`
      : purposeObj?.type === 'medical'
        ? `${selectedPart} 전문 치료사 찾기`
        : `${selectedPart} 전문가 찾기`

  const handleSearch = () => {
    if (!selectedPart) return
    const params = new URLSearchParams()
    params.set('part', selectedPart)
    if (selectedPurpose) params.set('purpose', selectedPurpose)
    if (userLat) params.set('lat', userLat.toString())
    if (userLng) params.set('lng', userLng.toString())
    router.push(`/search?${params.toString()}`)
  }

  return (
    <main className="max-w-md mx-auto min-h-screen bg-white">
      <div className="px-5 pt-4 pb-2 flex items-center gap-2 text-sm text-gray-400">
        <span>📍</span>
        <span>{locationStatus}</span>
      </div>

      <div className="text-center px-5 pt-8 pb-10">
        <h1 className="text-3xl font-extrabold text-gray-900 leading-tight tracking-tight">
          어디가<br />불편하신가요?
        </h1>
        <p className="text-sm text-gray-400 mt-3 leading-relaxed">
          물리치료사 · 물리치료사 출신 운동전문가를<br />
          부위와 목적에 맞게 찾아드려요
        </p>
      </div>

      <div className="px-5 grid grid-cols-4 gap-3 mb-8">
        {BODY_PARTS.map((part) => (
          <button
            key={part.label}
            onClick={() => {
              setSelectedPart(selectedPart === part.label ? null : part.label)
              setSelectedPurpose(null)
            }}
            className={
              'py-5 rounded-2xl text-center transition-all duration-200 ' +
              (selectedPart === part.label
                ? 'bg-[#0A8A7B] text-white shadow-lg'
                : 'bg-gray-50 text-gray-700 border border-gray-100')
            }
          >
            <div className="text-xl mb-1">{part.emoji}</div>
            <div className="text-sm font-bold">{part.label}</div>
          </button>
        ))}
      </div>

      {selectedPart && (
        <div className="px-5 mb-8">
          <p className="text-sm font-bold text-gray-700 mb-3">
            {selectedPart} · 어떤 도움이 필요하세요?
          </p>

          <div className="mb-3">
            <p className="text-xs text-gray-400 mb-2 font-semibold">🏥 치료 · 재활</p>
            <div className="flex flex-wrap gap-2">
              {PURPOSES.filter(p => p.type === 'medical').map((purpose) => (
                <button
                  key={purpose.label}
                  onClick={() => setSelectedPurpose(selectedPurpose === purpose.label ? null : purpose.label)}
                  className={
                    'px-4 py-2.5 rounded-full text-sm font-semibold transition-all ' +
                    (selectedPurpose === purpose.label
                      ? 'bg-[#0A8A7B] text-white'
                      : 'bg-gray-50 text-gray-500 border border-gray-100')
                  }
                >
                  {purpose.label}
                </button>
              ))}
            </div>
          </div>

          <div className="mb-3">
            <p className="text-xs text-gray-400 mb-2 font-semibold">🏋️ 운동 · 교정</p>
            <div className="flex flex-wrap gap-2">
              {PURPOSES.filter(p => p.type === 'exercise').map((purpose) => (
                <button
                  key={purpose.label}
                  onClick={() => setSelectedPurpose(selectedPurpose === purpose.label ? null : purpose.label)}
                  className={
                    'px-4 py-2.5 rounded-full text-sm font-semibold transition-all ' +
                    (selectedPurpose === purpose.label
                      ? 'bg-amber-500 text-white'
                      : 'bg-gray-50 text-gray-500 border border-gray-100')
                  }
                >
                  {purpose.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs text-gray-400 mb-2 font-semibold">🤰 특수 상황</p>
            <div className="flex flex-wrap gap-2">
              {PURPOSES.filter(p => p.type === 'special').map((purpose) => (
                <button
                  key={purpose.label}
                  onClick={() => setSelectedPurpose(selectedPurpose === purpose.label ? null : purpose.label)}
                  className={
                    'px-4 py-2.5 rounded-full text-sm font-semibold transition-all ' +
                    (selectedPurpose === purpose.label
                      ? 'bg-violet-500 text-white'
                      : 'bg-gray-50 text-gray-500 border border-gray-100')
                  }
                >
                  {purpose.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="px-5 pb-8">
        <button
          disabled={!selectedPart}
          onClick={handleSearch}
          className={
            'w-full py-4 rounded-2xl text-base font-bold transition-all ' +
            (selectedPart
              ? 'bg-[#0A8A7B] text-white shadow-lg active:scale-[0.98]'
              : 'bg-gray-100 text-gray-300 cursor-not-allowed')
          }
        >
          {searchLabel}
        </button>
      </div>

      <div className="px-5 pb-6 text-center">
        <p className="text-xs text-gray-300 leading-relaxed">
          물찾사의 모든 전문가는<br />
          물리치료사 면허를 보유하고 있습니다 🛡️
        </p>
      </div>

      <div className="mx-5 mb-8 p-5 bg-gradient-to-br from-[#E8F6F4] to-white border border-[#0A8A7B]/10 rounded-2xl">
        <p className="text-sm font-bold text-gray-900 mb-1">물리치료사이신가요? 👋</p>
        <p className="text-xs text-gray-500 leading-relaxed mb-4">
          물찾사에 가입하고 환자와 직접 연결되세요.<br />
          면허 인증 후 24시간 내 활성화됩니다.
        </p>
        <button
          onClick={() => router.push('/register')}
          className="w-full py-3 bg-white border border-[#0A8A7B] text-[#0A8A7B] rounded-xl font-bold text-sm hover:bg-[#0A8A7B] hover:text-white transition-all mb-2"
        >
          치료사로 가입하기 →
        </button>
        <button
          onClick={() => router.push('/mypage')}
          className="w-full py-3 bg-transparent text-gray-400 rounded-xl font-semibold text-sm"
        >
          이미 가입하셨나요? 프로필 수정 →
        </button>
      </div>
    </main>
  )
}