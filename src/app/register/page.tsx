'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

const PRACTITIONER_TYPES = [
  { value: 'hospital_pt', label: '🏥 병원 물리치료사', desc: '병원·의원 소속' },
  { value: 'exercise_specialist', label: '🏋️ 운동 전문가', desc: '필라테스·1:1 PT' },
  { value: 'both', label: '🔄 둘 다', desc: '병원 근무 + 개인 활동' },
]

const BODY_PART_OPTIONS = ['목', '어깨', '허리', '무릎', '손목', '발목', '골반']

const PURPOSE_OPTIONS = [
  '수술 후 재활', '만성 통증', '디스크',
  '스포츠 재활', '체형교정', '산후 재활',
  '운동 지도', '체력 강화', '자세 교정',
]

export default function RegisterPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [submitting, setSubmitting] = useState(false)

  const [name, setName] = useState('')
  const [licenseNumber, setLicenseNumber] = useState('')
  const [yearsExperience, setYearsExperience] = useState<number>(1)
  const [practitionerType, setPractitionerType] = useState('')
  const [hospitalName, setHospitalName] = useState('')
  const [studioName, setStudioName] = useState('')
  const [phone, setPhone] = useState('')
  const [kakaoLink, setKakaoLink] = useState('')
  const [intro, setIntro] = useState('')
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

  const canProceedStep1 = name.trim() && licenseNumber.trim() && phone.trim()
  const canProceedStep2 = practitionerType && (hospitalName.trim() || studioName.trim())
  const canProceedStep3 = selectedBodyParts.length > 0 && selectedPurposes.length > 0
  const canSubmit = intro.trim().length >= 30 && kakaoLink.trim()

  const handleSubmit = async () => {
    setSubmitting(true)
    try {
      const { data: therapistData, error: therapistError } = await supabase
        .from('therapists')
        .insert({
          name,
          license_number: licenseNumber,
          years_experience: yearsExperience,
          practitioner_type: practitionerType,
          hospital_name: hospitalName || null,
          studio_name: studioName || null,
          phone,
          kakao_link: kakaoLink,
          intro,
          verification_status: 'pending',
        })
        .select()
        .single()

      if (therapistError) throw therapistError

      const allTags = [...selectedBodyParts, ...selectedPurposes]
      const { data: tagData } = await supabase
        .from('tags')
        .select('id, label')
        .in('label', allTags)

      if (tagData && tagData.length > 0) {
        const therapistTags = tagData.map(tag => ({
          therapist_id: therapistData.id,
          tag_id: tag.id,
        }))
        await supabase.from('therapist_tags').insert(therapistTags)
      }

      setStep(5)
    } catch (error) {
      console.error('Error:', error)
      alert('가입 신청 중 오류가 발생했습니다. 다시 시도해주세요.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="max-w-md mx-auto min-h-screen bg-white pb-24">
      <div className="sticky top-0 bg-white border-b border-gray-100 px-5 py-4 flex items-center gap-3 z-10">
        {step > 1 && step < 5 && (
          <button onClick={() => setStep(step - 1)} className="text-gray-600 text-xl">←</button>
        )}
        <div className="flex-1">
          <p className="text-xs text-gray-400">치료사 가입 {step < 5 ? `${step}/4` : ''}</p>
          <h1 className="text-base font-bold text-gray-900">
            {step === 1 && '기본 정보'}
            {step === 2 && '활동 정보'}
            {step === 3 && '전문 분야'}
            {step === 4 && '자기소개'}
            {step === 5 && '가입 신청 완료'}
          </h1>
        </div>
      </div>

      {step < 5 && (
        <div className="px-5 pt-3">
          <div className="flex gap-1">
            {[1, 2, 3, 4].map(s => (
              <div key={s} className={`h-1 flex-1 rounded-full ${s <= step ? 'bg-[#0A8A7B]' : 'bg-gray-100'}`} />
            ))}
          </div>
        </div>
      )}

      <div className="px-5 py-6">
        {step === 1 && (
          <div className="space-y-5">
            <div>
              <label className="text-sm font-bold text-gray-700 block mb-2">이름 *</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="실명 입력"
                className="w-full p-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#0A8A7B]"
              />
            </div>

            <div>
              <label className="text-sm font-bold text-gray-700 block mb-2">물리치료사 면허번호 *</label>
              <input
                type="text"
                value={licenseNumber}
                onChange={(e) => setLicenseNumber(e.target.value)}
                placeholder="예: 12345"
                className="w-full p-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#0A8A7B]"
              />
              <p className="text-xs text-gray-400 mt-2">
                🛡️ 보건복지부에 등록된 면허번호로 24시간 내 인증됩니다
              </p>
            </div>

            <div>
              <label className="text-sm font-bold text-gray-700 block mb-2">경력 (년) *</label>
              <input
                type="number"
                value={yearsExperience}
                onChange={(e) => setYearsExperience(Number(e.target.value))}
                min="0"
                className="w-full p-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#0A8A7B]"
              />
            </div>

            <div>
              <label className="text-sm font-bold text-gray-700 block mb-2">연락처 *</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="010-0000-0000"
                className="w-full p-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#0A8A7B]"
              />
              <p className="text-xs text-gray-400 mt-2">
                * 환자에게 노출되지 않으며, 인증 결과 안내용으로만 사용됩니다
              </p>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-5">
            <div>
              <label className="text-sm font-bold text-gray-700 block mb-3">활동 유형 *</label>
              <div className="space-y-2">
                {PRACTITIONER_TYPES.map(type => (
                  <button
                    key={type.value}
                    onClick={() => setPractitionerType(type.value)}
                    className={
                      'w-full p-4 rounded-xl text-left transition-all ' +
                      (practitionerType === type.value
                        ? 'bg-[#0A8A7B] text-white'
                        : 'bg-gray-50 text-gray-700 border border-gray-100')
                    }
                  >
                    <div className="font-bold mb-1">{type.label}</div>
                    <div className={`text-xs ${practitionerType === type.value ? 'text-white/80' : 'text-gray-400'}`}>
                      {type.desc}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {(practitionerType === 'hospital_pt' || practitionerType === 'both') && (
              <div>
                <label className="text-sm font-bold text-gray-700 block mb-2">소속 병원·의원 *</label>
                <input
                  type="text"
                  value={hospitalName}
                  onChange={(e) => setHospitalName(e.target.value)}
                  placeholder="예: 강남재활의학과"
                  className="w-full p-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#0A8A7B]"
                />
              </div>
            )}

            {(practitionerType === 'exercise_specialist' || practitionerType === 'both') && (
              <div>
                <label className="text-sm font-bold text-gray-700 block mb-2">스튜디오·센터명 *</label>
                <input
                  type="text"
                  value={studioName}
                  onChange={(e) => setStudioName(e.target.value)}
                  placeholder="예: 바디밸런스 필라테스"
                  className="w-full p-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#0A8A7B]"
                />
              </div>
            )}
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6">
            <div>
              <label className="text-sm font-bold text-gray-700 block mb-3">
                전문 부위 * <span className="text-xs text-gray-400 font-normal">(복수 선택)</span>
              </label>
              <div className="flex flex-wrap gap-2">
                {BODY_PART_OPTIONS.map(part => (
                  <button
                    key={part}
                    onClick={() => toggleBodyPart(part)}
                    className={
                      'px-4 py-2.5 rounded-full text-sm font-semibold transition-all ' +
                      (selectedBodyParts.includes(part)
                        ? 'bg-[#0A8A7B] text-white'
                        : 'bg-gray-50 text-gray-500 border border-gray-100')
                    }
                  >
                    {part}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-sm font-bold text-gray-700 block mb-3">
                전문 분야 * <span className="text-xs text-gray-400 font-normal">(복수 선택)</span>
              </label>
              <div className="flex flex-wrap gap-2">
                {PURPOSE_OPTIONS.map(purpose => (
                  <button
                    key={purpose}
                    onClick={() => togglePurpose(purpose)}
                    className={
                      'px-4 py-2.5 rounded-full text-sm font-semibold transition-all ' +
                      (selectedPurposes.includes(purpose)
                        ? 'bg-[#0A8A7B] text-white'
                        : 'bg-gray-50 text-gray-500 border border-gray-100')
                    }
                  >
                    {purpose}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-5">
            <div>
              <label className="text-sm font-bold text-gray-700 block mb-2">카카오톡 오픈채팅 링크 *</label>
              <input
                type="text"
                value={kakaoLink}
                onChange={(e) => setKakaoLink(e.target.value)}
                placeholder="https://open.kakao.com/o/..."
                className="w-full p-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#0A8A7B]"
              />
              <p className="text-xs text-gray-400 mt-2">
                환자가 상담 요청 시 이 링크로 연결됩니다
              </p>
            </div>

            <div>
              <label className="text-sm font-bold text-gray-700 block mb-2">
                자기소개 * <span className="text-xs text-gray-400 font-normal">(최소 30자)</span>
              </label>
              <textarea
                value={intro}
                onChange={(e) => setIntro(e.target.value)}
                placeholder="환자에게 보여질 자기소개를 작성해주세요. 전문 분야, 치료 철학, 경력 등을 간단히 적어주시면 좋습니다."
                rows={6}
                className="w-full p-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#0A8A7B] resize-none"
              />
              <p className="text-xs text-gray-400 mt-2 text-right">
                {intro.length} / 최소 30자
              </p>
            </div>
          </div>
        )}

        {step === 5 && (
          <div className="text-center py-12">
            <div className="text-6xl mb-6">🎉</div>
            <h2 className="text-xl font-extrabold text-gray-900 mb-3">가입 신청 완료!</h2>
            <p className="text-sm text-gray-500 leading-relaxed mb-8">
              {name} 선생님의 신청이 접수되었습니다.<br />
              보건복지부 면허 인증 후 24시간 내<br />
              연락처({phone})로 안내드리겠습니다.
            </p>
            <div className="bg-[#E8F6F4] rounded-2xl p-5 mb-8 text-left">
              <p className="text-sm font-bold text-[#067A6C] mb-2">📋 다음 단계</p>
              <ol className="text-sm text-gray-700 space-y-1.5 list-decimal list-inside">
                <li>물찾사가 면허번호를 보건복지부에 조회합니다</li>
                <li>인증 완료 시 카톡으로 활성화 링크가 발송됩니다</li>
                <li>활성화 후 검색 결과에 노출됩니다</li>
              </ol>
            </div>
            <button
              onClick={() => router.push('/')}
              className="px-8 py-3 bg-[#0A8A7B] text-white rounded-xl font-semibold"
            >
              홈으로
            </button>
          </div>
        )}
      </div>

      {step < 5 && (
        <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto px-5 py-4 bg-white border-t border-gray-100">
          {step < 4 ? (
            <button
              onClick={() => setStep(step + 1)}
              disabled={
                (step === 1 && !canProceedStep1) ||
                (step === 2 && !canProceedStep2) ||
                (step === 3 && !canProceedStep3)
              }
              className={
                'w-full py-4 rounded-2xl text-base font-bold transition-all ' +
                (((step === 1 && canProceedStep1) ||
                  (step === 2 && canProceedStep2) ||
                  (step === 3 && canProceedStep3))
                  ? 'bg-[#0A8A7B] text-white active:scale-[0.98]'
                  : 'bg-gray-100 text-gray-300 cursor-not-allowed')
              }
            >
              다음
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={!canSubmit || submitting}
              className={
                'w-full py-4 rounded-2xl text-base font-bold transition-all ' +
                (canSubmit && !submitting
                  ? 'bg-[#0A8A7B] text-white active:scale-[0.98]'
                  : 'bg-gray-100 text-gray-300 cursor-not-allowed')
              }
            >
              {submitting ? '신청 중...' : '가입 신청하기'}
            </button>
          )}
        </div>
      )}
    </main>
  )
}