// 서비스 워커 캐시 이름과 버전
const CACHE_NAME = 'random-wheel-cache-v1';

// 캐시할 파일 목록
const CACHE_URLS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon.png',
  '/open.png',
];

// 서비스 워커 설치
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('캐시 생성 완료');
        return cache.addAll(CACHE_URLS);
      })
  );
});

// 서비스 워커 활성화 (이전 캐시 삭제)
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('이전 캐시 삭제:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// 네트워크 요청 가로채기 (캐시 우선 전략)
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // 캐시에서 찾으면 반환
        if (response) {
          return response;
        }
        
        // 캐시에 없으면 네트워크 요청
        return fetch(event.request)
          .then((response) => {
            // 유효한 응답이 아니면 그냥 반환
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }
            
            // 응답을 복제하여 캐시에 저장
            const responseToCache = response.clone();
            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache);
              });
              
            return response;
          });
      })
      .catch((error) => {
        console.log('네트워크 요청 실패:', error);
        // 오프라인 fallback 페이지 등을 제공할 수 있음
      })
  );
});
