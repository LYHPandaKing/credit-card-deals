// 設置緩存版本名稱
const CACHE_NAME = 'my-site-cache-v2';  // 更新緩存版本號
const TEMP_CACHE = 'temp-cache-v1';  // 可選的臨時緩存（用于更新期間）
const FILES_TO_CACHE = [
    '/',  // 網站首頁
    '/readme.html',
    '/assets/styles.css',
    '/assets/favicon.ico',
    '/assets/icon-192x192.png',
    '/assets/icon-512x512.png',
    // 在此處添加更多需要緩存的資源
];

// 安裝階段：將文件添加到緩存中
self.addEventListener('install', (event) => {
    console.log('Service Worker 安裝中...');
    event.waitUntil(
        caches.open(TEMP_CACHE).then((cache) => {
            console.log('緩存所有資源...');
            return cache.addAll(FILES_TO_CACHE);
        })
    );
});

// 激活階段：清理舊的緩存
self.addEventListener('activate', (event) => {
    console.log('Service Worker 激活中...');
    const cacheWhitelist = [CACHE_NAME];  // 保留的新緩存版本
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    // 刪除不在 whitelist 中的舊緩存
                    if (!cacheWhitelist.includes(cacheName)) {
                        console.log(`刪除舊緩存：${cacheName}`);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => {
            return self.clients.claim();  // 接管控制
        })
    );
});

// 抓取請求：首先嘗試從緩存中提取資源，如果沒有則從網絡請求
self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request).then((cachedResponse) => {
            // 如果找到緩存的響應，則返回緩存的資源
            if (cachedResponse) {
                return cachedResponse;
            }
            // 如果緩存中沒有，則進行網絡請求
            return fetch(event.request).then((networkResponse) => {
                // 僅對靜態資源進行緩存
                if (event.request.url.includes('http')) {
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(event.request, networkResponse.clone());  // 緩存網絡響應
                    });
                }
                return networkResponse;
            });
        }).catch((error) => {
            // 如果發生錯誤（例如網絡錯誤），則提供離線頁面（可選）
            console.error('服務工作人員抓取錯誤: ', error);
            return caches.match('/offline.html');  // 顯示離線頁面（如果有的話）
        })
    );
});
