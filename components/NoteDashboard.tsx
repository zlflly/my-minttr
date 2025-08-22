"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Loader2 } from "lucide-react"
import NoteCard from "./NoteCard"
import FloatingNoteCreator from "./FloatingNoteCreator"
import { Button } from "@/components/ui/button"
import { fetchNotes, deleteNote, type Note } from "@/lib/api"

export default function NoteDashboard() {
  const [notes, setNotes] = useState<Note[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // 获取笔记列表
  const loadNotes = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const response = await fetchNotes()
      if (response.success && response.data) {
        setNotes(response.data)
      } else {
        setError(response.error?.message || "获取笔记失败")
      }
    } catch (error) {
      console.error("获取笔记失败:", error)
      setError("网络错误，请稍后重试")
    } finally {
      setIsLoading(false)
    }
  }

  // 组件挂载时加载笔记
  useEffect(() => {
    loadNotes()
  }, [])

  // 处理新笔记创建
  const handleNoteCreated = (newNote: Note) => {
    setNotes((prev) => [newNote, ...prev])
  }

  // 处理删除笔记
  const handleNoteDelete = async (noteId: string) => {
    try {
      const response = await deleteNote(noteId)
      if (response.success) {
        setNotes((prev) => prev.filter(note => note.id !== noteId))
      } else {
        console.error("删除笔记失败:", response.error)
      }
    } catch (error) {
      console.error("删除笔记时出错:", error)
    }
  }

  // 处理隐藏笔记（仅从当前视图中移除）
  const handleNoteHide = (noteId: string) => {
    setNotes((prev) => prev.filter(note => note.id !== noteId))
  }

  return (
    <div className="min-h-screen bg-[#F6F4F0] p-4">
      {/* 内容区域 */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="flex items-center gap-2 text-[#A3A3A3]">
            <Loader2 className="h-5 w-5 animate-spin" />
            加载中...
          </div>
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-12">
          <p className="text-red-500 mb-4">{error}</p>
          <Button 
            onClick={loadNotes}
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
        /* Masonry layout */
        <div className="columns-1 md:columns-2 lg:columns-3 xl:columns-4 2xl:columns-5 gap-4 space-y-4">
          {notes.map((note) => (
            <div key={note.id} className="break-inside-avoid">
              <NoteCard 
                note={note} 
                onDelete={handleNoteDelete}
                onHide={handleNoteHide}
              />
            </div>
          ))}
        </div>
      )}
      
      {/* Floating Note Creator */}
      <FloatingNoteCreator onNoteCreated={handleNoteCreated} />
    </div>
  )
}
