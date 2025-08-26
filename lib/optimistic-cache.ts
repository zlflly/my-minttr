/**
 * 乐观更新和客户端缓存管理
 * 提供快速的UI响应和数据同步
 */

import type { Note } from './api'

export interface CacheItem<T> {
  data: T
  timestamp: number
  expiry: number
}

export interface OptimisticUpdate {
  id: string
  type: 'create' | 'update' | 'delete'
  data: Partial<Note>
  timestamp: number
  pending: boolean
}

class OptimisticCacheManager {
  private cache = new Map<string, CacheItem<any>>()
  private pendingUpdates = new Map<string, OptimisticUpdate>()
  private subscribers = new Map<string, Set<(data: any) => void>>()

  // 缓存TTL配置（毫秒）
  private readonly TTL = {
    notes: 5 * 60 * 1000,     // 笔记缓存5分钟
    metadata: 30 * 60 * 1000,  // 元数据缓存30分钟
    count: 2 * 60 * 1000,      // 计数缓存2分钟
  }

  /**
   * 设置缓存
   */
  set<T>(key: string, data: T, ttl?: number): void {
    const expiry = Date.now() + (ttl || this.TTL.notes)
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      expiry
    })

    // 通知订阅者
    this.notifySubscribers(key, data)
  }

  /**
   * 获取缓存
   */
  get<T>(key: string): T | null {
    const item = this.cache.get(key)
    
    if (!item) {
      return null
    }

    // 检查是否过期
    if (Date.now() > item.expiry) {
      this.cache.delete(key)
      return null
    }

    return item.data as T
  }

  /**
   * 删除缓存
   */
  delete(key: string): void {
    this.cache.delete(key)
    this.notifySubscribers(key, null)
  }

  /**
   * 清空所有缓存
   */
  clear(): void {
    this.cache.clear()
    this.pendingUpdates.clear()
  }

  /**
   * 订阅缓存变化
   */
  subscribe<T>(key: string, callback: (data: T | null) => void): () => void {
    if (!this.subscribers.has(key)) {
      this.subscribers.set(key, new Set())
    }
    
    this.subscribers.get(key)!.add(callback)

    // 立即返回当前缓存的数据
    const cached = this.get<T>(key)
    if (cached !== null) {
      callback(cached)
    }

    // 返回取消订阅函数
    return () => {
      const subscribers = this.subscribers.get(key)
      if (subscribers) {
        subscribers.delete(callback)
        if (subscribers.size === 0) {
          this.subscribers.delete(key)
        }
      }
    }
  }

  /**
   * 通知订阅者
   */
  private notifySubscribers(key: string, data: any): void {
    const subscribers = this.subscribers.get(key)
    if (subscribers) {
      subscribers.forEach(callback => callback(data))
    }
  }

  /**
   * 乐观创建笔记
   */
  optimisticCreate(tempNote: Note): string {
    const tempId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    // 添加到待处理更新
    this.pendingUpdates.set(tempId, {
      id: tempId,
      type: 'create',
      data: tempNote,
      timestamp: Date.now(),
      pending: true
    })

    // 更新笔记列表缓存
    this.updateNotesListCache(tempNote, 'add')

    return tempId
  }

  /**
   * 乐观更新笔记
   */
  optimisticUpdate(id: string, updates: Partial<Note>): void {
    this.pendingUpdates.set(id, {
      id,
      type: 'update',
      data: updates,
      timestamp: Date.now(),
      pending: true
    })

    // 更新相关缓存
    this.updateNoteCaches(id, updates)
  }

  /**
   * 乐观删除笔记
   */
  optimisticDelete(id: string, note: Note): void {
    this.pendingUpdates.set(id, {
      id,
      type: 'delete',
      data: note,
      timestamp: Date.now(),
      pending: true
    })

    // 从缓存中移除
    this.updateNotesListCache(note, 'remove')
  }

  /**
   * 确认乐观更新成功
   */
  confirmOptimisticUpdate(tempId: string, realId?: string, realData?: Note): void {
    const pending = this.pendingUpdates.get(tempId)
    if (!pending) return

    this.pendingUpdates.delete(tempId)

    // 如果是创建操作，需要用真实ID替换临时ID
    if (pending.type === 'create' && realId && realData) {
      this.replaceNotesListCache(tempId, realId, realData)
    }
  }

  /**
   * 回滚乐观更新
   */
  rollbackOptimisticUpdate(id: string): void {
    const pending = this.pendingUpdates.get(id)
    if (!pending) return

    this.pendingUpdates.delete(id)

    // 根据操作类型进行回滚
    switch (pending.type) {
      case 'create':
        // 从列表中移除临时项
        this.updateNotesListCache(pending.data as Note, 'remove')
        break
      case 'update':
        // 恢复原始数据 - 这里需要额外的逻辑来存储原始状态
        break
      case 'delete':
        // 重新添加到列表
        this.updateNotesListCache(pending.data as Note, 'add')
        break
    }
  }

  /**
   * 获取待处理的更新
   */
  getPendingUpdates(): OptimisticUpdate[] {
    return Array.from(this.pendingUpdates.values())
  }

  /**
   * 更新笔记列表缓存
   */
  private updateNotesListCache(note: Note, action: 'add' | 'remove'): void {
    // 遍历所有可能的笔记列表缓存键
    for (const [key] of this.cache) {
      if (key.startsWith('notes_')) {
        const cached = this.get<Note[]>(key)
        if (cached) {
          let updated: Note[]
          
          if (action === 'add') {
            updated = [note, ...cached]
          } else {
            updated = cached.filter(n => n.id !== note.id)
          }
          
          this.set(key, updated)
        }
      }
    }
  }

  /**
   * 替换笔记列表缓存中的临时项
   */
  private replaceNotesListCache(tempId: string, realId: string, realNote: Note): void {
    for (const [key] of this.cache) {
      if (key.startsWith('notes_')) {
        const cached = this.get<Note[]>(key)
        if (cached) {
          const updated = cached.map(note => 
            note.id === tempId ? realNote : note
          )
          this.set(key, updated)
        }
      }
    }
  }

  /**
   * 更新笔记相关缓存
   */
  private updateNoteCaches(id: string, updates: Partial<Note>): void {
    // 更新单个笔记缓存
    const noteKey = `note_${id}`
    const cached = this.get<Note>(noteKey)
    if (cached) {
      this.set(noteKey, { ...cached, ...updates })
    }

    // 更新列表中的对应项
    for (const [key] of this.cache) {
      if (key.startsWith('notes_')) {
        const cached = this.get<Note[]>(key)
        if (cached) {
          const updated = cached.map(note =>
            note.id === id ? { ...note, ...updates } : note
          )
          this.set(key, updated)
        }
      }
    }
  }

  /**
   * 生成缓存键
   */
  static keys = {
    notes: (page: number, search?: string, type?: string) => {
      const parts = ['notes', page.toString()]
      if (search) parts.push(`search_${search}`)
      if (type) parts.push(`type_${type}`)
      return parts.join('_')
    },
    note: (id: string) => `note_${id}`,
    metadata: (url: string) => `metadata_${btoa(url)}`,
    count: (userId: string) => `count_${userId}`
  }
}

// 全局单例
export const optimisticCache = new OptimisticCacheManager()

// React Hook for using cache (需要在组件文件中单独实现)
// export function useOptimisticCache<T>(key: string) {
//   const [data, setData] = React.useState<T | null>(null)
//   const [loading, setLoading] = React.useState(true)

//   React.useEffect(() => {
//     const unsubscribe = optimisticCache.subscribe<T>(key, (newData) => {
//       setData(newData)
//       setLoading(false)
//     })

//     return unsubscribe
//   }, [key])

//   return { data, loading, setCache: (newData: T) => optimisticCache.set(key, newData) }
// }