"use client"

import type React from "react"
import { useState, useEffect, useCallback, useMemo } from "react"
import { Loader2, Calendar } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import NoteCard from "./NoteCard"
import NewNoteMenu from "./NewNoteMenu"
import SearchBar from "./SearchBar"
import { Button } from "@/components/ui/button"
import { fetchNotes, deleteNote } from "@/lib/api"
import type { Note, ThrottledFunction } from "@/lib/types"
import { DashboardSkeleton, LoadMoreSkeleton } from "./LoadingSkeleton"

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

  // 计算网站运行天数
  useEffect(() => {
    const calculateDays = () => {
      const startDate = new Date('2025-08-22T00:00:00') // 网站创建日期，指定为当天开始
      const today = new Date()
      
      // 使用Date对象的内置方法计算天数差
      const startDateOnly = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate())
      const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate())
      
      const timeDiff = todayOnly.getTime() - startDateOnly.getTime()
      const days = Math.floor(timeDiff / (1000 * 3600 * 24))
      
      return Math.max(0, days) // 确保不会是负数
    }

    setDaysSinceStart(calculateDays())

    // 每小时更新一次（在日期变化时及时更新）
    const interval = setInterval(() => {
      setDaysSinceStart(calculateDays())
    }, 60 * 60 * 1000) // 每小时更新一次

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
        // 过滤无效的笔记对象
        const validNotes = response.data.filter(note => note && note.id && typeof note.id === 'string')
        
        if (append) {
          setNotes((prev) => [...prev, ...validNotes])
        } else {
          setNotes(validNotes)
        }
        
        // 更新分页信息
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
      setIsLoading(false)
      setIsLoadingMore(false)
      setIsSearching(false)
    }
  }

  // 搜索处理
  const handleSearch = async (query: string) => {
    setSearchQuery(query)
    setIsSearchMode(true)
    setCurrentPage(1)
    await loadNotes(1, false, query)
  }

  // 清空搜索
  const handleClearSearch = async () => {
    setSearchQuery("")
    setIsSearchMode(false)
    setCurrentPage(1)
    await loadNotes(1, false)
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

  // 无限滚动检测 - 使用节流优化性能
  useEffect(() => {
    const handleScroll = throttle(() => {
      const scrollThreshold = 1000;
      const hasReachedBottom = window.innerHeight + document.documentElement.scrollTop 
        >= document.documentElement.offsetHeight - scrollThreshold;
      
      if (hasReachedBottom && hasMore && !isLoadingMore && !isSearching) {
        loadMore();
      }
    }, 200); // 200ms 节流

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
      // 验证新笔记是否有效
      if (!newNote || !newNote.id || typeof newNote.id !== 'string') {
        console.error('Invalid note object:', newNote)
        return
      }
      
      setNotes((prev) => {
        // 确保新笔记添加到数组顶部，并且不重复
        const existingIndex = prev.findIndex(note => note?.id === newNote.id)
        if (existingIndex >= 0) {
          // 如果笔记已存在，更新它
          const updated = [...prev]
          updated[existingIndex] = newNote
          return updated
        } else {
          // 如果是新笔记，添加到顶部
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

  return (
    <div className="min-h-screen bg-[#F6F4F0] p-4">
      {/* 搜索栏 */}
      <SearchBar
        onSearch={handleSearch}
        onClear={handleClearSearch}
        isLoading={isSearching}
        placeholder="搜索笔记内容、标题、描述、标签..."
      />

      {/* 内容区域 */}
      <div className="">
        {/* 搜索状态提示 */}
        {isSearchMode && (
          <div className="text-center">
            <p className="text-[#A3A3A3] text-sm">
              搜索 "{searchQuery}" 的结果：{notes.length} 条
            </p>
          </div>
        )}

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
            {/* Masonry layout with animations */}
            <div className="columns-1 md:columns-2 lg:columns-3 xl:columns-4 2xl:columns-5 gap-4 space-y-4">
              <AnimatePresence mode="popLayout">
                {notes
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
                        ['LINK', 'TEXT', 'IMAGE'].includes(note.type as string)
                      );
                    } catch (error) {
                      console.warn('Invalid note object:', note, error);
                      return false;
                    }
                  })
                  .map((note) => {
                    try {
                      return (
                        <motion.div 
                          key={`note-${note.id}`}
                          className="break-inside-avoid"
                          layout
                          initial={{ opacity: 0, scale: 0.8, y: 20 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.8, y: -20 }}
                          transition={{
                            duration: 0.3,
                            ease: "easeOut",
                            layout: { duration: 0.3 }
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
                  })
                  .filter(Boolean)
                }
              </AnimatePresence>
            </div>
          
          {/* 加载更多指示器 - 使用骨架屏 */}
          {isLoadingMore && <LoadMoreSkeleton />}
          
          {/* 已加载完所有数据提示 */}
          {!hasMore && notes.length > 0 && (
            <div className="flex items-center justify-center py-8">
              <p className="text-[#A3A3A3] text-sm">
              created by [zlflly](https://github.com/zlflly)
                ---total {totalNotes} notes 💖--show: {notes.length} 🤠---
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
      
      {/* New Note Menu */}
      <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50">
        <NewNoteMenu onNoteCreated={handleNoteCreated} />
      </div>
      
      {/* 网站运行天数展示条 */}
      <div className="fixed bottom-4 right-4 z-40 bg-white/90 backdrop-blur-sm border border-gray-200/50 rounded-xl px-3 py-2 shadow-lg">
        <div className="flex items-center gap-2 text-xs text-[#A3A3A3]">
          <Calendar className="h-3 w-3" />
          <span>landed safely : {daysSinceStart} days </span>
        </div>
      </div>
    </div>
  )
}
