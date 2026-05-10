'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

const PURPOSE_OPTIONS = [
  '도수치료', '운동치료', '통증치료',
  '필라테스', '1:1 PT', '자세교정',
  '산후 재활', '스포츠 재활', '수술 후 재활',
]

const BODY_PART_OPTIONS = ['목', '어깨', '허리', '무릎', '손목', '발목', '골반']

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
  latitude: number | null
  longitude: number | null
}

export default function MyPage() {
  const router = useRouter()
  const [step, setStep] = useState<'verify' | 'edit' | 'done'>('verify')
  const [name, setName] = useState('')
  const [licenseNumber, setLicenseNumber] = useState('')
  const [verifying, setVerifying] = useState(false)
  const [verifyError, setVerifyError] = useState('')
  const [therapist, setTherapist] = useState<Therapist | null>(null)
  const [saving, setSaving] = useState(false)

  const [kakaoLink, setKakaoLink] = useState('')
  const [intro, setIntro] = useState('')
  const [hospitalName, setHospitalName] = useState('')
  const [studioName, setStudioName] = useState('')
  const [address, setAddress] = useState('')
  const [addressResult, setAddressResult] = useState<{ latitude: number; longitude: number; address: string } | null>(null)
  const [addressLoading, setAddressLoading] = useState(false)
  const [selectedBodyParts, setSelectedBodyParts] = useState<string[]>([])
  const [selectedPurposes, setSelectedPurposes] = useState<string[]>([])

  const toggleBodyPart = (part: string) => {
    setSelectedBodyParts(prev =>
      prev.includes(part) ? prev.filter(p => p !== part) : [...prev, part]
    )
  }

  const togglePurpose = (purpose: string) => {
    setSelectedPurposes(prev =>
      prev.includes(purpose) ? prev.filter(p => p !== purpose) : [...prev, purpose]
    )
  }

  const handleVerify = async () => {
    if (!name.trim() || !licenseNumber.trim()) return
    setVerifying(true)
    setVerifyError('')

    const { data } = await supabase
      .from('therapists')
      .select('*')
      .eq('name', name.trim())
      .eq('license_number', licenseNumber.trim())
      .single()

    if (!data) {
      setVerifyError('이름 또는 면허번호가 일치하지 않습니다.')
      setVerifying(false)
      return
    }

    setTherapist(data)
    setKakaoLink(data.kakao_link || '')
    setIntro(data.intro || '')
    setHospitalName(data.hospital_name || '')
    setStudioName(data.studio_name || '')

    const { data: ttData } = await supabase
      .from('therapist_tags')
      .select('tag_id')
      .eq('therapist_id', data.id)

    if (ttData && ttData.length > 0) {
      const tagIds = ttData.map(t => t.tag_id)
      const { data: tagData } = await supabase
        .from('tags')
        .select('category, label')
        .in('id', tagIds)

      if (tagData) {
        setSelectedBodyParts(tagData.filter(t => t.category === 'body_part').map(t => t.label))
        setSelectedPurposes(tagData.filter(t => t.category === 'purpose').map(t => t.label))
      }
    }

    setVerifying(false)
    setStep('edit')
  }

  const handleAddressSearch = async () => {
    if (!address.trim()) return
    setAddressLoading(true)
    try {
      const res = await fetch(`/api/geocode?address=${encodeURIComponent(address)}`)
      const data = await res.json()
      if (res.ok) {
        setAddressResult(data)
      }
    } catch {
      console.error('주소 검색 오류')
    } finally {
      setAddressLoading(false)
    }
  }

  const handleSave = async () => {
    if (!therapist) return
    setSaving(true)

    await supabase
      .from('therapists')
      .update({
        kakao_link: kakaoLink,
        intro,
        hospital_name: hospitalName || null,
        studio_name: studioName || null,
        latitude: addressResult?.latitude ?? therapist.latitude,
        longitude: addressResult?.longitude ?? therapist.longitude,
      })
      .eq('id', therapist.id)

    await supabase
      .from('therapist_tags')
      .delete()
      .eq('therapist_id', therapist.id)

    const allTags = [...selectedBodyParts, ...selectedPurposes]
    const { data: tagData } = await supabase
      .from('tags')
      .select('id, label')
      .in('label', allTags)

    if (tagData && tagData.length > 0) {
      await supabase.from('therapist_tags').insert(
        tagData.map(tag => ({ therapist_id: therapist.id, tag_id: tag.id }))
      )
    }

    setSaving(false)
    setStep('done')
  }

  return (
    <main className="max-w-md mx-auto min-h-screen bg-white pb-24">
      <div className="sticky top-0 bg-white border-b border-gray-100 px-5 py-4 flex items-center gap-3 z-10">
        <button onClick={() => router.back()} className="text-gray-600 text-xl">←</button>
        <h1 className="text-base font-bold text-gray-900">
          {step === 'verify' && '본인 확인'}
          {step === 'edit' && '프로필 수정'}
          {step === 'done' && '수정 완료'}
        </h1>
      </div>

      <div className="px-5 py-6">
        {step === 'verify' && (
          <div className="space-y-5">
            <div className="bg-[#E8F6F4] rounded-2xl p-4 mb-6">
              <p className="text-sm font-bold text-[#067A6C] mb-1">🔐 본인 확인</p>
              <p className="text-xs text-gray-600 leading-relaxed">
                가입 시 등록한 이름과 면허번호로 본인 확인 후 프로필을 수정할 수 있습니다.
              </p>
            </div>

            <div>
              <label className="text-sm font-bold text-gray-700 block mb-2">이름</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="가입 시 등록한 이름"
                className="w-full p-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#0A8A7B]"
              />
            </div>

            <div>
              <label className="text-sm font-bold text-gray-700 block mb-2">면허번호</label>
              <input
                type="text"
                value={licenseNumber}
                onChange={(e) => setLicenseNumber(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleVerify()}
                placeholder="가입 시 등록한 면허번호"
                className="w-full p-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#0A8A7B]"
              />
            </div>

            {verifyError && (
              <p className="text-sm text-red-500 text-center">{verifyError}</p>
            )}

            <button
              onClick={handleVerify}
              disabled={verifying || !name.trim() || !licenseNumber.trim()}
              className={'w-full py-4 rounded-2xl font-bold text-base transition-all ' + (!verifying && name.trim() && licenseNumber.trim() ? 'bg-[#0A8A7B] text-white' : 'bg-gray-100 text-gray-300 cursor-not-allowed')}
            >
              {verifying ? '확인 중...' : '본인 확인'}
            </button>
          </div>
        )}

        {step === 'edit' && therapist && (
          <div className="space-y-6">
            <div className="bg-gray-50 rounded-2xl p-4">
              <p className="text-sm font-bold text-gray-900">{therapist.name} 선생님</p>
              <p className="text-xs text-gray-400 mt-1">경력 {therapist.years_experience}년 · 면허번호 {therapist.license_number}</p>
            </div>

            <div>
              <label className="text-sm font-bold text-gray-700 block mb-2">카카오톡 오픈채팅 링크</label>
              <input type="text" value={kakaoLink} onChange={(e) => setKakaoLink(e.target.value)} placeholder="https://open.kakao.com/o/..." className="w-full p-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#0A8A7B]" />
            </div>

            <div>
              <label className="text-sm font-bold text-gray-700 block mb-2">소속 병원·의원</label>
              <input type="text" value={hospitalName} onChange={(e) => setHospitalName(e.target.value)} placeholder="예: 강남재활의학과" className="w-full p-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#0A8A7B]" />
            </div>

            <div>
              <label className="text-sm font-bold text-gray-700 block mb-2">스튜디오·센터명</label>
              <input type="text" value={studioName} onChange={(e) => setStudioName(e.target.value)} placeholder="예: 바디밸런스 필라테스" className="w-full p-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#0A8A7B]" />
            </div>

            <div>
              <label className="text-sm font-bold text-gray-700 block mb-2">소속 주소 변경</label>
              <div className="flex gap-2 mb-2">
                <input type="text" value={address} onChange={(e) => setAddress(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleAddressSearch()} placeholder="새 주소 입력" className="flex-1 p-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#0A8A7B]" />
                <button onClick={handleAddressSearch} disabled={addressLoading || !address.trim()} className="px-4 py-3 bg-[#0A8A7B] text-white rounded-xl text-sm font-bold shrink-0 disabled:bg-gray-200 disabled:text-gray-400">
                  {addressLoading ? '검색 중' : '검색'}
                </button>
              </div>
              {addressResult && (
                <div className="bg-green-50 border border-green-200 rounded-xl p-3">
                  <p className="text-xs font-bold text-green-700 mb-1">✅ 위치 확인됨</p>
                  <p className="text-xs text-green-600">{addressResult.address}</p>
                </div>
              )}
              {therapist.latitude && !addressResult && (
                <p className="text-xs text-gray-400 mt-1">📍 현재 등록된 위치 있음 (변경하려면 새 주소 검색)</p>
              )}
            </div>

            <div>
              <label className="text-sm font-bold text-gray-700 block mb-3">전문 부위 <span className="text-xs text-gray-400 font-normal">(복수 선택)</span></label>
              <div className="flex flex-wrap gap-2">
                {BODY_PART_OPTIONS.map(part => (
                  <button key={part} onClick={() => toggleBodyPart(part)}
                    className={'px-4 py-2.5 rounded-full text-sm font-semibold transition-all ' + (selectedBodyParts.includes(part) ? 'bg-[#0A8A7B] text-white' : 'bg-gray-50 text-gray-500 border border-gray-100')}>
                    {part}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-sm font-bold text-gray-700 block mb-3">전문 분야 <span className="text-xs text-gray-400 font-normal">(복수 선택)</span></label>
              <div className="flex flex-wrap gap-2">
                {PURPOSE_OPTIONS.map(purpose => (
                  <button key={purpose} onClick={() => togglePurpose(purpose)}
                    className={'px-4 py-2.5 rounded-full text-sm font-semibold transition-all ' + (selectedPurposes.includes(purpose) ? 'bg-[#0A8A7B] text-white' : 'bg-gray-50 text-gray-500 border border-gray-100')}>
                    {purpose}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-sm font-bold text-gray-700 block mb-2">자기소개 <span className="text-xs text-gray-400 font-normal">(최소 30자)</span></label>
              <textarea value={intro} onChange={(e) => setIntro(e.target.value)} rows={6} className="w-full p-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#0A8A7B] resize-none" />
              <p className="text-xs text-gray-400 mt-1 text-right">{intro.length}자</p>
            </div>
          </div>
        )}

        {step === 'done' && (
          <div className="text-center py-16">
            <div className="text-6xl mb-6">✅</div>
            <h2 className="text-xl font-extrabold text-gray-900 mb-3">수정 완료!</h2>
            <p className="text-sm text-gray-500 leading-relaxed mb-8">
              프로필이 성공적으로 업데이트되었습니다.
            </p>
            <button onClick={() => router.push('/')} className="px-8 py-3 bg-[#0A8A7B] text-white rounded-xl font-semibold">홈으로</button>
          </div>
        )}
      </div>

      {step === 'edit' && (
        <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto px-5 py-4 bg-white border-t border-gray-100">
          <button
            onClick={handleSave}
            disabled={saving || intro.trim().length < 30}
            className={'w-full py-4 rounded-2xl font-bold text-base transition-all ' + (!saving && intro.trim().length >= 30 ? 'bg-[#0A8A7B] text-white active:scale-[0.98]' : 'bg-gray-100 text-gray-300 cursor-not-allowed')}
          >
            {saving ? '저장 중...' : '저장하기'}
          </button>
        </div>
      )}
    </main>
  )
}