const CACHE_NAME = 'mulchasa-v1'
const urlsToCache = [
  '/',
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
]

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(urlsToCache))
  )
})

// fetch 이벤트 완전 제거 - 모든 요청 네트워크 직접 처리
self.addEventListener('fetch', (event) => {
  // 캐시된 정적 파일만 처리
  if (urlsToCache.includes(new URL(event.request.url).pathname)) {
    event.respondWith(
      caches.match(event.request).then((response) => response || fetch(event.request))
    )
  }
  // 그 외 모든 요청(Supabase, Kakao 등)은 Service Worker가 개입하지 않음
})