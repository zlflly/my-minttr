/**
 * 本地存储工具类
 * 提供类型安全的localStorage操作，支持序列化/反序列化和错误处理
 */

import { z } from 'zod'

// 存储键类型定义
export const STORAGE_KEYS = {
  THEME: 'theme',
  USER_PREFERENCES: 'user_preferences',
  DRAFT_NOTE: 'draft_note',
  RECENT_SEARCHES: 'recent_searches',
  WINDOW_STATE: 'window_state',
  CACHE_TIMESTAMP: 'cache_timestamp',
} as const

export type StorageKey = typeof STORAGE_KEYS[keyof typeof STORAGE_KEYS]

// 用户偏好设置的schema
const UserPreferencesSchema = z.object({
  defaultView: z.enum(['grid', 'list']).default('grid'),
  itemsPerPage: z.number().min(10).max(100).default(20),
  autoSave: z.boolean().default(true),
  showPreview: z.boolean().default(true),
  sortBy: z.enum(['created', 'updated', 'title']).default('updated'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
})

// 草稿笔记的schema
const DraftNoteSchema = z.object({
  title: z.string(),
  content: z.string(),
  tags: z.array(z.string()).default([]),
  url: z.string().optional(),
  timestamp: z.number(),
})

// 最近搜索的schema
const RecentSearchesSchema = z.array(z.string()).max(10)

// 窗口状态的schema
const WindowStateSchema = z.object({
  width: z.number(),
  height: z.number(),
  x: z.number().optional(),
  y: z.number().optional(),
  maximized: z.boolean().default(false),
})

export type UserPreferences = z.infer<typeof UserPreferencesSchema>
export type DraftNote = z.infer<typeof DraftNoteSchema>
export type RecentSearches = z.infer<typeof RecentSearchesSchema>
export type WindowState = z.infer<typeof WindowStateSchema>

// 存储值类型映射
type StorageValueMap = {
  [STORAGE_KEYS.THEME]: 'light' | 'dark' | 'system'
  [STORAGE_KEYS.USER_PREFERENCES]: UserPreferences
  [STORAGE_KEYS.DRAFT_NOTE]: DraftNote
  [STORAGE_KEYS.RECENT_SEARCHES]: RecentSearches
  [STORAGE_KEYS.WINDOW_STATE]: WindowState
  [STORAGE_KEYS.CACHE_TIMESTAMP]: number
}

class LocalStorageManager {
  private isClient = typeof window !== 'undefined'

  // 检查localStorage是否可用
  private isStorageAvailable(): boolean {
    if (!this.isClient) return false
    
    try {
      const test = '__localStorage_test__'
      localStorage.setItem(test, test)
      localStorage.removeItem(test)
      return true
    } catch {
      return false
    }
  }

  // 获取存储值
  get<K extends StorageKey>(key: K): StorageValueMap[K] | null {
    if (!this.isStorageAvailable()) return null

    try {
      const item = localStorage.getItem(key)
      if (item === null) return null

      const parsed = JSON.parse(item)
      
      // 根据key进行schema验证
      switch (key) {
        case STORAGE_KEYS.USER_PREFERENCES:
          return UserPreferencesSchema.parse(parsed) as StorageValueMap[K]
        case STORAGE_KEYS.DRAFT_NOTE:
          return DraftNoteSchema.parse(parsed) as StorageValueMap[K]
        case STORAGE_KEYS.RECENT_SEARCHES:
          return RecentSearchesSchema.parse(parsed) as StorageValueMap[K]
        case STORAGE_KEYS.WINDOW_STATE:
          return WindowStateSchema.parse(parsed) as StorageValueMap[K]
        case STORAGE_KEYS.THEME:
          if (['light', 'dark', 'system'].includes(parsed)) {
            return parsed as StorageValueMap[K]
          }
          return null
        case STORAGE_KEYS.CACHE_TIMESTAMP:
          return typeof parsed === 'number' ? parsed as StorageValueMap[K] : null
        default:
          return parsed as StorageValueMap[K]
      }
    } catch (error) {
      console.warn(`Failed to get localStorage item "${key}":`, error)
      return null
    }
  }

  // 设置存储值
  set<K extends StorageKey>(key: K, value: StorageValueMap[K]): boolean {
    if (!this.isStorageAvailable()) return false

    try {
      // 根据key进行schema验证
      let validatedValue = value
      switch (key) {
        case STORAGE_KEYS.USER_PREFERENCES:
          validatedValue = UserPreferencesSchema.parse(value) as StorageValueMap[K]
          break
        case STORAGE_KEYS.DRAFT_NOTE:
          validatedValue = DraftNoteSchema.parse(value) as StorageValueMap[K]
          break
        case STORAGE_KEYS.RECENT_SEARCHES:
          validatedValue = RecentSearchesSchema.parse(value) as StorageValueMap[K]
          break
        case STORAGE_KEYS.WINDOW_STATE:
          validatedValue = WindowStateSchema.parse(value) as StorageValueMap[K]
          break
      }

      localStorage.setItem(key, JSON.stringify(validatedValue))
      return true
    } catch (error) {
      console.warn(`Failed to set localStorage item "${key}":`, error)
      return false
    }
  }

  // 删除存储值
  remove(key: StorageKey): boolean {
    if (!this.isStorageAvailable()) return false

    try {
      localStorage.removeItem(key)
      return true
    } catch (error) {
      console.warn(`Failed to remove localStorage item "${key}":`, error)
      return false
    }
  }

  // 清除所有存储
  clear(): boolean {
    if (!this.isStorageAvailable()) return false

    try {
      localStorage.clear()
      return true
    } catch (error) {
      console.warn('Failed to clear localStorage:', error)
      return false
    }
  }

  // 获取存储大小（估算）
  getStorageSize(): number {
    if (!this.isStorageAvailable()) return 0

    let total = 0
    try {
      for (let key in localStorage) {
        if (localStorage.hasOwnProperty(key)) {
          total += localStorage[key].length + key.length
        }
      }
    } catch (error) {
      console.warn('Failed to calculate storage size:', error)
    }
    return total
  }

  // 检查存储是否接近限制（通常5MB）
  isStorageNearLimit(threshold = 0.8): boolean {
    const maxSize = 5 * 1024 * 1024 // 5MB
    const currentSize = this.getStorageSize()
    return currentSize > maxSize * threshold
  }

  // 获取所有键
  getAllKeys(): string[] {
    if (!this.isStorageAvailable()) return []

    try {
      return Object.keys(localStorage)
    } catch (error) {
      console.warn('Failed to get localStorage keys:', error)
      return []
    }
  }

  // 导出所有数据（用于备份）
  export(): Record<string, unknown> {
    if (!this.isStorageAvailable()) return {}

    const data: Record<string, unknown> = {}
    try {
      for (const key in localStorage) {
        if (localStorage.hasOwnProperty(key)) {
          try {
            data[key] = JSON.parse(localStorage[key])
          } catch {
            data[key] = localStorage[key]
          }
        }
      }
    } catch (error) {
      console.warn('Failed to export localStorage data:', error)
    }
    return data
  }

  // 导入数据（用于恢复）
  import(data: Record<string, unknown>): boolean {
    if (!this.isStorageAvailable()) return false

    try {
      for (const [key, value] of Object.entries(data)) {
        localStorage.setItem(key, typeof value === 'string' ? value : JSON.stringify(value))
      }
      return true
    } catch (error) {
      console.warn('Failed to import localStorage data:', error)
      return false
    }
  }
}

// 创建单例实例
export const localStorage = new LocalStorageManager()

// 便捷方法
export const storage = {
  // 主题相关
  getTheme: () => localStorage.get(STORAGE_KEYS.THEME) || 'system',
  setTheme: (theme: 'light' | 'dark' | 'system') => localStorage.set(STORAGE_KEYS.THEME, theme),

  // 用户偏好相关
  getPreferences: (): UserPreferences => {
    const prefs = localStorage.get(STORAGE_KEYS.USER_PREFERENCES)
    return prefs || UserPreferencesSchema.parse({})
  },
  setPreferences: (preferences: Partial<UserPreferences>) => {
    const current = storage.getPreferences()
    return localStorage.set(STORAGE_KEYS.USER_PREFERENCES, { ...current, ...preferences })
  },

  // 草稿笔记相关
  getDraftNote: () => localStorage.get(STORAGE_KEYS.DRAFT_NOTE),
  setDraftNote: (draft: DraftNote) => localStorage.set(STORAGE_KEYS.DRAFT_NOTE, draft),
  clearDraftNote: () => localStorage.remove(STORAGE_KEYS.DRAFT_NOTE),

  // 最近搜索相关
  getRecentSearches: (): string[] => localStorage.get(STORAGE_KEYS.RECENT_SEARCHES) || [],
  addRecentSearch: (search: string) => {
    const searches = storage.getRecentSearches()
    const filtered = searches.filter(s => s !== search)
    const updated = [search, ...filtered].slice(0, 10)
    return localStorage.set(STORAGE_KEYS.RECENT_SEARCHES, updated)
  },

  // 窗口状态相关
  getWindowState: () => localStorage.get(STORAGE_KEYS.WINDOW_STATE),
  setWindowState: (state: WindowState) => localStorage.set(STORAGE_KEYS.WINDOW_STATE, state),

  // 缓存时间戳相关
  getCacheTimestamp: () => localStorage.get(STORAGE_KEYS.CACHE_TIMESTAMP) || 0,
  setCacheTimestamp: (timestamp: number) => localStorage.set(STORAGE_KEYS.CACHE_TIMESTAMP, timestamp),
}

// 导入React（如果使用Hook）
import React from 'react'

// React Hook（如果需要）
export function useLocalStorageHook<K extends StorageKey>(
  key: K,
  defaultValue: StorageValueMap[K]
): [StorageValueMap[K], (value: StorageValueMap[K]) => void] {
  if (typeof window === 'undefined') {
    return [defaultValue, () => {}]
  }

  const [value, setValue] = React.useState<StorageValueMap[K]>(() => {
    const stored = localStorage.get(key)
    return stored !== null ? stored : defaultValue
  })

  const setStoredValue = React.useCallback((newValue: StorageValueMap[K]) => {
    setValue(newValue)
    localStorage.set(key, newValue)
  }, [key])

  return [value, setStoredValue]
}