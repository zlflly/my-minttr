/**
 * Service Worker for offline functionality
 * 支持资源缓存、API响应缓存和离线模式
 */

const CACHE_NAME = 'notes-app-v1';
const API_CACHE_NAME = 'notes-api-v1';
const STATIC_CACHE_NAME = 'notes-static-v1';

// 需要缓存的静态资源
const STATIC_ASSETS = [
  '/',
  '/favicon.png',
  '/site.webmanifest',
  '/_next/static/css/app/layout.css',
  '/_next/static/chunks/webpack.js',
  '/_next/static/chunks/main.js',
  '/_next/static/chunks/pages/_app.js',
];

// API路径匹配模式
const API_PATTERNS = [
  /^\/api\/notes($|\?)/,
  /^\/api\/notes\/[^/]+$/,
  /^\/api\/metadata\/extract$/,
];

// Service Worker安装事件
self.addEventListener('install', event => {
  console.log('Service Worker installing...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME)
      .then(cache => {
        console.log('Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .catch(error => {
        console.warn('Failed to cache static assets:', error);
      })
  );
  
  // 立即激活新的Service Worker
  self.skipWaiting();
});

// Service Worker激活事件
self.addEventListener('activate', event => {
  console.log('Service Worker activating...');
  
  event.waitUntil(
    Promise.all([
      // 清理旧版本的缓存
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (cacheName !== CACHE_NAME && 
                cacheName !== API_CACHE_NAME && 
                cacheName !== STATIC_CACHE_NAME) {
              console.log('Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }),
      // 立即控制所有客户端
      self.clients.claim()
    ])
  );
});

// 处理fetch请求
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);
  
  // 只处理同源请求
  if (url.origin !== self.location.origin) {
    return;
  }
  
  // API请求处理
  if (isApiRequest(url.pathname)) {
    event.respondWith(handleApiRequest(request));
    return;
  }
  
  // 静态资源处理
  event.respondWith(handleStaticRequest(request));
});

// 检查是否为API请求
function isApiRequest(pathname) {
  return API_PATTERNS.some(pattern => pattern.test(pathname));
}

// 处理API请求
async function handleApiRequest(request) {
  const url = new URL(request.url);
  const cacheKey = `${request.method}:${url.pathname}${url.search}`;
  
  try {
    // GET请求采用缓存优先策略
    if (request.method === 'GET') {
      return await handleGetApiRequest(request, cacheKey);
    }
    
    // 非GET请求采用网络优先策略
    return await handleMutatingApiRequest(request, cacheKey);
    
  } catch (error) {
    console.error('API request failed:', error);
    
    // 如果是GET请求且离线，尝试返回缓存
    if (request.method === 'GET') {
      const cachedResponse = await caches.match(request);
      if (cachedResponse) {
        return cachedResponse;
      }
    }
    
    // 返回离线响应
    return createOfflineResponse(request);
  }
}

// 处理GET API请求
async function handleGetApiRequest(request, cacheKey) {
  const cache = await caches.open(API_CACHE_NAME);
  
  try {
    // 尝试网络请求
    const response = await fetch(request);
    
    if (response.ok) {
      // 缓存成功响应
      cache.put(request, response.clone());
      return response;
    }
    
    throw new Error(`HTTP ${response.status}`);
    
  } catch (error) {
    // 网络失败，返回缓存
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
      console.log('Serving from cache:', request.url);
      return cachedResponse;
    }
    
    throw error;
  }
}

// 处理修改类API请求（POST, PUT, DELETE）
async function handleMutatingApiRequest(request, cacheKey) {
  try {
    // 尝试网络请求
    const response = await fetch(request);
    
    if (response.ok) {
      // 成功后清理相关缓存
      await invalidateRelatedCache(request);
      return response;
    }
    
    throw new Error(`HTTP ${response.status}`);
    
  } catch (error) {
    // 网络失败，存储到离线队列
    await storeOfflineOperation(request);
    
    // 返回乐观响应
    return createOptimisticResponse(request);
  }
}

// 处理静态资源请求
async function handleStaticRequest(request) {
  // 缓存优先策略
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    // 网络请求
    const response = await fetch(request);
    
    if (response.ok) {
      // 缓存静态资源
      const cache = await caches.open(STATIC_CACHE_NAME);
      cache.put(request, response.clone());
    }
    
    return response;
    
  } catch (error) {
    // 网络失败，返回离线页面
    if (request.destination === 'document') {
      return createOfflinePage();
    }
    
    throw error;
  }
}

// 清理相关缓存
async function invalidateRelatedCache(request) {
  const url = new URL(request.url);
  const cache = await caches.open(API_CACHE_NAME);
  
  // 如果是修改笔记的请求，清理笔记列表缓存
  if (url.pathname.startsWith('/api/notes/')) {
    const keys = await cache.keys();
    const notesListKeys = keys.filter(key => {
      const keyUrl = new URL(key.url);
      return keyUrl.pathname === '/api/notes' || keyUrl.pathname.startsWith('/api/notes?');
    });
    
    await Promise.all(notesListKeys.map(key => cache.delete(key)));
  }
}

// 存储离线操作
async function storeOfflineOperation(request) {
  const operation = {
    id: Date.now().toString(),
    method: request.method,
    url: request.url,
    body: request.method !== 'GET' ? await request.clone().text() : null,
    headers: Object.fromEntries(request.headers.entries()),
    timestamp: Date.now()
  };
  
  // 使用postMessage通知主线程存储离线操作
  const clients = await self.clients.matchAll();
  clients.forEach(client => {
    client.postMessage({
      type: 'STORE_OFFLINE_OPERATION',
      operation
    });
  });
}

// 创建乐观响应
function createOptimisticResponse(request) {
  const url = new URL(request.url);
  
  if (request.method === 'POST' && url.pathname === '/api/notes') {
    // 创建笔记的乐观响应
    return new Response(JSON.stringify({
      success: true,
      data: {
        id: `offline_${Date.now()}`,
        type: 'TEXT',
        title: null,
        content: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isOffline: true
      }
    }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });
  }
  
  if (request.method === 'DELETE') {
    // 删除笔记的乐观响应
    return new Response(JSON.stringify({
      success: true,
      data: { message: '笔记已删除（离线模式）' }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  }
  
  // 默认成功响应
  return new Response(JSON.stringify({
    success: true,
    message: '操作已排队，将在网络恢复时同步'
  }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
}

// 创建离线响应
function createOfflineResponse(request) {
  const url = new URL(request.url);
  
  if (url.pathname === '/api/notes') {
    // 返回空的笔记列表
    return new Response(JSON.stringify({
      success: false,
      error: {
        code: 'OFFLINE_MODE',
        message: '当前处于离线模式，请检查网络连接'
      }
    }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    });
  }
  
  // 通用离线响应
  return new Response(JSON.stringify({
    success: false,
    error: {
      code: 'NETWORK_ERROR',
      message: '网络连接失败，请检查网络连接'
    }
  }), {
    status: 503,
    headers: { 'Content-Type': 'application/json' }
  });
}

// 创建离线页面
function createOfflinePage() {
  return new Response(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>离线模式 - zlflly-notes</title>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style>
          body {
            font-family: system-ui, -apple-system, sans-serif;
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            margin: 0;
            background: #F6F4F0;
            color: #1C1917;
          }
          .container {
            text-align: center;
            max-width: 400px;
            padding: 2rem;
          }
          .icon {
            font-size: 4rem;
            margin-bottom: 1rem;
          }
          h1 {
            margin-bottom: 1rem;
            font-size: 1.5rem;
          }
          p {
            margin-bottom: 2rem;
            color: #6B7280;
          }
          button {
            background: #1C1917;
            color: white;
            border: none;
            padding: 0.75rem 1.5rem;
            border-radius: 0.5rem;
            cursor: pointer;
            font-size: 1rem;
          }
          button:hover {
            background: #374151;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="icon">📡</div>
          <h1>离线模式</h1>
          <p>当前无法连接到网络，但您仍可以查看已缓存的内容。</p>
          <button onclick="window.location.reload()">重试连接</button>
        </div>
      </body>
    </html>
  `, {
    headers: { 'Content-Type': 'text/html' }
  });
}

// 监听来自主线程的消息
self.addEventListener('message', event => {
  const { type, data } = event.data;
  
  switch (type) {
    case 'SYNC_OFFLINE_OPERATIONS':
      handleOfflineSync(data);
      break;
      
    case 'CLEAR_CACHE':
      clearAllCaches();
      break;
      
    default:
      console.log('Unknown message type:', type);
  }
});

// 处理离线同步
async function handleOfflineSync(operations) {
  console.log('Syncing offline operations:', operations);
  
  for (const operation of operations) {
    try {
      const request = new Request(operation.url, {
        method: operation.method,
        headers: operation.headers,
        body: operation.body
      });
      
      const response = await fetch(request);
      
      if (response.ok) {
        console.log('Successfully synced operation:', operation.id);
        // 通知主线程操作同步成功
        const clients = await self.clients.matchAll();
        clients.forEach(client => {
          client.postMessage({
            type: 'SYNC_SUCCESS',
            operationId: operation.id
          });
        });
      } else {
        throw new Error(`HTTP ${response.status}`);
      }
      
    } catch (error) {
      console.error('Failed to sync operation:', operation.id, error);
      // 通知主线程操作同步失败
      const clients = await self.clients.matchAll();
      clients.forEach(client => {
        client.postMessage({
          type: 'SYNC_FAILED',
          operationId: operation.id,
          error: error.message
        });
      });
    }
  }
}

// 清理所有缓存
async function clearAllCaches() {
  const cacheNames = await caches.keys();
  await Promise.all(cacheNames.map(name => caches.delete(name)));
  console.log('All caches cleared');
}