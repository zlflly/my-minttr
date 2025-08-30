/**
 * localStorage React Hook
 * 提供响应式的localStorage操作
 */

import { useState, useEffect, useCallback } from 'react'
import { localStorage, StorageKey, STORAGE_KEYS } from '../local-storage'

// 存储值类型映射（从local-storage.ts导入）
type StorageValueMap = {
  [STORAGE_KEYS.THEME]: 'light' | 'dark' | 'system'
  [STORAGE_KEYS.USER_PREFERENCES]: {
    defaultView: 'grid' | 'list'
    itemsPerPage: number
    autoSave: boolean
    showPreview: boolean
    sortBy: 'created' | 'updated' | 'title'
    sortOrder: 'asc' | 'desc'
  }
  [STORAGE_KEYS.DRAFT_NOTE]: {
    title: string
    content: string
    tags: string[]
    url?: string
    timestamp: number
  }
  [STORAGE_KEYS.RECENT_SEARCHES]: string[]
  [STORAGE_KEYS.WINDOW_STATE]: {
    width: number
    height: number
    x?: number
    y?: number
    maximized: boolean
  }
  [STORAGE_KEYS.CACHE_TIMESTAMP]: number
}

/**
 * 使用localStorage的React Hook
 * @param key 存储键
 * @param defaultValue 默认值
 * @returns [value, setValue, removeValue]
 */
export function useLocalStorage<K extends StorageKey>(
  key: K,
  defaultValue: StorageValueMap[K]
): [
  StorageValueMap[K],
  (value: StorageValueMap[K] | ((prev: StorageValueMap[K]) => StorageValueMap[K])) => void,
  () => void
] {
  // 获取初始值
  const [value, setValue] = useState<StorageValueMap[K]>(() => {
    if (typeof window === 'undefined') return defaultValue
    const stored = localStorage.get(key)
    return stored !== null ? stored : defaultValue
  })

  // 设置值的方法
  const setStoredValue = useCallback((
    newValue: StorageValueMap[K] | ((prev: StorageValueMap[K]) => StorageValueMap[K])
  ) => {
    setValue(prevValue => {
      const valueToStore = typeof newValue === 'function' 
        ? (newValue as (prev: StorageValueMap[K]) => StorageValueMap[K])(prevValue)
        : newValue
      
      localStorage.set(key, valueToStore)
      return valueToStore
    })
  }, [key])

  // 移除值的方法
  const removeValue = useCallback(() => {
    localStorage.remove(key)
    setValue(defaultValue)
  }, [key, defaultValue])

  // 监听storage事件（跨标签页同步）
  useEffect(() => {
    if (typeof window === 'undefined') return

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === key && e.newValue !== null) {
        try {
          const newValue = JSON.parse(e.newValue)
          setValue(newValue)
        } catch (error) {
          console.warn(`Failed to parse storage value for key "${key}":`, error)
        }
      } else if (e.key === key && e.newValue === null) {
        setValue(defaultValue)
      }
    }

    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [key, defaultValue])

  return [value, setStoredValue, removeValue]
}

/**
 * 使用主题的Hook
 */
export function useTheme() {
  return useLocalStorage(STORAGE_KEYS.THEME, 'system' as const)
}

/**
 * 使用用户偏好的Hook
 */
export function useUserPreferences() {
  const defaultPreferences = {
    defaultView: 'grid' as const,
    itemsPerPage: 20,
    autoSave: true,
    showPreview: true,
    sortBy: 'updated' as const,
    sortOrder: 'desc' as const,
  }
  
  return useLocalStorage(STORAGE_KEYS.USER_PREFERENCES, defaultPreferences)
}

/**
 * 使用草稿笔记的Hook
 */
export function useDraftNote() {
  const [draft, setDraft, removeDraft] = useLocalStorage(STORAGE_KEYS.DRAFT_NOTE, {
    title: '',
    content: '',
    tags: [],
    timestamp: Date.now(),
  })

  const saveDraft = useCallback((updates: Partial<typeof draft>) => {
    setDraft(prev => ({
      ...prev,
      ...updates,
      timestamp: Date.now()
    }))
  }, [setDraft])

  const hasDraft = draft.title.trim() !== '' || draft.content.trim() !== ''

  return {
    draft,
    saveDraft,
    clearDraft: removeDraft,
    hasDraft
  }
}

/**
 * 使用最近搜索的Hook
 */
export function useRecentSearches() {
  const [searches, setSearches] = useLocalStorage(STORAGE_KEYS.RECENT_SEARCHES, [])

  const addSearch = useCallback((search: string) => {
    if (!search.trim()) return
    
    setSearches(prev => {
      const filtered = prev.filter(s => s !== search)
      return [search, ...filtered].slice(0, 10)
    })
  }, [setSearches])

  const removeSearch = useCallback((search: string) => {
    setSearches(prev => prev.filter(s => s !== search))
  }, [setSearches])

  const clearSearches = useCallback(() => {
    setSearches([])
  }, [setSearches])

  return {
    searches,
    addSearch,
    removeSearch,
    clearSearches
  }
}

/**
 * 使用窗口状态的Hook
 */
export function useWindowState() {
  const defaultState = {
    width: 1200,
    height: 800,
    maximized: false
  }

  const [windowState, setWindowState] = useLocalStorage(STORAGE_KEYS.WINDOW_STATE, defaultState)

  const updateWindowState = useCallback((updates: Partial<typeof windowState>) => {
    setWindowState(prev => ({ ...prev, ...updates }))
  }, [setWindowState])

  return {
    windowState,
    updateWindowState,
    setWindowState
  }
}

/**
 * 检查localStorage是否可用的Hook
 */
export function useIsStorageAvailable() {
  const [isAvailable, setIsAvailable] = useState(false)

  useEffect(() => {
    try {
      const test = '__localStorage_test__'
      localStorage.set('__test__' as StorageKey, test as any)
      localStorage.remove('__test__' as StorageKey)
      setIsAvailable(true)
    } catch {
      setIsAvailable(false)
    }
  }, [])

  return isAvailable
}

/**
 * 监控localStorage使用情况的Hook
 */
export function useStorageMonitor() {
  const [storageInfo, setStorageInfo] = useState({
    size: 0,
    nearLimit: false,
    keys: [] as string[]
  })

  const updateStorageInfo = useCallback(() => {
    const size = localStorage.getStorageSize()
    const nearLimit = localStorage.isStorageNearLimit()
    const keys = localStorage.getAllKeys()

    setStorageInfo({ size, nearLimit, keys })
  }, [])

  useEffect(() => {
    updateStorageInfo()
    
    // 定期更新存储信息
    const interval = setInterval(updateStorageInfo, 30000) // 30秒更新一次
    
    return () => clearInterval(interval)
  }, [updateStorageInfo])

  return {
    ...storageInfo,
    refresh: updateStorageInfo,
    clear: localStorage.clear.bind(localStorage),
    export: localStorage.export.bind(localStorage),
    import: localStorage.import.bind(localStorage)
  }
}