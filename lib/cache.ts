// 简单的内存缓存实现
class SimpleCache<T> {
  private cache = new Map<string, { data: T; timestamp: number; ttl: number }>()

  set(key: string, data: T, ttl: number = 5 * 60 * 1000) { // 默认5分钟TTL
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    })
  }

  get(key: string): T | null {
    const entry = this.cache.get(key)
    if (!entry) return null

    const now = Date.now()
    if (now - entry.timestamp > entry.ttl) {
      this.cache.delete(key)
      return null
    }

    return entry.data
  }

  delete(key: string) {
    this.cache.delete(key)
  }

  clear() {
    this.cache.clear()
  }

  // 清理过期缓存
  cleanup() {
    const now = Date.now()
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key)
      }
    }
  }
}

// 全局缓存实例
export const apiCache = new SimpleCache()
export const imageCache = new SimpleCache()
export const metadataCache = new SimpleCache()

// 定期清理过期缓存
if (typeof window !== 'undefined') {
  setInterval(() => {
    apiCache.cleanup()
    imageCache.cleanup() 
    metadataCache.cleanup()
  }, 60 * 1000) // 每分钟清理一次
}

// 缓存键生成器
export const generateCacheKey = {
  notes: (page: number, limit: number, type?: string) => 
    `notes:${page}:${limit}${type ? `:${type}` : ''}`,
  note: (id: string) => `note:${id}`,
  metadata: (url: string) => `metadata:${btoa(url)}`, // base64编码URL避免特殊字符
  image: (url: string) => `image:${btoa(url)}`
}
