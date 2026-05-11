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
  profile_image_url: string | null
  certifications: string[] | null
}

interface Tag {
  category: string
  label: string
}

interface Review {
  id: string
  nickname: string
  rating: number
  content: string
  created_at: string
}

export default function TherapistDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [therapist, setTherapist] = useState<Therapist | null>(null)
  const [tags, setTags] = useState<Tag[]>([])
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [showReviewForm, setShowReviewForm] = useState(false)
  const [nickname, setNickname] = useState('')
  const [rating, setRating] = useState(5)
  const [content, setContent] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const fetchReviews = async (therapistId: string) => {
    const { data } = await supabase
      .from('reviews')
      .select('*')
      .eq('therapist_id', therapistId)
      .order('created_at', { ascending: false })
    setReviews(data || [])
  }

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

      if (!tData) { setLoading(false); return }
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

      await fetchReviews(id)
      setLoading(false)
    }
    fetchData()
  }, [params.id])

  const handleSubmitReview = async () => {
    if (!therapist || !nickname.trim() || content.trim().length < 10) return
    setSubmitting(true)

    const { error } = await supabase.from('reviews').insert({
      therapist_id: therapist.id,
      nickname: nickname.trim(),
      rating,
      content: content.trim(),
    })

    if (!error) {
      await fetchReviews(therapist.id)
      setNickname('')
      setRating(5)
      setContent('')
      setShowReviewForm(false)
    }
    setSubmitting(false)
  }

  const averageRating = reviews.length > 0
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : null

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
        <div className="flex items-start gap-5 mb-4">
          <div className="shrink-0" style={{width: 96, height: 96, marginRight: 20}}>
            {therapist.profile_image_url ? (
              <img
                src={therapist.profile_image_url}
                alt={therapist.name}
                style={{width: 96, height: 96, borderRadius: '50%', objectFit: 'cover'}}
              />
            ) : (
              <div style={{width: 96, height: 96, borderRadius: '50%'}} className="bg-gray-200 flex items-center justify-center">
                <svg width="60" height="60" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="12" cy="8" r="4" fill="#9CA3AF"/>
                  <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </div>
            )}
          </div>
          <div className="flex-1">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-2xl font-extrabold text-gray-900">{therapist.name}</h2>
                <p className="text-sm text-gray-500 mt-0.5">경력 {therapist.years_experience}년</p>
              </div>
              <span className="px-3 py-1.5 bg-green-100 text-green-700 text-xs font-bold rounded-full shrink-0">✓ 면허 인증</span>
            </div>
            {averageRating && (
              <div className="flex items-center gap-1 mt-1">
                <span className="text-yellow-400 text-sm">{'⭐'.repeat(Math.round(Number(averageRating)))}</span>
                <span className="text-sm font-bold text-gray-700">{averageRating}</span>
                <span className="text-xs text-gray-400">({reviews.length}개 후기)</span>
              </div>
            )}
          </div>
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
      </div>

      {bodyParts.length > 0 && (
        <div className="bg-white px-5 py-5 mb-2">
          <h3 className="text-sm font-bold text-gray-900 mb-3">🦴 전문 부위</h3>
          <div className="flex flex-wrap gap-2">
            {bodyParts.map(tag => (
              <span key={tag.label} className="px-3 py-1.5 bg-[#E8F6F4] text-[#0A8A7B] text-sm font-semibold rounded-full">{tag.label}</span>
            ))}
          </div>
        </div>
      )}

      {purposes.length > 0 && (
        <div className="bg-white px-5 py-5 mb-2">
          <h3 className="text-sm font-bold text-gray-900 mb-3">🎯 전문 분야</h3>
          <div className="flex flex-wrap gap-2">
            {purposes.map(tag => (
              <span key={tag.label} className="px-3 py-1.5 bg-violet-50 text-violet-600 text-sm font-semibold rounded-full">{tag.label}</span>
            ))}
          </div>
        </div>
      )}
{therapist.certifications && therapist.certifications.length > 0 && (
        <div className="bg-white px-5 py-5 mb-2">
          <h3 className="text-sm font-bold text-gray-900 mb-3">🏅 자격증</h3>
          <div className="flex flex-wrap gap-2">
            {therapist.certifications.map(cert => (
              <span key={cert} className="px-3 py-1.5 bg-yellow-50 text-yellow-700 text-xs font-semibold rounded-full border border-yellow-100">
                ✓ {cert}
              </span>
            ))}
          </div>
        </div>
      )}
      <div className="bg-white px-5 py-5 mb-2">
        <h3 className="text-sm font-bold text-gray-900 mb-3">💬 자기소개</h3>
        <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{therapist.intro}</p>
      </div>

      <div className="bg-white px-5 py-5 mb-2">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-gray-900">⭐ 후기</h3>
            {averageRating && (
              <p className="text-xs text-gray-400 mt-0.5">평균 {averageRating}점 · {reviews.length}개</p>
            )}
          </div>
          <button
            onClick={() => setShowReviewForm(!showReviewForm)}
            className="px-4 py-2 bg-[#0A8A7B] text-white rounded-xl text-xs font-bold"
          >
            {showReviewForm ? '취소' : '후기 작성'}
          </button>
        </div>

        {showReviewForm && (
          <div className="bg-gray-50 rounded-2xl p-4 mb-4 space-y-3">
            <div>
              <label className="text-xs font-bold text-gray-600 block mb-1.5">닉네임</label>
              <input
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="닉네임 입력"
                maxLength={20}
                className="w-full p-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#0A8A7B]"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-gray-600 block mb-1.5">별점</label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map(star => (
                  <button
                    key={star}
                    onClick={() => setRating(star)}
                    className="text-2xl transition-all"
                  >
                    {star <= rating ? '⭐' : '✩'}
                  </button>
                ))}
                <span className="text-sm text-gray-500 ml-1 self-center">{rating}점</span>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-gray-600 block mb-1.5">
                후기 내용 <span className="text-gray-400 font-normal">(최소 10자)</span>
              </label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="치료 경험을 자유롭게 작성해주세요"
                rows={4}
                className="w-full p-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#0A8A7B] resize-none"
              />
              <p className="text-xs text-gray-400 text-right mt-1">{content.length}자</p>
            </div>

            <button
              onClick={handleSubmitReview}
              disabled={submitting || !nickname.trim() || content.trim().length < 10}
              className={'w-full py-3 rounded-xl font-bold text-sm transition-all ' + (!submitting && nickname.trim() && content.trim().length >= 10 ? 'bg-[#0A8A7B] text-white' : 'bg-gray-200 text-gray-400 cursor-not-allowed')}
            >
              {submitting ? '등록 중...' : '후기 등록'}
            </button>
          </div>
        )}

        {reviews.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-400 text-sm">아직 후기가 없습니다</p>
            <p className="text-gray-300 text-xs mt-1">첫 번째 후기를 남겨보세요!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {reviews.map(review => (
              <div key={review.id} className="border border-gray-100 rounded-2xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-gray-800">{review.nickname}</span>
                    <span className="text-yellow-400 text-xs">{'⭐'.repeat(review.rating)}</span>
                  </div>
                  <span className="text-xs text-gray-300">
                    {new Date(review.created_at).toLocaleDateString('ko-KR')}
                  </span>
                </div>
                <p className="text-sm text-gray-600 leading-relaxed">{review.content}</p>
              </div>
            ))}
          </div>
        )}
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