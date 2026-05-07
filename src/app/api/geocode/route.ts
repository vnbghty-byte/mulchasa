import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const address = searchParams.get('address')

  if (!address) {
    return NextResponse.json({ error: '주소를 입력해주세요' }, { status: 400 })
  }

  const response = await fetch(
    `https://dapi.kakao.com/v2/local/search/address.json?query=${encodeURIComponent(address)}`,
    {
      headers: {
        Authorization: `KakaoAK ${process.env.KAKAO_REST_API_KEY}`,
      },
    }
  )

  const data = await response.json()

  if (!data.documents || data.documents.length === 0) {
    return NextResponse.json({ error: '주소를 찾을 수 없습니다' }, { status: 404 })
  }

  const { x, y } = data.documents[0]
  return NextResponse.json({
    latitude: parseFloat(y),
    longitude: parseFloat(x),
    address: data.documents[0].address_name,
  })
}