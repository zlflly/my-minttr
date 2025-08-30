"use client"

import type React from "react"
import { useState, useEffect, useCallback, useMemo } from "react"
import { Loader2, Calendar, Grid3X3, Columns3 } from "lucide-react"
import { motion, AnimatePresence, LayoutGroup } from "framer-motion"
import NoteCard from "./NoteCard"
import NewNoteMenu from "./NewNoteMenu"
import SearchBar from "./SearchBar"
import { Button } from "@/components/ui/button"
import { fetchNotes, deleteNote } from "@/lib/api"
import type { Note, ThrottledFunction } from "@/lib/types"
import { DashboardSkeleton, LoadMoreSkeleton } from "./LoadingSkeleton"

// 布局类型
type LayoutType = 'grid' | 'waterfall'

export default function NoteDashboard() {
  const [notes, setNotes] = useState<Note[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [isSearching, setIsSearching] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [totalNotes, setTotalNotes] = useState(0)
  const [daysSinceStart, setDaysSinceStart] = useState(0)
  const [searchQuery, setSearchQuery] = useState("")
  const [isSearchMode, setIsSearchMode] = useState(false)
  const [shouldClearSearchBar, setShouldClearSearchBar] = useState(false)
  const [layoutType, setLayoutType] = useState<LayoutType>('grid')
  
  // 计算网站运行天数
  useEffect(() => {
    const calculateDays = () => {
      const startDate = new Date('2025-08-22T00:00:00')
      const today = new Date()
      
      const startDateOnly = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate())
      const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate())
      
      const timeDiff = todayOnly.getTime() - startDateOnly.getTime()
      const days = Math.floor(timeDiff / (1000 * 3600 * 24))
      
      return Math.max(0, days)
    }

    setDaysSinceStart(calculateDays())

    const interval = setInterval(() => {
      setDaysSinceStart(calculateDays())
    }, 60 * 60 * 1000)

    return () => clearInterval(interval)
  }, [])

  // 获取笔记列表
  const loadNotes = async (page = 1, append = false, search?: string) => {
    try {
      if (!append) {
        if (search) {
          setIsSearching(true)
        } else {
          setIsLoading(true)
        }
      } else {
        setIsLoadingMore(true)
      }
      setError(null)
      
      const response = await fetchNotes(page, 20, search)
      if (response.success && response.data) {
        const validNotes = response.data.filter(note => note && note.id && typeof note.id === 'string')
        
        if (append) {
          setNotes((prev) => [...prev, ...validNotes])
        } else {
          setNotes(validNotes)
        }
        
        if (response.pagination) {
          setTotalNotes(response.pagination.total)
          setHasMore(page < response.pagination.totalPages)
        }
      } else {
        setError(response.error?.message || "获取笔记失败")
      }
    } catch (error) {
      console.error("获取笔记失败:", error)
      setError("网络错误，请稍后重试")
    } finally {
      if (!append) {
        if (search) {
          setIsSearching(false)
        } else {
          setIsLoading(false)
        }
      } else {
        setIsLoadingMore(false)
      }
    }
  }

  // 搜索处理 - 直接加载，让 Framer Motion 自动处理动画
  const handleSearch = async (query: string) => {
    setSearchQuery(query)
    setIsSearchMode(true)
    setCurrentPage(1)
    
    // 直接加载，无需等待布局稳定
    await loadNotes(1, false, query)
  }

  // 清空搜索
  const handleClearSearch = async () => {
    setSearchQuery("")
    setIsSearchMode(false)
    setCurrentPage(1)
    
    setShouldClearSearchBar(true)
    await loadNotes(1, false)
    setShouldClearSearchBar(false)
  }

  // 加载更多笔记
  const loadMore = useCallback(async () => {
    if (!isLoadingMore && hasMore) {
      const nextPage = currentPage + 1
      setCurrentPage(nextPage)
      await loadNotes(nextPage, true, isSearchMode ? searchQuery : undefined)
    }
  }, [currentPage, hasMore, isLoadingMore, isSearchMode, searchQuery])

  // 节流函数
  const throttle = useCallback(<T extends (...args: unknown[]) => void>(
    func: T, 
    limit: number
  ): ThrottledFunction<T> => {
    let inThrottle = false;
    return (...args: Parameters<T>) => {
      if (!inThrottle) {
        func(...args);
        inThrottle = true;
        setTimeout(() => { inThrottle = false; }, limit);
      }
    };
  }, []);

  // 无限滚动检测
  useEffect(() => {
    const handleScroll = throttle(() => {
      const scrollThreshold = 1000;
      const hasReachedBottom = window.innerHeight + document.documentElement.scrollTop 
        >= document.documentElement.offsetHeight - scrollThreshold;
      
      if (hasReachedBottom && hasMore && !isLoadingMore && !isSearching) {
        loadMore();
      }
    }, 200);

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [loadMore, hasMore, isLoadingMore, isSearching, throttle]);

  // 组件挂载时加载笔记
  useEffect(() => {
    loadNotes(1, false)
  }, [])

  // 处理新笔记创建
  const handleNoteCreated = (newNote: Note) => {
    try {
      if (!newNote || !newNote.id || typeof newNote.id !== 'string') {
        console.error('Invalid note object:', newNote)
        return
      }
      
      setNotes((prev) => {
        const existingIndex = prev.findIndex(note => note?.id === newNote.id)
        if (existingIndex >= 0) {
          const updated = [...prev]
          updated[existingIndex] = newNote
          return updated
        } else {
          return [newNote, ...prev]
        }
      })
      setTotalNotes((prev) => prev + 1)
    } catch (error) {
      console.error('Error handling note creation:', error)
    }
  }

  // 处理删除笔记
  const handleNoteDelete = async (noteId: string) => {
    try {
      const response = await deleteNote(noteId)
      if (response.success) {
        setNotes((prev) => prev.filter(note => note.id !== noteId))
        setTotalNotes((prev) => prev - 1)
      } else {
        console.error("删除笔记失败:", response.error)
      }
    } catch (error) {
      console.error("删除笔记时出错:", error)
    }
  }

  // 处理笔记更新
  const handleNoteUpdate = (updatedNote: Note) => {
    try {
      if (!updatedNote || !updatedNote.id || typeof updatedNote.id !== 'string') {
        console.error('Invalid updated note object:', updatedNote)
        return
      }
      
      setNotes((prev) => prev.map(note => {
        if (!note || !note.id) return note
        return note.id === updatedNote.id ? updatedNote : note
      }))
    } catch (error) {
      console.error('Error handling note update:', error)
    }
  }

  // 切换布局类型
  const toggleLayout = useCallback(() => {
    setLayoutType(prev => prev === 'grid' ? 'waterfall' : 'grid')
  }, [])

  // 优化的动画配置
  const cardVariants = {
    initial: { opacity: 0, scale: 0.9, y: 20 },
    animate: { opacity: 1, scale: 1, y: 0 },
    exit: { opacity: 0, scale: 0.9, y: -20 },
    hover: { scale: 1.02, y: -2 },
    tap: { scale: 0.98 }
  }

  const layoutTransition = {
    type: "spring" as const,
    damping: 20,
    stiffness: 400,
    mass: 0.8,
    restDelta: 0.001
  }

  // 渲染卡片内容
  const renderCards = () => {
    const filteredNotes = notes
      .filter((note): note is Note => {
        try {
          return Boolean(
            note && 
            typeof note === 'object' && 
            'id' in note &&
            note.id && 
            typeof note.id === 'string' &&
            note.id.length > 0 &&
            'type' in note &&
            ['LINK', 'TEXT', 'IMAGE', 'TODO'].includes(note.type as string)
          );
        } catch (error) {
          console.warn('Invalid note object:', note, error);
          return false;
        }
      })

    if (layoutType === 'grid') {
      return (
        <motion.div 
          className="grid gap-4"
          style={{
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gridAutoRows: 'auto',
            gridAutoFlow: 'dense'
          }}
          layout
          transition={layoutTransition}
        >
          <AnimatePresence mode="popLayout">
            {filteredNotes.map((note) => {
              try {
                return (
                  <motion.div 
                    key={note.id}
                    layoutId={note.id}
                    className="will-change-transform"
                    variants={cardVariants}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    whileHover="hover"
                    whileTap="tap"
                    transition={{
                      opacity: { duration: 0.15 },
                      scale: { duration: 0.15 },
                      y: { duration: 0.15 },
                      layout: layoutTransition
                    }}
                  >
                    <NoteCard 
                      note={note} 
                      onDelete={handleNoteDelete}
                      onNoteUpdate={handleNoteUpdate}
                      searchTerm={isSearchMode ? searchQuery : ""}
                    />
                  </motion.div>
                )
              } catch (error) {
                console.error('Error rendering note:', note.id, error)
                return null
              }
            })}
          </AnimatePresence>
        </motion.div>
      )
    } else {
      // 瀑布流布局
      return (
        <motion.div 
          className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 2xl:columns-5 gap-4"
          layout
          transition={layoutTransition}
        >
          <AnimatePresence mode="popLayout">
            {filteredNotes.map((note) => {
              try {
                return (
                  <motion.div 
                    key={note.id}
                    layoutId={note.id}
                    className="will-change-transform break-inside-avoid mb-4"
                    variants={cardVariants}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    whileHover="hover"
                    whileTap="tap"
                    transition={{
                      opacity: { duration: 0.15 },
                      scale: { duration: 0.15 },
                      y: { duration: 0.15 },
                      layout: layoutTransition
                    }}
                  >
                    <NoteCard 
                      note={note} 
                      onDelete={handleNoteDelete}
                      onNoteUpdate={handleNoteUpdate}
                      searchTerm={isSearchMode ? searchQuery : ""}
                    />
                  </motion.div>
                )
              } catch (error) {
                console.error('Error rendering note:', note.id, error)
                return null
              }
            })}
          </AnimatePresence>
        </motion.div>
      )
    }
  }

  return (
    <div className="min-h-screen bg-[#F6F4F0] p-4">
      {/* 搜索栏 */}
      <SearchBar
        onSearch={handleSearch}
        onClear={handleClearSearch}
        isLoading={isSearching}
        placeholder="搜索笔记内容、标题、描述、标签..."
        shouldClear={shouldClearSearchBar}
      />

      {/* 内容区域 */}
      <div className="">
        {/* 固定间距容器 */}
        <div className="h-3"></div>

        {/* 内容区域 */}
        {(isLoading || isSearching) && notes.length === 0 ? (
          <DashboardSkeleton />
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-12">
            <p className="text-red-500 mb-4">{error}</p>
            <Button 
              onClick={() => isSearchMode ? handleSearch(searchQuery) : loadNotes(1, false)}
              variant="outline"
              className="text-[#1C1917] border-[#1C1917]"
            >
              重试
            </Button>
          </div>
        ) : notes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="text-center">
              <h3 className="text-xl font-medium text-[#1C1917] mb-2">
                {isSearchMode ? "未找到相关笔记" : "还没有笔记"}
              </h3>
              <p className="text-[#A3A3A3] mb-6">
                {isSearchMode 
                  ? `没有找到包含 "${searchQuery}" 的笔记` 
                  : "点击底部按钮创建你的第一个笔记"
                }
              </p>
              {isSearchMode && (
                <Button 
                  onClick={handleClearSearch}
                  variant="outline"
                  className="text-[#1C1917] border-[#1C1917]"
                >
                  查看所有笔记
                </Button>
              )}
            </div>
          </div>
        ) : (
          <>
            {/* 优化的布局系统，支持 Grid 和瀑布流切换 */}
            <LayoutGroup>
              {renderCards()}
            </LayoutGroup>
          
            {/* 加载更多指示器 */}
            {isLoadingMore && <LoadMoreSkeleton />}
            
            {/* 已加载完所有数据提示 */}
            {!hasMore && notes.length > 0 && (
              <div className="flex items-center justify-center py-8">
                <p className="text-[#A3A3A3] text-sm">
                  created by [zlflly](https://github.com/zlflly)
                  ---total {totalNotes} notes 💖--show: {notes.length} 🤌 ---
                </p>
              </div>
            )}
            
            {/* 手动加载更多按钮 (备用) */}
            {hasMore && !isLoadingMore && notes.length > 0 && (
              <div className="flex items-center justify-center py-8">
                <Button 
                  onClick={loadMore}
                  variant="outline"
                  className="text-[#1C1917] border-[#1C1917]"
                >
                  加载更多
                </Button>
              </div>
            )}
          </>
        )}
      </div>
      
      {/* New Note Menu - 传递布局切换函数 */}
      <NewNoteMenu 
        onNoteCreated={handleNoteCreated} 
        onLayoutToggle={toggleLayout}
        currentLayout={layoutType}
      />
      
      {/* 网站运行天数展示栏 */}
      <div className="fixed bottom-4 right-4 z-40 bg-white/90 backdrop-blur-sm border border-gray-200/50 rounded-xl px-3 py-2 shadow-lg">
        <div className="flex items-center gap-2 text-xs text-[#A3A3A3]">
          <Calendar className="h-3 w-3" />
          <span>landed safely : {daysSinceStart} days </span>
        </div>
      </div>
    </div>
  )
}