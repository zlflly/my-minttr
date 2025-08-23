"use client"

import type React from "react"
import { useState, useEffect, useCallback, useMemo } from "react"
import { Loader2, Calendar } from "lucide-react"
import NoteCard from "./NoteCard"
import NewNoteMenu from "./NewNoteMenu"
import { Button } from "@/components/ui/button"
import { fetchNotes, deleteNote, type Note } from "@/lib/api"
import { DashboardSkeleton, LoadMoreSkeleton } from "./LoadingSkeleton"

export default function NoteDashboard() {
  const [notes, setNotes] = useState<Note[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [totalNotes, setTotalNotes] = useState(0)
  const [daysSinceStart, setDaysSinceStart] = useState(0)

  // 计算网站运行天数
  useEffect(() => {
    const startDate = new Date('2025-08-22') // 网站创建日期
    const today = new Date()
    const timeDiff = today.getTime() - startDate.getTime()
    const days = Math.floor(timeDiff / (1000 * 3600 * 24))
    setDaysSinceStart(days)

    // 每天更新一次
    const interval = setInterval(() => {
      const newToday = new Date()
      const newTimeDiff = newToday.getTime() - startDate.getTime()
      const newDays = Math.floor(newTimeDiff / (1000 * 3600 * 24))
      setDaysSinceStart(newDays)
    }, 24 * 60 * 60 * 1000) // 每24小时更新一次

    return () => clearInterval(interval)
  }, [])

  // 获取笔记列表
  const loadNotes = async (page = 1, append = false) => {
    try {
      if (!append) {
        setIsLoading(true)
      } else {
        setIsLoadingMore(true)
      }
      setError(null)
      
      const response = await fetchNotes(page, 20)
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
    }
  }

  // 加载更多笔记
  const loadMore = useCallback(async () => {
    if (!isLoadingMore && hasMore) {
      const nextPage = currentPage + 1
      setCurrentPage(nextPage)
      await loadNotes(nextPage, true)
    }
  }, [currentPage, hasMore, isLoadingMore])

  // 节流函数
  const throttle = useCallback((func: Function, limit: number) => {
    let inThrottle: boolean
    return function(this: any, ...args: any[]) {
      if (!inThrottle) {
        func.apply(this, args)
        inThrottle = true
        setTimeout(() => inThrottle = false, limit)
      }
    }
  }, [])

  // 无限滚动检测 - 使用节流优化性能
  useEffect(() => {
    const handleScroll = throttle(() => {
      if (window.innerHeight + document.documentElement.scrollTop 
          >= document.documentElement.offsetHeight - 1000 && hasMore && !isLoadingMore) {
        loadMore()
      }
    }, 200) // 200ms 节流

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [loadMore, hasMore, isLoadingMore, throttle])

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
      {/* 内容区域 */}
      {isLoading && notes.length === 0 ? (
        <DashboardSkeleton />
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-12">
          <p className="text-red-500 mb-4">{error}</p>
          <Button 
            onClick={() => loadNotes(1, false)}
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
              还没有笔记
            </h3>
            <p className="text-[#A3A3A3] mb-6">
              点击底部按钮创建你的第一个笔记
            </p>
          </div>
        </div>
      ) : (
        <>
          {/* Masonry layout */}
          <div className="columns-1 md:columns-2 lg:columns-3 xl:columns-4 2xl:columns-5 gap-4 space-y-4">
            {notes
              .filter((note): note is Note => {
                try {
                  return Boolean(
                    note && 
                    typeof note === 'object' && 
                    note.id && 
                    typeof note.id === 'string' &&
                    note.id.length > 0
                  )
                } catch (error) {
                  console.warn('Invalid note object:', note, error)
                  return false
                }
              })
              .map((note) => {
                try {
                  return (
                    <div key={`note-${note.id}`} className="break-inside-avoid">
                      <NoteCard 
                        note={note} 
                        onDelete={handleNoteDelete}
                        onNoteUpdate={handleNoteUpdate}
                      />
                    </div>
                  )
                } catch (error) {
                  console.error('Error rendering note:', note.id, error)
                  return null
                }
              })
              .filter(Boolean)
            }
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
